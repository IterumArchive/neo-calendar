/**
 * @file Hebrew Calendar Adjustments
 * @description Implements dehiyyot (postponement) rules and variable month lengths
 *
 * The Hebrew calendar has complex adjustment rules to prevent religious observances
 * from conflicting with Shabbat. These adjustments can shift Rosh Hashanah by 1-2 days
 * and vary the length of Cheshvan and Kislev.
 *
 * References:
 * - Dershowitz & Reingold, "Calendrical Calculations"
 * - Hebrew Calendar Science and Myths by Remy Landau
 */

import {
  AdjustmentPatterns,
  AdjustmentEngine,
} from "@iterumarchive/neo-calendar-core";
import { AdjustmentPriority } from "@iterumarchive/neo-calendar-core";
import type {
  AdjustmentRule,
  AdjustmentContext,
  JDN,
} from "@iterumarchive/neo-calendar-core";

/**
 * Molad calculation - determines the time of the new moon
 * This is the foundation for Hebrew calendar calculations
 */
export class HebrewMoladCalculator {
  // Molad constants (from Dershowitz & Reingold)
  private static readonly BAHARAD = {
    days: 1,
    hours: 5,
    parts: 204,
  }; // Molad of creation

  private static readonly PARTS_PER_HOUR = 1080;
  private static readonly HOURS_PER_DAY = 24;
  private static readonly PARTS_PER_DAY =
    HebrewMoladCalculator.PARTS_PER_HOUR * HebrewMoladCalculator.HOURS_PER_DAY;

  // Synodic month in parts (29d 12h 793p)
  private static readonly SYNODIC_MONTH_PARTS =
    29 * HebrewMoladCalculator.PARTS_PER_DAY +
    12 * HebrewMoladCalculator.PARTS_PER_HOUR +
    793;

  /**
   * Calculate molad (new moon time) for a given Hebrew year
   * @param year Hebrew year
   * @returns Molad time in parts since epoch
   */
  static calculateMolad(year: number): {
    days: number;
    hours: number;
    parts: number;
  } {
    // Number of months since creation
    const monthsElapsed = this.monthsElapsedBeforeYear(year);

    // Calculate total parts since BaHaRaD
    const totalParts =
      HebrewMoladCalculator.BAHARAD.days * HebrewMoladCalculator.PARTS_PER_DAY +
      HebrewMoladCalculator.BAHARAD.hours *
        HebrewMoladCalculator.PARTS_PER_HOUR +
      HebrewMoladCalculator.BAHARAD.parts +
      monthsElapsed * HebrewMoladCalculator.SYNODIC_MONTH_PARTS;

    // Convert back to days, hours, parts
    const days = Math.floor(totalParts / HebrewMoladCalculator.PARTS_PER_DAY);
    const remainingParts = totalParts % HebrewMoladCalculator.PARTS_PER_DAY;
    const hours = Math.floor(
      remainingParts / HebrewMoladCalculator.PARTS_PER_HOUR,
    );
    const parts = remainingParts % HebrewMoladCalculator.PARTS_PER_HOUR;

    return { days, hours, parts };
  }

  /**
   * Get day of week for molad (0 = Saturday, 1 = Sunday, ..., 6 = Friday)
   * Hebrew week starts on Saturday (Shabbat)
   */
  static getMoladDayOfWeek(year: number): number {
    const molad = this.calculateMolad(year);
    return molad.days % 7;
  }

  /**
   * Check if molad occurs at or after noon (18h = noon in Hebrew time)
   */
  static isMoladAfterNoon(year: number): boolean {
    const molad = this.calculateMolad(year);
    return molad.hours >= 18;
  }

  /**
   * Calculate total months elapsed before a given year
   */
  private static monthsElapsedBeforeYear(year: number): number {
    const yearsSinceCreation = year - 1;
    const leapYearsBeforeYear = Math.floor((yearsSinceCreation * 7 + 1) / 19);
    const regularYears = yearsSinceCreation - leapYearsBeforeYear;

    return regularYears * 12 + leapYearsBeforeYear * 13;
  }

  /**
   * Check if a Hebrew year is a leap year (has 13 months)
   * Leap years occur in years 3, 6, 8, 11, 14, 17, and 19 of the 19-year cycle
   */
  static isLeapYear(year: number): boolean {
    return (year * 7 + 1) % 19 < 7;
  }

  /**
   * Calculate the length of a Hebrew year in days
   * Can be 353, 354, 355 (regular) or 383, 384, 385 (leap)
   *
   * This is calculated by finding the actual JDN difference between
   * Rosh Hashanah of this year and Rosh Hashanah of next year,
   * which accounts for all dehiyyot postponements.
   */
  static getYearLength(year: number): number {
    // Calculate the new year day (Rosh Hashanah) for this year and next year
    const thisYearNewMoon = this.calculateNewYearJDN(year);
    const nextYearNewMoon = this.calculateNewYearJDN(year + 1);

    return Number(nextYearNewMoon - thisYearNewMoon);
  }

  /**
   * Calculate the JDN of Rosh Hashanah (Tishrei 1) for a given year
   * This applies all dehiyyot postponement rules in proper order.
   * Rules can stack - e.g., Molad Zaken can push to ADU day, triggering Lo ADU Rosh.
   */
  static calculateNewYearJDN(year: number): bigint {
    const molad = this.calculateMolad(year);
    // Base: molad days since creation + epoch adjustment
    // Hebrew epoch is at creation (Tishrei 1, year 1) = JDN 347998 - molad.days offset
    let jdn = BigInt(molad.days) + BigInt(347998);

    const isLeap = this.isLeapYear(year);
    const moladParts = molad.hours * 1080 + molad.parts;
    let moladDayOfWeek = molad.days % 7; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri

    // Check GaTaRaD BEFORE any postponements (leap year, Tuesday molad, >= 9h 204p)
    // If this triggers, we postpone by 2 days to Thursday
    // Thursday is NEVER an ADU day, so this is safe
    if (isLeap && moladDayOfWeek === 3 && moladParts >= 9 * 1080 + 204) {
      jdn += BigInt(2);
      return jdn;
    }

    // Check BeTUTeKaPaT BEFORE any postponements (regular year, Monday molad, >= 15h 589p)
    // If this triggers, we postpone by 1 day to Tuesday
    // Tuesday is NEVER an ADU day, so this is safe
    if (!isLeap && moladDayOfWeek === 2 && moladParts >= 15 * 1080 + 589) {
      jdn += BigInt(1);
      return jdn;
    }

    // Apply Molad Zaken: if molad is at or after noon (18h in Hebrew time), postpone to next day
    if (molad.hours >= 18) {
      jdn += BigInt(1);
      // Update the molad day of week since we postponed
      moladDayOfWeek = (moladDayOfWeek + 1) % 7;
    }

    // Apply Lo ADU Rosh: cannot fall on Sunday (1), Wednesday (4), or Friday (6) in Hebrew week
    // Use the (possibly updated) molad day of week
    if (moladDayOfWeek === 1 || moladDayOfWeek === 4 || moladDayOfWeek === 6) {
      jdn += BigInt(1);
    }

    return jdn;
  }
}

/**
 * Hebrew Dehiyyot (Postponement) Rules
 *
 * Four rules that can postpone Rosh Hashanah:
 * 1. Lo ADU Rosh - Rosh Hashanah cannot fall on Sunday, Wednesday, or Friday
 * 2. Molad Zaken - If molad is at noon or later, postpone to next day
 * 3. GaTaRaD - In leap years, prevent year from being too long
 * 4. BeTUTeKaPaT - In regular years, prevent year from being too short
 */
export class HebrewDehiyyotRules {
  /**
   * Rule 1: Lo ADU Rosh
   * "Not 1, 4, 6" - Rosh Hashanah cannot fall on days 1 (Sunday), 4 (Wednesday), or 6 (Friday)
   * This prevents Yom Kippur from falling adjacent to Shabbat
   */
  static readonly LO_ADU_ROSH: AdjustmentRule = {
    id: "hebrew.dehiyyot.lo_adu_rosh",
    category: "postponement",
    reason: "religious",
    description:
      "Lo ADU Rosh: Rosh Hashanah cannot fall on Sunday, Wednesday, or Friday",
    priority: AdjustmentPriority.HIGH,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 7 || ctx.day !== 1) {
        return { applied: false };
      }

      // Calculate what day Rosh Hashanah would fall on (including Molad Zaken)
      const molad = HebrewMoladCalculator.calculateMolad(ctx.year);
      let testJdn = BigInt(molad.days) + BigInt(347998);

      // Apply Molad Zaken first
      if (molad.hours >= 18) {
        testJdn += BigInt(1);
      }

      // Now check if this lands on an ADU day
      const dayOfWeek = Number(testJdn % BigInt(7)); // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri

      // Postpone if Sunday (1), Wednesday (4), or Friday (6)
      if (dayOfWeek === 1 || dayOfWeek === 4 || dayOfWeek === 6) {
        const dayNames = [
          "Saturday",
          "Sunday",
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
        ];
        return {
          applied: true,
          delta: 1, // Postpone by 1 day
          reason: "religious",
          metadata: {
            rule: "lo_adu_rosh",
            originalDay: dayOfWeek,
            reason: `Postponed from ${dayNames[dayOfWeek]}`,
          },
        };
      }

      return { applied: false };
    },
  };

  /**
   * Rule 2: Molad Zaken
   * If the molad occurs at noon or later, postpone Rosh Hashanah to the next day
   * This ensures the molad is not too old when the month begins
   */
  static readonly MOLAD_ZAKEN: AdjustmentRule = {
    id: "hebrew.dehiyyot.molad_zaken",
    category: "postponement",
    reason: "astronomical",
    description: "Molad Zaken: Postpone if molad is at noon or later",
    priority: AdjustmentPriority.HIGH,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 7 || ctx.day !== 1) {
        return { applied: false };
      }

      if (HebrewMoladCalculator.isMoladAfterNoon(ctx.year)) {
        return {
          applied: true,
          delta: 1,
          reason: "religious",
          metadata: {
            rule: "molad_zaken",
            moladHours: HebrewMoladCalculator.calculateMolad(ctx.year).hours,
          },
        };
      }

      return { applied: false };
    },
  };

  /**
   * Rule 3: GaTaRaD
   * In leap years, if molad occurs on Tuesday at 9h 204p or later,
   * postpone to Thursday to prevent the year from being too long (385+ days)
   */
  static readonly GATARAD: AdjustmentRule = {
    id: "hebrew.dehiyyot.gatarad",
    category: "postponement",
    reason: "mathematical",
    description:
      "GaTaRaD: Prevents too-long leap years (Tuesday at 9h 204p or later)",
    priority: AdjustmentPriority.HIGH,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 7 || ctx.day !== 1) {
        return { applied: false };
      }

      // Only applies to leap years
      if (!HebrewMoladCalculator.isLeapYear(ctx.year)) {
        return { applied: false };
      }

      const molad = HebrewMoladCalculator.calculateMolad(ctx.year);
      const dayOfWeek = molad.days % 7; // 0=Sat, 1=Sun, 2=Mon, 3=Tue, 4=Wed, 5=Thu, 6=Fri

      // Check if Tuesday (3) at 9h 204p or later
      if (dayOfWeek === 3) {
        const moladTime = molad.hours * 1080 + molad.parts;
        const thresholdTime = 9 * 1080 + 204;

        if (moladTime >= thresholdTime) {
          return {
            applied: true,
            delta: 2, // Postpone to Thursday (skip Wednesday per Lo ADU)
            reason: "religious",
            metadata: {
              rule: "gatarad",
              moladDay: "Tuesday",
              moladTime: `${molad.hours}h ${molad.parts}p`,
            },
          };
        }
      }

      return { applied: false };
    },
  };

  /**
   * Rule 4: BeTUTeKaPaT
   * In regular (non-leap) years, if molad occurs on Monday at 15h 589p or later,
   * postpone to Tuesday to prevent the year from being too short (352 days)
   */
  static readonly BETUTEKAPAT: AdjustmentRule = {
    id: "hebrew.dehiyyot.betutekapat",
    category: "postponement",
    reason: "mathematical",
    description:
      "BeTUTeKaPaT: Prevents too-short regular years (Monday at 15h 589p or later)",
    priority: AdjustmentPriority.HIGH,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 7 || ctx.day !== 1) {
        return { applied: false };
      }

      // Only applies to regular (non-leap) years
      if (HebrewMoladCalculator.isLeapYear(ctx.year)) {
        return { applied: false };
      }

      const molad = HebrewMoladCalculator.calculateMolad(ctx.year);
      const dayOfWeek = molad.days % 7; // 0=Sat, 1=Sun, 2=Mon

      // Check if Monday (2) at 15h 589p or later
      if (dayOfWeek === 2) {
        const moladTime = molad.hours * 1080 + molad.parts;
        const thresholdTime = 15 * 1080 + 589;

        if (moladTime >= thresholdTime) {
          return {
            applied: true,
            delta: 1, // Postpone to Tuesday
            reason: "religious",
            metadata: {
              rule: "betutekapat",
              moladDay: "Monday",
              moladTime: `${molad.hours}h ${molad.parts}p`,
            },
          };
        }
      }

      return { applied: false };
    },
  };

  /**
   * All dehiyyot rules in priority order
   */
  static readonly ALL_RULES: AdjustmentRule[] = [
    HebrewDehiyyotRules.LO_ADU_ROSH,
    HebrewDehiyyotRules.MOLAD_ZAKEN,
    HebrewDehiyyotRules.GATARAD,
    HebrewDehiyyotRules.BETUTEKAPAT,
  ];
}

/**
 * Variable Month Length Rules
 *
 * Cheshvan (month 2) and Kislev (month 3) can vary between 29 and 30 days
 * to adjust the year length to match the dehiyyot postponements
 */
export class HebrewVariableMonthRules {
  /**
   * Cheshvan can be 29 or 30 days (deficient vs regular/complete year)
   */
  static readonly CHESHVAN: AdjustmentRule = {
    id: "hebrew.variable_month.cheshvan",
    category: "variable_length",
    reason: "mathematical",
    description: "Cheshvan length varies (29 or 30) to adjust year length",
    priority: AdjustmentPriority.NORMAL,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 2) {
        return { applied: false };
      }

      // Calculate year length based on dehiyyot
      const yearLength = HebrewMoladCalculator.getYearLength(ctx.year);
      const isLeap = HebrewMoladCalculator.isLeapYear(ctx.year);

      // Deficient years: 353 (regular) or 383 (leap) - Cheshvan has 29 days
      // Regular/Complete years: 354+/384+ - Cheshvan has 30 days
      const isDeficient = yearLength === (isLeap ? 383 : 353);

      return {
        applied: true,
        newLength: isDeficient ? 29 : 30,
        metadata: {
          yearLength,
          yearType: isDeficient ? "deficient" : "regular/complete",
        },
      };
    },
  };

  /**
   * Kislev can be 29 or 30 days (deficient/regular vs complete year)
   */
  static readonly KISLEV: AdjustmentRule = {
    id: "hebrew.variable_month.kislev",
    category: "variable_length",
    reason: "mathematical",
    description: "Kislev length varies (29 or 30) to adjust year length",
    priority: AdjustmentPriority.NORMAL,

    apply: (ctx: AdjustmentContext) => {
      if (!ctx.year || ctx.month !== 3) {
        return { applied: false };
      }

      // Calculate year length based on dehiyyot
      const yearLength = HebrewMoladCalculator.getYearLength(ctx.year);
      const isLeap = HebrewMoladCalculator.isLeapYear(ctx.year);

      // Complete years: 355 (regular) or 385 (leap) - Kislev has 30 days
      // Deficient/Regular years: 353-354/383-384 - Kislev has 29 days
      const isComplete = yearLength === (isLeap ? 385 : 355);

      return {
        applied: true,
        newLength: isComplete ? 30 : 29,
        metadata: {
          yearLength,
          yearType: isComplete ? "complete" : "deficient/regular",
        },
      };
    },
  };

  /**
   * All variable month rules
   */
  static readonly ALL_RULES: AdjustmentRule[] = [
    HebrewVariableMonthRules.CHESHVAN,
    HebrewVariableMonthRules.KISLEV,
  ];
}

/**
 * Complete Hebrew adjustment system
 */
export class HebrewAdjustments {
  /**
   * All Hebrew adjustment rules (dehiyyot + variable months)
   */
  static readonly ALL_RULES: AdjustmentRule[] = [
    ...HebrewVariableMonthRules.ALL_RULES, // NORMAL priority - must apply first
    ...HebrewDehiyyotRules.ALL_RULES, // HIGH priority - apply after month lengths
  ];

  /**
   * Apply all Hebrew adjustments to a context
   */
  static async apply(ctx: AdjustmentContext) {
    return AdjustmentEngine.applyAdjustments(ctx, HebrewAdjustments.ALL_RULES);
  }
}
