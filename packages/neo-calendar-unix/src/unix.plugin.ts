/**
 * @file Unix Timestamp Plugin
 * @description Computational calendar - seconds since Unix epoch
 *
 * Unix time is a system for describing a point in time as the number of seconds
 * that have elapsed since 00:00:00 UTC on 1 January 1970.
 *
 * Key Properties:
 * - Computational basis (no astronomical reference)
 * - Second-level precision
 * - No concept of months or years (continuous count)
 * - No leap seconds (in standard Unix)
 * - Can represent negative values (dates before 1970)
 *
 * Mathematical Simplicity:
 * - toJDN: Convert seconds to days, add Unix epoch JDN
 * - fromJDN: Subtract Unix epoch JDN, convert days to seconds
 *
 * This demonstrates how Neo Calendar handles computational/technical calendars
 * that have no month/year structure.
 */

import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
} from "@iterumarchive/neo-calendar-core";

import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";
import { ValidationError } from "@iterumarchive/neo-calendar-core";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Unix epoch in JDN
 * January 1, 1970 00:00:00 UTC = JDN 2,440,588
 */
const UNIX_EPOCH_JDN = 2440588n;

/**
 * Seconds per day
 */
const SECONDS_PER_DAY = 86400;

// ============================================================================
// UNIX PLUGIN
// ============================================================================

/**
 * Unix timestamp calendar plugin.
 *
 * Pure computational calendar - no months/years, just seconds since epoch.
 * Demonstrates handling of technical time systems.
 */
export class UnixPlugin extends BaseCalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  readonly id: CalendarSystemId = "UNIX";

  readonly metadata: CalendarSystem = {
    id: "UNIX",
    name: "Unix Timestamp",
    aliases: ["Unix Time", "POSIX Time", "Epoch Time"],

    // Astronomical basis
    astronomicalBasis: "computational",
    epoch: {
      jdn: UNIX_EPOCH_JDN as BrandedJDN,
      description: "January 1, 1970 00:00:00 UTC",
      gregorianDate: { year: 1970, month: 1, day: 1 },
    },

    // Era system
    eraSystem: {
      labels: ["Unix"],
      direction: { type: "forward", startYear: 0 },
      cycle: { type: "continuous" },
      hasYearZero: true,
    },

    // Structure (Unix doesn't have traditional structure)
    monthsPerYear: 1, // Not applicable
    daysPerYear: 365.25, // Approximate for duration calculations

    // Temporal foundation
    diurnalStart: "midnight",

    // Intercalation (none - continuous count)
    intercalation: {
      type: "algorithmic",
    },

    // Precision
    granularity: {
      resolution: { unit: "second" },
      supportsFractional: true,
    },

    // Proleptic extension
    prolepticMode: "proleptic",

    // Display
    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: false },
      showEra: false,
    },

    // Context
    culturalContext: ["Technical", "Computing"],
    usedFor: ["scientific"],
    geographicRegions: ["Global"],
  };

  // ============================================================================
  // UNIX-SPECIFIC OVERRIDES
  // ============================================================================

  /**
   * Unix doesn't have traditional leap years
   * (It counts seconds continuously)
   */
  isLeapYear(year: number): boolean {
    return false;
  }

  /**
   * Unix doesn't have months
   */
  daysInMonth(year: number, month: number): number {
    throw ValidationError.invalidDate(this.id, year, month, undefined, [
      "Unix timestamps do not have month structure",
    ]);
  }

  /**
   * Unix represents time as continuous seconds
   * Day count is not meaningful
   */
  daysInYear(year: number): number {
    return 365; // Approximate, not actually used
  }

  /**
   * Unix doesn't have months
   */
  monthsInYear(year: number): number {
    return 1; // Not applicable
  }

  // ============================================================================
  // VALIDATION OVERRIDE
  // ============================================================================

  /**
   * Unix validation is simpler - just need a year (which represents seconds)
   */
  validate(input: DateInput) {
    const errors: string[] = [];
    const warnings: string[] = [];

    // For Unix, "year" actually represents seconds since epoch
    if (input.year === undefined || input.year === null) {
      errors.push("Unix timestamp (seconds) is required");
    }

    // Warn if month/day provided (will be ignored)
    if (input.month !== undefined || input.day !== undefined) {
      warnings.push(
        "Unix timestamps ignore month/day fields - only seconds are used",
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // ============================================================================
  // CORE CONVERSIONS
  // ============================================================================

  /**
   * Convert Unix timestamp to JDN
   *
   * Algorithm:
   * 1. Treat input.year as Unix timestamp (seconds since epoch)
   * 2. Convert seconds to days
   * 3. Add Unix epoch JDN
   *
   * Note: We use input.year to store the timestamp since DateInput
   * requires a year field. This is semantic overloading but maintains
   * interface compatibility.
   */
  toJDN(input: DateInput): BrandedJDN {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw ValidationError.invalidDate(
        this.id,
        input.year,
        input.month,
        input.day,
        validation.errors,
      );
    }

    // input.year contains Unix timestamp (seconds)
    const unixSeconds = input.year;

    // Convert to days (with fractional part)
    const days = Math.floor(unixSeconds / SECONDS_PER_DAY);

    // Add Unix epoch JDN
    const jdn = UNIX_EPOCH_JDN + BigInt(days);

    return jdn as BrandedJDN;
  }

  /**
   * Convert JDN to Unix timestamp
   *
   * Algorithm:
   * 1. Subtract Unix epoch JDN to get day offset
   * 2. Convert days to seconds
   * 3. Return as "year" field (semantic overloading)
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    // Calculate day offset from Unix epoch
    const daysSinceEpoch = Number(jdn - UNIX_EPOCH_JDN);

    // Convert to seconds
    const unixSeconds = daysSinceEpoch * SECONDS_PER_DAY;

    // For display, we could convert to ISO 8601, but for now just show seconds
    const display = `${unixSeconds}`;

    return {
      jdn,
      calendar: this.id,
      year: unixSeconds, // Semantic overload: "year" = timestamp
      month: 1, // Set to 1 for consistency (Unix has no real months)
      day: 1, // Set to 1 for consistency (Unix has no real days)
      era: "Unix",
      display,
      astronomicalBasis: "computational",
      epochOffset: UNIX_EPOCH_JDN as BrandedJDN,
      isProleptic: false, // Unix time is always proleptic by nature
      isLeapYear: false,
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }

  // ============================================================================
  // ERA HANDLING
  // ============================================================================

  /**
   * Unix only has one "era" (continuous count from epoch)
   */
  eraLabel(year: number): "Unix" {
    return "Unix";
  }

  /**
   * Unix era resolution (continuous from epoch)
   */
  resolveEra(year: number, era: string) {
    return {
      astronomicalYear: year,
      displayYear: year,
      eraStart: UNIX_EPOCH_JDN as BrandedJDN,
      era: "Unix" as const,
    };
  }
}
