import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import manifest from "./manifest.config.js";

const here = dirname(fileURLToPath(import.meta.url));

describe("manifest", () => {
  it("does not set default_locale without a _locales subtree (C1 regression guard)", () => {
    // Chrome refuses to LOAD an extension that declares default_locale but has
    // no _locales/<locale>/messages.json. The build looks clean; only Chrome
    // load fails. So assert the invariant here.
    const dl = (manifest as { default_locale?: string }).default_locale;
    if (dl) {
      const messages = join(here, "..", "..", "_locales", dl, "messages.json");
      expect(existsSync(messages), `default_locale="${dl}" requires ${messages}`).toBe(true);
    } else {
      expect(dl).toBeUndefined();
    }
  });

  it("requests least-privilege permissions (no unused cookies permission)", () => {
    expect(manifest.permissions).not.toContain("cookies");
    expect(manifest.host_permissions).toEqual(["https://ais.usvisa-info.com/*"]);
  });

  it("is manifest v3", () => {
    expect(manifest.manifest_version).toBe(3);
  });
});
