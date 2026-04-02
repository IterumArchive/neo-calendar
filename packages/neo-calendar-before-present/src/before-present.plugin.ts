/**
 * @file Before Present (BP) Calendar Plugin
 * @description Implements the Before Present (BP) scientific dating system
 *
 * Before Present (BP) is a time scale used in archaeology, geology, and other
 * scientific disciplines to specify when events occurred relative to 1950 AD.
 *
 * Key characteristics:
 * - "Present" is defined as January 1, 1950 (year 0 BP)
 * - Years count backward from 1950 (positive = past, negative = future)
 * - Used for radiocarbon dating and geological timescales
 * - Avoids ambiguity of BC/AD dating
 * - Typically year-only precision (no months/days)
 *
 * @example
 * - 1950 AD = 0 BP
 * - 1000 AD = 950 BP
 * - 2000 BC = 3950 BP
 * - 2026 AD = -76 BP (negative = future)
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
 * Before Present (BP) Calendar Plugin
 *
 * Implements the BP scientific dating system with 1950 AD as year 0.
 *
 * @example
 * ```typescript
 * const bp = new BeforePresentPlugin();
 *
 * // Carbon-14 dating: 3500 BP
 * const sample = bp.toJDN({ year: 3500, month: 1, day: 1, era: "BP" });
 *
 * // Convert to Gregorian
 * const gregorian = new GregorianPlugin();
 * const date = gregorian.fromJDN(sample);
 * // Result: ~1550 BC
 * ```
 */
export class BeforePresentPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "BP";

  readonly metadata: CalendarSystem = {
    id: "BP",
    name: "Before Present",
    aliases: ["BP", "Before Present", "Years Before Present"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: 2433283n as BrandedJDN,
      description: "January 1, 1950 AD (defined as year 0 BP)",
      gregorianDate: { year: 1950, month: 1, day: 1 },
    },

    eraSystem: {
      labels: ["BP"],
      direction: { type: "backward", startYear: 0 },
      cycle: { type: "continuous" },
      hasYearZero: true,
    },

    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 365.2425,

    diurnalStart: "midnight",
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
      leapYearRule: { type: "gregorian", divisors: [4, 100, 400] },
    },

    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    prolepticMode: "proleptic",
    historicalAdoptions: [],

    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    culturalContext: ["Scientific"],
    religiousContext: [],
    usedFor: ["scientific"],
    geographicRegions: ["Global"],
  };

  /**
   * Supported era labels for BP calendar
   */
  readonly eras: readonly EraLabel[] = ["BP"] as const;

  /**
   * Gregorian leap year check (BP uses Gregorian rules)
   */
  isLeapYear(year: number): boolean {
    if (year % 400 === 0) return true;
    if (year % 100 === 0) return false;
    if (year % 4 === 0) return true;
    return false;
  }

  /**
   * Get the number of days in a specific month
   *
   * @param year - The year (in Gregorian)
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
   * Convert a BP date to Julian Day Number
   *
   * Formula: BP year = 1950 - Gregorian year
   * So: Gregorian year = 1950 - BP year
   *
   * @param date - The BP date
   * @returns The Julian Day Number
   */
  toJDN(date: DateInput): BrandedJDN {
    const validationResult = this.validate(date);
    if (!validationResult.isValid) {
      throw new ValidationError(
        `Invalid BP date: ${validationResult.errors.join(", ")}`,
        validationResult.errors,
        validationResult.warnings,
      );
    }

    // Convert BP to Gregorian year (astronomical numbering)
    // BP 0 = 1950 CE (astronomical year 1950)
    // BP 10000 = 8050 BCE (astronomical year -8049)
    // Note: gregorianYear is already in astronomical numbering
    // (includes year 0: ..., -2, -1, 0, 1, 2, ...)
    const gregorianYear = 1950 - date.year;

    // Use Gregorian algorithm for JDN calculation
    let year = gregorianYear;
    let month = date.month ?? 1;
    let day = date.day ?? 1;

    // Adjust for January/February
    if (month <= 2) {
      year -= 1;
      month += 12;
    }

    // Gregorian JDN formula
    const a = Math.floor(year / 100);
    const b = 2 - a + Math.floor(a / 4);

    const jdn =
      BigInt(Math.floor(365.25 * (year + 4716))) +
      BigInt(Math.floor(30.6001 * (month + 1))) +
      BigInt(day) +
      BigInt(b) -
      1524n;

    return jdn as BrandedJDN;
  }

  /**
   * Convert a Julian Day Number to a BP date
   *
   * @param jdn - The Julian Day Number
   * @returns The BP date
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    // Use Gregorian algorithm to get Gregorian date
    const a = Number(jdn) + 32044;
    const b = Math.floor((4 * a + 3) / 146097);
    const c = a - Math.floor((146097 * b) / 4);
    const d = Math.floor((4 * c + 3) / 1461);
    const e = c - Math.floor((1461 * d) / 4);
    const m = Math.floor((5 * e + 2) / 153);

    let day = e - Math.floor((153 * m + 2) / 5) + 1;
    let month = m + 3 - 12 * Math.floor(m / 10);
    let astronomicalYear = 100 * b + d - 4800 + Math.floor(m / 10);

    // Convert astronomical year to BP
    // BP 0 = 1950 AD (astronomical year 1950)
    // BP 2276 = 301 BC (astronomical year -300)
    // Astronomical years: ..., -2, -1, 0, 1, 2, ...
    // BP formula: 1950 - astronomical_year
    const bpYear = 1950 - astronomicalYear;

    // Convert to display year for BC dates
    let gregorianYear = astronomicalYear;
    if (astronomicalYear <= 0) {
      gregorianYear = 1 - astronomicalYear;
    }

    // Format display string
    const display = `${bpYear} BP`;

    return {
      jdn,
      calendar: this.id,
      year: bpYear,
      month,
      day,
      era: "BP",
      display,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: this.metadata.epoch.jdn,
      isProleptic: false,
      isLeapYear: this.isLeapYear(Math.abs(gregorianYear)),
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }

  /**
   * Validate a BP date
   *
   * @param date - The date to validate
   * @returns ValidationResult with errors and warnings
   */
  validate(date: DateInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { year, month, day, era } = date;

    // Validate era
    if (era && era !== "BP") {
      errors.push(`Invalid era "${era}" for BP calendar. Must be "BP"`);
    }

    // BP years can be positive (past), zero (1950), or negative (future)
    // No validation needed for year range

    // Validate month
    if (month !== undefined && (month < 1 || month > 12)) {
      errors.push(`Month must be between 1 and 12. Got: ${month}`);
    }

    // Validate day (convert BP to Gregorian year for leap year check)
    if (day !== undefined && month !== undefined) {
      const gregorianYear = 1950 - year;
      const maxDay = this.daysInMonth(Math.abs(gregorianYear), month);
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
}
