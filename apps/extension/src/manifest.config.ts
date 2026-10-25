import { defineManifest } from "@crxjs/vite-plugin";

/**
 * MV3 manifest. The extension is the main data plane (see DESIGN.md).
 *
 * Key safety property: it runs inside the user's own browser, so requests to
 * usvisa-info carry the user's REAL logged-in cookies, residential IP, and
 * genuine browser TLS fingerprint automatically. We never store the password,
 * never automate login, never inject evasion. We simply ride the session the
 * user established by logging in themselves.
 *
 * host_permissions covers only usvisa-info. The notification services and the
 * optional control plane are optional host permissions: the options page asks
 * for the specific origins you configured (see src/lib/host-permissions.ts).
 */
export default defineManifest({
  manifest_version: 3,
  name: "VisaLark 签证云雀 — US Visa Appointment Monitor",
  version: "0.1.1",
  description:
    "Checks the US visa appointment calendar from the session you are logged into and notifies you when an earlier date opens. Stores no password.",
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
  optional_host_permissions: ["https://*/*", "http://*/*"],
});
