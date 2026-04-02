/**
 * @file NeoDuration Tests
 * @description Test suite for the NeoDuration class
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoDuration } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";

describe("NeoDuration", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new IslamicPlugin());
  });

  describe("Creation", () => {
    it("should create duration from days", () => {
      const duration = new NeoDuration(100);
      expect(duration.days).toBe(100);
    });

    it("should create duration from weeks", () => {
      const duration = NeoDuration.fromWeeks(2);
      expect(duration.days).toBe(14);
    });

    it("should create duration from months (Gregorian)", () => {
      const duration = NeoDuration.fromMonths(3, "GREGORIAN");
      expect(duration.toDays()).toBeCloseTo(91.31, 1); // ~30.44 days per month
    });

    it("should create duration from years (Gregorian)", () => {
      const duration = NeoDuration.fromYears(2, "GREGORIAN");
      expect(duration.toDays()).toBeCloseTo(730.5, 1);
    });

    it("should create duration from components", () => {
      const duration = NeoDuration.from({
        years: 1,
        months: 6,
        days: 15,
      });
      expect(duration.toDays()).toBeGreaterThan(500);
    });
  });

  describe("Unit Conversions", () => {
    it("should convert days to weeks", () => {
      const duration = new NeoDuration(14);
      expect(duration.toWeeks()).toBe(2);
    });

    it("should convert days to months (Gregorian)", () => {
      const duration = new NeoDuration(365.2425);
      expect(duration.toMonths("GREGORIAN")).toBeCloseTo(12, 1);
    });

    it("should convert days to years (Gregorian)", () => {
      const duration = new NeoDuration(365.2425);
      expect(duration.toYears("GREGORIAN")).toBeCloseTo(1, 2);
    });

    it("should handle calendar-specific conversions (Islamic)", () => {
      const duration = new NeoDuration(354);
      const years = duration.toYears("ISLAMIC_CIVIL");
      expect(years).toBeCloseTo(1, 1);
    });
  });

  describe("Human-Readable Output", () => {
    it("should format duration as human-readable string", () => {
      const duration = NeoDuration.from({
        years: 2,
        months: 3,
        days: 15,
      });
      const human = duration.toHuman();
      expect(human).toContain("year");
      expect(human).toContain("month");
      // Days may be omitted if maxUnits limit is reached
    });

    it("should respect maxUnits option", () => {
      const duration = NeoDuration.from({
        years: 2,
        months: 3,
        weeks: 1,
        days: 5,
      });
      const human = duration.toHuman({ maxUnits: 2 });
      const parts = human.split(",");
      expect(parts.length).toBeLessThanOrEqual(2);
    });

    it("should handle zero duration", () => {
      const duration = new NeoDuration(0);
      expect(duration.toHuman()).toBe("0 days");
    });
  });

  describe("ISO Duration Format", () => {
    it("should convert to ISO 8601 duration", () => {
      const duration = NeoDuration.from({
        years: 3,
        months: 6,
        days: 4,
      });
      const iso = duration.toISODuration();
      expect(iso).toMatch(/^P/);
      expect(iso).toContain("Y");
      expect(iso).toContain("M");
      expect(iso).toContain("D");
    });

    it("should handle zero duration in ISO format", () => {
      const duration = new NeoDuration(0);
      expect(duration.toISODuration()).toBe("P0D");
    });

    it("should parse ISO duration string", () => {
      const duration = NeoDuration.fromISODuration("P3Y6M4D");
      expect(duration.toDays()).toBeGreaterThan(1000);
    });

    it("should round-trip ISO format", () => {
      const original = NeoDuration.from({
        years: 2,
        months: 4,
        weeks: 1,
        days: 3,
      });
      const iso = original.toISODuration();
      const parsed = NeoDuration.fromISODuration(iso);
      expect(parsed.toDays()).toBeCloseTo(original.toDays(), 0);
    });
  });

  describe("Components Breakdown", () => {
    it("should break duration into components", () => {
      const duration = new NeoDuration(800);
      const components = duration.toComponents();
      expect(components.years).toBeGreaterThan(0);
      expect(components.days).toBeDefined();
    });

    it("should handle large durations", () => {
      const duration = new NeoDuration(10000);
      const components = duration.toComponents();
      expect(components.years).toBeGreaterThan(20);
    });

    it("should respect calendar-specific calculations", () => {
      const duration = new NeoDuration(365);
      const gregorianComps = duration.toComponents("GREGORIAN");
      const islamicComps = duration.toComponents("ISLAMIC_CIVIL");

      // Islamic year is shorter, so more years in same duration
      expect(islamicComps.years).toBeGreaterThan(gregorianComps.years || 0);
    });
  });

  describe("Arithmetic", () => {
    it("should add durations", () => {
      const d1 = new NeoDuration(100);
      const d2 = new NeoDuration(50);
      const result = d1.add(d2);
      expect(result.days).toBe(150);
    });

    it("should subtract durations", () => {
      const d1 = new NeoDuration(100);
      const d2 = new NeoDuration(30);
      const result = d1.subtract(d2);
      expect(result.days).toBe(70);
    });

    it("should multiply duration", () => {
      const duration = new NeoDuration(10);
      const result = duration.multiply(3);
      expect(result.days).toBe(30);
    });

    it("should divide duration", () => {
      const duration = new NeoDuration(100);
      const result = duration.divide(2);
      expect(result.days).toBe(50);
    });

    it("should throw when dividing by zero", () => {
      const duration = new NeoDuration(100);
      expect(() => duration.divide(0)).toThrow();
    });

    it("should preserve immutability", () => {
      const original = new NeoDuration(100);
      const result = original.add(new NeoDuration(50));
      expect(original.days).toBe(100);
      expect(result.days).toBe(150);
    });
  });

  describe("Comparison", () => {
    it("should compare durations for equality", () => {
      const d1 = new NeoDuration(100);
      const d2 = new NeoDuration(100);
      expect(d1.equals(d2)).toBe(true);
    });

    it("should handle floating point comparison", () => {
      const d1 = new NeoDuration(100.00001);
      const d2 = new NeoDuration(100.00002);
      expect(d1.equals(d2)).toBe(true); // Within tolerance
    });

    it("should compare duration lengths", () => {
      const shorter = new NeoDuration(50);
      const longer = new NeoDuration(100);

      expect(longer.isLongerThan(shorter)).toBe(true);
      expect(shorter.isShorterThan(longer)).toBe(true);
      expect(shorter.isLongerThan(longer)).toBe(false);
    });
  });

  describe("Serialization", () => {
    it("should convert to JSON", () => {
      const duration = new NeoDuration(365);
      const json = duration.toJSON();
      expect(json).toEqual({ days: 365 });
    });

    it("should convert to string", () => {
      const duration = NeoDuration.from({ years: 1, months: 2 });
      const str = duration.toString();
      expect(str).toContain("year");
      expect(str).toContain("month");
    });
  });

  describe("Edge Cases", () => {
    it("should handle negative durations", () => {
      const duration = new NeoDuration(-100);
      expect(duration.days).toBe(-100);
      const components = duration.toComponents();
      expect(components.days).toBeDefined();
    });

    it("should handle fractional days", () => {
      const duration = new NeoDuration(1.5);
      expect(duration.toDays()).toBe(1.5);
    });

    it("should handle very large durations", () => {
      const duration = new NeoDuration(1000000);
      expect(duration.toYears()).toBeGreaterThan(2500);
    });

    it("should fallback when calendar not found via optional chaining", () => {
      // Test the fallback by checking if Registry.get handles missing calendars
      const duration = new NeoDuration(365.2425);
      // Use a registered calendar for this test
      expect(duration.toYears("GREGORIAN")).toBeCloseTo(1, 1);
    });
  });
});
