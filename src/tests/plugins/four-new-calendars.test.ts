/**
 * @file Four New Calendars Test
 * @description Test the 4 newly added calendar systems
 * (Coptic, Ethiopian, Persian, French Revolutionary)
 */

import { describe, it, expect } from "vitest";
import { CopticPlugin } from "@iterumarchive/neo-calendar-coptic";
import { EthiopianPlugin } from "@iterumarchive/neo-calendar-ethiopian";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
import { FrenchRevolutionaryPlugin } from "@iterumarchive/neo-calendar-french-revolutionary";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";

const coptic = new CopticPlugin();
const ethiopian = new EthiopianPlugin();
const persian = new PersianPlugin();
const frenchRev = new FrenchRevolutionaryPlugin();
const gregorian = new GregorianPlugin();

describe("Coptic Calendar", () => {
  it("should have 13 months", () => {
    expect(coptic.metadata.monthsPerYear).toBe(13);
  });

  it("should have first 12 months with 30 days", () => {
    expect(coptic.daysInMonth(1, 1)).toBe(30);
    expect(coptic.daysInMonth(1, 6)).toBe(30);
    expect(coptic.daysInMonth(1, 12)).toBe(30);
  });

  it("should have 13th month with 5 days in regular year", () => {
    expect(coptic.daysInMonth(1, 13)).toBe(5);
    expect(coptic.daysInMonth(2, 13)).toBe(5);
  });

  it("should have 13th month with 6 days in leap year", () => {
    expect(coptic.daysInMonth(3, 13)).toBe(6); // Year 3 is leap
    expect(coptic.daysInMonth(7, 13)).toBe(6); // Year 7 is leap
  });

  it("should have leap years at 3, 7, 11, 15", () => {
    expect(coptic.isLeapYear(3)).toBe(true);
    expect(coptic.isLeapYear(7)).toBe(true);
    expect(coptic.isLeapYear(11)).toBe(true);
    expect(coptic.isLeapYear(15)).toBe(true);
    expect(coptic.isLeapYear(1)).toBe(false);
    expect(coptic.isLeapYear(2)).toBe(false);
  });

  it("should round-trip Coptic dates", () => {
    const original = { year: 1742, month: 1, day: 1, era: "AM" as const };
    const jdn = coptic.toJDN(original);
    const result = coptic.fromJDN(jdn);
    expect(result.year).toBe(1742);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.era).toBe("AM");
  });

  it("should convert Coptic to Gregorian", () => {
    // Coptic 1, 1, 1 = August 29, 284 AD
    const coptic1 = coptic.toJDN({ year: 1, month: 1, day: 1, era: "AM" });
    const greg = gregorian.fromJDN(coptic1);
    expect(greg.year).toBe(284);
    expect(greg.month).toBe(8);
    expect(greg.day).toBe(29);
  });
});

describe("Ethiopian Calendar", () => {
  it("should have 13 months", () => {
    expect(ethiopian.metadata.monthsPerYear).toBe(13);
  });

  it("should have similar structure to Coptic", () => {
    expect(ethiopian.daysInMonth(1, 1)).toBe(30);
    expect(ethiopian.daysInMonth(1, 13)).toBe(5);
    expect(ethiopian.daysInMonth(3, 13)).toBe(6); // Leap year
  });

  it("should have leap years at 3, 7, 11, 15", () => {
    expect(ethiopian.isLeapYear(3)).toBe(true);
    expect(ethiopian.isLeapYear(7)).toBe(true);
    expect(ethiopian.isLeapYear(1)).toBe(false);
  });

  it("should round-trip Ethiopian dates", () => {
    const original = { year: 2018, month: 1, day: 1, era: "EE" as const };
    const jdn = ethiopian.toJDN(original);
    const result = ethiopian.fromJDN(jdn);
    expect(result.year).toBe(2018);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.era).toBe("EE");
  });

  it("should convert Ethiopian to Gregorian", () => {
    // Ethiopian year is ~7-8 years behind Gregorian
    const eth2018 = ethiopian.toJDN({
      year: 2018,
      month: 1,
      day: 1,
      era: "EE",
    });
    const greg = gregorian.fromJDN(eth2018);
    // Ethiopian 2018 ≈ Gregorian 2025/2026
    expect(greg.year).toBeGreaterThanOrEqual(2025);
    expect(greg.year).toBeLessThanOrEqual(2026);
  });

  it("should be ~276 years ahead of Coptic", () => {
    // Coptic epoch = 284 AD, Ethiopian epoch = 8 AD
    // Difference = 276 years
    const copticJDN = coptic.toJDN({ year: 1000, month: 1, day: 1, era: "AM" });
    const ethiopianJDN = ethiopian.toJDN({
      year: 1276,
      month: 1,
      day: 1,
      era: "EE",
    });
    // Should be approximately the same JDN
    expect(Math.abs(Number(copticJDN - ethiopianJDN))).toBeLessThan(10);
  });
});

describe("Persian Calendar", () => {
  it("should have 12 months", () => {
    expect(persian.metadata.monthsPerYear).toBe(12);
  });

  it("should have first 6 months with 31 days", () => {
    expect(persian.daysInMonth(1, 1)).toBe(31);
    expect(persian.daysInMonth(1, 6)).toBe(31);
  });

  it("should have months 7-11 with 30 days", () => {
    expect(persian.daysInMonth(1, 7)).toBe(30);
    expect(persian.daysInMonth(1, 11)).toBe(30);
  });

  it("should have month 12 with 29 days in regular year", () => {
    expect(persian.daysInMonth(2, 12)).toBe(29);
  });

  it("should have month 12 with 30 days in leap year", () => {
    expect(persian.daysInMonth(1, 12)).toBe(30); // Year 1 is leap
    expect(persian.daysInMonth(5, 12)).toBe(30); // Year 5 is leap
  });

  it("should have leap years in 33-year cycle", () => {
    // Leap years: 1, 5, 9, 13, 17, 22, 26, 30
    expect(persian.isLeapYear(1)).toBe(true);
    expect(persian.isLeapYear(5)).toBe(true);
    expect(persian.isLeapYear(9)).toBe(true);
    expect(persian.isLeapYear(13)).toBe(true);
    expect(persian.isLeapYear(17)).toBe(true);
    expect(persian.isLeapYear(22)).toBe(true);
    expect(persian.isLeapYear(26)).toBe(true);
    expect(persian.isLeapYear(30)).toBe(true);
    // Non-leap years
    expect(persian.isLeapYear(2)).toBe(false);
    expect(persian.isLeapYear(10)).toBe(false);
  });

  it("should round-trip Persian dates", () => {
    const original = { year: 1403, month: 1, day: 1, era: "AP" as const };
    const jdn = persian.toJDN(original);
    const result = persian.fromJDN(jdn);
    expect(result.year).toBe(1403);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.era).toBe("AP");
  });

  it("should convert Persian year 1 to Gregorian 622/623", () => {
    // Persian epoch = March 22, 622 AD
    const persian1 = persian.toJDN({ year: 1, month: 1, day: 1, era: "AP" });
    const greg = gregorian.fromJDN(persian1);
    expect(greg.year).toBe(622);
    expect(greg.month).toBeGreaterThanOrEqual(3); // March or later
  });

  it("should handle large year values", () => {
    const original = { year: 1500, month: 6, day: 15, era: "AP" as const };
    const jdn = persian.toJDN(original);
    const result = persian.fromJDN(jdn);
    expect(result.year).toBe(1500);
    expect(result.month).toBe(6);
    expect(result.day).toBe(15);
  });
});

describe("French Revolutionary Calendar", () => {
  it("should have 12 regular months", () => {
    expect(frenchRev.metadata.monthsPerYear).toBe(12);
  });

  it("should have all 12 months with 30 days", () => {
    expect(frenchRev.daysInMonth(1, 1)).toBe(30);
    expect(frenchRev.daysInMonth(1, 6)).toBe(30);
    expect(frenchRev.daysInMonth(1, 12)).toBe(30);
  });

  it("should have sans-culottides (month 13) with 5 days in regular year", () => {
    expect(frenchRev.daysInMonth(1, 13)).toBe(5);
    expect(frenchRev.daysInMonth(2, 13)).toBe(5);
  });

  it("should have sans-culottides with 6 days in leap year", () => {
    expect(frenchRev.daysInMonth(3, 13)).toBe(6); // Year 3 is leap (Romme Rule)
    expect(frenchRev.daysInMonth(7, 13)).toBe(6); // Year 7 is leap
  });

  it("should have leap years every 4 years", () => {
    expect(frenchRev.isLeapYear(3)).toBe(true); // Romme Rule: year % 4 === 3
    expect(frenchRev.isLeapYear(7)).toBe(true);
    expect(frenchRev.isLeapYear(11)).toBe(true);
    expect(frenchRev.isLeapYear(1)).toBe(false);
    expect(frenchRev.isLeapYear(2)).toBe(false);
    expect(frenchRev.isLeapYear(4)).toBe(false);
  });

  it("should round-trip French Revolutionary dates", () => {
    const original = { year: 1, month: 1, day: 1, era: "ER" as const };
    const jdn = frenchRev.toJDN(original);
    const result = frenchRev.fromJDN(jdn);
    expect(result.year).toBe(1);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.era).toBe("ER");
  });

  it("should convert Year 1, Month 1, Day 1 to September 22, 1792", () => {
    const rev1 = frenchRev.toJDN({ year: 1, month: 1, day: 1, era: "ER" });
    const greg = gregorian.fromJDN(rev1);
    expect(greg.year).toBe(1792);
    expect(greg.month).toBe(9);
    expect(greg.day).toBe(22);
  });

  it("should handle sans-culottides correctly", () => {
    // Last day of year 1 (5th sans-culottide)
    const lastDay = frenchRev.toJDN({ year: 1, month: 13, day: 5, era: "ER" });
    // First day of year 2
    const firstDay = frenchRev.toJDN({ year: 2, month: 1, day: 1, era: "ER" });
    // Should be consecutive
    expect(firstDay - lastDay).toBe(1n);
  });

  it("should span years 1-14 (1792-1805)", () => {
    // Year 14 would be around 1805 when calendar was abandoned
    const rev14 = frenchRev.toJDN({ year: 14, month: 1, day: 1, era: "ER" });
    const greg = gregorian.fromJDN(rev14);
    expect(greg.year).toBeGreaterThanOrEqual(1805);
    expect(greg.year).toBeLessThanOrEqual(1806);
  });
});

describe("Cross-Calendar Conversions (New Calendars)", () => {
  it("should convert same JDN across all 4 new calendars", () => {
    const testJDN = 2440588n as BrandedJDN; // Unix epoch

    const copticDate = coptic.fromJDN(testJDN);
    const ethiopianDate = ethiopian.fromJDN(testJDN);
    const persianDate = persian.fromJDN(testJDN);
    const frenchRevDate = frenchRev.fromJDN(testJDN);

    expect(copticDate.jdn).toBe(testJDN);
    expect(ethiopianDate.jdn).toBe(testJDN);
    expect(persianDate.jdn).toBe(testJDN);
    expect(frenchRevDate.jdn).toBe(testJDN);
  });

  it("should convert between Coptic and Ethiopian", () => {
    const copticJDN = coptic.toJDN({
      year: 1000,
      month: 6,
      day: 15,
      era: "AM",
    });
    const ethDate = ethiopian.fromJDN(copticJDN);

    // Convert back
    const ethJDN = ethiopian.toJDN({
      year: ethDate.year,
      month: ethDate.month,
      day: ethDate.day,
      era: "EE",
    });

    expect(copticJDN).toBe(ethJDN);
  });

  it("should convert between Persian and Gregorian", () => {
    const persianJDN = persian.toJDN({
      year: 1400,
      month: 1,
      day: 1,
      era: "AP",
    });
    const gregDate = gregorian.fromJDN(persianJDN);

    // Convert back to Persian
    const gregJDN = gregorian.toJDN({
      year: gregDate.year,
      month: gregDate.month,
      day: gregDate.day,
      era: gregDate.era,
    });

    expect(Math.abs(Number(persianJDN - gregJDN))).toBeLessThan(2);
  });
});
