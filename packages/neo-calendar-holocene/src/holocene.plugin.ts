/**
 * @file Holocene Calendar Plugin
 * @description Human Epoch calendar - Gregorian + 10,000 years
 *
 * The Holocene calendar (HE) is a solar calendar that adds exactly 10,000 years
 * to Gregorian dates, creating a continuous timeline for all of human civilization.
 *
 * Key Properties:
 * - Solar basis (tracks Earth's orbit)
 * - Same leap year rules as Gregorian
 * - Same month structure as Gregorian
 * - All years are positive (no BC/AD split)
 * - Year 1 HE = 10,000 BC Gregorian
 * - Year 12,024 HE = 2024 AD Gregorian
 *
 * Mathematical Simplicity:
 * - toJDN: Convert to Gregorian (year - 10,000), then to JDN
 * - fromJDN: Convert from JDN to Gregorian, then add 10,000 to year
 *
 * This is the FLAGSHIP calendar of Neo Calendar - showcasing how a continuous
 * timeline eliminates the year-zero discontinuity problem.
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
import { ValidationError } from "@iterumarchive/neo-calendar-core";

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Holocene epoch in JDN
 * January 1, 10000 BC (Gregorian proleptic) = JDN -1,931,007
 */
const HOLOCENE_EPOCH_JDN = -1931007n;

/**
 * Year offset: HE year = Gregorian year + 10,000
 */
const HOLOCENE_OFFSET = 10000;

// ============================================================================
// HOLOCENE PLUGIN
// ============================================================================

/**
 * Holocene (Human Epoch) calendar plugin.
 *
 * Simplest solar calendar - just Gregorian with +10,000 year offset.
 * Perfect for demonstrating the architecture.
 */
export class HolocenePlugin extends BaseCalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  readonly id: CalendarSystemId = "HOLOCENE";

  readonly metadata: CalendarSystem = {
    id: "HOLOCENE",
    name: "Holocene Calendar",
    aliases: ["HE", "Human Epoch", "Human Era"],

    // Astronomical basis
    astronomicalBasis: "solar",
    epoch: {
      jdn: HOLOCENE_EPOCH_JDN as BrandedJDN,
      description: "January 1, 10000 BC (Gregorian proleptic)",
      gregorianDate: { year: -9999, month: 1, day: 1 },
    },

    // Era system
    eraSystem: {
      labels: ["HE"],
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    // Structure
    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 365.2425, // Average (accounts for leap years)

    // Temporal foundation
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
      weekStartDay: 1, // Monday
    },

    // Intercalation (same as Gregorian)
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

    // Display
    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    // Context
    culturalContext: ["Universal", "Scientific"],
    usedFor: ["scientific", "historical", "civil"],
    geographicRegions: ["Global"],
  };

  /**
   * Supported era labels for Holocene calendar
   */
  readonly eras: readonly EraLabel[] = ["HE"] as const;

  // ============================================================================
  // GREGORIAN LEAP YEAR LOGIC (Inherited)
  // ============================================================================

  /**
   * Holocene uses Gregorian leap year rules
   */
  isLeapYear(year: number): boolean {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  /**
   * Holocene uses Gregorian month lengths
   */
  daysInMonth(year: number, month: number): number {
    const days = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    return days[month - 1] || 30;
  }

  // ============================================================================
  // CORE CONVERSIONS
  // ============================================================================

  /**
   * Convert Holocene date to JDN
   *
   * Algorithm:
   * 1. Convert HE year to Gregorian year (subtract 10,000)
   * 2. Use Gregorian → JDN formula
   */
  toJDN(input: DateInput): BrandedJDN {
    // Validate input
    this.assertValid(input);

    // Get defaults
    const { year, month, day } = this.getDefaultInput(input);

    // Convert to Gregorian year
    const gregorianYear = year - HOLOCENE_OFFSET;

    // Use Gregorian algorithm
    // https://en.wikipedia.org/wiki/Julian_day#Converting_Gregorian_calendar_date_to_Julian_Day_Number
    const a = Math.floor((14 - month) / 12);
    const y = gregorianYear + 4800 - a;
    const m = month + 12 * a - 3;

    let jdn =
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
   * Convert JDN to Holocene date
   *
   * Algorithm:
   * 1. Use JDN → Gregorian formula
   * 2. Convert Gregorian year to HE year (add 10,000)
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    // Use Gregorian algorithm
    // https://en.wikipedia.org/wiki/Julian_day#Julian_or_Gregorian_calendar_from_Julian_day_number
    const J = Number(jdn);
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
    const gregorianYear =
      Math.floor(e / p) - y + Math.floor((n + m - month) / n);

    // Convert to Holocene year (Gregorian + 10,000)
    const year = gregorianYear + HOLOCENE_OFFSET;

    // Determine if leap year
    const isLeapYear = this.isLeapYear(year);

    return {
      jdn,
      calendar: this.id,
      year,
      month,
      day,
      era: "HE",
      display: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} HE`,
      astronomicalBasis: "solar",
      epochOffset: HOLOCENE_EPOCH_JDN as BrandedJDN,
      isProleptic: false, // Holocene is always proleptic by design
      isLeapYear,
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
   * Holocene only has one era: HE
   */
  eraLabel(year: number): "HE" {
    return "HE";
  }

  /**
   * Holocene era resolution (single continuous era)
   */
  resolveEra(year: number, era: string) {
    if (era !== "HE") {
      throw ValidationError.invalidDate(this.id, year, undefined, undefined, [
        `Holocene calendar only uses "HE" era, got "${era}"`,
      ]);
    }

    return {
      astronomicalYear: year,
      displayYear: year,
      eraStart: HOLOCENE_EPOCH_JDN as BrandedJDN,
      era: "HE" as const,
    };
  }
}
