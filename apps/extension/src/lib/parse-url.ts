/**
 * Parse the embassy code + schedule id from a usvisa-info schedule URL.
 * Used to auto-fill session context from the active tab so the user doesn't
 * have to type them. Pure + testable.
 */
const SCHEDULE_RE =
  /ais\.usvisa-info\.com\/(?<embassy>[a-z]{2}-[a-z]{2})\/niv\/schedule\/(?<sid>\d+)\b/i;

export function parseScheduleUrl(
  url: string,
): { embassyCode: string; scheduleId: string } | null {
  const m = SCHEDULE_RE.exec(url);
  if (m?.groups?.embassy && m.groups.sid) {
    return { embassyCode: m.groups.embassy.toLowerCase(), scheduleId: m.groups.sid };
  }
  return null;
}
