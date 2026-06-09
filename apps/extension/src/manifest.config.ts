import { defineManifest } from "@crxjs/vite-plugin";

/**
 * MV3 manifest. The extension is the PRIMARY data plane (DESIGN.md §2).
 *
 * Key safety property: it runs inside the user's own browser, so requests to
 * usvisa-info carry the user's REAL logged-in cookies, residential IP, and
 * genuine browser TLS fingerprint automatically. We never store the password,
 * never automate login, never inject evasion. We simply ride the session the
 * user established by logging in themselves.
 *
 * host_permissions is scoped to usvisa-info ONLY — least privilege.
 */
export default defineManifest({
  manifest_version: 3,
  name: "VisaLark 签证云雀 — US Visa Appointment Monitor",
  version: "0.1.0",
  description:
    "Open-source, account-safe US visa appointment monitor. Rides your own browser session — zero credentials stored, zero evasion. Improves your odds; no proxy arms race.",
  default_locale: "en",
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  action: {
    default_popup: "popup.html",
    default_title: "VisaLark",
  },
  options_page: "options.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  permissions: ["storage", "alarms", "notifications"],
  host_permissions: ["https://ais.usvisa-info.com/*"],
});
