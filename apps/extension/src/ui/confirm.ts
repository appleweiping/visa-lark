/**
 * One-tap confirm page. Opened from a slot-found notification's deep link.
 * It lives in the EXTENSION (data plane), so booking uses the warm browser
 * session via the background worker — the control plane never sees a credential
 * and cannot book (this is the fix for the "dead confirm link" problem).
 *
 * Flow: read m/f/d from the URL → ask the worker for bookable times → user
 * picks one → user clicks confirm → worker reschedules with the real session.
 * Human-in-the-loop the whole way.
 */

function sendMessage<T = any>(msg: unknown): Promise<T> {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, resolve));
}

const params = new URLSearchParams(location.search);
const monitorId = params.get("m") ?? "";
const facilityId = params.get("f") ?? "";
const date = params.get("d") ?? "";

let selectedTime: string | null = null;

const summary = document.getElementById("summary")!;
const timesEl = document.getElementById("times")!;
const actions = document.getElementById("actions")!;
const resultEl = document.getElementById("result")!;

summary.innerHTML = `领区 facility <strong>#${facilityId}</strong> · 日期 <strong>${date}</strong>`;

async function loadTimes() {
  if (!facilityId || !date) {
    timesEl.innerHTML = `<span class="muted">链接缺少参数，无法确认。</span>`;
    return;
  }
  const resp = await sendMessage<{ ok: boolean; times?: { outcome: string; times: string[] }; error?: string }>(
    { type: "getTimes", monitorId, facilityId, date },
  );
  if (!resp.ok) {
    timesEl.innerHTML = `<span class="muted">无法获取时段：${resp.error ?? "未知错误"}。请确认已在浏览器登录并同步会话。</span>`;
    return;
  }
  const t = resp.times!;
  if (t.outcome !== "ok") {
    timesEl.innerHTML = `<span class="muted">获取时段返回「${t.outcome}」。可能遇到验证拦截或会话过期，已停止以保护账号。请回到签证网站重新同步。</span>`;
    return;
  }
  if (t.times.length === 0) {
    timesEl.innerHTML = `<span class="muted">该日期已无可约时段（可能刚被抢走）。可关闭本页等待下次提醒。</span>`;
    return;
  }
  timesEl.innerHTML = "";
  for (const time of t.times) {
    const btn = document.createElement("button");
    btn.className = "time-chip";
    btn.textContent = time;
    btn.addEventListener("click", () => {
      selectedTime = time;
      timesEl.querySelectorAll(".time-chip").forEach((c) => c.classList.remove("sel"));
      btn.classList.add("sel");
      (actions as HTMLElement).style.display = "flex";
    });
    timesEl.appendChild(btn);
  }
}

document.getElementById("confirm-btn")!.addEventListener("click", async () => {
  if (!selectedTime) return;
  const btn = document.getElementById("confirm-btn") as HTMLButtonElement;
  btn.disabled = true;
  btn.textContent = "正在改期…";
  const resp = await sendMessage<{ ok: boolean; result?: { status: string; message?: string }; error?: string }>(
    { type: "confirmBook", monitorId, facilityId, date, time: selectedTime },
  );
  if (!resp.ok) {
    resultEl.innerHTML = `<div class="callout callout-warn">失败：${resp.error}</div>`;
    btn.disabled = false;
    btn.textContent = "确认改期到所选时段";
    return;
  }
  const r = resp.result!;
  const map: Record<string, string> = {
    confirmed: `<div class="callout" style="border-left-color:#2fae6a">✅ 改期成功！${date} ${selectedTime}。请登录签证网站核对。</div>`,
    slot_gone: `<div class="callout callout-warn">⏳ 该时段刚被抢走（slot gone）。关闭本页等待下次提醒即可。</div>`,
    recaptcha_required: `<div class="callout callout-warn">🔒 需要在浏览器完成验证码。请打开签证网站手动确认。</div>`,
    failed: `<div class="callout callout-warn">⚠️ 改期结果不明确，请登录签证网站手动核对，避免重复操作。${r.message ?? ""}</div>`,
  };
  resultEl.innerHTML = map[r.status] ?? `<div class="callout callout-warn">${r.status}: ${r.message ?? ""}</div>`;
  (actions as HTMLElement).style.display = "none";
});

document.getElementById("cancel-btn")!.addEventListener("click", () => window.close());

void loadTimes();
