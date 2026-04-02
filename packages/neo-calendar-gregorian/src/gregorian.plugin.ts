/**
 * @file Gregorian Calendar Plugin
 * @description Proleptic Gregorian calendar implementation
 *
 * The Gregorian calendar is the most widely used civil calendar worldwide.
 * Introduced by Pope Gregory XIII in 1582 to correct Julian calendar drift.
 *
 * Key features:
 * - Solar basis (tracks tropical year)
 * - 365.2425 days per year (average)
 * - Leap year: divisible by 4, except centuries unless divisible by 400
 * - 12 months with varying lengths (28-31 days)
 * - Epoch: January 1, 1 AD (proleptic)
 */

import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
  EraLabel,
} from "@iterumarchive/neo-calendar-core";

import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Gregorian epoch in JDN (January 1, 1 AD at noon)
 */
const GREGORIAN_EPOCH_JDN = 1721426n;

/**
 * Month lengths in regular years
 */
const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/**
 * Month names
 */
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ============================================================================
// GREGORIAN PLUGIN
// ============================================================================

/**
 * Gregorian calendar plugin.
 *
 * The international standard civil calendar.
 */
export class GregorianPlugin extends BaseCalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  readonly id: CalendarSystemId = "GREGORIAN";

  readonly metadata: CalendarSystem = {
    id: "GREGORIAN",
    name: "Gregorian Calendar",
    aliases: ["Gregorian", "Western Calendar", "Christian Calendar"],

    // Astronomical basis
    astronomicalBasis: "solar",
    epoch: {
      jdn: GREGORIAN_EPOCH_JDN as BrandedJDN,
      description: "January 1, 1 AD (proleptic)",
      gregorianDate: { year: 1, month: 1, day: 1 },
    },

    // Era system
    eraSystem: {
      labels: ["AD", "BC", "CE", "BCE"],
      direction: { type: "bidirectional", pivotYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false, // 1 BC → 1 AD (no year 0)
    },

    // Structure
    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 365.2425, // Average

    // Temporal foundation
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
      weekStartDay: 1, // Monday (ISO standard)
    },

    // Intercalation (leap year rules)
    intercalation: {
      type: "algorithmic",
      leapYearRule: {
        type: "gregorian",
        divisors: [4, 100, 400],
      },
    },

    // Precision
    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    // Proleptic extension
    prolepticMode: "proleptic",
    historicalAdoptions: [
      {
        region: "Catholic Europe",
        adoptionDate: { year: 1582, month: 10, day: 15 },
        replacedCalendar: "JULIAN",
        daysSkipped: 10,
      },
      {
        region: "Britain & colonies",
        adoptionDate: { year: 1752, month: 9, day: 14 },
        replacedCalendar: "JULIAN",
        daysSkipped: 11,
      },
    ],

    // Display
    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    // Context
    culturalContext: ["Western", "International"],
    religiousContext: ["Christian"],
    usedFor: ["civil"],
    geographicRegions: ["Global"],
  };

  /**
   * Supported era labels for Gregorian calendar
   */
  readonly eras: readonly EraLabel[] = ["AD", "BC", "CE", "BCE", "NS"] as const;

  // ============================================================================
  // CALENDAR-SPECIFIC QUERIES
  // ============================================================================

  /**
   * Gregorian leap year rules
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Days in month (accounting for leap years)
   */
  daysInMonth(year: number, month: number): number {
    if (month === 2) {
      return this.isLeapYear(year) ? 29 : 28;
    }
    return MONTH_LENGTHS[month - 1] ?? 30; // Fallback for safety
  }

  // ============================================================================
  // CORE CONVERSIONS
  // ============================================================================

  /**
   * Convert Gregorian date to JDN
   *
   * Uses standard Gregorian → JDN algorithm.
   * Handles BC dates via astronomical year numbering.
   *
   * @see https://en.wikipedia.org/wiki/Julian_day#Converting_Gregorian_calendar_date_to_Julian_Day_Number
   */
  toJDN(input: DateInput): BrandedJDN {
    this.assertValid(input);
    const { year, month, day } = this.getDefaultInput(input);

    // Handle BC dates (convert to astronomical year numbering)
    const astroYear =
      input.era === "BC" || input.era === "BCE" ? -(year - 1) : year;

    // Standard algorithm
    const a = Math.floor((14 - month) / 12);
    const y = astroYear + 4800 - a;
    const m = month + 12 * a - 3;

    const jdn =
      day +
      Math.floor((153 * m + 2) / 5) +
      365 * y +
      Math.floor(y / 4) -
      Math.floor(y / 100) +
      Math.floor(y / 400) -
      32045;

    return BigInt(jdn) as BrandedJDN;
  }

  /**
   * Convert JDN to Gregorian date
   *
   * Uses standard JDN → Gregorian algorithm.
   * Returns astronomical year numbering, then converts to BC/AD.
   *
   * @see https://en.wikipedia.org/wiki/Julian_day#Julian_or_Gregorian_calendar_from_Julian_day_number
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    const J = Number(jdn);

    // Standard algorithm
    const y = 4716;
    const j = 1401;
    const m = 2;
    const n = 12;
    const r = 4;
    const p = 1461;
    const v = 3;
    const u = 5;
    const s = 153;
    const w = 2;
    const B = 274277;
    const C = -38;

    const f =
      J + j + Math.floor((Math.floor((4 * J + B) / 146097) * 3) / 4) + C;
    const e = r * f + v;
    const g = Math.floor((e % p) / r);
    const h = u * g + w;

    const day = Math.floor((h % s) / u) + 1;
    const month = ((Math.floor(h / s) + m) % n) + 1;
    const astroYear = Math.floor(e / p) - y + Math.floor((n + m - month) / n);

    // Convert to BC/AD
    let displayYear: number;
    let era: "AD" | "BC" | "CE" | "BCE";

    if (astroYear <= 0) {
      displayYear = -(astroYear - 1); // Convert back to historical numbering
      era = "BC";
    } else {
      displayYear = astroYear;
      era = "AD";
    }

    // Format display string
    const monthName = MONTH_NAMES[month - 1];
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
      epochOffset: GREGORIAN_EPOCH_JDN,
      isProleptic: false, // Gregorian is the reference
      isLeapYear: this.isLeapYear(astroYear),
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }
}
