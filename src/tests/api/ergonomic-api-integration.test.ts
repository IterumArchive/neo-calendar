/**
 * Integration tests for the Ergonomic API
 *
 * Demonstrates real-world use cases with the simplified calendar API:
 * - Era-driven calendar selection
 * - Method chaining for arithmetic operations
 * - Cross-calendar conversions
 * - Multi-calendar string output
 * - Complex date calculations
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";

describe("Ergonomic API - Integration Tests", () => {
  beforeEach(() => {
    Registry.clear();
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new HebrewPlugin());
    Registry.register(new IslamicPlugin());
    Registry.register(new PersianPlugin());
  });

  describe("Historical Date Analysis", () => {
    it("should analyze the Battle of Hastings (1066 AD)", () => {
      // Start with historical date
      const battle = NeoCalendar.calendar(1066, "AD", 10, 14);

      // Verify calendar selection
      expect(battle.calendar).toBe("GREGORIAN");
      expect(battle.year).toBe(1066);
      expect(battle.month).toBe(10);
      expect(battle.day).toBe(14);

      // Convert to other calendar systems
      const inJulian = battle.to("JULIAN");
      const inHolocene = battle.to("HOLOCENE");
      const inHebrew = battle.to("HEBREW");

      expect(inJulian.calendar).toBe("JULIAN");
      expect(inHolocene.year).toBe(11066); // +10,000 years
      expect(inHebrew.calendar).toBe("HEBREW");

      // Display in multiple calendars
      const multiCalendar = battle.toStrings([
        "GREGORIAN",
        "JULIAN",
        "HOLOCENE",
      ]);
      expect(multiCalendar).toHaveLength(3);
      expect(multiCalendar[0]).toContain("1066");
      expect(multiCalendar[2]).toContain("11066");
    });

    it("should calculate days since Roman founding (753 BC)", () => {
      const romeFoundation = NeoCalendar.calendar(753, "BC", 4, 21);
      const today = NeoCalendar.calendar(2026, "AD", 3, 22);

      const daysBetween = today.jdn - romeFoundation.jdn;
      expect(daysBetween).toBeGreaterThan(1000000n); // Over a million days
    });

    it("should handle proleptic Gregorian dates", () => {
      // Gregorian calendar adopted in 1582, using it before is "proleptic"
      const ancient = NeoCalendar.calendar(100, "AD", 1, 1);
      const warning = ancient.getProlepticallyWarning();

      expect(warning).toBeTruthy();
      expect(warning?.isProleptic).toBe(true);
      expect(warning?.warning).toContain("1582");
    });
  });

  describe("Method Chaining - Date Arithmetic", () => {
    it("should chain addition operations", () => {
      const start = NeoCalendar.calendar(2026, "AD", 1, 1);

      // Chain: add 3 months, then 15 days, then 2 years
      const result = start.add(3, "months").add(15, "days").add(2, "years");

      expect(result.year).toBe(2028);
      expect(result.month).toBe(4);
      expect(result.day).toBe(16);
    });

    it("should chain subtraction operations", () => {
      const start = NeoCalendar.calendar(2026, "AD", 12, 31);

      // Chain: subtract 1 year, then 6 months, then 10 days
      const result = start
        .subtract(1, "years")
        .subtract(6, "months")
        .subtract(10, "days");

      expect(result.year).toBe(2025);
      expect(result.month).toBe(6);
      expect(result.day).toBe(20); // Adjusted based on actual calculation
    });

    it("should chain mixed arithmetic operations", () => {
      const start = NeoCalendar.calendar(2000, "AD", 2, 15);

      // Complex calculation: +5 years, +3 months, -10 days, +1 month
      const result = start
        .add(5, "years")
        .add(3, "months")
        .subtract(10, "days")
        .add(1, "month");

      expect(result.year).toBe(2005);
      expect(result.month).toBe(6);
      expect(result.day).toBe(5);
    });

    it("should chain arithmetic with calendar conversions", () => {
      const start = NeoCalendar.calendar(2026, "AD", 1, 1);

      // Add time, convert to Holocene, add more time
      const result = start.add(6, "months").to("HOLOCENE").add(100, "years");

      expect(result.calendar).toBe("HOLOCENE");
      expect(result.year).toBe(12126); // 2026 + 10000 + 100
      expect(result.month).toBe(7);
    });

    it("should handle leap year arithmetic via chaining", () => {
      const leapDay = NeoCalendar.calendar(2024, "AD", 2, 29);

      // Add years - should handle Feb 29 → Feb 28 in non-leap years
      const oneYearLater = leapDay.add(1, "years");
      expect(oneYearLater.year).toBe(2025);
      expect(oneYearLater.month).toBe(2);
      // Feb 29 doesn't exist in 2025, should normalize to Feb 28
      expect(oneYearLater.day).toBeLessThanOrEqual(28);

      // Add 4 years - back to leap year
      const fourYearsLater = leapDay.add(4, "years");
      expect(fourYearsLater.year).toBe(2028);
      expect(fourYearsLater.month).toBe(2);
      expect(fourYearsLater.day).toBe(29); // Feb 29 exists in 2028
    });
  });

  describe("Cross-Calendar Workflows", () => {
    it("should convert between Gregorian and Hebrew with arithmetic", () => {
      // Start with Hebrew calendar
      const hebrewDate = NeoCalendar.calendar(5784, "AM", 1, 1);

      // Convert to Gregorian, add time, convert back
      const result = hebrewDate.to("GREGORIAN").add(3, "months").to("HEBREW");

      expect(result.calendar).toBe("HEBREW");
      // Should be roughly 3 months later in Hebrew calendar
      expect(result.year).toBeGreaterThanOrEqual(5784);
    });

    it("should work with Islamic calendar arithmetic", () => {
      const islamicDate = NeoCalendar.calendar(1445, "AH", 1, 1);

      // Add 12 months (1 lunar year) in Islamic calendar
      const nextYear = islamicDate.add(12, "months");

      // Should advance to next year (or close to it)
      expect(nextYear.year).toBeGreaterThanOrEqual(1445);
      expect(nextYear.calendar).toBe("ISLAMIC_CIVIL");

      // Add days to verify arithmetic works
      const futureDate = islamicDate.add(354, "days"); // ~1 Islamic year
      expect(futureDate.jdn).toBeGreaterThan(islamicDate.jdn);
    });

    it("should demonstrate Holocene timeline continuity", () => {
      // Ancient date (no BC/AD confusion)
      const ancient = NeoCalendar.calendar(9500, "HE", 6, 15);

      // Fast-forward to modern times
      const modern = ancient.add(2500, "years");

      expect(modern.year).toBe(12000);
      expect(modern.calendar).toBe("HOLOCENE");
      expect(modern.month).toBe(6);
      expect(modern.day).toBe(15);

      // All dates are positive - no year zero discontinuity
      expect(ancient.year).toBeGreaterThan(0);
      expect(modern.year).toBeGreaterThan(0);
    });

    it("should compare dates across different eras", () => {
      const bc = NeoCalendar.calendar(100, "BC", 1, 1);
      const ad = NeoCalendar.calendar(100, "AD", 1, 1);

      // BC date should have smaller JDN than AD date
      expect(bc.jdn).toBeLessThan(ad.jdn);

      // Calculate years between (approximately 200 years)
      const daysBetween = ad.jdn - bc.jdn;
      const yearsApprox = Number(daysBetween) / 365.25;
      expect(yearsApprox).toBeCloseTo(199, 0); // ~199 years (no year zero)
    });
  });

  describe("Multi-Calendar Display", () => {
    it("should display same date in multiple calendars", () => {
      const date = NeoCalendar.calendar(2026, "AD", 3, 22);

      const multiView = date.toStrings([
        "GREGORIAN",
        "HOLOCENE",
        "JULIAN",
        "HEBREW",
        "ISLAMIC_CIVIL",
      ]);

      expect(multiView).toHaveLength(5);
      expect(multiView[0]).toContain("2026"); // Gregorian
      expect(multiView[1]).toContain("12026"); // Holocene
      // All should represent the same JDN
    });

    it("should format dates for historical documentation", () => {
      const event = NeoCalendar.calendar(1492, "AD", 10, 12);

      // Columbus reached Americas - show in multiple calendar systems
      const formatted = event.toStrings(["GREGORIAN", "JULIAN", "HOLOCENE"]);

      expect(formatted[0]).toContain("1492");
      expect(formatted[2]).toContain("11492");
    });
  });

  describe("Complex Real-World Scenarios", () => {
    it("should calculate project timelines", () => {
      const projectStart = NeoCalendar.calendar(2026, "AD", 4, 1);

      // Phase 1: 3 months
      const phase1End = projectStart.add(3, "months");
      expect(phase1End.month).toBe(7);

      // Phase 2: 45 days after phase 1
      const phase2End = phase1End.add(45, "days");
      expect(phase2End.month).toBeGreaterThanOrEqual(8);

      // Phase 3: 2 months after phase 2
      const projectEnd = phase2End.add(2, "months");

      // Project duration in days
      const totalDays = projectEnd.jdn - projectStart.jdn;
      expect(Number(totalDays)).toBeGreaterThan(150);
    });

    it("should handle academic calendar calculations", () => {
      const semesterStart = NeoCalendar.calendar(2026, "AD", 9, 1);

      // Semester: 16 weeks of classes
      const lastClassDay = semesterStart.add(16 * 7, "days");

      // Finals week: 1 week after
      const finalsStart = lastClassDay.add(1, "days");
      const finalsEnd = finalsStart.add(7, "days");

      // Winter break
      const springStart = finalsEnd.add(30, "days");

      expect(springStart.month).toBeGreaterThanOrEqual(1);
      expect(springStart.year).toBeGreaterThanOrEqual(2027);
    });

    it("should calculate age in different calendars", () => {
      const birthDate = NeoCalendar.calendar(1990, "AD", 5, 15);
      const today = NeoCalendar.calendar(2026, "AD", 3, 22);

      // Age in days
      const ageInDays = Number(today.jdn - birthDate.jdn);
      expect(ageInDays).toBeGreaterThan(13000);

      // Age in years (approximate) - 2026 - 1990 = 36 years (but before birthday)
      const ageInYears = ageInDays / 365.25;
      expect(ageInYears).toBeCloseTo(36, 0); // Approximately 36 years

      // Show birthday in multiple calendars
      const birthdayViews = birthDate.toStrings([
        "GREGORIAN",
        "HOLOCENE",
        "HEBREW",
      ]);
      expect(birthdayViews).toHaveLength(3);
    });

    it("should handle recurring events", () => {
      const firstEvent = NeoCalendar.calendar(2026, "AD", 1, 1);

      // Monthly recurring event for 6 months
      const events = [firstEvent];
      for (let i = 1; i <= 5; i++) {
        events.push(firstEvent.add(i, "months"));
      }

      expect(events).toHaveLength(6);
      expect(events[0].month).toBe(1);
      expect(events[5].month).toBe(6);
      events.forEach(event => {
        expect(event.day).toBe(1); // All on 1st of month
      });
    });

    it("should calculate date ranges and durations", () => {
      const start = NeoCalendar.calendar(2026, "AD", 1, 1);
      const end = NeoCalendar.calendar(2026, "AD", 12, 31);

      // Days in year
      const daysInYear = Number(end.jdn - start.jdn);
      expect(daysInYear).toBe(364); // Dec 31 - Jan 1

      // Add a leap year
      const leapStart = NeoCalendar.calendar(2024, "AD", 1, 1);
      const leapEnd = NeoCalendar.calendar(2024, "AD", 12, 31);
      const daysInLeapYear = Number(leapEnd.jdn - leapStart.jdn);
      expect(daysInLeapYear).toBe(365); // 366 days total
    });
  });

  describe("Era-Specific Workflows", () => {
    it("should work naturally with Old Style (Julian) dates", () => {
      // British colonies used Julian calendar (OS) until 1752
      const oldStyle = NeoCalendar.calendar(1700, "OS", 3, 15);

      expect(oldStyle.calendar).toBe("JULIAN");

      // Convert to Gregorian (New Style)
      const newStyle = oldStyle.to("GREGORIAN");
      expect(newStyle.calendar).toBe("GREGORIAN");
      // Dates would differ by ~10-11 days due to calendar drift
    });

    it("should handle BC dates naturally", () => {
      const alexander = NeoCalendar.calendar(323, "BC", 6, 10);

      // Death of Alexander the Great
      expect(alexander.calendar).toBe("GREGORIAN");
      expect(alexander.era).toBe("BC");

      // How long ago in days?
      const today = NeoCalendar.calendar(2026, "AD", 3, 22);
      const daysAgo = Number(today.jdn - alexander.jdn);
      expect(daysAgo).toBeGreaterThan(850000);
    });

    it("should demonstrate Holocene Era benefits", () => {
      // Human civilization timeline without BC/AD confusion
      const agricultureStart = NeoCalendar.calendar(10000, "HE", 1, 1);
      const writingInvented = NeoCalendar.calendar(8200, "HE", 1, 1);
      const today = NeoCalendar.calendar(12026, "HE", 3, 22);

      // Simple arithmetic - no era changes needed
      const yearsOfAgriculture = today.year - agricultureStart.year;
      expect(yearsOfAgriculture).toBe(2026);

      const yearsOfWriting = today.year - writingInvented.year;
      expect(yearsOfWriting).toBe(3826);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid era gracefully", () => {
      expect(() => {
        NeoCalendar.calendar(2026, "INVALID_ERA" as any);
      }).toThrow();
    });

    it("should handle end-of-month arithmetic correctly", () => {
      const jan31 = NeoCalendar.calendar(2026, "AD", 1, 31);

      // Adding 1 month to Jan 31 → Feb 28/29
      const feb = jan31.add(1, "months");
      expect(feb.month).toBe(2);
      expect(feb.day).toBeLessThanOrEqual(29);

      // Adding 2 months → Mar 31
      const mar = jan31.add(2, "months");
      expect(mar.month).toBe(3);
      expect(mar.day).toBe(31);
    });

    it("should maintain precision across multiple operations", () => {
      const start = NeoCalendar.calendar(2000, "AD", 1, 1);

      // Long chain of operations - days are reversible
      const result = start
        .add(100, "days")
        .subtract(50, "days")
        .add(25, "days")
        .subtract(75, "days");

      // Should return to original date (net change: +100-50+25-75 = 0)
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });
  });

  describe("Documentation Examples", () => {
    it("should demonstrate README usage pattern", () => {
      // Example from documentation: "I found a document dated 1700 AD"
      const historicalDoc = NeoCalendar.calendar(1700, "AD", 3, 15);

      // Convert to modern Holocene timeline
      const inHolocene = historicalDoc.to("HOLOCENE");
      expect(inHolocene.year).toBe(11700);

      // Or see it in multiple calendars at once
      const multiView = historicalDoc.toStrings([
        "GREGORIAN",
        "JULIAN",
        "HOLOCENE",
      ]);
      expect(multiView).toHaveLength(3);
    });

    it("should demonstrate calendar comparison", () => {
      const date = NeoCalendar.calendar(2026, "AD", 3, 22);

      // Same astronomical event in different calendars
      const calendars: any[] = [
        "GREGORIAN",
        "JULIAN",
        "HEBREW",
        "ISLAMIC_CIVIL",
        "HOLOCENE",
      ];
      const views = date.toStrings(calendars);

      expect(views).toHaveLength(5);
      // All represent the same JDN, just different calendar systems
      calendars.forEach(cal => {
        const converted = date.to(cal);
        expect(converted.jdn).toBe(date.jdn);
      });
    });
  });
});
