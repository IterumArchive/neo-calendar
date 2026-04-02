/**
 * @file Islamic Calendar Plugin
 * @description Islamic (Hijri) lunar calendar implementation
 *
 * The Islamic calendar is a pure lunar calendar used for Islamic religious observances.
 * It does not sync with the solar year, so it drifts ~11 days per year relative to seasons.
 *
 * Key features:
 * - Pure lunar basis (tracks Moon's phases)
 * - 12 lunar months per year (~354 days)
 * - 30-year cycle with 11 leap years
 * - Months begin at sunset (diurnal boundary)
 * - Drifts through seasons (complete cycle in ~33 years)
 * - Epoch: July 16, 622 CE (Hijra, migration to Medina)
 *
 * Note: This implements the tabular/civil version.
 * Traditional Islamic calendar uses actual moon sightings (observational).
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
 * Islamic epoch in JDN (July 16, 622 CE)
 * First day of Muharram, year 1 AH
 */
const ISLAMIC_EPOCH_JDN = 1948440n;

/**
 * Month names
 */
const MONTH_NAMES = [
  "Muharram",
  "Safar",
  "Rabi' al-Awwal",
  "Rabi' al-Thani",
  "Jumada al-Ula",
  "Jumada al-Akhira",
  "Rajab",
  "Sha'ban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qi'dah",
  "Dhu al-Hijjah",
];

/**
 * Leap years in 30-year cycle
 * Years: 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29
 */
const LEAP_YEARS_IN_CYCLE = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

// ============================================================================
// ISLAMIC PLUGIN
// ============================================================================

/**
 * Islamic calendar plugin (tabular/civil version).
 *
 * Uses algorithmic calculation with 30-year cycle.
 * Does NOT use actual moon sightings (that would be observational variant).
 */
export class IslamicPlugin extends BaseCalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  readonly id: CalendarSystemId = "ISLAMIC_CIVIL";

  readonly metadata: CalendarSystem = {
    id: "ISLAMIC_CIVIL",
    name: "Islamic Calendar (Tabular)",
    aliases: ["Hijri", "Islamic", "AH", "Hijri Civil"],

    // Astronomical basis
    astronomicalBasis: "lunar",
    epoch: {
      jdn: ISLAMIC_EPOCH_JDN as BrandedJDN,
      description: "Muharram 1, Year 1 AH (July 16, 622 CE)",
      gregorianDate: { year: 622, month: 7, day: 16 },
    },

    // Era system
    eraSystem: {
      labels: ["AH"], // Anno Hegirae (year of the Hijra)
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    // Structure
    monthsPerYear: 12,
    daysPerYear: 354.367, // Average (12 synodic months)

    // Temporal foundation
    diurnalStart: "sunset",

    // Intercalation (30-year cycle)
    intercalation: {
      type: "algorithmic",
      intercalaryDayRules: [
        {
          targetMonth: 12, // Dhu al-Hijjah
          daysAdded: 1,
          trigger: {
            type: "custom",
            predicate: "30-year cycle, years 2,5,7,10,13,16,18,21,24,26,29",
          },
        },
      ],
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
    culturalContext: ["Islamic", "Middle Eastern"],
    religiousContext: ["Islamic"],
    usedFor: ["religious"],
    geographicRegions: ["Middle East", "North Africa", "Islamic world"],
  };

  /**
   * Supported era labels for Islamic calendar
   */
  readonly eras: readonly EraLabel[] = ["AH"] as const;

  // ============================================================================
  // CONFIGURATION
  // ============================================================================

  /**
   * Islamic uses lunar months
   */
  protected averageDaysPerMonth = 29.53; // Synodic month
  protected averageDaysPerYear = 354.367; // 12 lunar months (no solar sync)

  // ============================================================================
  // CALENDAR-SPECIFIC QUERIES
  // ============================================================================

  /**
   * Is this an Islamic leap year?
   *
   * Leap years in 30-year cycle:
   * Years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29
   *
   * Note: Year 30 is NOT a leap year - it's year 1 of the next cycle
   */
  isLeapYear(year: number): boolean {
    const cyclePosition = ((year - 1) % 30) + 1; // Convert to 1-30 range
    return LEAP_YEARS_IN_CYCLE.includes(cyclePosition);
  }

  /**
   * Days in month
   *
   * Alternating 30/29 days
   * Dhu al-Hijjah (month 12) has 30 days in leap years
   */
  daysInMonth(year: number, month: number): number {
    // Alternating pattern: odd months = 30 days, even = 29
    if (month % 2 === 1) return 30;

    // Month 12 in leap years gets extra day
    if (month === 12 && this.isLeapYear(year)) return 30;

    return 29;
  }

  /**
   * Days in year (354 or 355)
   */
  daysInYear(year: number): number {
    return this.isLeapYear(year) ? 355 : 354;
  }

  /**
   * Diurnal offset: sunset (~18:00 = 0.75 of day)
   */
  getDiurnalOffset(): number {
    return 0.75;
  }

  // ============================================================================
  // CORE CONVERSIONS
  // ============================================================================

  /**
   * Convert Islamic date to JDN
   *
   * Uses Dershowitz-Reingold algorithm for tabular Islamic calendar.
   */
  toJDN(input: DateInput): BrandedJDN {
    this.assertValid(input);
    const { year, month, day } = this.getDefaultInput(input);

    // Calculate elapsed years
    const elapsedYears = year - 1;

    // Calculate elapsed days
    // Each cycle (30 years) has 10631 days
    const cycles = Math.floor(elapsedYears / 30);
    const yearInCycle = elapsedYears % 30;

    // Days from complete cycles
    let days = cycles * 10631;

    // Days from years in current cycle
    for (let y = 1; y <= yearInCycle; y++) {
      days += this.daysInYear(y);
    }

    // Days from complete months in current year
    for (let m = 1; m < month; m++) {
      days += this.daysInMonth(year, m);
    }

    // Add current day
    days += day;

    return (ISLAMIC_EPOCH_JDN + BigInt(days) - 1n) as BrandedJDN;
  }

  /**
   * Convert JDN to Islamic date
   *
   * Uses reverse algorithm to find year, month, day.
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    let remainingDays = Number(jdn - ISLAMIC_EPOCH_JDN) + 1;

    // Find year
    let year = 1;
    let cycles = Math.floor(remainingDays / 10631);
    year += cycles * 30;
    remainingDays -= cycles * 10631;

    while (remainingDays > this.daysInYear(year)) {
      remainingDays -= this.daysInYear(year);
      year++;
    }

    // Find month
    let month = 1;
    while (remainingDays > this.daysInMonth(year, month)) {
      remainingDays -= this.daysInMonth(year, month);
      month++;
    }

    // Remaining is the day
    const day = remainingDays;

    const monthName = MONTH_NAMES[month - 1];
    const display = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")} AH`;

    return {
      jdn,
      calendar: this.id,
      year,
      month,
      day,
      era: "AH",
      display,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: ISLAMIC_EPOCH_JDN,
      isProleptic: false,
      isLeapYear: this.isLeapYear(year),
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }
}
