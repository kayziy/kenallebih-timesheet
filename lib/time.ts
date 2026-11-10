const TZ = "Asia/Jakarta";

/** Tanggal WIB format YYYY-MM-DD */
export function wibDate(d: Date | string | number = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
}

/** Senin dari minggu yang memuat tanggal ini (YYYY-MM-DD) */
export function weekStart(date: string): string {
  const d = new Date(date + "T00:00:00Z");
  const dow = (d.getUTCDay() + 6) % 7; // Senin = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export function monthStart(date: string): string {
  return date.slice(0, 7) + "-01";
}

export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtHours(ms: number): string {
  const m = Math.round(ms / 60000);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h ? `${h}j ${mm}m` : `${mm}m`;
}

export function fmtTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: TZ, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

export function fmtDateLong(date: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" }).format(
    new Date(date + "T00:00:00Z"),
  );
}

/** Durasi blok jam "HH:MM"–"HH:MM". Kalau selesai <= mulai dianggap lewat tengah malam. */
export function entryMs(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let m = eh * 60 + em - (sh * 60 + sm);
  if (m <= 0) m += 1440;
  return m * 60000;
}

export function dayShort(date: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" }).format(
    new Date(date + "T00:00:00Z"),
  );
}

export function weekdayShort(date: string): string {
  return new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", weekday: "short" }).format(new Date(date + "T00:00:00Z"));
}

/** Selisih hari (b - a), keduanya YYYY-MM-DD */
export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);
}
