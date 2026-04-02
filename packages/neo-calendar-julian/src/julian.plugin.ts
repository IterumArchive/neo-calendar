/**
 * @file Julian Calendar Plugin
 * @description Implements the Julian calendar system (Old Style)
 *
 * The Julian calendar was introduced by Julius Caesar in 45 BC and was the
 * predominant calendar in the Western world until the Gregorian reform.
 *
 * Key characteristics:
 * - Leap year every 4 years with no exceptions
 * - Drifts ~1 day per 128 years relative to solar year
 * - Used historically until Gregorian adoption (varies by region)
 * - "Old Style" (OS) dates refer to Julian calendar
 *
 * This implementation uses proleptic Julian (extends before 45 BC).
 */

import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
  EraLabel,
  ValidationResult,
} from "@iterumarchive/neo-calendar-core";
import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";
import { ValidationError } from "@iterumarchive/neo-calendar-core";

/**
 * Julian Calendar Plugin
 *
 * Implements the Julian calendar with simple leap year rules.
 * Every year divisible by 4 is a leap year (no century exceptions).
 *
 * @example
 * ```typescript
 * const julian = new JulianPlugin();
 * const hastings = julian.toJDN({ year: 1066, month: 10, day: 14, era: "AD" });
 * const date = julian.fromJDN(hastings);
 * ```
 */
export class JulianPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "JULIAN";

  readonly metadata: CalendarSystem = {
    id: "JULIAN",
    name: "Julian Calendar",
    aliases: ["Julian", "Old Style", "OS"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: 1721423n as BrandedJDN,
      description: "January 1, 1 AD (proleptic Julian)",
      gregorianDate: { year: 1, month: 1, day: 3 },
    },

    eraSystem: {
      labels: ["AD", "BC", "CE", "BCE", "OS"],
      direction: { type: "bidirectional", pivotYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 365.25,

    // NOTE: Currently produces noon-based (astronomical) JDN
    // Civil midnight-based behavior requires diurnal offset implementation
    diurnalStart: "noon",
    weekStructure: {
      daysPerWeek: 7,
      dayNames: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      weekStartDay: 1,
    },

    intercalation: {
      type: "algorithmic",
      leapYearRule: { type: "julian", divisor: 4 },
    },

    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    prolepticMode: "proleptic",
    historicalAdoptions: [
      {
        region: "Roman Empire",
        adoptionDate: { year: -45, month: 1, day: 1 },
        replacedCalendar: "ROMAN_REPUBLICAN",
        daysSkipped: 0,
      },
    ],

    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    culturalContext: ["Historical European", "Orthodox Christian"],
    religiousContext: ["Christian"],
    usedFor: ["historical", "religious"],
    geographicRegions: ["Historical Europe", "Orthodox Church"],
  };

  /**
   * Supported era labels for Julian calendar
   */
  readonly eras: readonly EraLabel[] = ["AD", "BC", "CE", "BCE", "OS"] as const;

  /**
   * Check if a year is a leap year in the Julian calendar
   *
   * Rule: Every year divisible by 4 is a leap year (no exceptions)
   *
   * @param year - The year to check
   * @returns True if leap year, false otherwise
   */
  isLeapYear(year: number): boolean {
    return year % 4 === 0;
  }

  /**
   * Get the number of days in a specific month
   *
   * @param year - The year
   * @param month - The month (1-12)
   * @returns Number of days in the month
   */
  daysInMonth(year: number, month: number): number {
    const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }

    return daysPerMonth[month - 1] ?? 30;
  }

  /**
   * Convert a Julian calendar date to Julian Day Number
   *
   * Uses the standard Julian-to-JDN algorithm.
   *
   * @param date - The Julian calendar date
   * @returns The Julian Day Number
   */
  toJDN(date: DateInput): BrandedJDN {
    // Normalize era
    const normalizedDate = this.normalizeDate(date);

    // Validate the date
    const validationResult = this.validate(normalizedDate);
    if (!validationResult.isValid) {
      throw new ValidationError(
        `Invalid Julian date: ${validationResult.errors.join(", ")}`,
        validationResult.errors,
        validationResult.warnings,
      );
    }

    // Convert to astronomical year (1 BC = 0, 2 BC = -1, etc.)
    let year = normalizedDate.year;
    if (normalizedDate.era === "BC" || normalizedDate.era === "BCE") {
      year = 1 - year;
    }

    let month = normalizedDate.month ?? 1;
    let day = normalizedDate.day ?? 1;

    // Adjust for January/February (counted as months 13/14 of previous year)
    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    // Julian calendar JDN formula
    const jdn =
      BigInt(Math.floor(365.25 * (year + 4716))) +
      BigInt(Math.floor(30.6001 * (month + 1))) +
      BigInt(day) -
      1525n;

    return jdn as BrandedJDN;
  }

  /**
   * Convert a Julian Day Number to a Julian calendar date
   *
   * Uses the standard algorithm for JDN to Julian calendar conversion.
   * This is similar to the Gregorian algorithm but without the century correction.
   *
   * @param jdn - The Julian Day Number
   * @returns The Julian calendar date
   * @see https://en.wikipedia.org/wiki/Julian_day#Julian_or_Gregorian_calendar_from_Julian_day_number
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    const J = Number(jdn);

    // Inverse of the toJDN formula (Jean Meeus algorithm for Julian calendar)
    // Must match the toJDN calculation exactly for perfect round-trip
    const z = J + 1525;
    const a = Math.floor((z - 122.1) / 365.25);
    const b = Math.floor(365.25 * a);
    const c = Math.floor((z - b) / 30.6001);

    let day = z - b - Math.floor(30.6001 * c);
    let month = c - 1;
    let year = a - 4716;

    // Undo the Jan/Feb adjustment (months 13/14 become 1/2 of next year)
    if (month > 12) {
      month -= 12;
      year += 1;
    }

    // Determine era
    let displayYear: number;
    let era: EraLabel = "AD";
    if (year <= 0) {
      era = "BC";
      displayYear = 1 - year;
    } else {
      displayYear = year;
    }

    // Format display string
    const display = `${displayYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} ${era}`;

    return {
      jdn,
      calendar: this.id,
      year: displayYear,
      month,
      day,
      era,
      display,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: this.metadata.epoch.jdn,
      isProleptic: true,
      isLeapYear: this.isLeapYear(displayYear),
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }

  /**
   * Validate a Julian calendar date
   *
   * @param date - The date to validate
   * @returns ValidationResult with errors and warnings
   */
  validate(date: DateInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { year, month, day, era } = date;

    // Validate era
    if (era && !this.eras.includes(era as EraLabel)) {
      errors.push(
        `Invalid era "${era}" for Julian calendar. Must be one of: ${this.eras.join(", ")}`,
      );
    }

    // Validate year (must be positive)
    if (year <= 0) {
      errors.push(
        `Year must be positive (use BC/BCE era for negative years). Got: ${year}`,
      );
    }

    // Validate month
    if (month !== undefined && (month < 1 || month > 12)) {
      errors.push(`Month must be between 1 and 12. Got: ${month}`);
    }

    // Validate day
    if (day !== undefined && month !== undefined) {
      const maxDay = this.daysInMonth(year, month);
      if (day < 1 || day > maxDay) {
        errors.push(
          `Day must be between 1 and ${maxDay} for month ${month}. Got: ${day}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalize date input (convert CE/BCE/OS to AD/BC)
   */
  private normalizeDate(date: DateInput): DateInput {
    if (!date.era) {
      return date;
    }

    let era = date.era;

    // Normalize era aliases
    if (era === "CE" || era === "OS") {
      era = "AD";
    } else if (era === "BCE") {
      era = "BC";
    }

    return { ...date, era };
  }
}
