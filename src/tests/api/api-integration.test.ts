/**
 * @file API Layer Integration Test
 * @description Test the high-level NeoCalendar API
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { NeoCalendar, Registry } from "@iterumarchive/neo-calendar";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";

describe("NeoCalendar API Integration", () => {
  beforeAll(() => {
    // Register essential calendars
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new UnixPlugin());
  });

  afterAll(() => {
    // Clean up registry to prevent test pollution
    Registry.clear();
  });

  describe("Factory Methods", () => {
    it("should create a date with at()", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBe(18);
      expect(date.calendar).toBe("GREGORIAN");
    });

    it("should create a date with from()", () => {
      const date = NeoCalendar.from(
        { year: 12024, month: 3, day: 18, era: "HE" },
        "HOLOCENE",
      );
      expect(date.year).toBe(12024);
      expect(date.calendar).toBe("HOLOCENE");
    });

    it("should create a date with now()", () => {
      const date = NeoCalendar.now("GREGORIAN");
      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBeGreaterThan(2020);
    });

    it("should create a date from JS Date", () => {
      const jsDate = new Date(2024, 2, 18); // March 18, 2024
      const date = NeoCalendar.fromJSDate(jsDate);
      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBe(18);
    });
  });

  describe("Date Conversion", () => {
    it("should convert Gregorian to Holocene", () => {
      const gregorian = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const holocene = gregorian.to("HOLOCENE");

      expect(holocene.year).toBe(12024);
      expect(holocene.month).toBe(3);
      expect(holocene.day).toBe(18);
      expect(holocene.calendar).toBe("HOLOCENE");
    });

    it("should convert to multiple calendars at once", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const conversions = date.to(["HOLOCENE", "JULIAN"]);

      expect(conversions["HOLOCENE"].year).toBe(12024);
      expect(conversions["JULIAN"].calendar).toBe("JULIAN");
    });

    it("should round-trip convert without loss", () => {
      const original = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const holocene = original.to("HOLOCENE");
      const backToGregorian = holocene.to("GREGORIAN");

      expect(backToGregorian.year).toBe(original.year);
      expect(backToGregorian.month).toBe(original.month);
      expect(backToGregorian.day).toBe(original.day);
      expect(backToGregorian.jdn).toBe(original.jdn);
    });
  });

  describe("Date Arithmetic", () => {
    it("should add days", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const future = date.add(10, "day");

      expect(future.year).toBe(2024);
      expect(future.month).toBe(3);
      expect(future.day).toBe(28);
    });

    it("should add months", () => {
      const date = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const future = date.add(2, "month");

      expect(future.year).toBe(2024);
      expect(future.month).toBe(3);
      expect(future.day).toBe(15);
    });

    it("should add years", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const future = date.add(10, "year");

      expect(future.year).toBe(2034);
      expect(future.month).toBe(3);
      expect(future.day).toBe(18);
    });

    it("should subtract days", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const past = date.subtract(10, "day");

      expect(past.year).toBe(2024);
      expect(past.month).toBe(3);
      expect(past.day).toBe(8);
    });

    it("should calculate difference as NeoDuration", () => {
      const date1 = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const date2 = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
      const duration = date1.diff(date2);

      expect(duration.days).toBeGreaterThan(300);
      expect(duration.toYears("GREGORIAN")).toBeCloseTo(1, 0);
      // 364 days is just under 1 year, so toHuman() shows months
      expect(duration.toHuman()).toContain("month");
    });
  });

  describe("Date Comparison", () => {
    it("should compare dates with isBefore", () => {
      const date1 = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const date2 = NeoCalendar.at(2024, 3, 19, "GREGORIAN");

      expect(date1.isBefore(date2)).toBe(true);
      expect(date2.isBefore(date1)).toBe(false);
    });

    it("should compare dates with isAfter", () => {
      const date1 = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const date2 = NeoCalendar.at(2024, 3, 19, "GREGORIAN");

      expect(date2.isAfter(date1)).toBe(true);
      expect(date1.isAfter(date2)).toBe(false);
    });

    it("should compare dates with equals", () => {
      const date1 = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const date2 = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const date3 = NeoCalendar.at(2024, 3, 19, "GREGORIAN");

      expect(date1.equals(date2)).toBe(true);
      expect(date1.equals(date3)).toBe(false);
    });

    it("should check if date is between two others", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const start = NeoCalendar.at(2024, 3, 15, "GREGORIAN");
      const end = NeoCalendar.at(2024, 3, 20, "GREGORIAN");

      expect(date.isBetween(start, end)).toBe(true);
    });
  });

  describe("Display and Formatting", () => {
    it("should have a display property", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.display).toBeTruthy();
      expect(typeof date.display).toBe("string");
    });

    it("should convert to ISO string", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const iso = date.toISOString();
      expect(iso).toBe("2024-03-18");
    });

    it("should convert to JS Date", () => {
      const neoDate = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const jsDate = neoDate.toJSDate();

      expect(jsDate.getFullYear()).toBe(2024);
      expect(jsDate.getMonth()).toBe(2); // JS months are 0-indexed
      expect(jsDate.getDate()).toBe(18);
    });
  });

  describe("Metadata Support", () => {
    it("should add metadata with with()", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const withMeta = date.with({ circa: true });

      expect(withMeta.metadata.circa).toBe(true);
      expect(withMeta.year).toBe(date.year); // Date unchanged
    });

    it("should update date fields with with()", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const updated = date.with({ month: 5, day: 1 });

      expect(updated.year).toBe(2024);
      expect(updated.month).toBe(5);
      expect(updated.day).toBe(1);
    });
  });

  describe("Registry Integration", () => {
    it("should list registered calendars", () => {
      const calendars = NeoCalendar.registry.list();
      expect(calendars).toContain("GREGORIAN");
      expect(calendars).toContain("HOLOCENE");
    });

    it("should check if calendar is registered", () => {
      expect(NeoCalendar.registry.has("GREGORIAN")).toBe(true);
      expect(NeoCalendar.registry.has("NONEXISTENT" as any)).toBe(false);
    });
  });

  describe("Edge Cases & Scientific Rigor", () => {
    describe("Historical Calendar Transitions", () => {
      it("should correctly handle the 1582 Gregorian gap", () => {
        // October 4, 1582 (Julian) was followed by October 15, 1582 (Gregorian)
        const julian = NeoCalendar.at(1582, 10, 4, "JULIAN");
        const nextDay = julian.add(1, "day");

        // Converting to Gregorian - the transition skipped 10 days
        const gregorian = nextDay.to("GREGORIAN");
        expect(gregorian.day).toBe(14); // Oct 5 Julian = Oct 14 Gregorian (before adoption)
        expect(gregorian.month).toBe(10);
        expect(gregorian.year).toBe(1582);
      });

      it("should preserve JDN across calendar transitions", () => {
        const julianDate = NeoCalendar.at(1582, 10, 4, "JULIAN");
        const gregorianDate = julianDate.to("GREGORIAN");
        const backToJulian = gregorianDate.to("JULIAN");

        // JDN should be identical across conversions
        expect(backToJulian.jdn).toBe(julianDate.jdn);
      });
    });

    describe("Leap Year Arithmetic", () => {
      it("should snap Feb 29 to Feb 28 in non-leap years", () => {
        const leapDay = NeoCalendar.at(2024, 2, 29, "GREGORIAN");
        const nextYear = leapDay.add(1, "year", { overflow: "snap" });

        expect(nextYear.year).toBe(2025);
        expect(nextYear.month).toBe(2);
        expect(nextYear.day).toBe(28); // Snapped to last valid day
      });

      it("should handle month overflow at year boundaries", () => {
        const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
        const future = date.add(1, "month", { overflow: "snap" });

        expect(future.month).toBe(2);
        expect(future.day).toBe(29); // 2024 is a leap year
      });
    });

    describe("Scientific Metadata & Uncertainty", () => {
      it("should apply tolerance for uncertainty windows", () => {
        const date1 = NeoCalendar.at(12000, 1, 1, "HOLOCENE");
        const date2 = NeoCalendar.at(12001, 1, 1, "HOLOCENE");

        // 1 year apart with 2 year tolerance should be contemporary
        const isContemporary = date1.isContemporaryWith(date2, 365 * 2);
        expect(isContemporary).toBe(true);

        // But not with smaller tolerance
        const notContemporary = date1.isContemporaryWith(date2, 100);
        expect(notContemporary).toBe(false);
      });

      it("should not consider non-overlapping uncertainty windows as contemporary", () => {
        const date1 = NeoCalendar.at(12005, 1, 1, "HOLOCENE");
        const date2 = NeoCalendar.at(12100, 1, 1, "HOLOCENE").with({
          circa: true,
        });

        // 95 year gap (~34675 days), even with circa (~50 years = 18250 days)
        // should not be contemporary
        const isContemporary = date1.isContemporaryWith(date2);
        expect(isContemporary).toBe(false);
      });

      it("should preserve metadata through conversions", () => {
        const dateWithMeta = NeoCalendar.at(12000, 1, 1, "HOLOCENE").with({
          circa: true,
          uncertain: true,
        });

        const converted = dateWithMeta.to("GREGORIAN");

        expect(converted.metadata.circa).toBe(true);
        expect(converted.metadata.uncertain).toBe(true);
      });
    });

    describe("JDN Round-Trip Integrity", () => {
      it("should preserve exact BigInt JDN across high-level wrappers", () => {
        const bigJdn = 2460388n as BrandedJDN;
        const date = NeoCalendar.fromJDN(bigJdn, "GREGORIAN");

        expect(date.jdn).toBe(bigJdn);
      });

      it("should maintain JDN precision through multiple conversions", () => {
        const original = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
        const originalJDN = original.jdn;

        // Convert through multiple calendars
        const holocene = original.to("HOLOCENE");
        const julian = holocene.to("JULIAN");
        const backToGregorian = julian.to("GREGORIAN");

        expect(backToGregorian.jdn).toBe(originalJDN);
      });

      it("should handle very large JDN values", () => {
        // Test with a date far in the future
        const farFuture = 5000000n as BrandedJDN;
        const date = NeoCalendar.fromJDN(farFuture, "GREGORIAN");

        expect(date.jdn).toBe(farFuture);
        // JDN 5000000 is around year 8977 CE
        expect(date.year).toBeGreaterThan(8000);
      });

      it("should handle very small JDN values near epoch", () => {
        // Test JDN near the epoch
        const nearEpoch = 100n as BrandedJDN;
        const date = NeoCalendar.fromJDN(nearEpoch, "GREGORIAN");

        expect(date.jdn).toBe(nearEpoch);
        // Should be very early date (4713 CE in this implementation)
        expect(date.year).toBeGreaterThan(0);
        expect(date.year).toBeLessThan(5000);
      });
    });

    describe("Cross-Calendar Arithmetic Consistency", () => {
      it("should produce consistent results when adding days vs converting", () => {
        const gregorian = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
        const addedInGregorian = gregorian.add(100, "day");

        const holocene = gregorian.to("HOLOCENE");
        const addedInHolocene = holocene.add(100, "day");
        const backToGregorian = addedInHolocene.to("GREGORIAN");

        // Both approaches should yield same JDN
        expect(backToGregorian.jdn).toBe(addedInGregorian.jdn);
      });

      it("should handle arithmetic across calendar system boundaries", () => {
        // Test date arithmetic near the Julian/Gregorian transition
        const beforeTransition = NeoCalendar.at(1582, 9, 1, "JULIAN");
        const afterAdding = beforeTransition.add(50, "day");

        // Should cross the calendar gap seamlessly
        expect(afterAdding.month).toBe(10);
        expect(afterAdding.jdn).toBe(beforeTransition.jdn + 50n);
      });
    });

    describe("Immutability Guarantees", () => {
      it("should never mutate original date during operations", () => {
        const original = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
        const originalJDN = original.jdn;
        const originalYear = original.year;

        // Perform various operations
        original.add(1, "year");
        original.to("HOLOCENE");
        original.with({ circa: true });
        original.subtract(10, "day");

        // Original should be unchanged
        expect(original.jdn).toBe(originalJDN);
        expect(original.year).toBe(originalYear);
      });
    });
  });
});
