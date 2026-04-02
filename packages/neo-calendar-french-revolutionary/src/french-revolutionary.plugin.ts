/**
 * @file French Revolutionary Calendar Plugin
 * @description Implements the French Republican calendar (1793-1805)
 *
 * The French Revolutionary Calendar was created during the French Revolution
 * to remove religious and royalist influences from the calendar.
 *
 * Key characteristics:
 * - 12 months of 30 days each
 * - 5 or 6 complementary days (sans-culottides) at end of year
 * - Leap year every 4 years (initially, later adjusted)
 * - Epoch: September 22, 1792 (Proclamation of the Republic)
 * - Year begins on autumnal equinox (September 22/23)
 * - Decimal time was also proposed but never widely adopted
 * - Abandoned in 1805, returned briefly in 1871
 *
 * Month names by season:
 * Autumn: Vendémiaire, Brumaire, Frimaire
 * Winter: Nivôse, Pluviôse, Ventôse
 * Spring: Germinal, Floréal, Prairial
 * Summer: Messidor, Thermidor, Fructidor
 * + Sans-culottides (complementary days)
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

const FRENCH_REV_EPOCH_JDN = 2375840n; // September 22, 1792

export class FrenchRevolutionaryPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "FRENCH_REVOLUTIONARY";

  readonly metadata: CalendarSystem = {
    id: "FRENCH_REVOLUTIONARY",
    name: "French Revolutionary Calendar",
    aliases: ["French Republican", "Revolutionary", "Republican Calendar"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: FRENCH_REV_EPOCH_JDN as BrandedJDN,
      description: "September 22, 1792 (Proclamation of First Republic)",
      gregorianDate: { year: 1792, month: 9, day: 22 },
    },

    eraSystem: {
      labels: ["ER"], // Ère Républicaine
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    daysPerWeek: 10, // Décade (10-day week)
    monthsPerYear: 12,
    daysPerYear: 365.25,

    diurnalStart: "midnight",

    intercalation: {
      type: "algorithmic",
      leapYearRule: {
        type: "julian",
        divisor: 4,
      },
    },

    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    prolepticMode: "proleptic",

    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "-",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    geographicRegions: ["France"],
    historicalPeriod: {
      start: 1792,
      end: 1805,
    },
    usedFor: ["historical"],
  };

  isLeapYear(year: number): boolean {
    // Romme Rule: Years 3, 7, 11 were Sextile (leap) years
    // Since calendar was only active 1792-1805 (Years I-XIV),
    // year % 4 === 3 is the accurate implementation
    return year % 4 === 3;
  }

  daysInMonth(year: number, month: number): number {
    if (month <= 12) {
      return 30;
    }
    // Month 13 represents sans-culottides (complementary days)
    // Sextile years (Romme rule: year % 4 === 3) have 6 days
    return this.isLeapYear(year) ? 6 : 5;
  }

  toJDN(date: DateInput): BrandedJDN {
    const result = this.validate(date);
    if (!result.isValid) {
      throw new ValidationError(
        result.errors[0] || "Invalid date",
        result.errors,
      );
    }

    const year = date.year;
    const month = date.month ?? 1;
    const day = date.day ?? 1;

    // Calculate days since epoch
    // Romme rule: leap years are when year % 4 === 3 (years 3, 7, 11, 15...)
    // Count of leap years before year N: floor(year / 4)
    const leapYears = Math.floor(year / 4);
    const daysSinceEpoch =
      (year - 1) * 365 + // Regular years
      leapYears + // Leap days
      (month - 1) * 30 + // Previous months (all 30 days)
      (day - 1); // Days in current month

    const jdn = FRENCH_REV_EPOCH_JDN + BigInt(daysSinceEpoch);
    return jdn as BrandedJDN;
  }

  fromJDN(jdn: BrandedJDN): DateRecord {
    const daysSinceEpoch = Number(jdn - FRENCH_REV_EPOCH_JDN);

    // Calculate year using 1461-day (4-year) cycle
    // Same formula as Ethiopian (Romme rule: year % 4 === 3)
    const year = Math.floor((4 * daysSinceEpoch + 1463) / 1461);

    // Days into current year
    const leapYears = Math.floor(year / 4);
    const daysIntoYear = daysSinceEpoch - ((year - 1) * 365 + leapYears);

    // Calculate month and day
    let month: number;
    let day: number;

    if (daysIntoYear < 360) {
      // Regular months
      month = Math.floor(daysIntoYear / 30) + 1;
      day = (daysIntoYear % 30) + 1;
    } else {
      // Sans-culottides (complementary days)
      month = 13;
      day = daysIntoYear - 359;
    }

    return {
      year,
      month,
      day,
      era: "ER",
      jdn,
      calendar: this.id,
      display: `${year}-${month}-${day} ER`,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: jdn - FRENCH_REV_EPOCH_JDN,
      isProleptic: year < 1,
      isLeapYear: this.isLeapYear(year),
      isIntercalaryMonth: month === 13,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }

  validate(input: DateInput) {
    const year = input.year;
    const month = input.month ?? 1;
    const day = input.day ?? 1;
    const era = input.era;

    const errors: string[] = [];

    if (era && era !== "ER") {
      errors.push(
        `Invalid era "${era}" for French Revolutionary calendar. Must be "ER"`,
      );
    }

    if (year < 1) {
      errors.push(`Year must be positive. Got: ${year}`);
    }

    if (month < 1 || month > 13) {
      errors.push(`Month must be between 1 and 13. Got: ${month}`);
    }

    const maxDay = this.daysInMonth(year, month);
    if (day < 1 || day > maxDay) {
      errors.push(
        `Day must be between 1 and ${maxDay} for month ${month}. Got: ${day}`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  }
}
