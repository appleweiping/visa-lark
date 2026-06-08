import { classifyIpOrg, type IpReputation } from "@visa-lark/shared";

/**
 * Residential-IP guard (DESIGN.md §1, §3.1). The #1 account-ban vector is an
 * ASN / impossible-travel mismatch: logging in from a residential ISP but then
 * polling from a datacenter ASN. The local agent is meant to run on the user's
 * OWN home machine. This guard does a best-effort check of the egress IP's org
 * and REFUSES to start (unless explicitly overridden) if it looks like cloud
 * infrastructure.
 *
 * This is a heuristic, not a guarantee. It is the agent honestly trying to keep
 * the user's visa account safe rather than silently risking a ban.
 */

interface IpInfo {
  ip?: string;
  org?: string;
  asn?: string;
  hostname?: string;
}

async function fetchIpInfo(): Promise<IpInfo> {
  // ipinfo.io returns { ip, org: "AS#### Name", ... } without a token (rate-limited).
  try {
    const res = await fetch("https://ipinfo.io/json", {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = (await res.json()) as IpInfo;
      return j;
    }
  } catch {
    /* fall through */
  }
  // Fallback provider.
  try {
    const res = await fetch("https://api.ip.sb/geoip", {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const j = (await res.json()) as { ip?: string; organization?: string; asn?: number };
      return { ip: j.ip, org: j.organization, asn: j.asn ? String(j.asn) : undefined };
    }
  } catch {
    /* ignore */
  }
  return {};
}

export interface IpGuardResult extends IpReputation {
  ip?: string;
  checked: boolean;
}

export async function checkEgressIp(): Promise<IpGuardResult> {
  const info = await fetchIpInfo();
  if (!info.org && !info.ip) {
    return { isLikelyDatacenter: false, checked: false };
  }
  const rep = classifyIpOrg(info.org ?? info.hostname);
  return { ...rep, ip: info.ip, checked: true };
}
