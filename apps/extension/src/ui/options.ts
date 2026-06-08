import { loadState, saveState, type ExtState } from "../lib/storage.js";
import { FACILITY_SEEDS } from "@visa-lark/adapter-usvisa-info";
import type { Monitor, VisaType, BookingMode } from "@visa-lark/shared";
import type { ChannelConfig } from "@visa-lark/notify";

/** Options page controller. Vanilla TS, no framework (keeps the extension lean). */

const VISA_TYPES: VisaType[] = [
  "B1/B2", "F1", "F2", "J1", "J2", "H1B", "H4", "L1", "O1", "M1", "C1/D", "K1", "OTHER",
];
const MODES: { value: BookingMode; label: string }[] = [
  { value: "notify", label: "仅通知 Notify" },
  { value: "confirm", label: "一键确认 Confirm" },
  { value: "auto", label: "自动预约 Auto (高风险)" },
];
const PROFILES = [
  { value: "patient", label: "稳健 Patient (~5min, 最安全)" },
  { value: "balanced", label: "均衡 Balanced (~3min)" },
  { value: "eager", label: "积极 Eager (~90s, 较高封号风险)" },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
function $(sel: string): HTMLElement {
  return document.querySelector(sel)!;
}
function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

// ---- Tabs ----
document.querySelectorAll<HTMLButtonElement>(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.querySelector(`[data-panel="${tab.dataset.tab}"]`)!.classList.add("active");
  });
});

// ---- Monitor editor ----
function facilityOptions(selected: string[]): string {
  return FACILITY_SEEDS.map(
    (f) =>
      `<label class="fac"><input type="checkbox" value="${f.id}" ${
        selected.includes(f.id) ? "checked" : ""
      }/> ${esc(f.city)} ${esc(f.name)} <span class="muted">#${f.id}/${f.embassyCode}</span></label>`,
  ).join("");
}

function monitorEditorHtml(m?: Monitor): string {
  return `
    <div class="editor-card" data-id="${m?.id ?? ""}">
      <input class="ed-label" placeholder="名称，如 北京 B1/B2" value="${esc(m?.label ?? "")}" />
      <div class="ed-row">
        <select class="ed-visa">
          ${VISA_TYPES.map((v) => `<option ${m?.visaType === v ? "selected" : ""}>${v}</option>`).join("")}
        </select>
        <select class="ed-mode">
          ${MODES.map((x) => `<option value="${x.value}" ${m?.mode === x.value ? "selected" : ""}>${x.label}</option>`).join("")}
        </select>
        <select class="ed-profile">
          ${PROFILES.map((x) => `<option value="${x.value}" ${m?.pollProfile === x.value ? "selected" : ""}>${x.label}</option>`).join("")}
        </select>
      </div>
      <div class="ed-facilities">
        <span class="label">监控领区（可多选 → 取最早的位）</span>
        ${facilityOptions(m?.facilityIds ?? [])}
      </div>
      <div class="ed-row">
        <label>最早日期 <input type="date" class="ed-dmin" value="${m?.dateMin ?? ""}" /></label>
        <label>最晚日期 <input type="date" class="ed-dmax" value="${m?.dateMax ?? ""}" /></label>
        <label class="check"><input type="checkbox" class="ed-expedite" ${m?.expedite ? "checked" : ""}/> 加急/紧急位 Expedite</label>
      </div>
      <div class="ed-actions">
        <button class="btn btn-primary ed-save">保存</button>
        <button class="btn ed-cancel">取消</button>
      </div>
    </div>`;
}

function readEditor(card: HTMLElement, existingId?: string): Monitor {
  const facilityIds = Array.from(
    card.querySelectorAll<HTMLInputElement>(".ed-facilities input:checked"),
  ).map((i) => i.value);
  return {
    id: existingId || uid(),
    label: (card.querySelector(".ed-label") as HTMLInputElement).value,
    facilityIds: facilityIds.length ? facilityIds : ["95"],
    visaType: (card.querySelector(".ed-visa") as HTMLSelectElement).value as VisaType,
    mode: (card.querySelector(".ed-mode") as HTMLSelectElement).value as BookingMode,
    pollProfile: (card.querySelector(".ed-profile") as HTMLSelectElement).value,
    dateMin: (card.querySelector(".ed-dmin") as HTMLInputElement).value || undefined,
    dateMax: (card.querySelector(".ed-dmax") as HTMLInputElement).value || undefined,
    dowFilter: [],
    expedite: (card.querySelector(".ed-expedite") as HTMLInputElement).checked,
    enabled: true,
  };
}

$("#add-monitor").addEventListener("click", () => {
  const editor = $("#monitor-editor");
  editor.innerHTML = monitorEditorHtml();
  wireEditor(editor.querySelector(".editor-card")!);
});

function wireEditor(card: HTMLElement, existingId?: string) {
  card.querySelector(".ed-save")!.addEventListener("click", async () => {
    const m = readEditor(card, existingId);
    const state = await loadState();
    const idx = state.monitors.findIndex((x) => x.id === m.id);
    if (idx >= 0) state.monitors[idx] = m;
    else state.monitors.push(m);
    await saveState(state);
    $("#monitor-editor").innerHTML = "";
    await renderMonitors();
    chrome.runtime.sendMessage({ type: "rearm" });
  });
  card.querySelector(".ed-cancel")!.addEventListener("click", () => {
    $("#monitor-editor").innerHTML = "";
  });
}

async function renderMonitors() {
  const state = await loadState();
  const table = $("#monitors-table");
  if (state.monitors.length === 0) {
    table.innerHTML = `<p class="muted">还没有监控。点上面的“添加监控”。</p>`;
    return;
  }
  table.innerHTML = state.monitors
    .map(
      (m) => `
      <div class="mrow" data-id="${m.id}">
        <span class="m-label">${esc(m.label || m.visaType)}</span>
        <span class="m-fac muted">${m.facilityIds.join(",")}</span>
        <span class="mode-${m.mode}">${m.mode}</span>
        <span>${m.enabled ? "🟢" : "⚪"}</span>
        <button class="link m-toggle">${m.enabled ? "停用" : "启用"}</button>
        <button class="link m-edit">编辑</button>
        <button class="link m-run">立即检查</button>
        <button class="link m-del">删除</button>
      </div>`,
    )
    .join("");

  table.querySelectorAll<HTMLElement>(".mrow").forEach((row) => {
    const id = row.dataset.id!;
    row.querySelector(".m-toggle")!.addEventListener("click", async () => {
      const s = await loadState();
      const m = s.monitors.find((x) => x.id === id);
      if (m) { m.enabled = !m.enabled; await saveState(s); await renderMonitors(); chrome.runtime.sendMessage({ type: "rearm" }); }
    });
    row.querySelector(".m-edit")!.addEventListener("click", async () => {
      const s = await loadState();
      const m = s.monitors.find((x) => x.id === id);
      const editor = $("#monitor-editor");
      editor.innerHTML = monitorEditorHtml(m);
      wireEditor(editor.querySelector(".editor-card")!, id);
    });
    row.querySelector(".m-run")!.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "runNow", monitorId: id });
    });
    row.querySelector(".m-del")!.addEventListener("click", async () => {
      const s = await loadState();
      s.monitors = s.monitors.filter((x) => x.id !== id);
      await saveState(s);
      await renderMonitors();
      chrome.runtime.sendMessage({ type: "rearm" });
    });
  });
}

// ---- Notifications ----
function channelRowHtml(c: ChannelConfig, i: number): string {
  const fields: Record<string, string> = {};
  if (c.type === "bark") { fields.key = c.key; fields.server = c.server ?? ""; }
  else if (c.type === "serverchan") { fields.sendKey = c.sendKey; }
  else if (c.type === "telegram") { fields.botToken = c.botToken; fields.chatId = c.chatId; }
  else if (c.type === "webhook") { fields.url = c.url; }
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input class="ch-field" data-key="${k}" placeholder="${k}" value="${esc(v)}" />`)
    .join("");
  const reliable = c.type === "telegram" ? '<span class="muted">⚠️ 大陆需代理</span>' : '<span class="ok-tag">国内可达</span>';
  return `<div class="channel-row" data-i="${i}" data-type="${c.type}">
    <strong>${c.type}</strong> ${reliable}
    ${inputs}
    <button class="link ch-del">删除</button>
  </div>`;
}

async function renderChannels() {
  const state = await loadState();
  $("#channels-list").innerHTML = state.channels.map((c, i) => channelRowHtml(c, i)).join("");
  (document.getElementById("browser-notifications") as HTMLInputElement).checked = state.browserNotifications;
  document.querySelectorAll<HTMLElement>(".channel-row").forEach((row) => {
    const i = Number(row.dataset.i);
    row.querySelectorAll<HTMLInputElement>(".ch-field").forEach((inp) => {
      inp.addEventListener("change", async () => {
        const s = await loadState();
        const c = s.channels[i] as Record<string, string>;
        c[inp.dataset.key!] = inp.value;
        await saveState(s);
      });
    });
    row.querySelector(".ch-del")!.addEventListener("click", async () => {
      const s = await loadState();
      s.channels.splice(i, 1);
      await saveState(s);
      await renderChannels();
    });
  });
}

$("#add-channel").addEventListener("click", async () => {
  const type = (document.getElementById("channel-type") as HTMLSelectElement).value;
  const s = await loadState();
  const blank: Record<string, ChannelConfig> = {
    bark: { type: "bark", key: "" },
    serverchan: { type: "serverchan", sendKey: "" },
    telegram: { type: "telegram", botToken: "", chatId: "" },
    webhook: { type: "webhook", url: "" },
  };
  s.channels.push(blank[type]!);
  await saveState(s);
  await renderChannels();
});

(document.getElementById("browser-notifications") as HTMLInputElement).addEventListener("change", async (e) => {
  const s = await loadState();
  s.browserNotifications = (e.target as HTMLInputElement).checked;
  await saveState(s);
});

$("#test-notify").addEventListener("click", async () => {
  // Fire a local browser notification immediately as a smoke test.
  chrome.notifications.create(`test-${Date.now()}`, {
    type: "basic",
    iconUrl: chrome.runtime.getURL("icons/icon128.png"),
    title: "VisaLark 测试通知",
    message: "如果你看到这条，浏览器通知工作正常。配置的渠道会在发现可约位时一同推送。",
    priority: 2,
  });
});

// ---- Auto-book ----
async function renderAutoBook() {
  const s = await loadState();
  const a = s.autoBook;
  (document.getElementById("cur-date") as HTMLInputElement).value = s.currentAppointment.date ?? "";
  (document.getElementById("min-improve") as HTMLInputElement).value = String(a.minImprovementDays);
  (document.getElementById("allow-facilities") as HTMLInputElement).value = a.allowedFacilityIds.join(",");
  (document.getElementById("confirm-first-n") as HTMLInputElement).value = String(a.confirmFirstN);
  (document.getElementById("per-day-cap") as HTMLInputElement).value = String(a.perDayCap);
  (document.getElementById("dry-run") as HTMLInputElement).checked = a.dryRun;
  (document.getElementById("kill-switch") as HTMLInputElement).checked = a.killSwitch;
}

$("#save-autobook").addEventListener("click", async () => {
  const s = await loadState();
  const date = (document.getElementById("cur-date") as HTMLInputElement).value;
  s.currentAppointment = date ? { ...s.currentAppointment, date } : s.currentAppointment;
  s.autoBook = {
    minImprovementDays: Number((document.getElementById("min-improve") as HTMLInputElement).value) || 7,
    allowedFacilityIds: (document.getElementById("allow-facilities") as HTMLInputElement).value
      .split(",").map((x) => x.trim()).filter(Boolean),
    confirmFirstN: Number((document.getElementById("confirm-first-n") as HTMLInputElement).value) || 0,
    perDayCap: Number((document.getElementById("per-day-cap") as HTMLInputElement).value) || 1,
    dryRun: (document.getElementById("dry-run") as HTMLInputElement).checked,
    killSwitch: (document.getElementById("kill-switch") as HTMLInputElement).checked,
  };
  await saveState(s);
  ($("#save-autobook") as HTMLButtonElement).textContent = "已保存 ✓";
  setTimeout(() => (($("#save-autobook") as HTMLButtonElement).textContent = "保存 Save"), 1500);
});

// ---- Advanced ----
async function renderAdvanced() {
  const s = await loadState();
  (document.getElementById("cp-url") as HTMLInputElement).value = s.controlPlaneUrl ?? "";
  (document.getElementById("cp-token") as HTMLInputElement).value = s.controlPlaneToken ?? "";
  $("#session-ctx").textContent = s.sessionCtx
    ? `领区 ${s.sessionCtx.embassyCode} · 行程号 ${s.sessionCtx.scheduleId}`
    : "未同步。请在弹窗中“同步当前会话”。";
}

$("#save-advanced").addEventListener("click", async () => {
  const s = await loadState();
  s.controlPlaneUrl = (document.getElementById("cp-url") as HTMLInputElement).value || undefined;
  s.controlPlaneToken = (document.getElementById("cp-token") as HTMLInputElement).value || undefined;
  await saveState(s);
});

$("#export-config").addEventListener("click", async () => {
  const s = await loadState();
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "visalark-config.json";
  a.click();
  URL.revokeObjectURL(url);
});
$("#import-config").addEventListener("click", () => (document.getElementById("import-file") as HTMLInputElement).click());
(document.getElementById("import-file") as HTMLInputElement).addEventListener("change", async (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const text = await file.text();
  try {
    const parsed = JSON.parse(text);
    await saveState(parsed);
    location.reload();
  } catch {
    alert("导入失败：JSON 格式无效。");
  }
});

$("#clear-all").addEventListener("click", async () => {
  if (confirm("确定清除所有本地数据？监控、渠道密钥、历史都会删除。会话 cookie 不受影响。")) {
    await chrome.storage.local.clear();
    location.reload();
  }
});

// ---- Init ----
void renderMonitors();
void renderChannels();
void renderAutoBook();
void renderAdvanced();

export {};
