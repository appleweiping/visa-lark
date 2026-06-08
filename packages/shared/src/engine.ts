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
} from "./interlocks.js";
import type {
  BookingResult,
  CurrentAppointment,
  Monitor,
  PollOutcome,
  Session,
} from "./types.js";

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
    };
  }
  if (gate.kind === "wait") {
    return {
      outcome: "empty",
      next: { kind: "schedule", delayMs: Math.max(1000, gate.untilMs - now) },
      backoff,
      note: `Waiting (${gate.reason}).`,
    };
  }

  // 2) Poll available days.
  const day = await deps.adapter.getAvailableDays(monitor, session);
  const newBackoff = recordOutcome(backoff, day.outcome, now);

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
    };
  }

  // 5) We have an acceptable slot. Behaviour depends on mode.
  const confirmUrl = deps.confirmUrlBase
    ? `${deps.confirmUrlBase}?m=${encodeURIComponent(monitor.id)}&f=${encodeURIComponent(
        earliest.facilityId,
      )}&d=${encodeURIComponent(earliest.date)}`
    : undefined;

  let bookingResult: BookingResult | undefined;

  if (monitor.mode === "auto") {
    // Need a concrete time to book — fetch times for the earliest date.
    const times = await deps.adapter.getTimes(
      monitor,
      earliest.date,
      earliest.facilityId,
      session,
    );
    const time = times.times[0];
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
      } else {
        // Interlock blocked or dry-run or needs human confirm → notify, fall back.
        bookingResult = {
          status: decision.allowed ? "dry_run" : "interlock_blocked",
          message: decision.allowed ? "Dry-run." : (decision as { reason: string }).reason,
        };
        await dispatch(deps.channels, slotMessage(monitor, earliest.date, earliest.facilityId, time, confirmUrl));
      }
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
    backoff: newBackoff,
    note: `Slot found: ${earliest.date} @ ${earliest.facilityId} (mode=${monitor.mode}).`,
    bookingResult,
  };
}
