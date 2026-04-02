/**
 * @file Comprehensive Islamic Calendar Tests
 * @description Thorough testing of Islamic plugin
 */

import { describe, it, expect } from "vitest";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";
import { ValidationError } from "@iterumarchive/neo-calendar-core";

const islamic = new IslamicPlugin();

describe("30-Year Leap Cycle", () => {
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

  leapYears.forEach(year => {
    it(`should have Year ${year} as leap year`, () => {
      expect(islamic.isLeapYear(year)).toBe(true);
    });
  });

  [
    1, 3, 4, 6, 8, 9, 11, 12, 14, 15, 17, 19, 20, 22, 23, 25, 27, 28, 30,
  ].forEach(year => {
    it(`should have Year ${year} as NOT leap year`, () => {
      expect(islamic.isLeapYear(year)).toBe(false);
    });
  });

  it("should have cycle repeat: year 32 = year 2", () => {
    expect(islamic.isLeapYear(32)).toBe(islamic.isLeapYear(2));
  });

  it("should have cycle repeat: year 59 = year 29", () => {
    expect(islamic.isLeapYear(59)).toBe(islamic.isLeapYear(29));
  });
});

describe("Month Lengths", () => {
  it("should have odd months with 30 days", () => {
    expect(islamic.daysInMonth(1, 1)).toBe(30);
    expect(islamic.daysInMonth(1, 3)).toBe(30);
    expect(islamic.daysInMonth(1, 5)).toBe(30);
    expect(islamic.daysInMonth(1, 7)).toBe(30);
    expect(islamic.daysInMonth(1, 9)).toBe(30);
    expect(islamic.daysInMonth(1, 11)).toBe(30);
  });

  it("should have even months with 29 days (except month 12 in leap years)", () => {
    expect(islamic.daysInMonth(1, 2)).toBe(29);
    expect(islamic.daysInMonth(1, 4)).toBe(29);
    expect(islamic.daysInMonth(1, 6)).toBe(29);
    expect(islamic.daysInMonth(1, 8)).toBe(29);
    expect(islamic.daysInMonth(1, 10)).toBe(29);
  });

  it("should have month 12 with 29 days in regular year", () => {
    expect(islamic.daysInMonth(1, 12)).toBe(29);
  });

  it("should have month 12 with 30 days in leap year", () => {
    expect(islamic.daysInMonth(2, 12)).toBe(30);
  });
});

describe("Year Lengths", () => {
  it("should have regular year with 354 days", () => {
    const year1Start = islamic.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    const year2Start = islamic.toJDN({ year: 2, month: 1, day: 1, era: "AH" });
    expect(year2Start - year1Start).toBe(354n);
  });

  it("should have leap year with 355 days", () => {
    const year2Start = islamic.toJDN({ year: 2, month: 1, day: 1, era: "AH" });
    const year3Start = islamic.toJDN({ year: 3, month: 1, day: 1, era: "AH" });
    expect(year3Start - year2Start).toBe(355n);
  });

  it("should have 30-year cycle with correct total days (10631)", () => {
    const year1 = islamic.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    const year31 = islamic.toJDN({ year: 31, month: 1, day: 1, era: "AH" });
    expect(year31 - year1).toBe(10631n);
  });
});

describe("Epoch and Known Dates", () => {
  it("should have epoch: 1 AH = JDN 1948440", () => {
    const jdn = islamic.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    expect(jdn).toBe(1948440n);
  });

  it("should round-trip epoch", () => {
    const jdn = islamic.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    const result = islamic.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
  });
});

describe("Round-Trip Conversions", () => {
  it("should round-trip random date: 1445-09-01", () => {
    const jdn = islamic.toJDN({ year: 1445, month: 9, day: 1, era: "AH" });
    const result = islamic.fromJDN(jdn);
    expect(result.year).toBe(1445);
    expect(result.month).toBe(9);
    expect(result.day).toBe(1);
  });

  it("should round-trip leap year last day: 2-12-30", () => {
    const jdn = islamic.toJDN({ year: 2, month: 12, day: 30, era: "AH" });
    const result = islamic.fromJDN(jdn);
    expect(result.year).toBe(2);
    expect(result.month).toBe(12);
    expect(result.day).toBe(30);
  });

  it("should round-trip end of regular year: 1-12-29", () => {
    const jdn = islamic.toJDN({ year: 1, month: 12, day: 29, era: "AH" });
    const result = islamic.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.month).toBe(12);
    expect(result.day).toBe(29);
  });
});

describe("Invalid Dates", () => {
  it("should throw error for Month 0", () => {
    try {
      islamic.toJDN({ year: 1, month: 0, day: 1, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Month 13", () => {
    try {
      islamic.toJDN({ year: 1, month: 13, day: 1, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Day 0", () => {
    try {
      islamic.toJDN({ year: 1, month: 1, day: 0, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Day 31 in month 1", () => {
    try {
      islamic.toJDN({ year: 1, month: 1, day: 31, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Day 30 in even month (non-leap)", () => {
    try {
      islamic.toJDN({ year: 1, month: 2, day: 30, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Day 31 in month 12 (leap year)", () => {
    try {
      islamic.toJDN({ year: 2, month: 12, day: 31, era: "AH" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });
});

describe("Diurnal Offset", () => {
  it("should have diurnal offset as 0.75 (sunset)", () => {
    expect(islamic.getDiurnalOffset()).toBe(0.75);
  });
});

describe("Metadata", () => {
  it("should have plugin ID as ISLAMIC_CIVIL", () => {
    expect(islamic.id).toBe("ISLAMIC_CIVIL");
  });

  it("should have astronomical basis as lunar", () => {
    expect(islamic.metadata.astronomicalBasis).toBe("lunar");
  });

  it("should have 12 months per year", () => {
    expect(islamic.metadata.monthsPerYear).toBe(12);
  });

  it("should have diurnal start as sunset", () => {
    expect(islamic.metadata.diurnalStart).toBe("sunset");
  });
});
