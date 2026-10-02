export function electionCalendar(name: string, date: string, url?: string) {
  const end = new Date(`${date}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const ymd = (d: Date) => d.toISOString().slice(0, 10).replaceAll("-", "");
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
  const encoder = new TextEncoder();
  const description = `Check official election information.${url ? ` ${url}` : ""}`;
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//10-10-10//Election Calendar//EN", "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT", `UID:${date}-${encodeURIComponent(name)}@101010`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
    `DTSTART;VALUE=DATE:${date.replaceAll("-", "")}`, `DTEND;VALUE=DATE:${ymd(end)}`,
    `SUMMARY:${escape(name)}`, `DESCRIPTION:${escape(description)}`, "END:VEVENT", "END:VCALENDAR", "",
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
