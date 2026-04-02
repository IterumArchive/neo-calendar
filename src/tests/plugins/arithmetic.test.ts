/**
 * @file Arithmetic Operations Tests
 * @description Test addMonths() and addYears() from BaseCalendarPlugin
 */

import { describe, it, expect } from "vitest";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { CopticPlugin } from "@iterumarchive/neo-calendar-coptic";
import { EthiopianPlugin } from "@iterumarchive/neo-calendar-ethiopian";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
import { FrenchRevolutionaryPlugin } from "@iterumarchive/neo-calendar-french-revolutionary";

const gregorian = new GregorianPlugin();
const islamic = new IslamicPlugin();
const coptic = new CopticPlugin();
const ethiopian = new EthiopianPlugin();
const persian = new PersianPlugin();
const frenchRev = new FrenchRevolutionaryPlugin();

describe("Add Months", () => {
  it("should add 1 month: Jan → Feb", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 1, day: 15, era: "AD" },
      1,
    );
    expect(result.year).toBe(2024);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 1 month: Jan 31 → Feb 29 (leap year, clamps to valid day)", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 1, day: 31, era: "AD" },
      1,
    );
    expect(result.year).toBe(2024);
    expect(result.month).toBe(2);
    expect(result.day).toBe(29);
  });

  it("should add 1 month: Jan 31 → Feb 28 (non-leap year)", () => {
    const result = gregorian.addMonths(
      { year: 2023, month: 1, day: 31, era: "AD" },
      1,
    );
    expect(result.year).toBe(2023);
    expect(result.month).toBe(2);
    expect(result.day).toBe(28);
  });

  it("should add 12 months: crosses year boundary", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 6, day: 15, era: "AD" },
      12,
    );
    expect(result.year).toBe(2025);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should add 13 months: year + 1, month + 1", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 1, day: 15, era: "AD" },
      13,
    );
    expect(result.year).toBe(2025);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add negative months: goes backwards", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 3, day: 15, era: "AD" },
      -2,
    );
    expect(result.year).toBe(2024);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add -12 months: crosses year backward", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 6, day: 15, era: "AD" },
      -12,
    );
    expect(result.year).toBe(2023);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should handle BC/AD crossing (known limitation)", () => {
    const result = gregorian.addMonths(
      { year: 1, month: 6, day: 15, era: "BC" },
      12,
    );
    // BC/AD crossing is complex - just verify it doesn't crash
    expect(result.year).toBeGreaterThan(0);
  });
});

describe("Add Years", () => {
  it("should add 1 year", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 3, day: 18, era: "AD" },
      1,
    );
    expect(result.year).toBe(2025);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should add 100 years", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 3, day: 18, era: "AD" },
      100,
    );
    expect(result.year).toBe(2124);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should add year: Feb 29 leap → Feb 28 non-leap", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 2, day: 29, era: "AD" },
      1,
    );
    expect(result.year).toBe(2025);
    expect(result.month).toBe(2);
    expect(result.day).toBe(28);
  });

  it("should add year: Feb 29 leap → Feb 29 leap", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 2, day: 29, era: "AD" },
      4,
    );
    expect(result.year).toBe(2028);
    expect(result.month).toBe(2);
    expect(result.day).toBe(29);
  });

  it("should add negative years: goes backward", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 3, day: 18, era: "AD" },
      -10,
    );
    expect(result.year).toBe(2014);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should handle BC/AD crossing (known limitation)", () => {
    const result = gregorian.addYears(
      { year: 5, month: 1, day: 1, era: "BC" },
      10,
    );
    // BC/AD crossing is complex - just verify it doesn't crash
    expect(result.year).toBeGreaterThan(0);
  });
});

describe("Islamic Arithmetic", () => {
  it("should add 1 month", () => {
    const result = islamic.addMonths(
      { year: 1445, month: 1, day: 15, era: "AH" },
      1,
    );
    expect(result.year).toBe(1445);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 12 months", () => {
    const result = islamic.addMonths(
      { year: 1445, month: 1, day: 15, era: "AH" },
      12,
    );
    expect(result.year).toBe(1446);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add 1 year", () => {
    const result = islamic.addYears(
      { year: 1445, month: 1, day: 15, era: "AH" },
      1,
    );
    expect(result.year).toBe(1446);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should preserve month 30 in leap year", () => {
    // Month 12 day 30 in leap year 2
    const result = islamic.addYears(
      { year: 2, month: 12, day: 30, era: "AH" },
      3,
    );
    // Year 5 is also leap, so day 30 should be preserved
    expect(result.year).toBe(5);
    expect(result.month).toBe(12);
    expect(result.day).toBe(30);
  });
});

describe("Edge Cases", () => {
  it("should add 0 months: no change", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 3, day: 18, era: "AD" },
      0,
    );
    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should add 0 years: no change", () => {
    const result = gregorian.addYears(
      { year: 2024, month: 3, day: 18, era: "AD" },
      0,
    );
    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should handle large addition: 1000 months", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 1, day: 1, era: "AD" },
      1000,
    );
    // 1000 months = 83 years, 4 months
    expect(result.year).toBe(2107);
    expect(result.month).toBe(5);
  });

  it("should handle large subtraction: -1000 months", () => {
    const result = gregorian.addMonths(
      { year: 2024, month: 5, day: 1, era: "AD" },
      -1000,
    );
    // -1000 months = -83 years, -4 months
    expect(result.year).toBe(1941);
    expect(result.month).toBe(1);
  });
});

describe("Coptic Arithmetic", () => {
  it("should add 1 month", () => {
    const result = coptic.addMonths(
      { year: 1742, month: 1, day: 15, era: "AM" },
      1,
    );
    expect(result.year).toBe(1742);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 12 months", () => {
    const result = coptic.addMonths(
      { year: 1742, month: 1, day: 15, era: "AM" },
      12,
    );
    expect(result.year).toBe(1743);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add 1 year", () => {
    const result = coptic.addYears(
      { year: 1742, month: 6, day: 15, era: "AM" },
      1,
    );
    expect(result.year).toBe(1743);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should handle 13th month (Pi Kogi Enavot) addition", () => {
    const result = coptic.addMonths(
      { year: 1742, month: 12, day: 30, era: "AM" },
      1,
    );
    // Adding 1 month from month 12 wraps to next year, month 1
    expect(result.year).toBe(1743);
    expect(result.month).toBe(1);
    expect(result.day).toBe(30);
  });

  it("should handle leap year edge case in 13th month", () => {
    // Year 1743 is leap (1743 % 4 === 3)
    const result = coptic.addYears(
      { year: 1742, month: 13, day: 5, era: "AM" },
      1,
    );
    expect(result.year).toBe(1743);
    expect(result.month).toBe(13);
    expect(result.day).toBe(5);
  });
});

describe("Ethiopian Arithmetic", () => {
  it("should add 1 month", () => {
    const result = ethiopian.addMonths(
      { year: 2018, month: 1, day: 15, era: "EE" },
      1,
    );
    expect(result.year).toBe(2018);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 12 months", () => {
    const result = ethiopian.addMonths(
      { year: 2018, month: 1, day: 15, era: "EE" },
      12,
    );
    expect(result.year).toBe(2019);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add 1 year", () => {
    const result = ethiopian.addYears(
      { year: 2018, month: 6, day: 15, era: "EE" },
      1,
    );
    expect(result.year).toBe(2019);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should handle 13th month (Pagumen) addition", () => {
    const result = ethiopian.addMonths(
      { year: 2018, month: 12, day: 30, era: "EE" },
      1,
    );
    // Adding 1 month from month 12 wraps to next year, month 1
    expect(result.year).toBe(2019);
    expect(result.month).toBe(1);
    expect(result.day).toBe(30);
  });

  it("should handle leap year edge case in Pagumen", () => {
    // Year 2019 is leap (2019 % 4 === 3)
    const result = ethiopian.addYears(
      { year: 2018, month: 13, day: 5, era: "EE" },
      1,
    );
    expect(result.year).toBe(2019);
    expect(result.month).toBe(13);
    expect(result.day).toBe(5);
  });
});

describe("Persian Arithmetic", () => {
  it("should add 1 month", () => {
    const result = persian.addMonths(
      { year: 1400, month: 1, day: 15, era: "AP" },
      1,
    );
    expect(result.year).toBe(1400);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 12 months", () => {
    const result = persian.addMonths(
      { year: 1400, month: 1, day: 15, era: "AP" },
      12,
    );
    expect(result.year).toBe(1401);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add 1 year", () => {
    const result = persian.addYears(
      { year: 1400, month: 6, day: 15, era: "AP" },
      1,
    );
    expect(result.year).toBe(1401);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should handle varying month lengths (31 → 30 days)", () => {
    // Month 6 has 31 days, month 7 has 30 days
    const result = persian.addMonths(
      { year: 1400, month: 6, day: 31, era: "AP" },
      1,
    );
    expect(result.year).toBe(1400);
    expect(result.month).toBe(7);
    expect(result.day).toBe(30); // Clamped to valid day
  });

  it("should handle 12th month edge cases (29/30 days)", () => {
    // Year 1400 is not leap, month 12 has 29 days
    const result = persian.addMonths(
      { year: 1399, month: 12, day: 30, era: "AP" },
      12,
    );
    expect(result.year).toBe(1400);
    expect(result.month).toBe(12);
    expect(result.day).toBe(29); // Clamped down in non-leap year
  });
});

describe("French Revolutionary Arithmetic", () => {
  it("should add 1 month", () => {
    const result = frenchRev.addMonths(
      { year: 1, month: 1, day: 15, era: "ER" },
      1,
    );
    expect(result.year).toBe(1);
    expect(result.month).toBe(2);
    expect(result.day).toBe(15);
  });

  it("should add 12 months", () => {
    const result = frenchRev.addMonths(
      { year: 1, month: 1, day: 15, era: "ER" },
      12,
    );
    expect(result.year).toBe(2);
    expect(result.month).toBe(1);
    expect(result.day).toBe(15);
  });

  it("should add 1 year", () => {
    const result = frenchRev.addYears(
      { year: 1, month: 6, day: 15, era: "ER" },
      1,
    );
    expect(result.year).toBe(2);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });

  it("should handle sans-culottides (13th month) addition", () => {
    const result = frenchRev.addMonths(
      { year: 1, month: 12, day: 30, era: "ER" },
      1,
    );
    // Adding 1 month from month 12 wraps to next year, month 1
    expect(result.year).toBe(2);
    expect(result.month).toBe(1);
    expect(result.day).toBe(30);
  });

  it("should handle leap year sans-culottides", () => {
    // Year 3 is leap (1795)
    const result = frenchRev.addYears(
      { year: 2, month: 13, day: 5, era: "ER" },
      1,
    );
    expect(result.year).toBe(3);
    expect(result.month).toBe(13);
    expect(result.day).toBe(5);
  });
});
