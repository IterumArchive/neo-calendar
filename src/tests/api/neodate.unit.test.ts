/**
 * @file NeoDate Unit Tests
 * @description Unit tests for NeoDate class methods
 * Tests all documented methods from Phase 1: NeoDate.md
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { NeoDate } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";

describe("NeoDate Unit Tests", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new HebrewPlugin());
    Registry.register(new UnixPlugin());
  });

  afterAll(() => {
    Registry.clear();
  });

  describe("Core Properties", () => {
    it("should expose jdn property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(typeof date.jdn).toBe("bigint");
      expect(date.jdn).toBeGreaterThan(0n);
    });

    it("should expose calendar property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.calendar).toBe("GREGORIAN");
    });

    it("should expose year, month, day properties", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBe(15);
    });

    it("should expose era property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.era).toBeDefined();
    });

    it("should expose display property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.display).toContain("2024");
      expect(date.display).toContain("03");
      expect(date.display).toContain("15");
    });

    it("should expose record property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.record).toBeDefined();
      expect(date.record.year).toBe(2024);
    });

    it("should expose metadata property", () => {
      const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      expect(date.metadata).toBeDefined();
      expect(typeof date.metadata).toBe("object");
    });
  });

  describe("Conversion Methods", () => {
    describe("to()", () => {
      it("should convert to single calendar", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const holocene = gregorian.to("HOLOCENE");

        expect(holocene.year).toBe(12024);
        expect(holocene.calendar).toBe("HOLOCENE");
        expect(holocene.jdn).toBe(gregorian.jdn); // Same JDN
      });

      it("should convert to multiple calendars", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const conversions = gregorian.to(["HOLOCENE", "JULIAN"]);

        expect(conversions["HOLOCENE"]).toBeDefined();
        expect(conversions["JULIAN"]).toBeDefined();
        expect(conversions["HOLOCENE"].calendar).toBe("HOLOCENE");
      });

      it("should preserve JDN across conversions", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const holocene = gregorian.to("HOLOCENE");
        const backToGregorian = holocene.to("GREGORIAN");

        expect(backToGregorian.jdn).toBe(gregorian.jdn);
        expect(backToGregorian.year).toBe(gregorian.year);
      });

      // Era-based conversion tests
      describe("era suffix conversion", () => {
        it("should convert to calendar by era suffix and return formatted string", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const heDate = gregorian.to("HE");

          expect(typeof heDate).toBe("string");
          expect(heDate).toBe("12024 HE");
        });

        it("should convert to multiple calendars by era suffixes and return string array", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const dates = gregorian.to(["HE", "AD"]);

          expect(Array.isArray(dates)).toBe(true);
          expect(dates.length).toBe(2);
          expect(dates[0]).toBe("12024 HE");
          expect(dates[1]).toBe("2024 AD");
        });

        it("should support includeSuffix option", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const withSuffix = gregorian.to("HE", { includeSuffix: true });
          const withoutSuffix = gregorian.to("HE", { includeSuffix: false });

          expect(withSuffix).toBe("12024 HE");
          expect(withoutSuffix).toBe("12024");
        });

        it("should support includeDate option", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const yearOnly = gregorian.to("HE", { includeDate: false });
          const fullDate = gregorian.to("HE", { includeDate: true });

          expect(yearOnly).toBe("12024 HE");
          expect(fullDate).toContain("12024");
          expect(fullDate).toContain("03");
          expect(fullDate).toContain("15");
          expect(fullDate).toContain("HE");
        });

        it("should support both options together for arrays", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const dates = gregorian.to(["HE", "AD"], {
            includeSuffix: false,
            includeDate: false,
          });

          expect(dates[0]).toBe("12024");
          expect(dates[1]).toBe("2024");
        });

        it("should throw error for unknown era suffix", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");

          expect(() => {
            gregorian.to("UNKNOWN_ERA" as any);
          }).toThrow(/not found in registry/);
        });

        it("should work with Julian era (OS)", () => {
          const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
          const osDate = gregorian.to("OS");

          expect(typeof osDate).toBe("string");
          expect(osDate).toContain("OS");
        });
      });
    });

    describe("as()", () => {
      it("should work as alias for to()", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const holocene1 = gregorian.to("HOLOCENE");
        const holocene2 = gregorian.as("HOLOCENE");

        expect(holocene2.year).toBe(holocene1.year);
        expect(holocene2.jdn).toBe(holocene1.jdn);
      });
    });

    describe("project()", () => {
      it("should project to multiple calendars", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const projection = gregorian.project(["HOLOCENE", "JULIAN"]);

        expect(projection.source).toBe(gregorian);
        expect(projection.calendars["HOLOCENE"]).toBeDefined();
        expect(projection.calendars["JULIAN"]).toBeDefined();
      });

      it("should return valid projection result", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const projection = gregorian.project(["HOLOCENE"]);

        expect(projection.allValid()).toBe(true);
        expect(projection.toArray().length).toBe(1);
      });
    });
  });

  describe("Arithmetic Operations", () => {
    describe("add()", () => {
      it("should add days", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.add(10, "day");

        expect(result.year).toBe(2024);
        expect(result.month).toBe(3);
        expect(result.day).toBe(25);
      });

      it("should add months", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.add(2, "month");

        expect(result.year).toBe(2024);
        expect(result.month).toBe(5);
        expect(result.day).toBe(15);
      });

      it("should add years", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.add(1, "year");

        expect(result.year).toBe(2025);
        expect(result.month).toBe(3);
        expect(result.day).toBe(15);
      });

      it("should add weeks as days", () => {
        // Week is not a supported unit - use days (7 days = 1 week)
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.add(14, "day"); // 2 weeks = 14 days

        expect(result.day).toBe(29); // 15 + 14 days
      });

      it("should handle month overflow with snap strategy", () => {
        const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
        const result = date.add(1, "month", { overflow: "snap" });

        expect(result.month).toBe(2);
        expect(result.day).toBe(29); // Snapped to Feb 29 (leap year)
      });
    });

    describe("subtract()", () => {
      it("should subtract days", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.subtract(10, "day");

        expect(result.year).toBe(2024);
        expect(result.month).toBe(3);
        expect(result.day).toBe(5);
      });

      it("should subtract months", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.subtract(2, "month");

        expect(result.year).toBe(2024);
        expect(result.month).toBe(1);
      });

      it("should subtract years", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const result = date.subtract(1, "year");

        expect(result.year).toBe(2023);
      });
    });

    describe("diff()", () => {
      it("should calculate difference between dates", () => {
        const date1 = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const date2 = NeoCalendar.at(2024, 1, 10, "GREGORIAN");
        const duration = date1.diff(date2);

        expect(duration.days).toBe(9);
      });

      it("should work across calendars", () => {
        const gregorian = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const holocene = gregorian.to("HOLOCENE");
        const duration = gregorian.diff(holocene);

        expect(duration.days).toBe(0); // Same JDN
      });
    });
  });

  describe("Comparison Methods", () => {
    describe("isBefore()", () => {
      it("should return true when date is before other", () => {
        const date1 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const date2 = NeoCalendar.at(2024, 3, 20, "GREGORIAN");

        expect(date1.isBefore(date2)).toBe(true);
        expect(date2.isBefore(date1)).toBe(false);
      });
    });

    describe("isAfter()", () => {
      it("should return true when date is after other", () => {
        const date1 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const date2 = NeoCalendar.at(2024, 3, 10, "GREGORIAN");

        expect(date1.isAfter(date2)).toBe(true);
        expect(date2.isAfter(date1)).toBe(false);
      });
    });

    describe("equals()", () => {
      it("should return true for same dates", () => {
        const date1 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const date2 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");

        expect(date1.equals(date2)).toBe(true);
      });

      it("should return true for same JDN different calendars", () => {
        const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const holocene = gregorian.to("HOLOCENE");

        expect(gregorian.equals(holocene)).toBe(true);
      });
    });

    describe("isSame()", () => {
      it("should work as alias for equals()", () => {
        const date1 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const date2 = NeoCalendar.at(2024, 3, 15, "GREGORIAN");

        expect(date1.isSame(date2)).toBe(true);
      });
    });

    describe("isBetween()", () => {
      it("should return true when date is between two others", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const start = NeoCalendar.at(2024, 3, 10, "GREGORIAN");
        const end = NeoCalendar.at(2024, 3, 20, "GREGORIAN");

        expect(date.isBetween(start, end)).toBe(true);
      });

      it("should return false when date is outside range", () => {
        const date = NeoCalendar.at(2024, 3, 25, "GREGORIAN");
        const start = NeoCalendar.at(2024, 3, 10, "GREGORIAN");
        const end = NeoCalendar.at(2024, 3, 20, "GREGORIAN");

        expect(date.isBetween(start, end)).toBe(false);
      });
    });
  });

  describe("Display & Formatting Methods", () => {
    describe("format()", () => {
      it("should format with YYYY token", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        expect(date.format("YYYY")).toBe("2024");
      });

      it("should format with MM token", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        expect(date.format("MM")).toBe("03");
      });

      it("should format with DD token", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        expect(date.format("DD")).toBe("15");
      });

      it("should format with combined tokens", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        expect(date.format("YYYY-MM-DD")).toBe("2024-03-15");
      });
    });

    // toHuman() method not yet implemented - skip for now
    // toHuman() method not yet implemented on NeoDate (but exists on NeoDuration/NeoSpan)
    describe.skip("toHuman()", () => {
      it("should return human-readable string", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const human = date.toHuman();

        expect(typeof human).toBe("string");
        expect(human.length).toBeGreaterThan(0);
      });
    });

    describe("toISOString()", () => {
      it("should return ISO format string", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        expect(date.toISOString()).toBe("2024-03-15");
      });
    });

    describe("toJSON()", () => {
      it("should return JSON representation", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const json = date.toJSON();

        expect(json).toHaveProperty("year");
        expect(json).toHaveProperty("month");
        expect(json).toHaveProperty("day");
        expect(json).toHaveProperty("calendar");
      });
    });

    describe("toString()", () => {
      it("should return string representation", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const str = date.toString();

        expect(typeof str).toBe("string");
        expect(str.length).toBeGreaterThan(0);
      });
    });
  });

  // Metadata operations not yet implemented - skip for now
  describe.skip("Metadata Operations", () => {
    describe("withMeta()", () => {
      it("should add metadata to date", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const withMeta = date.withMeta({ event: "Birthday" });

        expect(withMeta.metadata.event).toBe("Birthday");
      });

      it("should preserve date values", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const withMeta = date.withMeta({ event: "Birthday" });

        expect(withMeta.year).toBe(date.year);
        expect(withMeta.jdn).toBe(date.jdn);
      });

      it("should update existing metadata", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const withMeta1 = date.withMeta({ event: "Birthday" });
        const withMeta2 = withMeta1.withMeta({ priority: "high" });

        expect(withMeta2.metadata.event).toBe("Birthday");
        expect(withMeta2.metadata.priority).toBe("high");
      });
    });

    describe("clearMeta()", () => {
      it("should clear all metadata", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const withMeta = date.withMeta({ event: "Birthday" });
        const cleared = withMeta.clearMeta();

        expect(Object.keys(cleared.metadata).length).toBe(0);
      });
    });
  });

  describe("Interoperability Methods", () => {
    describe("toJSDate()", () => {
      it("should convert to JavaScript Date", () => {
        const date = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
        const jsDate = date.toJSDate();

        expect(jsDate.getFullYear()).toBe(2024);
        expect(jsDate.getMonth()).toBe(2); // JS months are 0-indexed
        expect(jsDate.getDate()).toBe(15);
      });
    });

    describe("toUnixTimestamp()", () => {
      it("should convert to Unix timestamp", () => {
        const date = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const timestamp = date.toUnixTimestamp();

        expect(typeof timestamp).toBe("number");
        expect(timestamp).toBeGreaterThan(0);
      });
    });
  });

  describe("Immutability", () => {
    it("should not mutate original date on arithmetic", () => {
      const original = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      const modified = original.add(10, "day");

      expect(original.day).toBe(15);
      expect(modified.day).toBe(25);
    });

    it("should not mutate original date on conversion", () => {
      const gregorian = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      const holocene = gregorian.to("HOLOCENE");

      expect(gregorian.calendar).toBe("GREGORIAN");
      expect(holocene.calendar).toBe("HOLOCENE");
    });

    it("should not mutate original date on any operation", () => {
      const original = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      const converted = original.to("HOLOCENE");
      const added = original.add(1, "day");

      // Original unchanged
      expect(original.calendar).toBe("GREGORIAN");
      expect(original.day).toBe(15);

      // New instances created
      expect(converted.calendar).toBe("HOLOCENE");
      expect(added.day).toBe(16);
    });
  });
});
