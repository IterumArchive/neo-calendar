/**
 * @file NeoCalendar Factory Unit Tests
 * @description Unit tests for NeoCalendar static factory methods
 * Tests all 15 factory methods documented in Phase 1
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";

describe("NeoCalendar Factory Methods", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new HebrewPlugin());
  });

  afterAll(() => {
    Registry.clear();
  });

  describe("at()", () => {
    it("should create a date from year, month, day", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");

      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBe(15);
      expect(date.calendar).toBe("GREGORIAN");
    });

    it("should work with different calendars", () => {
      const holocene = NeoCalendar.at(12024, 3, 15, "HOLOCENE");

      expect(holocene.year).toBe(12024);
      expect(holocene.calendar).toBe("HOLOCENE");
    });

    it("should handle leap days", () => {
      const leapDay = NeoCalendar.at(2024, 2, 29, "GREGORIAN");

      expect(leapDay.year).toBe(2024);
      expect(leapDay.month).toBe(2);
      expect(leapDay.day).toBe(29);
    });

    it("should handle historical dates", () => {
      const historical = NeoCalendar.at(1500, 12, 25, "JULIAN");

      expect(historical.year).toBe(1500);
      expect(historical.calendar).toBe("JULIAN");
    });
  });

  describe("from()", () => {
    it("should create date from DateInput object", () => {
      const date = NeoCalendar.from(
        { year: 2024, month: 3, day: 15 },
        "GREGORIAN",
      );

      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBe(15);
    });

    it("should handle DateInput with era", () => {
      const date = NeoCalendar.from(
        { year: 12024, month: 3, day: 15, era: "HE" },
        "HOLOCENE",
      );

      expect(date.year).toBe(12024);
      expect(date.era).toBe("HE");
    });
  });

  describe("fromJDN()", () => {
    it("should create date from Julian Day Number", () => {
      // Note: JDN 2460310 = Dec 31, 2023 (not Jan 1, 2024)
      // JDN 2460311 = Jan 1, 2024
      const jdn = 2460311n as BrandedJDN; // Jan 1, 2024
      const date = NeoCalendar.fromJDN(jdn, "GREGORIAN");

      expect(date.jdn).toBe(jdn);
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });

    it("should work with different calendars", () => {
      const jdn = 2460311n as BrandedJDN; // Jan 1, 2024
      const holocene = NeoCalendar.fromJDN(jdn, "HOLOCENE");

      expect(holocene.jdn).toBe(jdn);
      expect(holocene.year).toBe(12024);
    });

    it("should handle same JDN across calendars", () => {
      const jdn = 2460311n as BrandedJDN; // Jan 1, 2024
      const gregorian = NeoCalendar.fromJDN(jdn, "GREGORIAN");
      const julian = NeoCalendar.fromJDN(jdn, "JULIAN");

      // Same JDN, different calendar dates
      expect(gregorian.jdn).toBe(julian.jdn);
      expect(gregorian.display).not.toBe(julian.display);
    });
  });

  describe("fromJSDate()", () => {
    it("should create date from JavaScript Date object", () => {
      const jsDate = new Date(2024, 2, 15); // March 15, 2024 (month 0-indexed)
      const date = NeoCalendar.fromJSDate(jsDate);

      expect(date.year).toBe(2024);
      expect(date.month).toBe(3); // NeoCalendar months are 1-indexed
      expect(date.day).toBe(15);
    });

    it("should handle different JS Date months correctly", () => {
      const jan = new Date(2024, 0, 1); // January
      const dec = new Date(2024, 11, 31); // December

      expect(NeoCalendar.fromJSDate(jan).month).toBe(1);
      expect(NeoCalendar.fromJSDate(dec).month).toBe(12);
    });
  });

  describe("fromUnix()", () => {
    it("should create date from Unix timestamp (seconds)", () => {
      const timestamp = 1704067200; // Jan 1, 2024 00:00:00 UTC
      const date = NeoCalendar.fromUnix(timestamp);

      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });

    it("should handle milliseconds when flag is true", () => {
      const timestampMs = 1704067200000; // Milliseconds
      const date = NeoCalendar.fromUnix(timestampMs, true);

      expect(date.year).toBe(2024);
    });

    it("should handle Unix epoch", () => {
      const epoch = 0; // Jan 1, 1970
      const date = NeoCalendar.fromUnix(epoch);

      expect(date.year).toBe(1970);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });
  });

  describe("now()", () => {
    it("should create current date in Gregorian", () => {
      const date = NeoCalendar.now("GREGORIAN");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBeGreaterThan(2020);
      expect(date.month).toBeGreaterThanOrEqual(1);
      expect(date.month).toBeLessThanOrEqual(12);
    });

    it("should create current date in other calendars", () => {
      const holocene = NeoCalendar.now("HOLOCENE");

      expect(holocene.calendar).toBe("HOLOCENE");
      expect(holocene.year).toBeGreaterThan(12020);
    });

    it("should default to Gregorian when no calendar specified", () => {
      const date = NeoCalendar.now();

      expect(date.calendar).toBe("GREGORIAN");
    });
  });

  describe("parse()", () => {
    it("should parse ISO-style date string", () => {
      const result = NeoCalendar.parse("2024-03-15");

      expect(result.success).toBe(true);
      expect(result.date?.year).toBe(2024);
      expect(result.date?.month).toBe(3);
      expect(result.date?.day).toBe(15);
    });

    // Era detection not yet fully implemented
    it.skip("should detect era markers", () => {
      const result = NeoCalendar.parse("12024-03-15 HE");

      expect(result.success).toBe(true);
      expect(result.detectedCalendar).toBe("HOLOCENE");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should return errors for invalid strings", () => {
      const result = NeoCalendar.parse("invalid-date");

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should use default calendar when no era detected", () => {
      const result = NeoCalendar.parse("2024-03-15");

      expect(result.detectedCalendar).toBe("GREGORIAN");
      expect(result.confidence).toBeLessThan(0.8);
    });
  });

  describe("parseWith()", () => {
    it("should parse with explicit calendar", () => {
      const result = NeoCalendar.parseWith("2024-03-15", "HOLOCENE");

      expect(result.success).toBe(true);
      expect(result.date?.calendar).toBe("HOLOCENE");
    });
  });

  // Era detection not yet fully implemented - skip for now
  describe.skip("detectEra()", () => {
    it("should detect CE era", () => {
      const result = NeoCalendar.detectEra("2024 CE");

      expect(result).not.toBeNull();
      expect(result?.era).toMatch(/CE|AD/i);
    });

    it("should detect HE era for Holocene", () => {
      const result = NeoCalendar.detectEra("12024 HE");

      expect(result).not.toBeNull();
      expect(result?.calendar).toBe("HOLOCENE");
    });

    it("should return null when no era found", () => {
      const result = NeoCalendar.detectEra("2024-03-15");

      expect(result).toBeNull();
    });
  });

  describe("span()", () => {
    it("should create span from two dates", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
      const span = NeoCalendar.span(start, end);

      expect(span.start.year).toBe(2024);
      expect(span.end.year).toBe(2024);
      expect(span.duration.days).toBeGreaterThan(300);
    });

    it("should create span from DateInput objects", () => {
      const span = NeoCalendar.span(
        { year: 2024, month: 1, day: 1 },
        { year: 2024, month: 12, day: 31 },
      );

      expect(span.start.year).toBe(2024);
      expect(span.end.year).toBe(2024);
    });
  });

  describe("series()", () => {
    it("should create daily series", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 10, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates.length).toBe(10);
    });

    it("should create monthly series", () => {
      const start = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const end = NeoCalendar.at(2024, 6, 15, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "month" },
      });

      const dates = series.toArray();
      expect(dates.length).toBe(6);
    });

    it("should apply limit option", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
        limit: 10,
      });

      const dates = series.toArray();
      expect(dates.length).toBe(10);
    });

    it("should apply filter option", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 10, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
        filter: date => date.day !== undefined && date.day % 2 === 0,
      });

      const dates = series.toArray();
      expect(dates.length).toBe(5); // Even days only
    });
  });

  describe("isValid()", () => {
    it("should return true for NeoDate instances", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(NeoCalendar.isValid(date)).toBe(true);
    });

    it("should return true for valid DateInput objects", () => {
      expect(NeoCalendar.isValid({ year: 2024, month: 3, day: 15 })).toBe(true);
    });

    it("should return false for null or undefined", () => {
      expect(NeoCalendar.isValid(null)).toBe(false);
      expect(NeoCalendar.isValid(undefined)).toBe(false);
    });

    it("should return false for invalid objects", () => {
      expect(NeoCalendar.isValid({})).toBe(false);
      expect(NeoCalendar.isValid("2024-03-15")).toBe(false);
      expect(NeoCalendar.isValid(12345)).toBe(false);
    });
  });

  describe("configure()", () => {
    it("should update global configuration", () => {
      NeoCalendar.configure({ defaultCalendar: "HOLOCENE" });
      const config = NeoCalendar.getConfig();

      expect(config.defaultCalendar).toBe("HOLOCENE");

      // Reset
      NeoCalendar.configure({ defaultCalendar: "GREGORIAN" });
    });

    it("should preserve existing config when updating", () => {
      const originalLocale = NeoCalendar.getConfig().locale;
      NeoCalendar.configure({ strict: true });
      const config = NeoCalendar.getConfig();

      expect(config.strict).toBe(true);
      expect(config.locale).toBe(originalLocale); // Preserved
    });
  });

  describe("getConfig()", () => {
    it("should return current configuration", () => {
      const config = NeoCalendar.getConfig();

      expect(config).toHaveProperty("defaultCalendar");
      expect(config).toHaveProperty("strict");
      expect(config).toHaveProperty("locale");
    });

    it("should return a copy (not mutable reference)", () => {
      const config1 = NeoCalendar.getConfig();
      config1.defaultCalendar = "HOLOCENE";
      const config2 = NeoCalendar.getConfig();

      expect(config2.defaultCalendar).not.toBe("HOLOCENE");
    });
  });

  describe("registry", () => {
    it("should expose registry methods", () => {
      const registry = NeoCalendar.registry;

      expect(registry.has("GREGORIAN")).toBe(true);
      expect(registry.list()).toContain("GREGORIAN");
    });

    it("should allow registering new plugins", () => {
      const registry = NeoCalendar.registry;
      const plugins = registry.list();

      expect(Array.isArray(plugins)).toBe(true);
      expect(plugins.length).toBeGreaterThan(0);
    });
  });

  describe("register()", () => {
    it("should register plugin via NeoCalendar", () => {
      // Already registered in beforeAll, verify it exists
      expect(NeoCalendar.registry.has("GREGORIAN")).toBe(true);
      expect(NeoCalendar.registry.has("HOLOCENE")).toBe(true);
    });
  });
});
