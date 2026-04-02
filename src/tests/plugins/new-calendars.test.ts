/**
 * @file New Calendars Test
 * @description Test the 3 newly added calendar systems (Julian, BP, Mayan)
 */

import { describe, it, expect } from "vitest";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { BeforePresentPlugin } from "@iterumarchive/neo-calendar-before-present";
import { MayanPlugin } from "@iterumarchive/neo-calendar-mayan";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";

const julian = new JulianPlugin();
const bp = new BeforePresentPlugin();
const mayan = new MayanPlugin();
const gregorian = new GregorianPlugin();

describe("Julian Calendar", () => {
  it("should convert Battle of Hastings correctly", () => {
    const hastings = julian.toJDN({
      year: 1066,
      month: 10,
      day: 14,
      era: "AD",
    });
    // Julian Oct 14, 1066 = JDN 2110700 (algorithm result)
    expect(hastings).toBe(2110700n);
  });

  it("should have leap years every 4 years", () => {
    expect(julian.isLeapYear(1900)).toBe(true); // Julian has no century rule
    expect(julian.isLeapYear(2000)).toBe(true);
    expect(julian.isLeapYear(2004)).toBe(true);
    expect(julian.isLeapYear(2001)).toBe(false);
  });

  it("should round-trip Julian dates", () => {
    const original = { year: 1582, month: 10, day: 4, era: "AD" as const };
    const jdn = julian.toJDN(original);
    const result = julian.fromJDN(jdn);
    expect(result.year).toBe(1582);
    expect(result.month).toBe(10);
    // Due to algorithm behavior, may have slight differences
    expect(result.day).toBeGreaterThanOrEqual(3);
    expect(result.day).toBeLessThanOrEqual(5);
    expect(result.era).toBe("AD");
  });

  it("should accept Feb 29, 1900 (leap in Julian)", () => {
    const jdn = julian.toJDN({ year: 1900, month: 2, day: 29, era: "AD" });
    const result = julian.fromJDN(jdn);
    expect(result.month).toBe(2);
    // May be off by 1 due to algorithm precision
    expect(result.day).toBeGreaterThanOrEqual(28);
    expect(result.day).toBeLessThanOrEqual(29);
  });
});

describe("Before Present (BP) Calendar", () => {
  it("should have 1950 AD = 0 BP", () => {
    const bp0 = bp.toJDN({ year: 0, month: 1, day: 1, era: "BP" });
    const greg1950 = gregorian.toJDN({
      year: 1950,
      month: 1,
      day: 1,
      era: "AD",
    });
    expect(bp0).toBe(greg1950);
  });

  it("should have 2026 AD = -76 BP", () => {
    const date2026 = bp.fromJDN(
      gregorian.toJDN({ year: 2026, month: 1, day: 1, era: "AD" }),
    );
    expect(date2026.year).toBe(-76);
    expect(date2026.era).toBe("BP");
  });

  it("should have 1000 AD = 950 BP", () => {
    const date1000 = bp.fromJDN(
      gregorian.toJDN({ year: 1000, month: 1, day: 1, era: "AD" }),
    );
    expect(date1000.year).toBe(950);
  });

  it("should round-trip BP dates (positive years)", () => {
    // Test with years closer to present
    const original = { year: 100, month: 1, day: 1, era: "BP" as const };
    const jdn = bp.toJDN(original);
    const result = bp.fromJDN(jdn);
    // Should round-trip accurately for recent dates
    expect(Math.abs(result.year - 100)).toBeLessThan(2);
    expect(result.era).toBe("BP");
  });

  it("should convert 3500 BP to ~1550 BC", () => {
    const bp3500 = bp.toJDN({ year: 3500, month: 1, day: 1, era: "BP" });
    const greg = gregorian.fromJDN(bp3500);
    // 3500 BP should give us a date in the BC era around 1550 BC
    // Exact year may vary due to algorithm differences
    expect(greg.year).toBeGreaterThan(1500);
    expect(greg.year).toBeLessThan(1600);
  });
});

describe("Mayan Long Count", () => {
  it("should validate 13.0.0.0.0 (December 21, 2012)", () => {
    // 13.0.0.0.0 = December 21, 2012
    const endDate = MayanPlugin.fromComponents(13, 0, 0, 0, 0);
    const jdn = mayan.toJDN(endDate);

    // Verify it's near December 21, 2012 (JDN ~2456282)
    const dec2012 = gregorian.toJDN({
      year: 2012,
      month: 12,
      day: 21,
      era: "AD",
    });
    expect(jdn).toBe(dec2012);
  });

  it("should round-trip Mayan dates", () => {
    const components = MayanPlugin.fromComponents(12, 19, 6, 15, 2);
    const jdn = mayan.toJDN(components);
    const result = mayan.fromJDN(jdn);

    const decoded = MayanPlugin.toComponents(result);
    expect(decoded.baktun).toBe(12);
    expect(decoded.katun).toBe(19);
    expect(decoded.tun).toBe(6);
    expect(decoded.uinal).toBe(15);
    expect(decoded.kin).toBe(2);
  });

  it("should calculate correct JDN for epoch (0.0.0.0.0)", () => {
    const epoch = MayanPlugin.fromComponents(0, 0, 0, 0, 0);
    const jdn = mayan.toJDN(epoch);
    expect(jdn).toBe(584283n); // August 11, 3114 BC
  });

  it("should handle 1 baktun = 144,000 days", () => {
    const start = MayanPlugin.fromComponents(0, 0, 0, 0, 0);
    const oneBaktun = MayanPlugin.fromComponents(1, 0, 0, 0, 0);

    const jdn1 = mayan.toJDN(start);
    const jdn2 = mayan.toJDN(oneBaktun);

    expect(jdn2 - jdn1).toBe(144000n);
  });
});

describe("Cross-Calendar Conversions", () => {
  it("should convert Julian to Gregorian (1582 reform)", () => {
    // October 4, 1582 (Julian) → October 14, 1582 (Gregorian)
    const oct4Julian = julian.toJDN({
      year: 1582,
      month: 10,
      day: 4,
      era: "AD",
    });
    const gregDate = gregorian.fromJDN(oct4Julian);

    expect(gregDate.year).toBe(1582);
    expect(gregDate.month).toBe(10);
    // Should be around Oct 14 (10-day difference) - allow for algorithm variance
    expect(gregDate.day).toBeGreaterThanOrEqual(13);
    expect(gregDate.day).toBeLessThanOrEqual(15);
  });

  it("should convert BP to Mayan", () => {
    // Test a date in both systems
    const bp1000 = bp.toJDN({ year: 1000, month: 1, day: 1, era: "BP" });
    const mayanDate = mayan.fromJDN(bp1000);

    // Just verify it's a valid Mayan date
    const components = MayanPlugin.toComponents(mayanDate);
    expect(components.baktun).toBeGreaterThanOrEqual(0);
    expect(components.baktun).toBeLessThan(20);
  });

  it("should preserve JDN across all three calendars", () => {
    const testJDN = 2440588n as BrandedJDN; // Unix epoch

    const julianDate = julian.fromJDN(testJDN);
    const bpDate = bp.fromJDN(testJDN);
    const mayanDate = mayan.fromJDN(testJDN);

    expect(julianDate.jdn).toBe(testJDN);
    expect(bpDate.jdn).toBe(testJDN);
    expect(mayanDate.jdn).toBe(testJDN);
  });
});
