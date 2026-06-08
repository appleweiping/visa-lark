import { describe, it, expect } from "vitest";
import { parseScheduleUrl } from "./parse-url.js";

describe("parseScheduleUrl", () => {
  it("extracts embassy + schedule id from a schedule page URL", () => {
    expect(
      parseScheduleUrl(
        "https://ais.usvisa-info.com/en-cn/niv/schedule/12345678/appointment",
      ),
    ).toEqual({ embassyCode: "en-cn", scheduleId: "12345678" });
  });
  it("works for other consulates", () => {
    expect(
      parseScheduleUrl("https://ais.usvisa-info.com/en-ca/niv/schedule/999/continue_actions"),
    ).toEqual({ embassyCode: "en-ca", scheduleId: "999" });
  });
  it("returns null for non-schedule pages", () => {
    expect(parseScheduleUrl("https://ais.usvisa-info.com/en-cn/niv/account")).toBeNull();
    expect(parseScheduleUrl("https://example.com")).toBeNull();
    expect(parseScheduleUrl("")).toBeNull();
  });
});
