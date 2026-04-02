/**
 * @file Unit tests for BaseCalendarPlugin
 * @description Comprehensive unit tests for abstract BaseCalendarPlugin class
 *
 * Tests the base plugin through a minimal concrete implementation that
 * exercises all default methods and overridable behaviors.
 */

import { describe, it, expect } from "vitest";
import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";
import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
  ValidationResult,
  ConversionStrategy,
  Duration,
  DurationUnit,
  DiurnalStart,
  EraLabel,
} from "@iterumarchive/neo-calendar-core";
import { ValidationError, EraError } from "@iterumarchive/neo-calendar-core";

// ============================================================================
// MINIMAL TEST PLUGIN
// ============================================================================

/**
 * Minimal concrete implementation of BaseCalendarPlugin for testing.
 *
 * This plugin implements a simple fixed-length calendar:
 * - 12 months per year
 * - 30 days per month (no leap years)
 * - Epoch at JDN 0
 * - No special era handling
 */
class TestCalendarPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "TEST_CALENDAR";

  readonly metadata: CalendarSystem = {
    id: "TEST_CALENDAR",
    name: "Test Calendar",
    aliases: ["Test"],
    astronomicalBasis: "solar",
    epoch: {
      jdn: 0n as BrandedJDN,
      description: "JDN 0",
      gregorianDate: { year: -4712, month: 1, day: 1 },
    },
    eraSystem: {
      labels: ["AD", "BC"],
      direction: { type: "bidirectional", pivotYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },
    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 360, // Fixed (30 * 12)
    diurnalStart: "midnight",
    status: "test",
  };

  /**
   * Convert date to JDN (simple arithmetic)
   * Formula: JDN = (year - 1) * 360 + (month - 1) * 30 + day - 1
   */
  toJDN(input: DateInput): BrandedJDN {
    this.assertValid(input);
    const { year, month = 1, day = 1 } = input;
    const jdn = BigInt((year - 1) * 360 + (month - 1) * 30 + day - 1);
    return jdn as BrandedJDN;
  }

  /**
   * Convert JDN to date (simple arithmetic)
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    const days = Number(jdn);
    const year = Math.floor(days / 360) + 1;
    const remainingDays = days % 360;
    const month = Math.floor(remainingDays / 30) + 1;
    const day = (remainingDays % 30) + 1;

    return {
      year,
      month,
      day,
      era: year > 0 ? "AD" : "BC",
      calendar: this.id,
    };
  }

  /**
   * Fixed: 30 days per month
   */
  override daysInMonth(year: number, month: number): number {
    return 30;
  }

  /**
   * Fixed: 360 days per year (no leap years)
   */
  override daysInYear(year: number): number {
    return 360;
  }

  /**
   * Fixed: 12 months per year
   */
  override monthsInYear(year: number): number {
    return 12;
  }

  /**
   * No leap years in test calendar
   */
  override isLeapYear(year: number): boolean {
    return false;
  }
}

// ============================================================================
// VALIDATION TESTS
// ============================================================================

describe("BaseCalendarPlugin - Validation", () => {
  const plugin = new TestCalendarPlugin();

  describe("validate", () => {
    it("should validate complete valid date", () => {
      const result = plugin.validate({ year: 2024, month: 6, day: 15 });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it("should validate date with only year", () => {
      const result = plugin.validate({ year: 2024 });
      expect(result.isValid).toBe(true);
    });

    it("should reject missing year", () => {
      const result = plugin.validate({ month: 6, day: 15 } as DateInput);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Year is required");
    });

    it("should reject invalid month (too high)", () => {
      const result = plugin.validate({ year: 2024, month: 13 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Month must be between"))).toBe(
        true,
      );
    });

    it("should reject invalid month (too low)", () => {
      const result = plugin.validate({ year: 2024, month: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Month must be between"))).toBe(
        true,
      );
    });

    it("should reject invalid day (too high)", () => {
      const result = plugin.validate({ year: 2024, month: 6, day: 31 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Day must be between"))).toBe(
        true,
      );
    });

    it("should reject invalid day (too low)", () => {
      const result = plugin.validate({ year: 2024, month: 6, day: 0 });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Day must be between"))).toBe(
        true,
      );
    });

    it("should reject invalid era", () => {
      const result = plugin.validate({
        year: 2024,
        month: 6,
        day: 15,
        era: "INVALID" as EraLabel,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes("Era"))).toBe(true);
    });

    it("should accept valid era", () => {
      const result = plugin.validate({
        year: 2024,
        month: 6,
        day: 15,
        era: "AD",
      });
      expect(result.isValid).toBe(true);
    });
  });

  describe("isValid", () => {
    it("should return true for valid date", () => {
      expect(plugin.isValid({ year: 2024, month: 6, day: 15 })).toBe(true);
    });

    it("should return false for invalid date", () => {
      expect(plugin.isValid({ year: 2024, month: 13 })).toBe(false);
    });

    it("should return false for missing year", () => {
      expect(plugin.isValid({ month: 6 } as DateInput)).toBe(false);
    });
  });

  describe("assertValid", () => {
    it("should not throw for valid date", () => {
      expect(() => {
        // Access protected method through any
        (plugin as any).assertValid({ year: 2024, month: 6, day: 15 });
      }).not.toThrow();
    });

    it("should throw ValidationError for invalid date", () => {
      expect(() => {
        (plugin as any).assertValid({ year: 2024, month: 13 });
      }).toThrow(ValidationError);
    });

    it("should throw ValidationError with correct context", () => {
      try {
        (plugin as any).assertValid({ year: 2024, month: 13 });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        if (error instanceof ValidationError) {
          expect(error.context?.calendar).toBe("TEST_CALENDAR");
          expect(error.context?.year).toBe(2024);
          expect(error.context?.month).toBe(13);
        }
      }
    });
  });
});

// ============================================================================
// NORMALIZATION TESTS
// ============================================================================

describe("BaseCalendarPlugin - Normalization", () => {
  const plugin = new TestCalendarPlugin();

  describe("normalize", () => {
    it("should default month to 1 if not provided", () => {
      const normalized = plugin.normalize({ year: 2024 }, "snap");
      expect(normalized.month).toBe(1);
    });

    it("should default day to 1 if not provided", () => {
      const normalized = plugin.normalize({ year: 2024, month: 6 }, "snap");
      expect(normalized.day).toBe(1);
    });

    it("should clamp month to max (snap strategy)", () => {
      const normalized = plugin.normalize({ year: 2024, month: 15 }, "snap");
      expect(normalized.month).toBe(12);
    });

    it("should clamp month to min (snap strategy)", () => {
      const normalized = plugin.normalize({ year: 2024, month: 0 }, "snap");
      expect(normalized.month).toBe(1);
    });

    it("should clamp day to max (snap strategy)", () => {
      const normalized = plugin.normalize(
        { year: 2024, month: 6, day: 35 },
        "snap",
      );
      expect(normalized.day).toBe(30); // Max days in test calendar
    });

    it("should clamp day to min (snap strategy)", () => {
      const normalized = plugin.normalize(
        { year: 2024, month: 6, day: 0 },
        "snap",
      );
      expect(normalized.day).toBe(1);
    });

    it("should work with strict strategy (same as snap for base impl)", () => {
      const normalized = plugin.normalize(
        { year: 2024, month: 15, day: 35 },
        "strict",
      );
      expect(normalized.month).toBe(12);
      expect(normalized.day).toBe(30);
    });

    it("should preserve year and era", () => {
      const normalized = plugin.normalize(
        { year: 2024, month: 15, era: "AD" },
        "snap",
      );
      expect(normalized.year).toBe(2024);
      expect(normalized.era).toBe("AD");
    });
  });
});

// ============================================================================
// CALENDAR QUERY TESTS
// ============================================================================

describe("BaseCalendarPlugin - Calendar Queries", () => {
  const plugin = new TestCalendarPlugin();

  describe("isLeapYear", () => {
    it("should return false for all years (test calendar has no leap years)", () => {
      expect(plugin.isLeapYear(2024)).toBe(false);
      expect(plugin.isLeapYear(2000)).toBe(false);
      expect(plugin.isLeapYear(1900)).toBe(false);
    });
  });

  describe("daysInMonth", () => {
    it("should return 30 for all months (test calendar is fixed)", () => {
      for (let month = 1; month <= 12; month++) {
        expect(plugin.daysInMonth(2024, month)).toBe(30);
      }
    });
  });

  describe("daysInYear", () => {
    it("should return 360 for all years (test calendar is fixed)", () => {
      expect(plugin.daysInYear(2024)).toBe(360);
      expect(plugin.daysInYear(2000)).toBe(360);
      expect(plugin.daysInYear(1)).toBe(360);
    });
  });

  describe("monthsInYear", () => {
    it("should return 12 for all years", () => {
      expect(plugin.monthsInYear(2024)).toBe(12);
      expect(plugin.monthsInYear(1)).toBe(12);
    });
  });
});

// ============================================================================
// DIURNAL BOUNDARY TESTS
// ============================================================================

describe("BaseCalendarPlugin - Diurnal Boundary", () => {
  const plugin = new TestCalendarPlugin();

  describe("getDiurnalStart", () => {
    it("should return midnight by default", () => {
      expect(plugin.getDiurnalStart()).toBe("midnight");
    });
  });

  describe("getDiurnalOffset", () => {
    it("should return 0.0 (midnight) by default", () => {
      expect(plugin.getDiurnalOffset()).toBe(0.0);
    });
  });
});

// ============================================================================
// ERA HANDLING TESTS
// ============================================================================

describe("BaseCalendarPlugin - Era Handling", () => {
  const plugin = new TestCalendarPlugin();

  describe("resolveEra", () => {
    it("should convert AD year to astronomical year", () => {
      const result = plugin.resolveEra(2024, "AD");
      expect(result.astronomicalYear).toBe(2024);
      expect(result.displayYear).toBe(2024);
      expect(result.era).toBe("AD");
    });

    it("should convert BC year to negative astronomical year", () => {
      const result = plugin.resolveEra(1, "BC");
      expect(result.astronomicalYear).toBe(-0); // 1 BC = year 0 (represented as -0)
      expect(result.displayYear).toBe(1);
      expect(result.era).toBe("BC");
    });

    it("should convert BC year 5 to astronomical year -4", () => {
      const result = plugin.resolveEra(5, "BC");
      expect(result.astronomicalYear).toBe(-4);
      expect(result.displayYear).toBe(5);
    });

    it("should include epoch JDN", () => {
      const result = plugin.resolveEra(2024, "AD");
      expect(result.eraStart).toBe(0n);
    });
  });

  describe("eraLabel", () => {
    it("should return AD for positive years", () => {
      expect(plugin.eraLabel(2024)).toBe("AD");
      expect(plugin.eraLabel(1)).toBe("AD");
    });

    it("should return BC for negative years", () => {
      expect(plugin.eraLabel(-5)).toBe("BC");
      expect(plugin.eraLabel(-1)).toBe("BC");
    });

    it("should return AD for year 0 (edge case)", () => {
      expect(plugin.eraLabel(0)).toBe("AD");
    });
  });
});

// ============================================================================
// ARITHMETIC TESTS
// ============================================================================

describe("BaseCalendarPlugin - Arithmetic", () => {
  const plugin = new TestCalendarPlugin();

  describe("addMonths", () => {
    it("should add months within same year", () => {
      const result = plugin.addMonths({ year: 2024, month: 6, day: 15 }, 3);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(9);
      expect(result.day).toBe(15);
    });

    it("should add months across year boundary", () => {
      const result = plugin.addMonths({ year: 2024, month: 10, day: 15 }, 5);
      expect(result.year).toBe(2025);
      expect(result.month).toBe(3);
      expect(result.day).toBe(15);
    });

    it("should subtract months", () => {
      const result = plugin.addMonths({ year: 2024, month: 6, day: 15 }, -3);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(3);
      expect(result.day).toBe(15);
    });

    it("should subtract months across year boundary", () => {
      const result = plugin.addMonths({ year: 2024, month: 2, day: 15 }, -5);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(9);
      expect(result.day).toBe(15);
    });

    it("should handle day overflow by snapping to max", () => {
      const result = plugin.addMonths({ year: 2024, month: 1, day: 30 }, 1);
      // Should stay at day 30 (max for test calendar)
      expect(result.day).toBe(30);
    });

    it("should default month and day if not provided", () => {
      const result = plugin.addMonths({ year: 2024 }, 3);
      expect(result.month).toBe(4);
      expect(result.day).toBe(1);
    });
  });

  describe("addYears", () => {
    it("should add years", () => {
      const result = plugin.addYears({ year: 2024, month: 6, day: 15 }, 5);
      expect(result.year).toBe(2029);
      expect(result.month).toBe(6);
      expect(result.day).toBe(15);
    });

    it("should subtract years", () => {
      const result = plugin.addYears({ year: 2024, month: 6, day: 15 }, -10);
      expect(result.year).toBe(2014);
      expect(result.month).toBe(6);
      expect(result.day).toBe(15);
    });

    it("should handle large year additions", () => {
      const result = plugin.addYears({ year: 1, month: 1, day: 1 }, 1000);
      expect(result.year).toBe(1001);
    });

    it("should default month and day if not provided", () => {
      const result = plugin.addYears({ year: 2024 }, 1);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
    });

    it("should handle day overflow in target year", () => {
      // If calendar had variable month lengths, this would test snapping
      const result = plugin.addYears({ year: 2024, month: 2, day: 30 }, 1);
      expect(result.day).toBe(30); // No change in test calendar (all months 30 days)
    });
  });

  describe("durationBetween", () => {
    it("should calculate duration in days", () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 11 };
      const duration = plugin.durationBetween(start, end, "days");

      expect(duration.days).toBe(10);
      expect(duration.originalUnit).toBe("days");
      expect(duration.originalValue).toBe(10);
      expect(duration.isVariable).toBe(false);
    });

    it("should calculate duration in weeks", () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 1, day: 15 };
      const duration = plugin.durationBetween(start, end, "weeks");

      expect(duration.days).toBe(14);
      expect(duration.originalUnit).toBe("weeks");
      expect(duration.originalValue).toBe(2);
      expect(duration.isVariable).toBe(false);
    });

    it("should calculate approximate duration in months", () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2024, month: 4, day: 1 };
      const duration = plugin.durationBetween(start, end, "months");

      expect(duration.days).toBe(90); // 3 months * 30 days
      expect(duration.originalUnit).toBe("months");
      expect(duration.isVariable).toBe(true); // Marked as variable
      expect(duration.calendarContext).toBe("TEST_CALENDAR");
    });

    it("should calculate approximate duration in years", () => {
      const start = { year: 2024, month: 1, day: 1 };
      const end = { year: 2025, month: 1, day: 1 };
      const duration = plugin.durationBetween(start, end, "years");

      expect(duration.days).toBe(360); // 1 year in test calendar
      expect(duration.originalUnit).toBe("years");
      expect(duration.isVariable).toBe(true);
    });

    it("should handle negative durations (end before start)", () => {
      const start = { year: 2024, month: 1, day: 15 };
      const end = { year: 2024, month: 1, day: 5 };
      const duration = plugin.durationBetween(start, end, "days");

      expect(duration.days).toBe(-10);
    });
  });
});

// ============================================================================
// CONVERSION TESTS (toJDN / fromJDN)
// ============================================================================

describe("BaseCalendarPlugin - Conversion", () => {
  const plugin = new TestCalendarPlugin();

  describe("toJDN", () => {
    it("should convert valid date to JDN", () => {
      const jdn = plugin.toJDN({ year: 1, month: 1, day: 1 });
      expect(jdn).toBe(0n);
    });

    it("should convert date with defaults", () => {
      const jdn = plugin.toJDN({ year: 2 });
      // Year 2, month 1 (default), day 1 (default) = 360 days from epoch
      expect(jdn).toBe(360n);
    });

    it("should throw ValidationError for invalid date", () => {
      expect(() => {
        plugin.toJDN({ year: 2024, month: 13 });
      }).toThrow(ValidationError);
    });

    it("should handle multi-year conversion", () => {
      const jdn = plugin.toJDN({ year: 10, month: 1, day: 1 });
      // (10 - 1) * 360 = 3240
      expect(jdn).toBe(3240n);
    });
  });

  describe("fromJDN", () => {
    it("should convert JDN to date", () => {
      const date = plugin.fromJDN(0n as BrandedJDN);
      expect(date.year).toBe(1);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
      expect(date.era).toBe("AD");
      expect(date.calendar).toBe("TEST_CALENDAR");
    });

    it("should convert large JDN", () => {
      const date = plugin.fromJDN(360n as BrandedJDN);
      expect(date.year).toBe(2);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });

    it("should handle mid-year dates", () => {
      // 180 days = 6 months into year 1
      const date = plugin.fromJDN(180n as BrandedJDN);
      expect(date.year).toBe(1);
      expect(date.month).toBe(7);
      expect(date.day).toBe(1);
    });
  });

  describe("toJDN/fromJDN round-trip", () => {
    it("should round-trip valid dates", () => {
      const original = { year: 2024, month: 6, day: 15 };
      const jdn = plugin.toJDN(original);
      const result = plugin.fromJDN(jdn);

      expect(result.year).toBe(original.year);
      expect(result.month).toBe(original.month);
      expect(result.day).toBe(original.day);
    });

    it("should round-trip edge case dates", () => {
      const dates = [
        { year: 1, month: 1, day: 1 },
        { year: 1, month: 12, day: 30 },
        { year: 100, month: 6, day: 15 },
        { year: 2024, month: 1, day: 1 },
      ];

      for (const date of dates) {
        const jdn = plugin.toJDN(date);
        const result = plugin.fromJDN(jdn);
        expect(result.year).toBe(date.year);
        expect(result.month).toBe(date.month);
        expect(result.day).toBe(date.day);
      }
    });
  });
});

// ============================================================================
// HELPER METHOD TESTS
// ============================================================================

describe("BaseCalendarPlugin - Helper Methods", () => {
  const plugin = new TestCalendarPlugin();

  describe("getDefaultInput", () => {
    it("should fill in defaults for partial input", () => {
      const result = (plugin as any).getDefaultInput({ year: 2024 });
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.era).toBe("AD");
    });

    it("should preserve provided values", () => {
      const result = (plugin as any).getDefaultInput({
        year: 2024,
        month: 6,
        day: 15,
        era: "AD",
      });
      expect(result.year).toBe(2024);
      expect(result.month).toBe(6);
      expect(result.day).toBe(15);
      expect(result.era).toBe("AD");
    });

    it("should infer era from year if not provided", () => {
      const resultPositive = (plugin as any).getDefaultInput({ year: 100 });
      expect(resultPositive.era).toBe("AD");

      const resultNegative = (plugin as any).getDefaultInput({ year: -100 });
      expect(resultNegative.era).toBe("BC");
    });
  });
});

// ============================================================================
// PROTECTED PROPERTIES TESTS
// ============================================================================

describe("BaseCalendarPlugin - Protected Properties", () => {
  const plugin = new TestCalendarPlugin();

  it("should have correct averageDaysPerMonth (default)", () => {
    // Access protected property through any
    expect((plugin as any).averageDaysPerMonth).toBe(30.436875);
  });

  it("should have correct averageDaysPerYear (default)", () => {
    expect((plugin as any).averageDaysPerYear).toBe(365.2425);
  });
});

// ============================================================================
// METADATA TESTS
// ============================================================================

describe("BaseCalendarPlugin - Metadata", () => {
  const plugin = new TestCalendarPlugin();

  it("should have correct id", () => {
    expect(plugin.id).toBe("TEST_CALENDAR");
  });

  it("should have complete metadata", () => {
    expect(plugin.metadata).toBeDefined();
    expect(plugin.metadata.id).toBe("TEST_CALENDAR");
    expect(plugin.metadata.name).toBe("Test Calendar");
    expect(plugin.metadata.astronomicalBasis).toBe("solar");
    expect(plugin.metadata.epoch.jdn).toBe(0n);
    expect(plugin.metadata.daysPerWeek).toBe(7);
    expect(plugin.metadata.monthsPerYear).toBe(12);
    expect(plugin.metadata.daysPerYear).toBe(360);
  });

  it("should have era system in metadata", () => {
    expect(plugin.metadata.eraSystem).toBeDefined();
    expect(plugin.metadata.eraSystem.labels).toContain("AD");
    expect(plugin.metadata.eraSystem.labels).toContain("BC");
    expect(plugin.metadata.eraSystem.hasYearZero).toBe(false);
  });
});
