/**
 * @file Mayan Long Count Calendar Plugin
 * @description Implements the Mayan Long Count (MLC) calendar system
 *
 * The Mayan Long Count is a non-repeating vigesimal (base-20) calendar used
 * by the Maya civilization. It counts days from a mythological creation date.
 *
 * Key characteristics:
 * - Creation date: August 11, 3114 BC (Gregorian proleptic)
 * - Correlation: GMT (Goodman-Martinez-Thompson) = JDN 584283
 * - Format: baktun.katun.tun.uinal.kin (e.g., 13.0.0.0.0)
 * - Cycle: 13 baktuns = ~5,125 years (completed December 21, 2012)
 * - Vigesimal (base-20) except tun/uinal (18 uinals = 1 tun)
 *
 * Units:
 * - 1 kin = 1 day
 * - 1 uinal = 20 kin = 20 days
 * - 1 tun = 18 uinal = 360 days (~1 year)
 * - 1 katun = 20 tun = 7,200 days (~20 years)
 * - 1 baktun = 20 katun = 144,000 days (~394 years)
 * - 1 piktun = 20 baktun = 2,880,000 days (~7,885 years)
 *
 * @example
 * December 21, 2012 (end of 13th baktun): 13.0.0.0.0
 * January 1, 2000: 12.19.6.15.2
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
 * Mayan Long Count Calendar Plugin
 *
 * Implements the Mayan Long Count calendar with vigesimal counting.
 * Uses GMT correlation (JDN 584283 = 0.0.0.0.0).
 *
 * @example
 * ```typescript
 * const mayan = new MayanPlugin();
 *
 * // December 21, 2012 (end of 13th baktun)
 * const endDate = mayan.toJDN({ year: 13, month: 0, day: 0, era: "MLC" });
 *
 * // Convert to components
 * const components = mayan.fromJDN(endDate);
 * // Result: { baktun: 13, katun: 0, tun: 0, uinal: 0, kin: 0 }
 * ```
 */
export class MayanPlugin extends BaseCalendarPlugin {
  readonly id: CalendarSystemId = "MAYAN_LONG_COUNT";

  readonly metadata: CalendarSystem = {
    id: "MAYAN_LONG_COUNT",
    name: "Mayan Long Count",
    aliases: ["Mayan Long Count", "MLC", "Maya Calendar"],

    astronomicalBasis: "solar",
    epoch: {
      jdn: 584283n as BrandedJDN,
      description: "August 11, 3114 BC (GMT correlation)",
      gregorianDate: { year: -3113, month: 8, day: 11 },
    },

    eraSystem: {
      labels: ["MLC"],
      direction: { type: "forward", startYear: 0 },
      cycle: { type: "continuous" },
      hasYearZero: true,
    },

    daysPerWeek: 7,
    monthsPerYear: 20,
    daysPerYear: 360,

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
    },

    granularity: {
      resolution: { unit: "day" },
      supportsFractional: false,
    },

    prolepticMode: "proleptic",
    historicalAdoptions: [],

    defaultDisplay: {
      fieldOrder: "YMD",
      separator: ".",
      monthFormat: { type: "numeric", padded: false },
      showEra: false,
      eraPosition: "suffix",
    },

    culturalContext: ["Mesoamerican"],
    religiousContext: [],
    usedFor: ["historical"],
    geographicRegions: ["Mesoamerica"],
  };

  /**
   * Supported era labels for Mayan calendar
   */
  readonly eras: readonly EraLabel[] = ["MLC"] as const;

  /**
   * Mayan Long Count has no leap years (continuous day count)
   */
  isLeapYear(_year: number): boolean {
    return false;
  }

  /**
   * Not applicable to Mayan calendar (no traditional months)
   */
  daysInMonth(_year: number, _month: number): number {
    return 20; // Default to uinal size
  }

  /**
   * Convert a Mayan Long Count date to Julian Day Number
   *
   * Mayan date format uses:
   * - year = baktun (cycles of 144,000 days)
   * - month = katun (cycles of 7,200 days)
   * - day = tun.uinal.kin (packed into day field)
   *
   * For simplicity, we use a 5-component encoding:
   * - year = baktun
   * - month = katun
   * - day = tun * 10000 + uinal * 100 + kin
   *
   * @param date - The Mayan Long Count date
   * @returns The Julian Day Number
   */
  toJDN(date: DateInput): BrandedJDN {
    const validationResult = this.validate(date);
    if (!validationResult.isValid) {
      throw new ValidationError(
        `Invalid Mayan date: ${validationResult.errors.join(", ")}`,
        validationResult.errors,
        validationResult.warnings,
      );
    }

    const baktun = date.year;
    const katun = date.month ?? 0;
    const dayValue = date.day ?? 0;

    // Unpack tun.uinal.kin from day field
    const tun = Math.floor(dayValue / 10000);
    const uinal = Math.floor((dayValue % 10000) / 100);
    const kin = dayValue % 100;

    // Calculate total days since Mayan epoch
    const totalDays =
      baktun * 144000 + // 144,000 days per baktun
      katun * 7200 + // 7,200 days per katun
      tun * 360 + // 360 days per tun
      uinal * 20 + // 20 days per uinal
      kin; // Individual days

    // Add to Mayan epoch
    const jdn = this.metadata.epoch.jdn + BigInt(totalDays);

    return jdn as BrandedJDN;
  }

  /**
   * Convert a Julian Day Number to a Mayan Long Count date
   *
   * @param jdn - The Julian Day Number
   * @returns The Mayan Long Count date
   */
  fromJDN(jdn: BrandedJDN): DateRecord {
    // Calculate days since Mayan epoch
    const daysSinceEpoch = Number(jdn - this.metadata.epoch.jdn);

    // Break down into Mayan units
    const baktun = Math.floor(daysSinceEpoch / 144000);
    let remainder = daysSinceEpoch % 144000;

    const katun = Math.floor(remainder / 7200);
    remainder = remainder % 7200;

    const tun = Math.floor(remainder / 360);
    remainder = remainder % 360;

    const uinal = Math.floor(remainder / 20);
    const kin = remainder % 20;

    // Pack tun.uinal.kin into day field
    const packedDay = tun * 10000 + uinal * 100 + kin;

    // Format display string
    const display = `${baktun}.${katun}.${tun}.${uinal}.${kin}`;

    return {
      jdn,
      calendar: this.id,
      year: baktun,
      month: katun,
      day: packedDay,
      era: "MLC",
      display,
      astronomicalBasis: this.metadata.astronomicalBasis,
      epochOffset: this.metadata.epoch.jdn,
      isProleptic: false,
      isLeapYear: false,
      isIntercalaryMonth: false,
      isCirca: false,
      isUncertain: false,
      isAmbiguous: false,
    };
  }

  /**
   * Validate a Mayan Long Count date
   *
   * @param date - The date to validate
   * @returns ValidationResult with errors and warnings
   */
  validate(date: DateInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const { year, month, day, era } = date;

    // Validate era
    if (era && era !== "MLC") {
      errors.push(`Invalid era "${era}" for Mayan Long Count. Must be "MLC"`);
    }

    // Validate baktun (0-19, though 13 was significant)
    if (year < 0 || year > 19) {
      errors.push(`Baktun (year) must be between 0 and 19. Got: ${year}`);
    }

    // Validate katun (0-19)
    if (month !== undefined && (month < 0 || month > 19)) {
      errors.push(`Katun (month) must be between 0 and 19. Got: ${month}`);
    }

    // Unpack and validate tun.uinal.kin
    if (day !== undefined) {
      const tun = Math.floor(day / 10000);
      const uinal = Math.floor((day % 10000) / 100);
      const kin = day % 100;

      if (tun < 0 || tun > 17) {
        errors.push(`Tun must be between 0 and 17. Got: ${tun}`);
      }

      if (uinal < 0 || uinal > 17) {
        errors.push(`Uinal must be between 0 and 17. Got: ${uinal}`);
      }

      if (kin < 0 || kin > 19) {
        errors.push(`Kin must be between 0 and 19. Got: ${kin}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Helper: Create a Mayan date from components
   *
   * @param baktun - Baktun (0-19)
   * @param katun - Katun (0-19)
   * @param tun - Tun (0-17)
   * @param uinal - Uinal (0-17)
   * @param kin - Kin (0-19)
   * @returns DateInput for use with toJDN
   */
  static fromComponents(
    baktun: number,
    katun: number,
    tun: number,
    uinal: number,
    kin: number,
  ): DateInput {
    return {
      year: baktun,
      month: katun,
      day: tun * 10000 + uinal * 100 + kin,
      era: "MLC",
    };
  }

  /**
   * Helper: Extract components from a DateRecord
   *
   * @param date - The Mayan date record
   * @returns Object with baktun, katun, tun, uinal, kin
   */
  static toComponents(date: DateRecord): {
    baktun: number;
    katun: number;
    tun: number;
    uinal: number;
    kin: number;
  } {
    const baktun = date.year;
    const katun = date.month ?? 0;
    const dayValue = date.day ?? 0;
    const tun = Math.floor(dayValue / 10000);
    const uinal = Math.floor((dayValue % 10000) / 100);
    const kin = dayValue % 100;

    return { baktun, katun, tun, uinal, kin };
  }
}
