import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import manifestExport from "./manifest.config.js";

const here = dirname(fileURLToPath(import.meta.url));

// defineManifest() is typed as "object, function or promise"; ours is a plain object.
const manifest = manifestExport as unknown as {
  manifest_version: number;
  default_locale?: string;
  permissions?: string[];
  host_permissions?: string[];
  optional_host_permissions?: string[];
};

describe("manifest", () => {
  it("does not set default_locale without a _locales subtree (Chrome refuses to load the extension otherwise)", () => {
    // Chrome refuses to LOAD an extension that declares default_locale but has
    // no _locales/<locale>/messages.json. The build looks clean; only Chrome
    // load fails. So assert the invariant here.
    const dl = manifest.default_locale;
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

  it("keeps notification and control-plane hosts optional, granted at runtime", () => {
    // Without host access the worker's JSON POSTs (Telegram, webhooks, control
    // plane) hit a CORS preflight and are never sent; the options page asks for
    // the configured origins.
    expect(manifest.optional_host_permissions).toEqual(["https://*/*", "http://*/*"]);
  });

  it("is manifest v3", () => {
    expect(manifest.manifest_version).toBe(3);
  });
});
