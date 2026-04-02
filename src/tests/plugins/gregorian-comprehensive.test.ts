/**
 * @file Comprehensive Gregorian Calendar Tests
 * @description Thorough testing of Gregorian plugin
 */

import { describe, it, expect } from "vitest";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";
import { ValidationError } from "@iterumarchive/neo-calendar-core";

const greg = new GregorianPlugin();

describe("Month Lengths", () => {
  it("should have 31 days in January", () => {
    expect(greg.daysInMonth(2024, 1)).toBe(31);
  });

  it("should have 28 days in February (non-leap)", () => {
    expect(greg.daysInMonth(2023, 2)).toBe(28);
  });

  it("should have 29 days in February (leap year)", () => {
    expect(greg.daysInMonth(2024, 2)).toBe(29);
  });

  it("should have 31 days in March", () => {
    expect(greg.daysInMonth(2024, 3)).toBe(31);
  });

  it("should have 30 days in April", () => {
    expect(greg.daysInMonth(2024, 4)).toBe(30);
  });

  it("should have 31 days in May", () => {
    expect(greg.daysInMonth(2024, 5)).toBe(31);
  });

  it("should have 30 days in June", () => {
    expect(greg.daysInMonth(2024, 6)).toBe(30);
  });

  it("should have 31 days in July", () => {
    expect(greg.daysInMonth(2024, 7)).toBe(31);
  });

  it("should have 31 days in August", () => {
    expect(greg.daysInMonth(2024, 8)).toBe(31);
  });

  it("should have 30 days in September", () => {
    expect(greg.daysInMonth(2024, 9)).toBe(30);
  });

  it("should have 31 days in October", () => {
    expect(greg.daysInMonth(2024, 10)).toBe(31);
  });

  it("should have 30 days in November", () => {
    expect(greg.daysInMonth(2024, 11)).toBe(30);
  });

  it("should have 31 days in December", () => {
    expect(greg.daysInMonth(2024, 12)).toBe(31);
  });
});

describe("Leap Year Rules", () => {
  it("should have 2000 as leap (divisible by 400)", () => {
    expect(greg.isLeapYear(2000)).toBe(true);
  });

  it("should have 1900 NOT as leap (divisible by 100)", () => {
    expect(greg.isLeapYear(1900)).toBe(false);
  });

  it("should have 2004 as leap (divisible by 4)", () => {
    expect(greg.isLeapYear(2004)).toBe(true);
  });

  it("should have 2001 NOT as leap", () => {
    expect(greg.isLeapYear(2001)).toBe(false);
  });

  it("should have 2400 as leap (divisible by 400)", () => {
    expect(greg.isLeapYear(2400)).toBe(true);
  });

  it("should have 1800 NOT as leap (divisible by 100)", () => {
    expect(greg.isLeapYear(1800)).toBe(false);
  });
});

describe("Valid Date Conversions", () => {
  it("should convert Jan 1, 2000 AD", () => {
    const jdn = greg.toJDN({ year: 2000, month: 1, day: 1, era: "AD" });
    expect(jdn).toBe(2451545n);
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(2000);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
  });

  it("should convert Dec 31, 1999 AD", () => {
    const jdn = greg.toJDN({ year: 1999, month: 12, day: 31, era: "AD" });
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(1999);
    expect(result.month).toBe(12);
    expect(result.day).toBe(31);
  });

  it("should convert Feb 29, 2000 AD (leap year)", () => {
    const jdn = greg.toJDN({ year: 2000, month: 2, day: 29, era: "AD" });
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(2000);
    expect(result.month).toBe(2);
    expect(result.day).toBe(29);
  });

  it("should convert Oct 15, 1582 AD (Gregorian adoption)", () => {
    const jdn = greg.toJDN({ year: 1582, month: 10, day: 15, era: "AD" });
    expect(jdn).toBe(2299161n);
  });
});

describe("BC Dates", () => {
  it("should round-trip 1 BC", () => {
    const jdn = greg.toJDN({ year: 1, month: 1, day: 1, era: "BC" });
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.era).toBe("BC");
  });

  it("should round-trip 100 BC", () => {
    const jdn = greg.toJDN({ year: 100, month: 6, day: 15, era: "BC" });
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(100);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
    expect(result.era).toBe("BC");
  });

  it("should round-trip 44 BC (Caesar's death)", () => {
    const jdn = greg.toJDN({ year: 44, month: 3, day: 15, era: "BC" });
    const result = greg.fromJDN(jdn);
    expect(result.year).toBe(44);
    expect(result.era).toBe("BC");
  });
});

describe("Invalid Dates", () => {
  it("should throw error for Feb 30", () => {
    try {
      greg.toJDN({ year: 2024, month: 2, day: 30, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Feb 29 in non-leap year", () => {
    try {
      greg.toJDN({ year: 2023, month: 2, day: 29, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Month 0", () => {
    try {
      greg.toJDN({ year: 2024, month: 0, day: 1, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Month 13", () => {
    try {
      greg.toJDN({ year: 2024, month: 13, day: 1, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for Day 0", () => {
    try {
      greg.toJDN({ year: 2024, month: 1, day: 0, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for April 31", () => {
    try {
      greg.toJDN({ year: 2024, month: 4, day: 31, era: "AD" });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });
});

describe("Era Equivalence", () => {
  it("should treat AD and CE as equivalent", () => {
    const ad2024 = greg.toJDN({ year: 2024, month: 1, day: 1, era: "AD" });
    const ce2024 = greg.toJDN({ year: 2024, month: 1, day: 1, era: "CE" });
    expect(ad2024).toBe(ce2024);
  });

  it("should treat BC and BCE as equivalent", () => {
    const bc100 = greg.toJDN({ year: 100, month: 1, day: 1, era: "BC" });
    const bce100 = greg.toJDN({ year: 100, month: 1, day: 1, era: "BCE" });
    expect(bc100).toBe(bce100);
  });
});

describe("Boundary Conditions", () => {
  it("should have last day of year to first day of next year", () => {
    const dec31 = greg.toJDN({ year: 2023, month: 12, day: 31, era: "AD" });
    const jan1 = greg.toJDN({ year: 2024, month: 1, day: 1, era: "AD" });
    expect(jan1 - dec31).toBe(1n);
  });

  it("should transition correctly through all months", () => {
    for (let month = 1; month < 12; month++) {
      const lastDay = greg.daysInMonth(2024, month);
      const endOfMonth = greg.toJDN({
        year: 2024,
        month,
        day: lastDay,
        era: "AD",
      });
      const startOfNextMonth = greg.toJDN({
        year: 2024,
        month: month + 1,
        day: 1,
        era: "AD",
      });
      expect(startOfNextMonth - endOfMonth).toBe(1n);
    }
  });
});

describe("Metadata", () => {
  it("should have plugin ID as GREGORIAN", () => {
    expect(greg.id).toBe("GREGORIAN");
  });

  it("should have astronomical basis as solar", () => {
    expect(greg.metadata.astronomicalBasis).toBe("solar");
  });

  it("should have 12 months per year", () => {
    expect(greg.metadata.monthsPerYear).toBe(12);
  });

  it("should have 7 days per week", () => {
    expect(greg.metadata.daysPerWeek).toBe(7);
  });

  it("should have diurnal start as noon (astronomical JDN)", () => {
    // NOTE: Currently using noon-based astronomical JDN
    // Civil midnight-based behavior requires diurnal offset implementation
    expect(greg.metadata.diurnalStart).toBe("noon");
  });
});
