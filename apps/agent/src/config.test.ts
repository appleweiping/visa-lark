import { describe, it, expect, vi } from "vitest";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadConfig, toSession } from "../src/config.js";

function tmpConfig(obj: unknown): string {
  const dir = mkdtempSync(join(tmpdir(), "visalark-"));
  const p = join(dir, "cfg.json");
  writeFileSync(p, JSON.stringify(obj));
  return p;
}

describe("agent config", () => {
  it("loads a valid config and builds a cookie-only session (no password field)", () => {
    const p = tmpConfig({
      session: { cookie: "_yatri_session=abc", embassyCode: "en-cn", scheduleId: "123" },
      monitors: [
        {
          id: "m1",
          facilityIds: ["95"],
          visaType: "B1/B2",
          dowFilter: [],
          expedite: false,
          mode: "notify",
          pollProfile: "patient",
          enabled: true,
        },
      ],
    });
    const cfg = loadConfig(p);
    expect(cfg.monitors).toHaveLength(1);
    const s = toSession(cfg);
    expect(s.cookie).toBe("_yatri_session=abc");
    // critical: there is no password concept anywhere in the session
    expect((s as Record<string, unknown>).password).toBeUndefined();
    expect(cfg.allowDatacenterIp).toBe(false); // safe default
  });

  it("rejects a config missing session credentials", () => {
    const p = tmpConfig({ monitors: [] });
    expect(() => loadConfig(p)).toThrow(/session/);
  });

  it("validates monitor shape via zod", () => {
    const p = tmpConfig({
      session: { cookie: "c", embassyCode: "en-cn", scheduleId: "1" },
      monitors: [{ id: "x" }], // missing facilityIds → should throw
    });
    expect(() => loadConfig(p)).toThrow();
  });

  it("applies safe auto-book defaults when omitted", () => {
    const p = tmpConfig({
      session: { cookie: "c", embassyCode: "en-cn", scheduleId: "1" },
    });
    const cfg = loadConfig(p);
    expect(cfg.autoBook.killSwitch).toBe(false);
    expect(cfg.autoBook.minImprovementDays).toBe(7);
    expect(cfg.autoBook.confirmFirstN).toBe(1);
  });

  it("downgrades confirm mode to notify on the agent (HIGH-2 — no dead button)", () => {
    const p = tmpConfig({
      session: { cookie: "c", embassyCode: "en-cn", scheduleId: "1" },
      monitors: [
        {
          id: "m1",
          facilityIds: ["95"],
          visaType: "B1/B2",
          dowFilter: [],
          expedite: false,
          mode: "confirm",
          pollProfile: "patient",
          enabled: true,
        },
      ],
    });
    const cfg = loadConfig(p);
    expect(cfg.monitors[0]!.mode).toBe("notify");
  });

  it("preserves auto mode on the agent", () => {
    const p = tmpConfig({
      session: { cookie: "c", embassyCode: "en-cn", scheduleId: "1" },
      monitors: [
        {
          id: "m1",
          facilityIds: ["95"],
          visaType: "B1/B2",
          dowFilter: [],
          expedite: false,
          mode: "auto",
          pollProfile: "patient",
          enabled: true,
        },
      ],
    });
    expect(loadConfig(p).monitors[0]!.mode).toBe("auto");
  });
});

describe("ip-guard classification (via shared)", () => {
  it("the guard module imports and exposes checkEgressIp", async () => {
    const mod = await import("../src/ip-guard.js");
    expect(typeof mod.checkEgressIp).toBe("function");
  });
});
