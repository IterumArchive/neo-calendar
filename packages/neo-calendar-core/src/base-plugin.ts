/**
 * @file Base Calendar Plugin
 * @description Abstract base class for calendar plugins
 *
 * Provides default implementations of common methods to reduce boilerplate.
 * Plugins extend this class and implement calendar-specific logic.
 *
 * MUST IMPLEMENT:
 * - toJDN() - Convert date to JDN
 * - fromJDN() - Convert JDN to date
 *
 * MAY OVERRIDE:
 * - validate() - Custom validation logic
 * - normalize() - Custom normalization strategy
 * - daysInMonth() - Calendar-specific month lengths
 * - etc.
 */

import type {
  BrandedJDN,
  CalendarSystem,
  CalendarSystemId,
  DateInput,
  DateRecord,
  Duration,
  DurationUnit,
  ConversionStrategy,
  ValidationResult,
  EraLabel,
  DiurnalStart,
} from "./ontology.types.js";

import type { ICalendarPlugin } from "./interfaces.js";
import { ValidationError, EraError, ArithmeticError } from "./errors.js";

// ============================================================================
// ABSTRACT BASE PLUGIN
// ============================================================================

/**
 * Abstract base class for calendar plugins.
 *
 * Provides sensible defaults for most methods.
 * Subclasses must implement toJDN() and fromJDN().
 */
export abstract class BaseCalendarPlugin implements ICalendarPlugin {
  // ============================================================================
  // PROTECTED CONFIGURATION (Can be overridden by subclasses)
  // ============================================================================

  /**
   * Average days per month for this calendar system.
   *
   * Used for approximate duration calculations when converting between
   * variable-length units (months/years).
   *
   * Defaults:
   * - Solar calendars: 30.436875 (Gregorian average)
   * - Lunar calendars: 29.53 (synodic month)
   * - Fixed calendars: Exact value (e.g., 30 for Egyptian civil)
   *
   * Override this in subclasses for calendar-specific precision.
   */
  protected averageDaysPerMonth: number = 30.436875;

  /**
   * Average days per year for this calendar system.
   *
   * Used for approximate duration calculations when converting between
   * variable-length units.
   *
   * Defaults:
   * - Solar calendars: 365.2425 (Gregorian average)
   * - Lunar calendars: 354.367 (12 synodic months)
   * - Fixed calendars: Exact value (e.g., 365 for Egyptian civil)
   *
   * Override this in subclasses for calendar-specific precision.
   */
  protected averageDaysPerYear: number = 365.2425;

  // ============================================================================
  // ABSTRACT METHODS (Must be implemented by subclasses)
  // ============================================================================

  /**
   * Calendar system identifier (must be unique)
   */
  abstract readonly id: CalendarSystemId;

  /**
   * Complete calendar system definition
   */
  abstract readonly metadata: CalendarSystem;

  /**
   * Optional list of supported era labels for era-driven calendar selection
   * If not provided, falls back to metadata.eraSystem.labels
   */
  readonly eras?: readonly EraLabel[];

  /**
   * Convert FROM calendar-specific date TO JDN (The Hub)
   *
   * Subclasses MUST implement this method.
   */
  abstract toJDN(input: DateInput): BrandedJDN;

  /**
   * Convert FROM JDN TO calendar-specific date (The Skin)
   *
   * Subclasses MUST implement this method.
   */
  abstract fromJDN(jdn: BrandedJDN): DateRecord;

  // ============================================================================
  // VALIDATION (Default implementations)
  // ============================================================================

  /**
   * Validate date input before conversion
   *
   * Default implementation checks:
   * - Year is present
   * - Month is in valid range (if present)
   * - Day is in valid range (if present)
   *
   * Override for calendar-specific validation.
   */
  validate(input: DateInput): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Year is required
    if (input.year === undefined || input.year === null) {
      errors.push("Year is required");
    }

    // Validate era if present
    if (input.era !== undefined) {
      // Check against plugin's eras array if defined, otherwise use metadata
      const allowedEras = this.eras || this.metadata.eraSystem.labels;
      if (!allowedEras.includes(input.era as any)) {
        errors.push(
          `Era "${input.era}" is not valid for ${this.id}. Allowed eras: ${allowedEras.join(", ")}`,
        );
      }
    }

    // Validate month if present
    if (input.month !== undefined) {
      const maxMonths = input.year ? this.monthsInYear(input.year) : 12;
      if (input.month < 1 || input.month > maxMonths) {
        errors.push(
          `Month must be between 1 and ${maxMonths}, got ${input.month}`,
        );
      }
    }

    // Validate day if present
    if (
      input.day !== undefined &&
      input.month !== undefined &&
      input.year !== undefined
    ) {
      const maxDays = this.daysInMonth(input.year, input.month);
      if (input.day < 1 || input.day > maxDays) {
        errors.push(
          `Day must be between 1 and ${maxDays} for month ${input.month}, got ${input.day}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if date is valid (quick boolean check)
   */
  isValid(input: DateInput): boolean {
    return this.validate(input).isValid;
  }

  /**
   * Normalize invalid date to closest valid date
   *
   * Default strategy: "snap" to nearest valid date.
   * Override for calendar-specific normalization.
   */
  normalize(input: DateInput, strategy: ConversionStrategy): DateInput {
    const normalized = { ...input };

    // Default month to 1 if not provided
    if (!normalized.month) {
      normalized.month = 1;
    }

    // Default day to 1 if not provided
    if (!normalized.day) {
      normalized.day = 1;
    }

    // Snap strategy: clamp to valid ranges
    if (strategy === "snap" || strategy === "strict") {
      // Clamp month to valid range
      const maxMonths = this.monthsInYear(normalized.year);
      if (normalized.month > maxMonths) {
        normalized.month = maxMonths;
      }
      if (normalized.month < 1) {
        normalized.month = 1;
      }

      // Clamp day to valid range
      const maxDays = this.daysInMonth(normalized.year, normalized.month);
      if (normalized.day > maxDays) {
        normalized.day = maxDays;
      }
      if (normalized.day < 1) {
        normalized.day = 1;
      }
    }

    return normalized;
  }

  // ============================================================================
  // CALENDAR-SPECIFIC QUERIES (Default implementations)
  // ============================================================================

  /**
   * Is this a leap year?
   *
   * Default: No leap years.
   * Override with calendar-specific leap year logic.
   */
  isLeapYear(year: number): boolean {
    return false;
  }

  /**
   * How many days in this month?
   *
   * Default: 30 days per month.
   * Override with calendar-specific month lengths.
   */
  daysInMonth(year: number, month: number): number {
    return 30;
  }

  /**
   * How many days in this year?
   *
   * Default: 365 days (or 366 if leap year).
   * Override for calendars with different year lengths.
   */
  daysInYear(year: number): number {
    return this.isLeapYear(year) ? 366 : 365;
  }

  /**
   * How many months in this year?
   *
   * Default: 12 months.
   * Override for lunisolar calendars with intercalary months.
   */
  monthsInYear(year: number): number {
    return 12;
  }

  // ============================================================================
  // DIURNAL BOUNDARY (Default implementations)
  // ============================================================================

  /**
   * When does this calendar's day begin?
   *
   * Default: midnight.
   * Override for sunset/sunrise calendars.
   */
  getDiurnalStart(): DiurnalStart {
    return "midnight";
  }

  /**
   * Get diurnal boundary offset in fractional days from midnight
   *
   * Default: 0.0 (midnight).
   * Override for sunset/sunrise/noon calendars.
   */
  getDiurnalOffset(): number {
    return 0.0;
  }

  // ============================================================================
  // ERA HANDLING (Default implementations)
  // ============================================================================

  /**
   * Resolve era label to calendar-specific year representation
   *
   * Default: Simple bidirectional era (BC/AD style).
   * Override for complex era systems (Japanese, Regnal, etc.).
   */
  resolveEra(
    year: number,
    era: EraLabel,
  ): {
    astronomicalYear: number;
    displayYear: number;
    eraStart: BrandedJDN;
    era: EraLabel;
  } {
    // Default: Simple BC/AD or CE/BCE handling
    const isBefore = era === "BC" || era === "BCE";
    const astronomicalYear = isBefore ? -(year - 1) : year;

    // Default era start (epoch)
    const eraStart = this.metadata.epoch.jdn as BrandedJDN;

    return {
      astronomicalYear,
      displayYear: year,
      eraStart,
      era,
    };
  }

  /**
   * Get era label for a given astronomical year
   *
   * Default: Returns AD/CE for positive years, BC/BCE for negative.
   * Override for calendar-specific era labels.
   */
  eraLabel(year: number): EraLabel {
    // Use calendar's default era labels
    const labels = this.metadata.eraSystem.labels;

    if (year < 0) {
      // Negative year: use first "before" label (BC, BCE)
      return (labels.find((l: string) => l === "BC" || l === "BCE") ||
        labels[1] ||
        "BC") as EraLabel;
    } else {
      // Positive year: use first "after" label (AD, CE)
      return (labels.find((l: string) => l === "AD" || l === "CE") ||
        labels[0] ||
        "AD") as EraLabel;
    }
  }

  // ============================================================================
  // ARITHMETIC SUPPORT (Default implementations)
  // ============================================================================

  /**
   * Add months to a date (calendar-aware)
   *
   * Default: Adjust month/year, snap day to valid range.
   * Override for calendar-specific month arithmetic.
   */
  addMonths(input: DateInput, months: number): DateInput {
    const year = input.year;
    const currentMonth = input.month || 1;
    const day = input.day || 1;
    const monthsPerYear = this.monthsInYear(year);

    // Calculate total months from year 1
    const totalMonths =
      (year - 1) * monthsPerYear + (currentMonth - 1) + months;

    // Calculate new year and month
    const newYear = Math.floor(totalMonths / monthsPerYear) + 1;
    const newMonth = (totalMonths % monthsPerYear) + 1;

    // Snap day to valid range in new month
    const maxDays = this.daysInMonth(newYear, newMonth);
    const newDay = Math.min(day, maxDays);

    // Convert to JDN and back to handle BC/AD crossing
    const tempInput: DateInput = {
      year: newYear,
      month: newMonth,
      day: newDay,
    };
    if (input.era) {
      tempInput.era = input.era;
    }

    const jdn = this.toJDN(tempInput);
    const result = this.fromJDN(jdn);

    return {
      year: result.year,
      month: result.month!,
      day: result.day!,
      era: result.era,
    };
  }

  /**
   * Add years to a date (calendar-aware)
   *
   * Default: Adjust year, snap day to valid range.
   * Override for calendar-specific year arithmetic.
   */
  addYears(input: DateInput, years: number): DateInput {
    const month = input.month || 1;
    const day = input.day || 1;

    // Convert to JDN, add approximate days, convert back
    // This handles BC/AD crossing and era changes
    const jdn = this.toJDN(input);
    const daysToAdd = Math.floor(years * this.averageDaysPerYear);
    const newJDN = (jdn + BigInt(daysToAdd)) as BrandedJDN;
    const roughDate = this.fromJDN(newJDN);

    // Fine-tune to exact year offset
    const targetYear = input.year + years;
    const yearDiff = roughDate.year - targetYear;

    // Adjust if we're off by a year
    let finalYear = targetYear;
    if (Math.abs(yearDiff) <= 1 && roughDate.era === input.era) {
      finalYear = roughDate.year;
    }

    // Snap day to valid range in target year
    const maxDays = this.daysInMonth(finalYear, month);
    const newDay = Math.min(day, maxDays);

    // Convert final date to get correct era
    const finalInput: DateInput = {
      year: finalYear,
      month,
      day: newDay,
    };
    if (input.era) {
      finalInput.era = input.era;
    }

    const finalJDN = this.toJDN(finalInput);
    const result = this.fromJDN(finalJDN);

    return {
      year: result.year,
      month: result.month!,
      day: result.day!,
      era: result.era,
    };
  }

  /**
   * Calculate duration between two dates in calendar-specific units
   *
   * Default: Convert to JDN, calculate day difference, convert to requested unit.
   * Override for calendar-specific duration calculations.
   */
  durationBetween(
    start: DateInput,
    end: DateInput,
    unit: DurationUnit,
  ): Duration {
    // Convert both dates to JDN
    const startJDN = this.toJDN(start);
    const endJDN = this.toJDN(end);

    // Calculate day difference
    const days = Number(endJDN - startJDN);

    // For simple units, we can calculate directly
    let value = days;
    let isVariable = false;

    switch (unit) {
      case "days":
        value = days;
        break;
      case "weeks":
        value = days / 7;
        break;
      case "months":
        // Approximate using calendar-specific average
        value = days / this.averageDaysPerMonth;
        isVariable = true;
        break;
      case "years":
        // Approximate using calendar-specific average
        value = days / this.averageDaysPerYear;
        isVariable = true;
        break;
      default:
        value = days;
    }

    return {
      days,
      originalUnit: unit,
      originalValue: value,
      calendarContext: this.id,
      isVariable,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Throw validation error if date is invalid
   *
   * Useful for enforcing validation in toJDN().
   */
  protected assertValid(input: DateInput): void {
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw ValidationError.invalidDate(
        this.id,
        input.year,
        input.month,
        input.day,
        validation.errors,
      );
    }
  }

  /**
   * Get default DateInput with year/month/day defaults
   */
  protected getDefaultInput(input: DateInput): Required<DateInput> {
    return {
      year: input.year,
      month: input.month ?? 1,
      day: input.day ?? 1,
      era: input.era ?? this.eraLabel(input.year),
    };
  }
}
