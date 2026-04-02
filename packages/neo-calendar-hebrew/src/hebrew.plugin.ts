/**
 * @file Hebrew Calendar Plugin
 * @description Hebrew lunisolar calendar implementation
 *
 * The Hebrew calendar is used for Jewish religious observances.
 * It's a lunisolar system that keeps months synchronized with lunar phases
 * and years synchronized with the solar cycle via the Metonic cycle.
 *
 * Key features:
 * - Lunisolar basis (lunar months + solar year correction)
 * - 19-year Metonic cycle with 7 leap years
 * - 12 or 13 months per year (Adar II in leap years)
 * - Months begin at sunset (diurnal boundary)
 * - Postponements (dehiyyot) for religious reasons
 * - Epoch: October 7, 3761 BC (traditional creation date)
 */

import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
  AdjustmentContext,
  EraLabel,
} from "@iterumarchive/neo-calendar-core";

import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";
import {
  HebrewMoladCalculator,
  HebrewAdjustments,
} from "./hebrew-adjustments.js";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Hebrew epoch in JDN (Tishrei 1, year 1 AM)
 * Corresponds to Monday, October 7, 3761 BCE (proleptic Julian)
 * JDN 347998 per Dershowitz & Reingold, "Calendrical Calculations"
 */
const HEBREW_EPOCH_JDN = 347998n;

/**
 * Parts per hour (ancient Hebrew time unit)
 */
const PARTS_PER_HOUR = 1080;

/**
 * Month names
 */
const MONTH_NAMES = [
  "Tishrei",
  "Cheshvan",
  "Kislev",
  "Tevet",
  "Shevat",
  "Adar",
  "Nisan",
  "Iyar",
  "Sivan",
  "Tammuz",
  "Av",
  "Elul",
  "Adar II", // Leap month
];

// ============================================================================
// HEBREW PLUGIN
// ============================================================================

/**
 * Hebrew calendar plugin.
 *
 * Full implementation with:
 * - Molad (new moon) calculation using traditional parts system
 * - Dehiyyot (postponement) rules for religious observance
 * - Variable month lengths (Cheshvan and Kislev)
 * - Proper year type calculation (deficient/regular/complete)
 */
export class HebrewPlugin extends BaseCalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  readonly id: CalendarSystemId = "HEBREW";

  readonly metadata: CalendarSystem = {
    id: "HEBREW",
    name: "Hebrew Calendar",
    aliases: ["Jewish Calendar", "Hebrew", "AM"],

    // Astronomical basis
    astronomicalBasis: "lunisolar",
    epoch: {
      jdn: HEBREW_EPOCH_JDN as BrandedJDN,
      description: "Tishrei 1, Year 1 AM (October 7, 3761 BC)",
      gregorianDate: { year: -3760, month: 10, day: 7 },
    },

    // Era system
    eraSystem: {
      labels: ["AM"], // Anno Mundi (year of the world)
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    // Structure
    monthsPerYear: 12, // 13 in leap years
    daysPerYear: 354.367, // Average (12 synodic months)

    // Temporal foundation
    diurnalStart: "sunset",

    // Intercalation (Metonic cycle)
    intercalation: {
      type: "algorithmic",
      leapMonthRule: {
        type: "metonic",
        cycle: 19,
        leapYears: [3, 6, 8, 11, 14, 17, 19],
      },
    },

    // Precision
    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    // Proleptic extension
    prolepticMode: "proleptic",

    // Display
    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    // Context
    culturalContext: ["Jewish"],
    religiousContext: ["Jewish"],
    usedFor: ["religious", "civil"],
    geographicRegions: ["Israel", "Jewish diaspora"],
  };

  /**
   * Supported era labels for Hebrew calendar
   */
  readonly eras: readonly EraLabel[] = ["AM"] as const;

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Hebrew uses lunar months
   */
  protected averageDaysPerMonth = 29.53; // Synodic month
  protected averageDaysPerYear = 354.367; // 12 lunar months

  // ============================================================================
  // CALENDAR-SPECIFIC QUERIES
  // ============================================================================

  /**
   * Is this a Hebrew leap year?
   *
   * Leap years in the 19-year Metonic cycle:
   * Years 3, 6, 8, 11, 14, 17, 19 of each cycle
   */
  isLeapYear(year: number): boolean {
    return HebrewMoladCalculator.isLeapYear(year);
  }

  /**
   * Months in year (12 or 13)
   */
  monthsInYear(year: number): number {
    return this.isLeapYear(year) ? 13 : 12;
  }

  /**
   * Days in month
   *
   * Uses the proper variable month length rules for Cheshvan and Kislev
   */
  daysInMonth(year: number, month: number): number {
    // Get accurate year length including dehiyyot
    const yearLength = HebrewMoladCalculator.getYearLength(year);

    // Determine year type (deficient/regular/complete)
    const isLeap = this.isLeapYear(year);
    const baseLength = isLeap ? 383 : 353;

    // Year type: deficient (353/383), regular (354/384), complete (355/385)
    const yearType = yearLength - baseLength; // 0 = deficient, 1 = regular, 2 = complete

    // Standard month lengths
    const standardLengths: Record<number, number> = {
      1: 30, // Tishrei
      2: 29, // Cheshvan (variable)
      3: 30, // Kislev (variable)
      4: 29, // Tevet
      5: 30, // Shevat
      6: 29, // Adar (or Adar I in leap years)
      7: 30, // Nisan (or Adar II in leap years)
      8: 29, // Iyar (or Nisan in leap years)
      9: 30, // Sivan (or Iyar in leap years)
      10: 29, // Tammuz (or Sivan in leap years)
      11: 30, // Av (or Tammuz in leap years)
      12: 29, // Elul (or Av in leap years)
      13: 29, // Adar II (leap years only, or Elul)
    };

    // Apply variable month lengths based on year type
    if (month === 2) {
      // Cheshvan: 29 in deficient, 30 in regular/complete
      return yearType >= 1 ? 30 : 29;
    }
    if (month === 3) {
      // Kislev: 29 in deficient/regular, 30 in complete
      return yearType === 2 ? 30 : 29;
    }

    // Leap year adjustments
    if (isLeap && month === 6) {
      return 30; // Adar I
    }
    if (isLeap && month === 7) {
      return 29; // Adar II
    }

    return standardLengths[month] || 29;
  }

  /**
   * Diurnal offset: sunset (~18:00 = 0.75 of day)
   */
  getDiurnalOffset(): number {
    return 0.75;
  }

  // ============================================================================
  // CORE CONVERSIONS (Simplified)
  // ============================================================================

  /**
   * Convert Hebrew date to JDN
   *
   * Uses proper molad calculation and year lengths including dehiyyot.
   *
   * Month numbering follows Torah/religious order:
   * - Months 1-6: Nisan, Iyar, Sivan, Tammuz, Av, Elul
   * - Months 7-12: Tishrei, Cheshvan, Kislev, Tevet, Shevat, Adar (+ Adar II in leap)
   *
   * The epoch (year=1, month=7, day=1) is Tishrei 1, the civil new year.
   */
  toJDN(input: DateInput): BrandedJDN {
    this.assertValid(input);
    const { year, month, day } = this.getDefaultInput(input);

    // Calculate JDN for Rosh Hashanah (Tishrei 1) of this year
    // This properly accounts for molad and dehiyyot rules
    let jdn = HebrewMoladCalculator.calculateNewYearJDN(year);

    // Month 7 (Tishrei) is the start of the year, so it's civil month 1
    // We need to map religious months to day offsets from Tishrei 1

    // Month order from Tishrei (civil year start):
    // 7=Tishrei, 8=Cheshvan, 9=Kislev, 10=Tevet, 11=Shevat, 12/13=Adar(s),
    // 1=Nisan, 2=Iyar, 3=Sivan, 4=Tammuz, 5=Av, 6=Elul

    // Build the month order starting from Tishrei (month 7)
    const monthOrder = [
      7, // Tishrei (civil month 1)
      8, // Cheshvan
      9, // Kislev
      10, // Tevet
      11, // Shevat
      12, // Adar I (or Adar in non-leap years)
      ...(this.isLeapYear(year) ? [13] : []), // Adar II in leap years
      1, // Nisan
      2, // Iyar
      3, // Sivan
      4, // Tammuz
      5, // Av
      6, // Elul
    ];

    // Find position of current month in civil order
    const monthIndex = monthOrder.indexOf(month);

    // Add days from complete months before this one
    for (let i = 0; i < monthIndex; i++) {
      const m = monthOrder[i];
      if (m === undefined) {
        throw new Error(`Invalid month index ${i} in monthOrder`);
      }
      jdn += BigInt(this.daysInMonth(year, m));
    }

    // Add days within current month
    jdn += BigInt(day - 1);

    return jdn as BrandedJDN;
  }

  /**
   * Convert JDN to Hebrew date
   *
   * Uses proper year calculation with molad and dehiyyot rules.
   * Returns dates in religious month order (Nisan=1...Tishrei=7...).
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    // Find the year by checking when Rosh Hashanah (1 Tishrei) falls
    // Start with a reasonable estimate based on average year length
    const daysFromEpoch = Number(jdn - HEBREW_EPOCH_JDN);
    let year = Math.max(1, Math.floor(daysFromEpoch / 354)); // Average Hebrew year

    // Refine: find the year where Rosh Hashanah of year <= jdn < Rosh Hashanah of year+1
    while (year > 1 && HebrewMoladCalculator.calculateNewYearJDN(year) > jdn) {
      year--; // JDN is before this year's Rosh Hashanah, go back
    }

    while (HebrewMoladCalculator.calculateNewYearJDN(year + 1) <= jdn) {
      year++; // JDN is at or after next year's Rosh Hashanah, go forward
    }

    // Now we know the year. Calculate days from Rosh Hashanah of this year.
    const newYearJDN = HebrewMoladCalculator.calculateNewYearJDN(year);
    const daysInYear = Number(jdn - newYearJDN);

    // Month order from Tishrei:
    const monthOrder = [
      7,
      8,
      9,
      10,
      11,
      12,
      ...(this.isLeapYear(year) ? [13] : []),
      1,
      2,
      3,
      4,
      5,
      6,
    ];

    // Find the month
    let monthIndex = 0;
    let daysInMonths = 0;

    while (monthIndex < monthOrder.length) {
      const m = monthOrder[monthIndex];
      if (m === undefined) {
        throw new Error(`Invalid month index ${monthIndex} in monthOrder`);
      }
      const monthLength = this.daysInMonth(year, m);

      if (daysInMonths + monthLength > daysInYear) {
        break;
      }

      daysInMonths += monthLength;
      monthIndex++;
    }

    const month = monthOrder[monthIndex];
    if (month === undefined) {
      throw new Error(
        `Invalid month index ${monthIndex} for Hebrew year ${year}`,
      );
    }
    const day = daysInYear - daysInMonths + 1;

    const display = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} AM`;

    return {
      jdn,
      calendar: this.id,
      year,
      month,
      day,
      era: "AM",
      display,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: HEBREW_EPOCH_JDN,
      isProleptic: false,
      isLeapYear: this.isLeapYear(year),
      isIntercalaryMonth: month === 13,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false, // Now using accurate calculation
    };
  }
}
