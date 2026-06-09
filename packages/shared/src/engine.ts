import type { VisaAdapter } from "./adapter.js";
import type { NotifyChannel, NotifyMessage } from "./notify.js";
import { dispatch } from "./notify.js";
import {
  type BackoffState,
  type PollProfile,
  decideNextAction,
  recordOutcome,
  jitteredInterval,
} from "./safety.js";
import {
  type AutoBookConfig,
  type AutoBookContext,
  earliestAcceptable,
  evaluateAutoBook,
  timeAllowed,
} from "./interlocks.js";
import type {
  BookingResult,
  CurrentAppointment,
  Monitor,
  PollOutcome,
  Session,
} from "./types.js";

/** Map a booking result status to a poll outcome for the fail-safe machine (HIGH-3).
 * NOTE: only called AFTER an actual reschedule POST, so the status is always one
 * of confirmed/slot_gone/recaptcha_required/failed. dry_run/interlock_blocked are
 * produced in the no-POST branch and must NOT be routed here (they'd wrongly reset
 * the error streak with no request having been made). */
function bookingResultToOutcome(status: BookingResult["status"]): PollOutcome {
  switch (status) {
    case "recaptcha_required":
      return "challenge"; // STOP — never re-POST through a challenge
    case "confirmed":
    case "slot_gone":
    case "dry_run":
    case "interlock_blocked":
      return "ok"; // benign — a real round-trip happened, no error to escalate
    case "failed":
    default:
      return "network_error";
  }
}

/**
 * The monitor engine: one pure-ish orchestration step that BOTH data planes
 * (browser extension + local agent) drive. It does not own a timer — the host
 * calls `runOnce` and is told when to schedule the next run. This keeps the
 * engine testable and lets the host persist backoff state across restarts
 * (so a restart never resets a cooldown — DESIGN.md §3.4).
 */

export interface EngineDeps {
  adapter: VisaAdapter;
  channels: NotifyChannel[];
  /** Where one-tap-confirm links point (control plane or local). */
  confirmUrlBase?: string;
  /** Current appointment context for auto-book interlocks. */
  getCurrentAppointment: () => CurrentAppointment;
  /** Auto-book bookkeeping for interlocks. */
  getAutoBookContext: () => Omit<AutoBookContext, "current">;
  /** Persist a slot observation (for heatmap / release-pattern learning). */
  onObservation?: (dates: { date: string; facilityId: string }[], at: number) => void;
  /** Called when a booking is actually made (host updates counts + current appt). */
  onBooked?: (result: BookingResult) => void;
  /** Optional clock + rng injection for tests. */
  now?: () => number;
  rng?: () => number;
  /**
   * Optional GLOBAL (cross-monitor) daily request budget (MEDIUM-1). The
   * per-monitor cap lives in BackoffState; this is the account-wide ceiling so
   * N monitors can't multiply total load N×. The host supplies the current
   * 24h request count and the ceiling; the engine refuses to poll when over.
   */
  getGlobalRequestBudget?: () => { used: number; cap: number };
}

export interface RunResult {
  outcome: PollOutcome;
  /** Next action the host should take. */
  next:
    | { kind: "schedule"; delayMs: number }
    | { kind: "stopped"; reason: string };
  /** New backoff state to persist. */
  backoff: BackoffState;
  /** Human-readable note for logs. */
  note: string;
  bookingResult?: BookingResult;
  /**
   * The exact number of HTTP requests this cycle issued to usvisa-info (days +
   * any times + any reschedule). The host uses THIS for the global request
   * budget — never reverse-engineer it from backoff.recentPolls.length, which
   * self-prunes >24h stamps and would miscount (H1).
   */
  requestsIssued: number;
}

function slotMessage(
  monitor: Monitor,
  date: string,
  facilityId: string,
  time: string | undefined,
  confirmUrl: string | undefined,
): NotifyMessage {
  const when = time ? `${date} ${time}` : date;
  return {
    title: `🎯 有位！${monitor.label || monitor.visaType}`,
    body: `Found ${when} @ facility ${facilityId}. ${
      confirmUrl ? "点击一键确认预约。" : "请尽快登录预约。"
    }`,
    priority: "high",
    url: confirmUrl,
    kind: "slot_found",
  };
}

/**
 * Run a single monitor cycle. The host loop:
 *   const r = await runMonitorOnce(monitor, session, profile, autoCfg, backoff, deps)
 *   persist(r.backoff); if (r.next.kind === 'schedule') setTimeout(loop, r.next.delayMs)
 */
export async function runMonitorOnce(
  monitor: Monitor,
  session: Session,
  profile: PollProfile,
  autoCfg: AutoBookConfig,
  backoff: BackoffState,
  deps: EngineDeps,
): Promise<RunResult> {
  const now = (deps.now ?? Date.now)();
  const rng = deps.rng ?? Math.random;

  // 1) Fail-safe gate BEFORE any network call.
  const gate = decideNextAction(backoff, profile, now);
  if (gate.kind === "stop") {
    await dispatch(deps.channels, {
      title: "⛔ 监控已暂停 / Monitoring paused",
      body: gate.reason,
      priority: "high",
      kind: "challenge",
    });
    return {
      outcome: "challenge",
      next: { kind: "stopped", reason: gate.reason },
      backoff,
      note: "Fail-safe stop.",
      requestsIssued: 0,
    };
  }
  if (gate.kind === "wait") {
    return {
      outcome: "empty",
      next: { kind: "schedule", delayMs: Math.max(1000, gate.untilMs - now) },
      backoff,
      note: `Waiting (${gate.reason}).`,
      requestsIssued: 0,
    };
  }

  // 1b) GLOBAL cross-monitor request budget (MEDIUM-1). Even if this monitor's
  // own cap is fine, refuse to poll when the account-wide daily ceiling is hit.
  const budget = deps.getGlobalRequestBudget?.();
  if (budget && budget.used >= budget.cap) {
    return {
      outcome: "empty",
      next: { kind: "schedule", delayMs: Math.max(60_000, jitteredInterval(profile, rng)) },
      backoff,
      note: `Waiting (global daily request budget ${budget.used}/${budget.cap} reached).`,
      requestsIssued: 0,
    };
  }

  // 2) Poll available days.
  const day = await deps.adapter.getAvailableDays(monitor, session);
  const newBackoff = recordOutcome(backoff, day.outcome, now, day.requestCount);
  // Track the EXACT request count this cycle issues for the global budget (H1).
  let requestsIssued = day.requestCount;

  if (day.outcome !== "ok") {
    // Surface expiry/challenge to the user; reschedule per backoff.
    if (day.outcome === "session_expired") {
      await dispatch(deps.channels, {
        title: "🔑 会话已过期 / Session expired",
        body: "请在浏览器重新打开签证网站并重新同步会话。Re-open the visa site and re-sync.",
        priority: "high",
        kind: "session_expired",
      });
    }
    const action = decideNextAction(newBackoff, profile, now);
    if (action.kind === "stop") {
      return {
        outcome: day.outcome,
        next: { kind: "stopped", reason: action.reason },
        backoff: newBackoff,
        note: `Stopped after ${day.outcome}.`,
        requestsIssued,
      };
    }
    const delayMs =
      action.kind === "wait"
        ? Math.max(1000, action.untilMs - now)
        : jitteredInterval(profile, rng);
    return {
      outcome: day.outcome,
      next: { kind: "schedule", delayMs },
      backoff: newBackoff,
      note: `Poll outcome: ${day.outcome}.`,
      requestsIssued,
    };
  }

  // 3) Record observation for heatmap / release-pattern learning.
  deps.onObservation?.(day.dates, now);

  // 4) Find earliest acceptable slot (filters applied).
  const earliest = earliestAcceptable(day.dates, monitor);
  if (!earliest) {
    return {
      outcome: "empty",
      next: { kind: "schedule", delayMs: jitteredInterval(profile, rng) },
      backoff: newBackoff,
      note: `${day.dates.length} date(s) seen, none match filters.`,
      requestsIssued,
    };
  }

  // 5) We have an acceptable slot. Behaviour depends on mode.
  const confirmUrl = deps.confirmUrlBase
    ? `${deps.confirmUrlBase}?m=${encodeURIComponent(monitor.id)}&f=${encodeURIComponent(
        earliest.facilityId,
      )}&d=${encodeURIComponent(earliest.date)}${monitor.expedite ? "&x=1" : ""}`
    : undefined;

  let bookingResult: BookingResult | undefined;
  let workingBackoff = newBackoff;

  if (monitor.mode === "auto") {
    // Need a concrete time to book — fetch times for the earliest date.
    const times = await deps.adapter.getTimes(
      monitor,
      earliest.date,
      earliest.facilityId,
      session,
    );
    // Account for the extra request, and FAIL-SAFE on any non-ok times outcome
    // (a challenge/ban/expiry on the times endpoint must STOP, not be swallowed — H1).
    workingBackoff = recordOutcome(workingBackoff, times.outcome, now, 1);
    requestsIssued += 1;
    if (times.outcome !== "ok") {
      if (times.outcome === "session_expired") {
        await dispatch(deps.channels, {
          title: "🔑 会话已过期 / Session expired",
          body: "请在浏览器重新打开签证网站并重新同步会话。Re-open the visa site and re-sync.",
          priority: "high",
          kind: "session_expired",
        });
      }
      const action = decideNextAction(workingBackoff, profile, now);
      if (action.kind === "stop") {
        return {
          outcome: times.outcome,
          next: { kind: "stopped", reason: action.reason },
          backoff: workingBackoff,
          note: `Stopped after times poll: ${times.outcome}.`,
          requestsIssued,
        };
      }
      const delayMs =
        action.kind === "wait" ? Math.max(1000, action.untilMs - now) : jitteredInterval(profile, rng);
      return {
        outcome: times.outcome,
        next: { kind: "schedule", delayMs },
        backoff: workingBackoff,
        note: `Times poll outcome: ${times.outcome}.`,
        requestsIssued,
      };
    }
    // Pick the earliest time that passes the time-of-day filter (M2).
    const time = times.times.find((t) => timeAllowed(t, monitor.todFilter));
    if (time) {
      const ctx: AutoBookContext = {
        current: deps.getCurrentAppointment(),
        ...deps.getAutoBookContext(),
      };
      const decision = evaluateAutoBook(
        { facilityId: earliest.facilityId, date: earliest.date, time, monitorId: monitor.id },
        autoCfg,
        ctx,
      );
      if (decision.allowed && !decision.dryRun) {
        bookingResult = await deps.adapter.reschedule(
          { facilityId: earliest.facilityId, date: earliest.date, time, monitorId: monitor.id },
          session,
        );
        // HIGH-3: the reschedule POST is real traffic to usvisa-info — count it
        // and feed its outcome to the fail-safe machine. A recaptcha/challenge on
        // booking must STOP, never silently let the next cycle re-POST through it.
        const bookingOutcome = bookingResultToOutcome(bookingResult.status);
        workingBackoff = recordOutcome(workingBackoff, bookingOutcome, now, 1);
        requestsIssued += 1;
        deps.onBooked?.(bookingResult);
        await dispatch(deps.channels, {
          title:
            bookingResult.status === "confirmed"
              ? "✅ 已自动预约 / Auto-booked"
              : `⚠️ 自动预约未完成 (${bookingResult.status})`,
          body: bookingResult.message ?? `${earliest.date} ${time}`,
          priority: "high",
          url: confirmUrl,
          kind: "booked",
        });
        if (bookingOutcome === "challenge") {
          const action = decideNextAction(workingBackoff, profile, now);
          if (action.kind === "stop") {
            return {
              outcome: "challenge",
              next: { kind: "stopped", reason: action.reason },
              backoff: workingBackoff,
              note: "Stopped: reschedule hit a security challenge.",
              bookingResult,
              requestsIssued,
            };
          }
        }
      } else {
        // Interlock blocked or dry-run or needs human confirm → notify, fall back.
        bookingResult = {
          status: decision.allowed ? "dry_run" : "interlock_blocked",
          message: decision.allowed ? "Dry-run." : (decision as { reason: string }).reason,
        };
        await dispatch(deps.channels, slotMessage(monitor, earliest.date, earliest.facilityId, time, confirmUrl));
      }
    } else {
      // Times came back ok but none usable (emptied by a race, or all filtered out by
      // TOD) → don't silently drop a found date; notify the human (H1).
      await dispatch(
        deps.channels,
        slotMessage(monitor, earliest.date, earliest.facilityId, undefined, confirmUrl),
      );
    }
  } else {
    // notify / confirm modes → push (confirm carries a one-tap deep link).
    await dispatch(
      deps.channels,
      slotMessage(monitor, earliest.date, earliest.facilityId, undefined, confirmUrl),
    );
  }

  return {
    outcome: "ok",
    next: { kind: "schedule", delayMs: jitteredInterval(profile, rng) },
    backoff: workingBackoff,
    note: `Slot found: ${earliest.date} @ ${earliest.facilityId} (mode=${monitor.mode}).`,
    bookingResult,
    requestsIssued,
  };
}
