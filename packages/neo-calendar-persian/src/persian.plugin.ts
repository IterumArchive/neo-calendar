/**
 * @file Persian (Solar Hijri) Calendar Plugin
 * @description Implements the Persian/Iranian solar calendar
 *
 * The Solar Hijri calendar is the official calendar of Iran and Afghanistan.
 * It is one of the most astronomically accurate calendars in use today.
 *
 * Key characteristics:
 * - Pure solar calendar (follows tropical year)
 * - 12 months: first 6 have 31 days, next 5 have 30 days, last has 29 or 30
 * - Leap year follows a 33-year cycle (complex astronomical calculation)
 * - Epoch: March 22, 622 AD (Hijra/Migration of Prophet Muhammad)
 * - Year begins on vernal equinox (March 20/21)
 * - Also known as Jalali calendar
 *
 * Leap year rule (33-year cycle):
 * Years 1, 5, 9, 13, 17, 22, 26, 30 in each 33-year cycle are leap years
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

const PERSIAN_EPOCH_JDN = 1948321n; // March 22, 622 AD

export class PersianPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "PERSIAN_ALGORITHMIC";

  readonly metadata: CalendarSystem = {
    id: "PERSIAN_ALGORITHMIC",
    name: "Persian Calendar (Algorithmic)",
    aliases: [
      "Persian",
      "Solar Hijri",
      "Iranian",
      "Jalali",
      "Persian Algorithmic",
    ],

    astronomicalBasis: "solar",
    epoch: {
      jdn: PERSIAN_EPOCH_JDN as BrandedJDN,
      description: "March 22, 622 AD (Hijra)",
      gregorianDate: { year: 622, month: 3, day: 22 },
    },

    eraSystem: {
      labels: ["AP", "SH"], // Anno Persico / Solar Hijri
      direction: { type: "forward", startYear: 1 },
      cycle: { type: "continuous" },
      hasYearZero: false,
    },

    daysPerWeek: 7,
    monthsPerYear: 12,
    daysPerYear: 365.24219,

    diurnalStart: "midnight",

    intercalation: {
      type: "algorithmic",
      leapYearRule: {
        type: "persian",
        calculation: "algorithmic",
        note: "Uses 33-year cycle approximation. May differ by ±1 day from astronomical variant which calculates actual vernal equinox.",
      },
    },

    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    prolepticMode: "proleptic",

    defaultDisplay: {
      fieldOrder: "YMD",
      separator: "/",
      monthFormat: { type: "numeric", padded: true },
      showEra: true,
      eraPosition: "suffix",
    },

    geographicRegions: ["Iran", "Afghanistan", "Tajikistan"],
    usedFor: ["civil"],
  };

  isLeapYear(year: number): boolean {
    // 33-year cycle approximation (simplified algorithmic variant)
    // NOTE: This differs from the astronomical variant which uses actual equinox
    // May produce dates ±1 day different from official Iranian calendar
    // Leap years at: 1, 5, 9, 13, 17, 22, 26, 30 in each 33-year cycle
    const cycleYear = year % 33;
    const leapYears = [1, 5, 9, 13, 17, 22, 26, 30];
    return leapYears.includes(cycleYear);
  }

  daysInMonth(year: number, month: number): number {
    if (month <= 6) {
      return 31; // First 6 months
    } else if (month <= 11) {
      return 30; // Months 7-11
    } else {
      return this.isLeapYear(year) ? 30 : 29; // Month 12
    }
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
    let totalDays = 0;

    // Add days for complete years
    for (let y = 1; y < year; y++) {
      totalDays += this.isLeapYear(y) ? 366 : 365;
    }

    // Add days for complete months in current year
    for (let m = 1; m < month; m++) {
      totalDays += this.daysInMonth(year, m);
    }

    // Add days in current month
    totalDays += day - 1;

    const jdn = PERSIAN_EPOCH_JDN + BigInt(totalDays);
    return jdn as BrandedJDN;
  }

  fromJDN(jdn: BrandedJDN): DateRecord {
    let daysSinceEpoch = Number(jdn - PERSIAN_EPOCH_JDN);

    // Handle dates before epoch (proleptic Persian calendar)
    if (daysSinceEpoch < 0) {
      // Count backward from epoch
      let year = 0; // Year 0 (1 AP - 1 = 0, which is 1 BP)
      let remainingDays = -daysSinceEpoch;

      // Go backward through years
      while (remainingDays > 0) {
        year--;
        const daysInYear = this.isLeapYear(Math.abs(year)) ? 366 : 365;
        if (remainingDays <= daysInYear) {
          // We're in this year
          daysSinceEpoch = daysInYear - remainingDays;
          break;
        }
        remainingDays -= daysInYear;
      }

      // Find month and day within this year
      let month = 1;
      let daysIntoYear = Math.floor(daysSinceEpoch);
      while (month <= 12) {
        const daysInMonth = this.daysInMonth(Math.abs(year), month);
        if (daysIntoYear < daysInMonth) break;
        daysIntoYear -= daysInMonth;
        month++;
      }

      const day = daysIntoYear + 1;

      return {
        year,
        month,
        day,
        era: "AP",
        jdn,
        calendar: this.id,
        display: `${year}/${month}/${day} AP`,
        astronomicalBasis: this.metadata.astronomicalBasis,
        epochOffset: jdn - PERSIAN_EPOCH_JDN,
        isProleptic: true,
        isLeapYear: this.isLeapYear(Math.abs(year)),
        isIntercalaryMonth: false,
        isCirca: false,
        isUncertain: false,
        isAmbiguous: false,
      };
    }

    // Find year (forward from epoch)
    let year = 1;
    while (true) {
      const daysInYear = this.isLeapYear(year) ? 366 : 365;
      if (daysSinceEpoch < daysInYear) break;
      daysSinceEpoch -= daysInYear;
      year++;
    }

    // Find month
    let month = 1;
    while (month <= 12) {
      const daysInMonth = this.daysInMonth(year, month);
      if (daysSinceEpoch < daysInMonth) break;
      daysSinceEpoch -= daysInMonth;
      month++;
    }

    const day = daysSinceEpoch + 1;

    return {
      year,
      month,
      day,
      era: "AP",
      jdn,
      calendar: this.id,
      display: `${year}/${month}/${day} AP`,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: jdn - PERSIAN_EPOCH_JDN,
      isProleptic: year < 1,
      isLeapYear: this.isLeapYear(year),
      isIntercalaryMonth: false,
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

    if (era && era !== "AP" && era !== "SH") {
      errors.push(
        `Invalid era "${era}" for Persian calendar. Must be "AP" or "SH"`,
      );
    }

    if (year < 1) {
      errors.push(`Year must be positive. Got: ${year}`);
    }

    if (month < 1 || month > 12) {
      errors.push(`Month must be between 1 and 12. Got: ${month}`);
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
