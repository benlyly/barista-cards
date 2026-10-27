import { describe, expect, it } from "vitest";
import { sampleWeek, todaySummary } from "@/lib/schedule";

const NOW = Date.UTC(2026, 9, 27, 9, 0); // Tue 27 Oct 2026, 12:00 Moscow

describe("master schedule", () => {
  it("shows 7 consecutive days starting today, today highlighted", () => {
    const days = sampleWeek("m1", "Слой", NOW);
    expect(days).toHaveLength(7);
    expect(days[0]!.key).toBe("2026-10-27");
    expect(days[6]!.key).toBe("2026-11-02");
    expect(days[0]!.weekday).toBe("ВТ");
    expect(days.filter((d) => d.isToday)).toHaveLength(1);
  });

  it("summary names today's place and end time when working", () => {
    const days = sampleWeek("m1", "Слой", NOW);
    days[0] = { ...days[0]!, working: true, place: "Слой", endsAt: "21:00" };
    expect(todaySummary(days)).toBe("Сегодня: в «Слой» до 21:00");
  });
});
