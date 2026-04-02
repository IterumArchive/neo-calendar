/**
 * @file Ethiopian Calendar Plugin
 * @description Implements the Ethiopian calendar (Ge'ez calendar)
 *
 * The Ethiopian calendar is very similar to the Coptic calendar but with
 * a different epoch. It is the official calendar of Ethiopia.
 *
 * Key characteristics:
 * - 13 months: 12 months of 30 days + 1 short month (5 or 6 days)
 * - Leap year every 4 years (no century exception)
 * - Epoch: August 29, 8 AD (approximately 7-8 years behind Gregorian)
 * - Also called Ge'ez calendar
 * - Year begins on August 29 (Gregorian) or August 30 in leap years
 *
 * The Ethiopian calendar is approximately 7-8 years behind the Gregorian
 * calendar due to a different calculation of the Annunciation.
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

const ETHIOPIAN_EPOCH_JDN = 1724221n; // August 29, 8 AD

export class EthiopianPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "ETHIOPIAN";

  readonly metadata: CalendarSystem = {
    id: "ETHIOPIAN",
    name: "Ethiopian Calendar",
    aliases: ["Ethiopian", "Ge'ez Calendar", "Ethiopic"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: ETHIOPIAN_EPOCH_JDN as BrandedJDN,
      description: "August 29, 8 AD (Era of Incarnation)",
      gregorianDate: { year: 8, month: 8, day: 29 },
    },

    eraSystem: {
      labels: ["EE"], // Ethiopian Era
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    daysPerWeek: 7,
    monthsPerYear: 13,
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

    geographicRegions: ["Ethiopia", "Eritrea"],
    usedFor: ["civil", "religious"],
  };

  isLeapYear(year: number): boolean {
    // Ethiopian leap year: every year divisible by 4, remainder 3
    return year % 4 === 3;
  }

  daysInMonth(year: number, month: number): number {
    if (month <= 12) {
      return 30;
    }
    // 13th month (Pagumen) has 5 or 6 days
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

    // Days from epoch (same algorithm as Coptic)
    const leapYears = Math.floor((year - 1) / 4);
    const daysSinceEpoch =
      (year - 1) * 365 + leapYears + (month - 1) * 30 + (day - 1);

    const jdn = ETHIOPIAN_EPOCH_JDN + BigInt(daysSinceEpoch);
    return jdn as BrandedJDN;
  }

  fromJDN(jdn: BrandedJDN): DateRecord {
    const daysSinceEpoch = Number(jdn - ETHIOPIAN_EPOCH_JDN);

    // Use 1461-day (4-year) cycle to find the year correctly
    // This prevents the 366th day from overflowing into next year
    const year = Math.floor((4 * daysSinceEpoch + 1463) / 1461);

    // Calculate day of year by finding start of this year
    const startOfYearJDN = this.toJDN({ year, month: 1, day: 1 });
    const dayOfYear = Number(jdn - startOfYearJDN) + 1;

    // Calculate month and day from day of year
    // Months 1-12: 30 days each (days 1-360)
    // Month 13: remaining days (days 361-365 or 366)
    let month: number;
    let day: number;

    if (dayOfYear <= 360) {
      // Regular months (1-12)
      month = Math.floor((dayOfYear - 1) / 30) + 1;
      day = ((dayOfYear - 1) % 30) + 1;
    } else {
      // Month 13 (Pagume) - days 361+
      month = 13;
      day = dayOfYear - 360;
    }

    return {
      year,
      month,
      day,
      era: "EE",
      jdn,
      calendar: this.id,
      display: `${year}-${month}-${day} EE`,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: jdn - ETHIOPIAN_EPOCH_JDN,
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

    if (era && era !== "EE") {
      errors.push(
        `Invalid era "${era}" for Ethiopian calendar. Must be "EE" (Ethiopian Era)`,
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
