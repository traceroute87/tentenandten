export type CalendarPlatform = "android" | "ios" | "desktop";
export type CalendarAction = "google" | "ics";

export function calendarPlatform(userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent, platform = typeof navigator === "undefined" ? "" : navigator.platform, touchPoints = typeof navigator === "undefined" ? 0 : navigator.maxTouchPoints): CalendarPlatform {
  if (/iPad|iPhone|iPod/i.test(userAgent) || (platform === "MacIntel" && touchPoints > 1)) return "ios";
  if (/Android/i.test(userAgent)) return "android";
  return "desktop";
}

export function supportsIcsHandoff(): boolean {
  return typeof Blob !== "undefined" && typeof URL.createObjectURL === "function" && typeof document !== "undefined" && typeof window !== "undefined";
}

export function calendarActions(platform: CalendarPlatform, icsSupported = true): CalendarAction[] {
  return [
    ...(platform === "ios" ? [] : ["google" as const]),
    ...(icsSupported ? ["ics" as const] : []),
  ];
}

export function allDayDateRange(date: string): { start: string; end: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new RangeError(`Invalid calendar date: ${date}`);
  const [, year, month, day] = match;
  const startDate = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (startDate.toISOString().slice(0, 10) !== date) throw new RangeError(`Invalid calendar date: ${date}`);
  const endDate = new Date(startDate);
  endDate.setUTCDate(endDate.getUTCDate() + 1);
  const basic = (value: Date) => value.toISOString().slice(0, 10).replaceAll("-", "");
  return { start: basic(startDate), end: basic(endDate) };
}

export function electionDescription(url?: string): string {
  return `Check official election information.${url ? ` ${url}` : ""}`;
}

export function googleCalendarUrl(name: string, date: string, url?: string): string {
  const range = allDayDateRange(date);
  const googleUrl = new URL("https://calendar.google.com/calendar/render");
  googleUrl.searchParams.set("action", "TEMPLATE");
  googleUrl.searchParams.set("text", name);
  googleUrl.searchParams.set("dates", `${range.start}/${range.end}`);
  googleUrl.searchParams.set("details", electionDescription(url));
  return googleUrl.toString();
}

export function electionCalendar(name: string, date: string, url?: string) {
  const range = allDayDateRange(date);
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const encoder = new TextEncoder();
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//10-10-10//Election Calendar//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${range.start}-${encodeURIComponent(name)}@101010`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${range.start}`, `DTEND;VALUE=DATE:${range.end}`,
    `SUMMARY:${escape(name)}`, `DESCRIPTION:${escape(electionDescription(url))}`, "END:VEVENT", "END:VCALENDAR", "",
  ].flatMap((line) => {
    const chunks: string[] = [];
    let chunk = "";
    for (const char of line) {
      if (encoder.encode(chunk + char).length > 75) { chunks.push(chunk); chunk = ` ${char}`; }
      else chunk += char;
    }
    chunks.push(chunk);
    return chunks;
  }).join("\r\n");
}

export function downloadCalendar(name: string, date: string, url?: string): boolean {
  try {
    const blob = new Blob([electionCalendar(name, date, url)], { type: "text/calendar;charset=utf-8" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${date}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.ics`;
    if (!("download" in a)) { window.open(href, "_blank", "noopener"); return true; }
    a.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
    return true;
  } catch {
    return false;
  }
}
