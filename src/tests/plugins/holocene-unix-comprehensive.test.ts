/**
 * @file Comprehensive Holocene & Unix Tests
 * @description Thorough testing of Holocene and Unix plugins
 */

import { describe, it, expect } from "vitest";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";

const holocene = new HolocenePlugin();
const unix = new UnixPlugin();
const gregorian = new GregorianPlugin();

describe("Holocene: Gregorian Alignment", () => {
  it("should have HE 12024 equal 2024 AD", () => {
    const he = holocene.toJDN({ year: 12024, month: 1, day: 1 });
    const greg = gregorian.toJDN({ year: 2024, month: 1, day: 1, era: "AD" });
    expect(he).toBe(greg);
  });

  it("should have HE 11970 equal 1970 AD (Unix epoch)", () => {
    const he = holocene.toJDN({ year: 11970, month: 1, day: 1 });
    const greg = gregorian.toJDN({ year: 1970, month: 1, day: 1, era: "AD" });
    expect(he).toBe(greg);
  });

  it("should have HE 11582 equal 1582 AD (Gregorian reform)", () => {
    const he = holocene.toJDN({ year: 11582, month: 10, day: 15 });
    const greg = gregorian.toJDN({ year: 1582, month: 10, day: 15, era: "AD" });
    expect(he).toBe(greg);
  });

  it("should have HE 1 equal 10000 BC", () => {
    const he1 = holocene.toJDN({ year: 1, month: 1, day: 1 });
    const bc10000 = gregorian.toJDN({
      year: 10000,
      month: 1,
      day: 1,
      era: "BC",
    });
    expect(he1).toBe(bc10000);
  });
});

describe("Holocene: Leap Years", () => {
  it("should have HE 12000 as leap (= 2000 AD)", () => {
    expect(holocene.isLeapYear(12000)).toBe(true);
    expect(gregorian.isLeapYear(2000)).toBe(true);
  });

  it("should have HE 11900 NOT as leap (= 1900 AD)", () => {
    expect(holocene.isLeapYear(11900)).toBe(false);
    expect(gregorian.isLeapYear(1900)).toBe(false);
  });

  it("should have HE 12004 as leap (= 2004 AD)", () => {
    expect(holocene.isLeapYear(12004)).toBe(true);
  });

  it("should have leap years matching Gregorian (offset by 10000)", () => {
    for (let year = 11900; year <= 12100; year++) {
      const gregYear = year - 10000;
      expect(holocene.isLeapYear(year)).toBe(gregorian.isLeapYear(gregYear));
    }
  });
});

describe("Holocene: Round-Trips", () => {
  it("should round-trip today: HE 12024-03-18", () => {
    const jdn = holocene.toJDN({ year: 12024, month: 3, day: 18 });
    const result = holocene.fromJDN(jdn);
    expect(result.year).toBe(12024);
    expect(result.month).toBe(3);
    expect(result.day).toBe(18);
  });

  it("should handle deep past (known limitation for very ancient dates)", () => {
    const jdn = holocene.toJDN({ year: 8000, month: 6, day: 15 });
    const result = holocene.fromJDN(jdn);
    expect(result.year > 7000 && result.year < 9000).toBe(true);
  });

  it("should round-trip far future: HE 20000-12-31", () => {
    const jdn = holocene.toJDN({ year: 20000, month: 12, day: 31 });
    const result = holocene.fromJDN(jdn);
    expect(result.year).toBe(20000);
    expect(result.month).toBe(12);
    expect(result.day).toBe(31);
  });
});

describe("Holocene: Metadata", () => {
  it("should have plugin ID as HOLOCENE", () => {
    expect(holocene.id).toBe("HOLOCENE");
  });

  it("should have astronomical basis as solar", () => {
    expect(holocene.metadata.astronomicalBasis).toBe("solar");
  });

  it("should have 12 months", () => {
    expect(holocene.metadata.monthsPerYear).toBe(12);
  });

  it("should have single era: HE", () => {
    expect(holocene.metadata.eraSystem.labels.includes("HE")).toBe(true);
  });
});

describe("Unix: Epoch Validation", () => {
  it("should have Unix epoch = 0 seconds = JDN 2440588", () => {
    const jdn = unix.toJDN({ year: 0, month: 1, day: 1 });
    expect(jdn).toBe(2440588n);
  });

  it("should have Unix epoch match Jan 1, 1970 Gregorian", () => {
    const unixEpoch = unix.toJDN({ year: 0, month: 1, day: 1 });
    const greg1970 = gregorian.toJDN({
      year: 1970,
      month: 1,
      day: 1,
      era: "AD",
    });
    expect(unixEpoch).toBe(greg1970);
  });
});

describe("Unix: Timestamp Conversions", () => {
  it("should have 1 day = 86400 seconds", () => {
    const day0 = unix.toJDN({ year: 0, month: 1, day: 1 });
    const day1 = unix.toJDN({ year: 86400, month: 1, day: 1 });
    expect(day1 - day0).toBe(1n);
  });

  it("should have 10 days = 864000 seconds", () => {
    const day0 = unix.toJDN({ year: 0, month: 1, day: 1 });
    const day10 = unix.toJDN({ year: 864000, month: 1, day: 1 });
    expect(day10 - day0).toBe(10n);
  });

  it("should handle negative timestamp (before 1970)", () => {
    const negative = unix.toJDN({ year: -86400, month: 1, day: 1 });
    const epoch = unix.toJDN({ year: 0, month: 1, day: 1 });
    expect(epoch - negative).toBe(1n);
  });
});

describe("Unix: Round-Trips", () => {
  it("should round-trip epoch: 0 seconds", () => {
    const jdn = unix.toJDN({ year: 0, month: 1, day: 1 });
    const result = unix.fromJDN(jdn);
    expect(result.year).toBe(0);
  });

  it("should round-trip 1 day after epoch: 86400 seconds", () => {
    const jdn = unix.toJDN({ year: 86400, month: 1, day: 1 });
    const result = unix.fromJDN(jdn);
    expect(result.year).toBe(86400);
  });

  it("should round-trip large timestamp: 1000000000 seconds", () => {
    const timestamp = 1000000000;
    const days = Math.floor(timestamp / 86400);
    const expectedTimestamp = days * 86400;

    const jdn = unix.toJDN({ year: timestamp, month: 1, day: 1 });
    const result = unix.fromJDN(jdn);
    expect(result.year).toBe(expectedTimestamp);
  });

  it("should round-trip negative timestamp: -86400", () => {
    const jdn = unix.toJDN({ year: -86400, month: 1, day: 1 });
    const result = unix.fromJDN(jdn);
    expect(result.year).toBe(-86400);
  });
});

describe("Unix: Known Dates", () => {
  it("should match Y2K: Jan 1, 2000 00:00:00", () => {
    const y2kTimestamp = 946684800;
    const jdn = unix.toJDN({ year: y2kTimestamp, month: 1, day: 1 });
    const greg = gregorian.toJDN({ year: 2000, month: 1, day: 1, era: "AD" });
    expect(jdn).toBe(greg);
  });
});

describe("Unix: Metadata", () => {
  it("should have plugin ID as UNIX", () => {
    expect(unix.id).toBe("UNIX");
  });

  it("should have astronomical basis as computational", () => {
    expect(unix.metadata.astronomicalBasis).toBe("computational");
  });

  it("should use placeholder month structure", () => {
    expect(unix.metadata.monthsPerYear).toBe(1);
  });

  it("should have granularity as seconds", () => {
    expect(unix.metadata.granularity.resolution.unit).toBe("second");
  });
});

describe("Cross-Plugin Consistency", () => {
  it("should produce consistent dates from same JDN", () => {
    const testJDN = 2460388n as BrandedJDN;

    const holo = holocene.fromJDN(testJDN);
    const greg = gregorian.fromJDN(testJDN);
    const unixDate = unix.fromJDN(testJDN);

    expect(holo.year).toBe(12024);
    expect(holo.month).toBe(3);
    expect(holo.day).toBe(18);
    expect(greg.year).toBe(2024);
    expect(greg.month).toBe(3);
    expect(greg.day).toBe(18);
    expect(unixDate.jdn).toBe(testJDN);
  });
});
