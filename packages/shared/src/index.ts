/**
 * @visa-lark/shared — the adapter-agnostic core reused by BOTH data planes
 * (browser extension and local agent) and the control plane.
 *
 * Hard design laws live here in code:
 *  - safety.ts      jitter / backoff / cooldown / fail-safe / datacenter-ASN guard
 *  - interlocks.ts  auto-book "strictly-better-only" surgery guards + filters
 *  - adapter.ts     the ONLY seam that touches a specific visa system
 *  - notify.ts      multi-channel, china-first, redundant notification
 *
 * See DESIGN.md for the full threat model.
 */
export * from "./types.js";
export * from "./safety.js";
export * from "./interlocks.js";
export * from "./adapter.js";
export * from "./notify.js";
export * from "./engine.js";

export const VISA_LARK_VERSION = "0.1.0";
