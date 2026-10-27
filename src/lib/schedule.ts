export type ScheduleDay = {
  key: string;
  weekday: string; // ПН, ВТ…
  date: string; // 27 окт.
  isToday: boolean;
  working: boolean;
  place: string | null;
  hours: string | null;
  endsAt: string | null;
};

const GUEST_PLACES = ["Слой", "Surf Coffee", "Кооператив Чёрный"];
const SHIFTS: Array<[string, string]> = [
  ["09:00", "21:00"],
  ["10:00", "22:00"],
  ["08:00", "20:00"],
];
const DAY_MS = 24 * 60 * 60 * 1000;
const TZ = "Europe/Moscow";

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Sample 7-day schedule starting today (Moscow time). Deterministic per master,
 * so the same master always shows the same pattern. Placeholder until masters
 * can keep their own schedule.
 */
export function sampleWeek(seed: string, workplace: string | null, now = Date.now()): ScheduleDay[] {
  const h = hash(seed);
  const wd = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, weekday: "short" });
  const dm = new Intl.DateTimeFormat("ru-RU", { timeZone: TZ, day: "numeric", month: "short" });
  const iso = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
  const home = workplace?.trim() || GUEST_PLACES[h % GUEST_PLACES.length]!;
  const guest = GUEST_PLACES.filter((p) => p !== home)[h % 2]!;
  const offA = h % 7;
  const offB = (offA + 3 + (h % 2)) % 7;
  const guestDay = (offA + 5) % 7;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now + i * DAY_MS);
    const working = i !== offA && i !== offB;
    const [from, to] = SHIFTS[(h + i) % SHIFTS.length]!;
    return {
      key: iso.format(d),
      weekday: wd.format(d).replace(".", "").toUpperCase(),
      date: dm.format(d).replace(".", ""),
      isToday: i === 0,
      working,
      place: working ? (i === guestDay ? guest : home) : null,
      hours: working ? `${from} – ${to}` : null,
      endsAt: working ? to : null,
    };
  });
}

export function todaySummary(days: ScheduleDay[]): string {
  const today = days[0];
  if (!today) return "";
  if (today.working) return `Сегодня: в «${today.place}» до ${today.endsAt}`;
  const next = days.find((d) => d.working);
  return next ? `Сегодня выходной · следующая смена ${next.weekday}` : "Сегодня выходной";
}
