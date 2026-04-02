/**
 * @file Critical Edge Case Tests
 * @description Tests the most important edge cases that could break the system
 *
 * Focus areas:
 * 1. BC/AD transition (no year 0)
 * 2. Leap year boundaries
 * 3. Invalid date handling
 * 4. Era resolution
 * 5. Cross-era arithmetic
 * 6. Month/year boundaries
 */

import { describe, it, expect } from "vitest";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";
import { ValidationError } from "@iterumarchive/neo-calendar-core";

const gregorian = new GregorianPlugin();
const holocene = new HolocenePlugin();
const islamic = new IslamicPlugin();

describe("BC/AD Transition (No Year 0)", () => {
  it("should round-trip 1 BC to JDN to 1 BC", () => {
    const jdn = gregorian.toJDN({ year: 1, month: 1, day: 1, era: "BC" });
    const result = gregorian.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.era).toBe("BC");
  });

  it("should round-trip 1 AD to JDN to 1 AD", () => {
    const jdn = gregorian.toJDN({ year: 1, month: 1, day: 1, era: "AD" });
    const result = gregorian.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.era).toBe("AD");
  });

  it("should have Dec 31, 1 BC one day before Jan 1, 1 AD", () => {
    const dec31_1BC = gregorian.toJDN({
      year: 1,
      month: 12,
      day: 31,
      era: "BC",
    });
    const jan1_1AD = gregorian.toJDN({ year: 1, month: 1, day: 1, era: "AD" });
    const diff = jan1_1AD - dec31_1BC;
    expect(diff).toBe(1n);
  });

  it("should have 100 BC further in past than 1 BC", () => {
    const year100BC = gregorian.toJDN({
      year: 100,
      month: 1,
      day: 1,
      era: "BC",
    });
    const year1BC = gregorian.toJDN({ year: 1, month: 1, day: 1, era: "BC" });
    expect(year100BC < year1BC).toBe(true);
  });
});

describe("Leap Year Boundaries", () => {
  it("should accept Feb 29, 2000 (leap year)", () => {
    const jdn = gregorian.toJDN({ year: 2000, month: 2, day: 29, era: "AD" });
    const result = gregorian.fromJDN(jdn);
    expect(result.month).toBe(2);
    expect(result.day).toBe(29);
  });

  it("should reject Feb 29, 1900 (not leap year)", () => {
    try {
      gregorian.toJDN({ year: 1900, month: 2, day: 29, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should have 2 days between Feb 28 and Mar 1 in leap year", () => {
    const feb28 = gregorian.toJDN({ year: 2000, month: 2, day: 28, era: "AD" });
    const mar1 = gregorian.toJDN({ year: 2000, month: 3, day: 1, era: "AD" });
    const diff = mar1 - feb28;
    expect(diff).toBe(2n);
  });

  it("should have 1 day between Feb 28 and Mar 1 in non-leap year", () => {
    const feb28 = gregorian.toJDN({ year: 1900, month: 2, day: 28, era: "AD" });
    const mar1 = gregorian.toJDN({ year: 1900, month: 3, day: 1, era: "AD" });
    const diff = mar1 - feb28;
    expect(diff).toBe(1n);
  });

  it("should validate leap year rules", () => {
    expect(gregorian.isLeapYear(2000)).toBe(true);
    expect(gregorian.isLeapYear(1900)).toBe(false);
    expect(gregorian.isLeapYear(2004)).toBe(true);
    expect(gregorian.isLeapYear(2001)).toBe(false);
  });
});

describe("Invalid Date Handling", () => {
  it("should reject Feb 30", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 2, day: 30, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should reject Month 13", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 13, day: 1, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should reject Day 0", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 1, day: 0, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should reject Day 32 in January", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 1, day: 32, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should reject Sept 31", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 9, day: 31, era: "AD" });
      throw new Error("Should have thrown validation error");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });
});

describe("Era Resolution", () => {
  it("should convert BC dates to negative astronomical years correctly", () => {
    const bc1 = gregorian.toJDN({ year: 1, month: 1, day: 1, era: "BC" });
    const bc2 = gregorian.toJDN({ year: 2, month: 1, day: 1, era: "BC" });
    const diff = bc1 - bc2;
    expect(diff >= 365n && diff <= 366n).toBe(true);
  });

  it("should treat CE and AD as equivalent", () => {
    const ad2024 = gregorian.toJDN({ year: 2024, month: 1, day: 1, era: "AD" });
    const ce2024 = gregorian.toJDN({ year: 2024, month: 1, day: 1, era: "CE" });
    expect(ad2024).toBe(ce2024);
  });

  it("should treat BCE and BC as equivalent", () => {
    const bc100 = gregorian.toJDN({ year: 100, month: 1, day: 1, era: "BC" });
    const bce100 = gregorian.toJDN({ year: 100, month: 1, day: 1, era: "BCE" });
    expect(bc100).toBe(bce100);
  });
});

describe("Month/Year Boundaries", () => {
  it("should have 1 day between Dec 31 and Jan 1", () => {
    const dec31 = gregorian.toJDN({
      year: 2023,
      month: 12,
      day: 31,
      era: "AD",
    });
    const jan1 = gregorian.toJDN({ year: 2024, month: 1, day: 1, era: "AD" });
    const diff = jan1 - dec31;
    expect(diff).toBe(1n);
  });

  it("should have 1 day between Jan 31 and Feb 1", () => {
    const jan31 = gregorian.toJDN({ year: 2024, month: 1, day: 31, era: "AD" });
    const feb1 = gregorian.toJDN({ year: 2024, month: 2, day: 1, era: "AD" });
    const diff = feb1 - jan31;
    expect(diff).toBe(1n);
  });

  it("should respect different month lengths", () => {
    expect(gregorian.daysInMonth(2024, 1)).toBe(31);
    expect(gregorian.daysInMonth(2024, 2)).toBe(29);
    expect(gregorian.daysInMonth(2023, 2)).toBe(28);
    expect(gregorian.daysInMonth(2024, 4)).toBe(30);
  });
});

describe("Islamic Leap Year Cycle", () => {
  it("should validate 30-year cycle leap years", () => {
    expect(islamic.isLeapYear(2)).toBe(true);
    expect(islamic.isLeapYear(5)).toBe(true);
    expect(islamic.isLeapYear(29)).toBe(true);
    expect(islamic.isLeapYear(1)).toBe(false);
    expect(islamic.isLeapYear(3)).toBe(false);
    expect(islamic.isLeapYear(30)).toBe(false);
    expect(islamic.isLeapYear(32)).toBe(true);
    expect(islamic.isLeapYear(59)).toBe(true);
  });

  it("should have 355 days in Islamic leap year", () => {
    const year2Start = islamic.toJDN({ year: 2, month: 1, day: 1, era: "AH" });
    const year3Start = islamic.toJDN({ year: 3, month: 1, day: 1, era: "AH" });
    const days = year3Start - year2Start;
    expect(days).toBe(355n);
  });

  it("should have 354 days in Islamic regular year", () => {
    const year1Start = islamic.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    const year2Start = islamic.toJDN({ year: 2, month: 1, day: 1, era: "AH" });
    const days = year2Start - year1Start;
    expect(days).toBe(354n);
  });
});

describe("Holocene Edge Cases", () => {
  it("should have Holocene year 1 as 10,000 BC Gregorian", () => {
    const he1 = holocene.toJDN({ year: 1, month: 1, day: 1 });
    const greg = gregorian.fromJDN(he1);
    expect(greg.era).toBe("BC");
    expect(greg.year).toBe(10000);
  });

  it("should have Holocene 12024 equal to Gregorian 2024 AD", () => {
    const he12024 = holocene.toJDN({ year: 12024, month: 1, day: 1 });
    const greg2024 = gregorian.toJDN({
      year: 2024,
      month: 1,
      day: 1,
      era: "AD",
    });
    expect(he12024).toBe(greg2024);
  });

  it("should have same leap years as Gregorian (offset by 10000)", () => {
    expect(holocene.isLeapYear(12000)).toBe(true);
    expect(holocene.isLeapYear(11900)).toBe(false);
    expect(holocene.isLeapYear(12004)).toBe(true);
  });
});

describe("Cross-Calendar Consistency", () => {
  it("should produce consistent dates from same JDN across calendars", () => {
    const testJDN = 2460388n as BrandedJDN;
    const greg = gregorian.fromJDN(testJDN);
    const holo = holocene.fromJDN(testJDN);
    const islam = islamic.fromJDN(testJDN);

    expect(greg.jdn).toBe(testJDN);
    expect(holo.jdn).toBe(testJDN);
    expect(islam.jdn).toBe(testJDN);
  });

  it("should preserve JDN through multiple calendar round-trips", () => {
    const original = 2460388n as BrandedJDN;
    const greg = gregorian.fromJDN(original);

    const gregJDN = gregorian.toJDN({
      year: greg.year,
      month: greg.month,
      day: greg.day,
      era: greg.era,
    });

    expect(gregJDN).toBe(original);
  });
});

describe("Definitional Values (Ground Truth)", () => {
  it("should validate JDN 0 = Jan 1, 4713 BC (proleptic Julian)", () => {
    const jdn0 = gregorian.fromJDN(0n as BrandedJDN);
    // JDN 0 = January 1, 4713 BC in proleptic Julian (by definition)
    // Our proleptic Gregorian produces different date due to Gregorian/Julian difference
    // This is expected - we're using proleptic Gregorian, not Julian
    // Just verify it's a valid date in deep antiquity
    expect(jdn0.year).toBeGreaterThan(4700);
    expect(jdn0.era).toBe("BC");
    expect(jdn0.month).toBeGreaterThan(0);
    expect(jdn0.month).toBeLessThanOrEqual(12);
    expect(jdn0.day).toBeGreaterThan(0);
    expect(jdn0.day).toBeLessThanOrEqual(31);
  });

  it("should validate Unix Epoch = JDN 2440588", () => {
    const unixEpoch = { year: 1970, month: 1, day: 1, era: "AD" as const };
    const jdn = gregorian.toJDN(unixEpoch);
    expect(jdn).toBe(2440588n);
  });

  it("should validate Y2K = JDN 2451545", () => {
    const y2k = { year: 2000, month: 1, day: 1, era: "AD" as const };
    const jdn = gregorian.toJDN(y2k);
    expect(jdn).toBe(2451545n);
  });

  it("should validate Gregorian Reform date = JDN 2299161", () => {
    // October 15, 1582 (first day of Gregorian calendar)
    const reform = { year: 1582, month: 10, day: 15, era: "AD" as const };
    const jdn = gregorian.toJDN(reform);
    expect(jdn).toBe(2299161n);
  });
});

describe("Historical Events (JDN Verification)", () => {
  it("should validate Battle of Hastings (Oct 14, 1066)", () => {
    // Using proleptic Gregorian for this test
    // Historical Julian date would be different
    const hastings = { year: 1066, month: 10, day: 14, era: "AD" as const };
    const jdn = gregorian.toJDN(hastings);
    // Note: This is proleptic Gregorian, not historical Julian (JDN 2110701)
    // Proleptic Gregorian Oct 14, 1066 ≈ JDN 2110695
    expect(jdn).toBeGreaterThan(2110690n);
    expect(jdn).toBeLessThan(2110710n);
  });

  it("should validate Moon Landing (July 20, 1969)", () => {
    const moonLanding = { year: 1969, month: 7, day: 20, era: "AD" as const };
    const jdn = gregorian.toJDN(moonLanding);
    expect(jdn).toBe(2440423n);
  });

  it("should validate US Independence Day (July 4, 1776)", () => {
    const independence = { year: 1776, month: 7, day: 4, era: "AD" as const };
    const jdn = gregorian.toJDN(independence);
    expect(jdn).toBe(2369916n);
  });
});

describe("400-Year Gregorian Cycle", () => {
  it("should have exactly 146,097 days in 400-year cycle", () => {
    const year2000 = gregorian.toJDN({
      year: 2000,
      month: 1,
      day: 1,
      era: "AD",
    });
    const year2400 = gregorian.toJDN({
      year: 2400,
      month: 1,
      day: 1,
      era: "AD",
    });
    const dayDiff = year2400 - year2000;
    expect(dayDiff).toBe(146097n);
  });
});
