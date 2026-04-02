/**
 * @file Coptic Calendar Plugin
 * @description Implements the Coptic Orthodox Church calendar
 *
 * The Coptic calendar is used by the Coptic Orthodox Church and is based
 * on the ancient Egyptian calendar with Christian modifications.
 *
 * Key characteristics:
 * - 13 months: 12 months of 30 days + 1 short month (5 or 6 days)
 * - Leap year every 4 years (no century exception, like Julian)
 * - Epoch: August 29, 284 AD (Diocletian's Era)
 * - Also known as the Alexandrian calendar
 * - Year begins on August 29 (Gregorian) or August 30 in leap years
 *
 * Month names: Thout, Paopi, Hathor, Koiak, Tobi, Meshir, Paremhat,
 *              Parmouti, Pashons, Paoni, Epip, Mesori, Pi Kogi Enavot
 *
 * Proleptic Extension:
 * - Dates before the epoch (284 CE) are supported using proleptic extension
 * - Years before epoch use B.E.A.M. (Before Era of Martyrs) era label
 * - Months (1-13) and days (1-30) are always positive, even for proleptic dates
 * - This ensures mathematically correct calculations with human-readable notation
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

const COPTIC_EPOCH_JDN = 1825030n; // August 29, 284 AD (Julian) - Diocletian Era

export class CopticPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "COPTIC";

  readonly metadata: CalendarSystem = {
    id: "COPTIC",
    name: "Coptic Calendar",
    aliases: ["Coptic", "Alexandrian Calendar", "Coptic Orthodox"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: COPTIC_EPOCH_JDN as BrandedJDN,
      description: "August 29, 284 AD - Era of Martyrs (Diocletian)",
      gregorianDate: { year: 284, month: 8, day: 29 },
    },

    eraSystem: {
      labels: ["AM", "B.E.A.M."], // Anno Martyrum (Era of Martyrs) & Before Era of Martyrs
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

    geographicRegions: ["Egypt", "Ethiopia", "Eritrea"],
    usedFor: ["religious"],
  };

  isLeapYear(year: number): boolean {
    // Coptic leap year: every year divisible by 4 (like Julian)
    return year % 4 === 3; // Year 3, 7, 11, 15, etc.
  }

  daysInMonth(year: number, month: number): number {
    if (month <= 12) {
      return 30; // First 12 months always have 30 days
    }
    // 13th month (Pi Kogi Enavot) has 5 or 6 days
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

    // Days from epoch
    // Coptic leap years: year % 4 === 3 (years 3, 7, 11, ...)
    // Number of completed leap years before year N:
    // - For y%4===0: floor(y/4) (includes previous cycle's leap year)
    // - Otherwise: floor((y-1)/4)
    const leapYears =
      year % 4 === 0 ? Math.floor(year / 4) : Math.floor((year - 1) / 4);
    const daysSinceEpoch =
      (year - 1) * 365 + // Regular years
      leapYears + // Leap days
      (month - 1) * 30 + // Previous months
      (day - 1); // Days in current month

    const jdn = COPTIC_EPOCH_JDN + BigInt(daysSinceEpoch);
    return jdn as BrandedJDN;
  }

  fromJDN(jdn: BrandedJDN): DateRecord {
    const daysSinceEpoch = Number(jdn - COPTIC_EPOCH_JDN);

    // Calculate year using 4-year cycles (1461 days = 3*365 + 366)
    // Coptic leap years are at year % 4 === 3 (year 3, 7, 11, etc.)

    // Handle proleptic dates (before epoch): adjust for proper modulo with negative numbers
    const fourYearCycles = Math.floor(daysSinceEpoch / 1461);
    let dayInCycle = daysSinceEpoch - fourYearCycles * 1461;

    // For negative dates, ensure dayInCycle is positive (0-1460)
    if (dayInCycle < 0) {
      dayInCycle += 1461;
    }

    // Determine year within the cycle
    // Cycle structure: 365, 365, 365, 366 (Leap at year 3 of cycle)
    let yearInCycle = 0;
    if (dayInCycle >= 365) {
      yearInCycle++;
      dayInCycle -= 365;
      if (dayInCycle >= 365) {
        yearInCycle++;
        dayInCycle -= 365;
        if (dayInCycle >= 365) {
          yearInCycle++;
          dayInCycle -= 365;
          // The 4th year is the leap year with 366 days
        }
      }
    }

    const year = fourYearCycles * 4 + yearInCycle + 1;
    const dayInYear = dayInCycle;

    // Calculate Month and Day
    let month: number;
    let day: number;

    if (dayInYear < 360) {
      // Standard 30-day months
      month = Math.floor(dayInYear / 30) + 1;
      day = (dayInYear % 30) + 1;
    } else {
      // The 13th Month (Epagomenal Days)
      month = 13;
      day = dayInYear - 360 + 1;
    }

    // Determine the proper era label
    const era = year < 1 ? "B.E.A.M." : "AM";
    const displayYear = year < 1 ? Math.abs(year - 1) : year;
    const displayEra = year < 1 ? " B.E.A.M." : " AM";

    return {
      year,
      month,
      day,
      era: year < 1 ? "B.E.A.M." : "AM",
      jdn,
      calendar: this.id,
      display: `${displayYear}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}${displayEra}`,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: jdn - COPTIC_EPOCH_JDN,
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

    if (era && era !== "AM" && era !== "B.E.A.M.") {
      errors.push(
        `Invalid era "${era}" for Coptic calendar. Must be "AM" (Anno Martyrum) or "B.E.A.M." (Before Era of Martyrs)`,
      );
    }

    // Proleptic calendar: Allow negative years for dates before epoch
    // Year 1 AM = 284 CE (Era of Martyrs)
    // Negative years represent proleptic extension before this epoch

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
