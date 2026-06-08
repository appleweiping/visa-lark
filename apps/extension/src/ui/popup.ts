import { loadState, type ExtState } from "../lib/storage.js";
import { parseScheduleUrl } from "../lib/parse-url.js";

/**
 * Popup: quick status + session sync + recent activity. The heavy config lives
 * in the options page. The "Sync session" button reads the embassy/scheduleId
 * from the active usvisa-info tab's URL so the user doesn't have to type them.
 */

async function detectFromActiveTab(): Promise<{ embassyCode: string; scheduleId: string } | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return parseScheduleUrl(tab?.url ?? "");
}

function badge(el: HTMLElement, health: string) {
  const map: Record<string, [string, string]> = {
    healthy: ["badge-ok", "正常 Healthy"],
    expired: ["badge-warn", "已过期 Expired"],
    challenge: ["badge-err", "验证拦截 Challenge"],
    banned: ["badge-err", "账号受限 Banned"],
    rate_limited: ["badge-warn", "限速 Rate-limited"],
    unknown: ["badge-unknown", "未知 Unknown"],
  };
  const [cls, text] = map[health] ?? map.unknown!;
  el.className = `badge ${cls}`;
  el.textContent = text;
}

async function render() {
  const state = await loadState();
  const badgeEl = document.getElementById("session-badge")!;
  const hintEl = document.getElementById("session-hint")!;

  if (state.sessionCtx) {
    hintEl.textContent = `领区 ${state.sessionCtx.embassyCode} · 行程号 ${state.sessionCtx.scheduleId}`;
    // ask background for a live health check
    chrome.runtime.sendMessage({ type: "validateSession" }, (resp) => {
      if (resp?.ok) badge(badgeEl, resp.health);
    });
  }

  const monitors = state.monitors;
  document.getElementById("monitor-count")!.textContent = String(monitors.length);
  const list = document.getElementById("monitor-list")!;
  list.innerHTML = "";
  for (const m of monitors) {
    const li = document.createElement("li");
    li.className = "monitor-item";
    li.innerHTML = `
      <span class="mi-label">${escapeHtml(m.label || m.visaType)}</span>
      <span class="mi-mode mode-${m.mode}">${modeText(m.mode)}</span>
      <span class="mi-state ${m.enabled ? "on" : "off"}">${m.enabled ? "运行中" : "已停"}</span>
    `;
    list.appendChild(li);
  }

  renderLogs(state);
}

function renderLogs(state: ExtState) {
  const logs = [...state.logs].reverse().slice(0, 8);
  const ul = document.getElementById("log-list")!;
  ul.innerHTML = "";
  for (const l of logs) {
    const li = document.createElement("li");
    const t = new Date(l.at).toLocaleTimeString();
    li.innerHTML = `<span class="lt">${t}</span> <span class="lo lo-${l.outcome}">${l.outcome}</span> <span class="ln">${escapeHtml(l.note)}</span>`;
    ul.appendChild(li);
  }
}

function modeText(mode: string): string {
  return mode === "auto" ? "自动" : mode === "confirm" ? "一键确认" : "仅通知";
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

document.getElementById("sync-session")!.addEventListener("click", async () => {
  const detected = await detectFromActiveTab();
  const hintEl = document.getElementById("session-hint")!;
  if (!detected) {
    hintEl.textContent =
      "未检测到签证排期页。请先打开 ais.usvisa-info.com 并登录到“预约/改期”页面，再点同步。";
    return;
  }
  const state = await loadState();
  state.sessionCtx = detected;
  await chrome.storage.local.set({ visalark_state_v1: state });
  hintEl.textContent = `已同步：${detected.embassyCode} · ${detected.scheduleId}`;
  chrome.runtime.sendMessage({ type: "validateSession" }, (resp) => {
    if (resp?.ok) badge(document.getElementById("session-badge")!, resp.health);
  });
  chrome.runtime.sendMessage({ type: "rearm" });
});

document.getElementById("open-options")!.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
document.getElementById("open-docs")!.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: "https://github.com/appleweiping/visa-lark#readme" });
});
document.getElementById("refresh-logs")!.addEventListener("click", render);

render();
