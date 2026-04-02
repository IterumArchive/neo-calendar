/**
 * @file NeoDuration Implementation
 * @description Represents a length of time with calendar-aware conversions
 *
 * Duration is relative and calendar-dependent:
 * - "1 month" varies by calendar (28-31 days Gregorian, 29-30 Islamic, 20 Mayan)
 * - Duration stores normalized days but converts based on calendar context
 */

import type { CalendarSystemId } from "@iterumarchive/neo-calendar-core";
import type {
  NeoDuration as INeoDuration,
  DurationComponents,
} from "./api.types.js";
import { Registry } from "./registry.js";

/**
 * NeoDuration - Immutable duration object
 *
 * Represents a length of time anchored to total days, with calendar-aware
 * conversions for months and years.
 */
export class NeoDuration implements INeoDuration {
  /** Total duration in days (normalized) */
  readonly days: number;

  /**
   * Create a new duration
   * @param days - Total days (can be fractional)
   */
  constructor(days: number) {
    this.days = days;
  }

  // ========== Unit Conversions ==========

  toDays(): number {
    return this.days;
  }

  toWeeks(): number {
    return this.days / 7;
  }

  toMonths(calendar: CalendarSystemId = "GREGORIAN"): number {
    const plugin = Registry.get(calendar);
    if (!plugin) {
      // Fallback to average month length
      return this.days / 30.436875; // Average Gregorian month
    }

    // Use plugin's year/month structure to calculate average month
    const metadata = plugin.metadata;
    const avgMonthLength = metadata.daysPerYear / metadata.monthsPerYear;
    return this.days / avgMonthLength;
  }

  toYears(calendar: CalendarSystemId = "GREGORIAN"): number {
    const plugin = Registry.get(calendar);
    if (!plugin) {
      // Fallback to average year length
      return this.days / 365.2425; // Average Gregorian year
    }

    // Use plugin's average year length
    const metadata = plugin.metadata;
    const avgYearLength = metadata.daysPerYear;
    return this.days / avgYearLength;
  }

  // ========== Human-Readable Output ==========

  toHuman(options?: { locale?: string; maxUnits?: number }): string {
    const maxUnits = options?.maxUnits || 3;
    const components = this.toComponents();

    const parts: string[] = [];
    if (components.years && parts.length < maxUnits) {
      parts.push(
        `${components.years} year${components.years !== 1 ? "s" : ""}`,
      );
    }
    if (components.months && parts.length < maxUnits) {
      parts.push(
        `${components.months} month${components.months !== 1 ? "s" : ""}`,
      );
    }
    if (components.weeks && parts.length < maxUnits) {
      parts.push(
        `${components.weeks} week${components.weeks !== 1 ? "s" : ""}`,
      );
    }
    if (components.days && parts.length < maxUnits) {
      parts.push(`${components.days} day${components.days !== 1 ? "s" : ""}`);
    }

    if (parts.length === 0) {
      return "0 days";
    }

    return parts.join(", ");
  }

  toISODuration(): string {
    const components = this.toComponents();
    let result = "P";

    if (components.years) {
      result += `${components.years}Y`;
    }
    if (components.months) {
      result += `${components.months}M`;
    }
    if (components.weeks) {
      result += `${components.weeks}W`;
    }
    if (components.days) {
      result += `${components.days}D`;
    }

    // If no components, return P0D
    return result === "P" ? "P0D" : result;
  }

  toComponents(calendar: CalendarSystemId = "GREGORIAN"): DurationComponents {
    let remainingDays = Math.abs(this.days);

    const plugin = Registry.get(calendar);
    const avgYearLength = plugin?.metadata.daysPerYear || 365.2425;
    const avgMonthLength = plugin
      ? plugin.metadata.daysPerYear / plugin.metadata.monthsPerYear
      : 30.436875;

    // Calculate years
    const years = Math.floor(remainingDays / avgYearLength);
    remainingDays -= years * avgYearLength;

    // Calculate months
    const months = Math.floor(remainingDays / avgMonthLength);
    remainingDays -= months * avgMonthLength;

    // Calculate weeks
    const weeks = Math.floor(remainingDays / 7);
    remainingDays -= weeks * 7;

    // Remaining days
    const days = Math.floor(remainingDays);

    const result: DurationComponents = {};
    if (years > 0) result.years = years;
    if (months > 0) result.months = months;
    if (weeks > 0) result.weeks = weeks;
    if (days > 0) result.days = days;

    return result;
  }

  // ========== Arithmetic ==========

  add(other: NeoDuration): NeoDuration {
    return new NeoDuration(this.days + other.days);
  }

  subtract(other: NeoDuration): NeoDuration {
    return new NeoDuration(this.days - other.days);
  }

  multiply(factor: number): NeoDuration {
    return new NeoDuration(this.days * factor);
  }

  divide(divisor: number): NeoDuration {
    if (divisor === 0) {
      throw new Error("Cannot divide duration by zero");
    }
    return new NeoDuration(this.days / divisor);
  }

  // ========== Comparison ==========

  equals(other: NeoDuration): boolean {
    return Math.abs(this.days - other.days) < 0.0001; // Tolerance for floating point
  }

  isLongerThan(other: NeoDuration): boolean {
    return this.days > other.days;
  }

  isShorterThan(other: NeoDuration): boolean {
    return this.days < other.days;
  }

  // ========== Static Factory Methods ==========

  /**
   * Create a duration from components
   */
  static from(
    components: DurationComponents,
    calendar: CalendarSystemId = "GREGORIAN",
  ): NeoDuration {
    const plugin = Registry.get(calendar);
    const avgYearLength = plugin?.metadata.daysPerYear || 365.2425;
    const avgMonthLength = plugin
      ? plugin.metadata.daysPerYear / plugin.metadata.monthsPerYear
      : 30.436875;

    let totalDays = 0;

    if (components.years) {
      totalDays += components.years * avgYearLength;
    }
    if (components.months) {
      totalDays += components.months * avgMonthLength;
    }
    if (components.weeks) {
      totalDays += components.weeks * 7;
    }
    if (components.days) {
      totalDays += components.days;
    }

    return new NeoDuration(totalDays);
  }

  /**
   * Parse an ISO 8601 duration string
   * @example "P3Y6M4D" -> 3 years, 6 months, 4 days
   */
  static fromISODuration(
    iso: string,
    calendar: CalendarSystemId = "GREGORIAN",
  ): NeoDuration {
    const match = iso.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/);
    if (!match) {
      throw new Error(`Invalid ISO duration format: ${iso}`);
    }

    const [, years, months, weeks, days] = match;
    const components: DurationComponents = {};
    if (years) components.years = parseInt(years, 10);
    if (months) components.months = parseInt(months, 10);
    if (weeks) components.weeks = parseInt(weeks, 10);
    if (days) components.days = parseInt(days, 10);

    return NeoDuration.from(components, calendar);
  }

  /**
   * Create a duration from a specific unit
   */
  static fromDays(days: number): NeoDuration {
    return new NeoDuration(days);
  }

  static fromWeeks(weeks: number): NeoDuration {
    return new NeoDuration(weeks * 7);
  }

  static fromMonths(
    months: number,
    calendar: CalendarSystemId = "GREGORIAN",
  ): NeoDuration {
    const plugin = Registry.get(calendar);
    const avgMonthLength = plugin
      ? plugin.metadata.daysPerYear / plugin.metadata.monthsPerYear
      : 30.436875;
    return new NeoDuration(months * avgMonthLength);
  }

  static fromYears(
    years: number,
    calendar: CalendarSystemId = "GREGORIAN",
  ): NeoDuration {
    const plugin = Registry.get(calendar);
    const avgYearLength = plugin?.metadata.daysPerYear || 365.2425;
    return new NeoDuration(years * avgYearLength);
  }

  // ========== Serialization ==========

  toJSON(): { days: number } {
    return { days: this.days };
  }

  toString(): string {
    return this.toHuman();
  }
}
