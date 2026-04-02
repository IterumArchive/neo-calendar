/**
 * @file NeoDate Implementation
 * @description The primary user-facing date object - immutable and JDN-anchored
 *
 * NeoDate wraps the low-level plugin system in a fluent, developer-friendly API.
 * All operations return new instances, preserving immutability.
 */

import type {
  BrandedJDN,
  CalendarSystemId,
  DateInput,
  DateRecord,
  EraLabel,
} from "@iterumarchive/neo-calendar-core";
import type {
  NeoDate as INeoDate,
  DateMetadata,
  FormatOptions,
  ArithmeticOptions,
  DiffOptions,
  TimeUnit,
  ProjectionResult,
} from "./api.types.js";
import { Registry } from "./registry.js";
import { ValidationError } from "@iterumarchive/neo-calendar-core";
import { NeoDuration } from "./NeoDuration.js";
import { formatDate } from "./formatting.js";

/**
 * NeoDate - Immutable date object representing a moment in time
 *
 * Design principles:
 * - Immutable: All operations return new instances
 * - JDN-anchored: Source of truth is always the JDN
 * - Calendar-aware: Remembers its context for formatting
 * - Metadata-rich: Can carry uncertainty, precision, and observational data
 */
export class NeoDate implements INeoDate {
  /** The Julian Day Number - immutable source of truth */
  readonly jdn: BrandedJDN;

  /** The "home" calendar system */
  readonly calendar: CalendarSystemId;

  /** The date representation in the home calendar */
  readonly record: DateRecord;

  /** Metadata (uncertainty, precision, etc.) */
  readonly metadata: DateMetadata;

  /**
   * Private constructor - use factory methods to create instances
   */
  private constructor(
    jdn: BrandedJDN,
    calendar: CalendarSystemId,
    record: DateRecord,
    metadata: DateMetadata = {},
  ) {
    this.jdn = jdn;
    this.calendar = calendar;
    this.record = record;
    this.metadata = metadata;
  }

  // ========== Convenience Properties ==========

  get year(): number {
    return this.record.year;
  }

  get month(): number | undefined {
    return this.record.month;
  }

  get day(): number | undefined {
    return this.record.day;
  }

  get era(): EraLabel | undefined {
    return this.record.era as EraLabel | undefined;
  }

  /**
   * Level 0 diurnal data accessor
   * Exposes observational timing information for astronomical/archaeological use
   */
  get diurnal() {
    return {
      transitionFraction: this.metadata.diurnal?.transitionFraction,
      isObservationBased: this.metadata.diurnal?.isObservationBased ?? false,
    };
  }

  // ========== Display & Formatting ==========

  get display(): string {
    return this.record.display;
  }

  format(template: string, options?: FormatOptions): string {
    return formatDate(
      this.record,
      this.calendar,
      template,
      this.metadata,
      options,
    );
  }

  toISOString(): string {
    // Use current calendar for ISO string formatting
    const y = this.year;
    const m = (this.month ?? 1).toString().padStart(2, "0");
    const d = (this.day ?? 1).toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  toISO8601Extended(): string {
    // TODO: Implement ISO 8601-2 extended format with uncertainty markers
    let result = this.toISOString();

    if (this.metadata.circa) {
      result = `~${result}`;
    }
    if (this.metadata.uncertain) {
      result = `${result}?`;
    }
    if (this.metadata.approximate) {
      result = `${result}%`;
    }

    return result;
  }

  // ========== Conversion & Translation ==========

  to(
    eraSuffix: EraLabel,
    options?: { includeSuffix?: boolean; includeDate?: boolean },
  ): string;
  to(
    eraSuffixes: EraLabel[],
    options?: { includeSuffix?: boolean; includeDate?: boolean },
  ): string[];
  to(calendarId: CalendarSystemId): NeoDate;
  to(calendarIds: CalendarSystemId[]): Record<CalendarSystemId, NeoDate>;
  to(
    input: CalendarSystemId | CalendarSystemId[] | EraLabel | EraLabel[],
    options?: { includeSuffix?: boolean; includeDate?: boolean },
  ): NeoDate | Record<CalendarSystemId, NeoDate> | string | string[] {
    // Check if input is an era suffix (not a calendar ID)
    if (typeof input === "string" && !Registry.has(input as CalendarSystemId)) {
      // Try to find calendar by era
      const calendars = Registry.findByEra(input);
      if (calendars.length === 0) {
        const availableEras = Registry.getAllEras();
        throw new ValidationError(
          `Calendar with era "${input}" not found in registry`,
          [`Era "${input}" is not registered`],
          [],
          { availableEras },
        );
      }
      // Use the first matching calendar (guaranteed to exist after length check)
      const calendarId = calendars[0]!;
      const converted = this.toSingle(calendarId);

      // Format the result
      const includeSuffix = options?.includeSuffix ?? true;
      const includeDate = options?.includeDate ?? false;

      if (includeDate) {
        // Include full date: "12024-01-01 HE"
        return includeSuffix
          ? converted.display
          : converted.display.replace(/\s+[A-Z]+$/, "");
      } else {
        // Year only: "12024 HE" or "12024"
        return includeSuffix
          ? `${converted.year} ${input.toUpperCase()}`
          : `${converted.year}`;
      }
    }

    if (Array.isArray(input)) {
      // Check if array contains era suffixes or calendar IDs
      const firstItem = input[0];
      if (firstItem && !Registry.has(firstItem as CalendarSystemId)) {
        // Array of era suffixes - return string array
        return input.map(era => {
          const calendars = Registry.findByEra(era);
          if (calendars.length === 0) {
            const availableEras = Registry.getAllEras();
            throw new ValidationError(
              `Calendar with era "${era}" not found in registry`,
              [`Era "${era}" is not registered`],
              [],
              { availableEras },
            );
          }
          const calendarId = calendars[0]!;
          const converted = this.toSingle(calendarId);

          const includeSuffix = options?.includeSuffix ?? true;
          const includeDate = options?.includeDate ?? false;

          if (includeDate) {
            return includeSuffix
              ? converted.display
              : converted.display.replace(/\s+[A-Z]+$/, "");
          } else {
            return includeSuffix
              ? `${converted.year} ${era.toUpperCase()}`
              : `${converted.year}`;
          }
        });
      } else {
        // Array of calendar IDs - return map
        const result: Record<CalendarSystemId, NeoDate> = {} as Record<
          CalendarSystemId,
          NeoDate
        >;
        for (const calendarId of input) {
          result[calendarId as CalendarSystemId] = this.toSingle(
            calendarId as CalendarSystemId,
          );
        }
        return result;
      }
    } else {
      // Single calendar - return NeoDate
      return this.toSingle(input as CalendarSystemId);
    }
  }

  /**
   * Convert to multiple calendars and return as simple string array
   * Convenience method for displaying dates in multiple calendar systems
   *
   * @example
   * ```typescript
   * const date = NeoCalendar.calendar(2026, 'AD', 3, 16);
   * const displays = date.toStrings(['ISO', 'HE', 'HIJRI']);
   * // → ["+002026-03-16 AD", "+012026-03-16 HE", "1447/9/28 AH"]
   * ```
   */
  toStrings(calendarIds: CalendarSystemId[]): string[] {
    return calendarIds.map(calendarId => {
      const converted = this.toSingle(calendarId);
      return converted.display;
    });
  }

  private toSingle(calendarId: CalendarSystemId): NeoDate {
    // If already in the target calendar, return self
    if (this.calendar === calendarId) {
      return this;
    }

    // Get the target plugin
    const targetPlugin = Registry.get(calendarId);

    // Convert JDN to target calendar
    const newRecord = targetPlugin.fromJDN(this.jdn);

    // Create new NeoDate with same JDN, new calendar context
    return new NeoDate(this.jdn, calendarId, newRecord, this.metadata);
  }

  project(calendarIds: CalendarSystemId[]): ProjectionResult {
    const calendars: Record<CalendarSystemId, DateRecord> = {} as Record<
      CalendarSystemId,
      DateRecord
    >;

    for (const calendarId of calendarIds) {
      const plugin = Registry.get(calendarId);
      calendars[calendarId] = plugin.fromJDN(this.jdn);
    }

    return {
      source: this,
      calendars,
      toArray: () => {
        return Object.entries(calendars).map(([calendar, record]) => ({
          calendar: calendar as CalendarSystemId,
          record,
        }));
      },
      allValid: () => {
        return Object.values(calendars).every(record => !record.isAmbiguous);
      },
    };
  }

  as(calendarId: CalendarSystemId): NeoDate {
    return this.toSingle(calendarId);
  }

  // ========== Arithmetic ==========

  add(amount: number, unit: TimeUnit, options?: ArithmeticOptions): NeoDate {
    const plugin = Registry.get(this.calendar);
    const normalizedUnit = this.normalizeUnit(unit);
    const opts = options || {};

    let newRecord: DateRecord;

    if (normalizedUnit === "day") {
      // Add days by manipulating JDN
      const newJDN = (this.jdn + BigInt(amount)) as BrandedJDN;
      newRecord = plugin.fromJDN(newJDN);
      return new NeoDate(newJDN, this.calendar, newRecord, this.metadata);
    } else if (normalizedUnit === "month") {
      const newInput = plugin.addMonths(this.record, amount);
      const newJDN = plugin.toJDN(newInput);
      newRecord = plugin.fromJDN(newJDN);

      // Handle overflow strategy for month arithmetic
      if (opts.overflow && this.record.day !== undefined) {
        newRecord = this.handleOverflow(
          this.record,
          newRecord,
          plugin,
          opts.overflow,
        );
      }
    } else if (normalizedUnit === "year") {
      const newInput = plugin.addYears(this.record, amount);
      const newJDN = plugin.toJDN(newInput);
      newRecord = plugin.fromJDN(newJDN);

      // Handle overflow strategy for year arithmetic
      if (opts.overflow && this.record.day !== undefined) {
        newRecord = this.handleOverflow(
          this.record,
          newRecord,
          plugin,
          opts.overflow,
        );
      }
    } else {
      throw new ValidationError(`Unsupported time unit: ${unit}`, [
        `Supported units: day, month, year`,
      ]);
    }

    // Convert back to JDN
    const newJDN = plugin.toJDN(newRecord);
    return new NeoDate(newJDN, this.calendar, newRecord, this.metadata);
  }

  subtract(
    amount: number,
    unit: TimeUnit,
    options?: ArithmeticOptions,
  ): NeoDate {
    return this.add(-amount, unit, options);
  }

  diff(other: NeoDate, options?: DiffOptions): NeoDuration {
    const daysDiff = Number(other.jdn - this.jdn);
    return new NeoDuration(daysDiff);
  }

  diffIn(other: NeoDate, unit: TimeUnit): number {
    const daysDiff = Number(other.jdn - this.jdn);
    const normalizedUnit = this.normalizeUnit(unit);

    if (normalizedUnit === "day") {
      return daysDiff;
    } else if (normalizedUnit === "week") {
      return daysDiff / 7;
    } else {
      // For month/year, use calendar-aware calculation
      // TODO: Implement proper calendar-aware diff
      return daysDiff;
    }
  }

  // ========== Comparison ==========

  isBefore(other: NeoDate): boolean {
    return this.jdn < other.jdn;
  }

  isAfter(other: NeoDate): boolean {
    return this.jdn > other.jdn;
  }

  equals(other: NeoDate): boolean {
    return this.jdn === other.jdn;
  }

  isSame(other: NeoDate): boolean {
    return this.equals(other);
  }

  isBetween(start: NeoDate, end: NeoDate, inclusive = true): boolean {
    if (inclusive) {
      return this.jdn >= start.jdn && this.jdn <= end.jdn;
    } else {
      return this.jdn > start.jdn && this.jdn < end.jdn;
    }
  }

  isContemporaryWith(other: NeoDate, tolerance = 0): boolean {
    // Calculate tolerance based on metadata
    let totalTolerance = tolerance;

    // Add precision-based tolerance
    if (this.metadata.precision === "year") {
      totalTolerance += 365;
    } else if (this.metadata.precision === "month") {
      totalTolerance += 30;
    }

    // Add circa tolerance (~50 years)
    if (this.metadata.circa) {
      totalTolerance += 18250; // ~50 years
    }

    // Add C14 error if present
    if (this.metadata.scientific?.c14) {
      totalTolerance += this.metadata.scientific.c14.error;
    }

    // Check if dates overlap within tolerance
    const diff = Math.abs(Number(this.jdn - other.jdn));
    return diff <= totalTolerance;
  }

  // ========== Metadata & Context ==========

  with(metadata: Partial<DateMetadata>): NeoDate;
  with(fields: Partial<DateInput>): NeoDate;
  with(input: Partial<DateMetadata> | Partial<DateInput>): NeoDate {
    // Check if it's metadata or date fields
    if (
      "circa" in input ||
      "uncertain" in input ||
      "precision" in input ||
      "approximate" in input ||
      "scientific" in input ||
      "diurnal" in input ||
      "unspecified" in input ||
      "range" in input ||
      "custom" in input
    ) {
      // Metadata update
      const newMetadata = { ...this.metadata, ...input } as DateMetadata;
      return new NeoDate(this.jdn, this.calendar, this.record, newMetadata);
    } else {
      // Date field update - cast to DateInput
      const dateInput = input as Partial<DateInput>;
      const plugin = Registry.get(this.calendar);

      // Build input with only defined values
      const updatedInput: DateInput = { year: dateInput.year ?? this.year };
      const month = dateInput.month ?? this.month;
      const day = dateInput.day ?? this.day;
      const era = dateInput.era ?? this.era;

      if (month !== undefined) {
        updatedInput.month = month as number;
      }
      if (day !== undefined) {
        updatedInput.day = day as number;
      }
      if (era !== undefined) {
        updatedInput.era = era as string;
      }

      const newJDN = plugin.toJDN(updatedInput);
      const newRecord = plugin.fromJDN(newJDN);
      return new NeoDate(newJDN, this.calendar, newRecord, this.metadata);
    }
  }

  // ========== Advanced Edge Case Methods ==========

  /**
   * Adjust this date to match the JDN of another date
   * Useful for synchronizing dates across calendars to the same absolute moment
   */
  sync(otherDate: NeoDate): NeoDate {
    // Convert to the other date's JDN, keeping current calendar context
    const plugin = Registry.get(this.calendar);
    const newRecord = plugin.fromJDN(otherDate.jdn);
    return new NeoDate(otherDate.jdn, this.calendar, newRecord, this.metadata);
  }

  /**
   * Detect if this date falls in a calendar gap (ambiguous/skipped days)
   * Example: October 5-14, 1582 in Gregorian calendar (skipped during adoption)
   */
  get isAmbiguous(): boolean {
    return this.record.isAmbiguous ?? false;
  }

  /**
   * Check if this date is being used proleptically (before calendar adoption)
   * Returns warning information if calendar is used outside its historical range
   */
  getProlepticallyWarning(): { isProleptic: boolean; warning?: string } | null {
    const plugin = Registry.get(this.calendar);
    const metadata = plugin.metadata;

    // Check if plugin has historical adoption information
    if (
      !metadata.historicalAdoptions ||
      metadata.historicalAdoptions.length === 0
    ) {
      return null;
    }

    // Find the earliest adoption date
    const earliestAdoption = metadata.historicalAdoptions[0];
    if (!earliestAdoption?.adoptionDate) {
      return null;
    }

    // Convert adoption date to JDN for comparison
    try {
      const adoptionJDN = plugin.toJDN(earliestAdoption.adoptionDate);

      if (this.jdn < adoptionJDN) {
        const { year, month, day } = earliestAdoption.adoptionDate;
        const region = earliestAdoption.region || "most regions";
        const replaced =
          earliestAdoption.replacedCalendar || "previous calendar";

        return {
          isProleptic: true,
          warning: `This date uses the ${metadata.name} calendar proleptically (before adoption in ${region} on ${year}-${month}-${day}). Historical accuracy may require using the ${replaced} calendar instead.`,
        };
      }
    } catch (error) {
      // If we can't determine the adoption JDN, skip the check
      return null;
    }

    return null;
  }

  /**
   * Get calendar suggestions based on geographic location and date
   * Helps users choose historically accurate calendar systems
   */
  getGeographicSuggestions(region?: string): Array<{
    calendar: CalendarSystemId;
    reason: string;
    priority: "primary" | "alternative";
  }> {
    const suggestions: Array<{
      calendar: CalendarSystemId;
      reason: string;
      priority: "primary" | "alternative";
    }> = [];

    // Gregorian adoption dates varied by region
    const gregorianAdoption = 2299161n; // Oct 15, 1582

    // Modern dates (after 1900) - Gregorian is standard globally
    const modern = 2415021n; // Jan 1, 1900
    if (this.jdn > modern) {
      suggestions.push({
        calendar: "GREGORIAN",
        reason: "Standard global calendar for modern dates",
        priority: "primary",
      });
      suggestions.push({
        calendar: "HOLOCENE",
        reason: "Scientific/archaeological dating",
        priority: "alternative",
      });
      return suggestions;
    }

    // Medieval/Renaissance Europe
    if (region === "europe" || region === undefined) {
      if (this.jdn < gregorianAdoption) {
        suggestions.push({
          calendar: "JULIAN",
          reason: "Standard calendar in Europe before 1582",
          priority: "primary",
        });
      } else {
        suggestions.push({
          calendar: "GREGORIAN",
          reason: "Standard calendar in Catholic Europe after 1582",
          priority: "primary",
        });
        suggestions.push({
          calendar: "JULIAN",
          reason: "Still used in some Orthodox regions until 1900s",
          priority: "alternative",
        });
      }
    }

    // Middle East / Islamic regions
    if (region === "middle-east" || region === "islamic") {
      suggestions.push({
        calendar: "ISLAMIC_CIVIL",
        reason: "Traditional calendar in Islamic regions",
        priority: "primary",
      });
      suggestions.push({
        calendar: "GREGORIAN",
        reason: "Administrative/international use",
        priority: "alternative",
      });
    }

    // Jewish communities
    if (region === "jewish") {
      suggestions.push({
        calendar: "HEBREW",
        reason: "Traditional Jewish calendar",
        priority: "primary",
      });
      suggestions.push({
        calendar: "GREGORIAN",
        reason: "Civil calendar",
        priority: "alternative",
      });
    }

    // Ancient dates - suggest archaeological calendars
    const ancient = 1721426n; // Jan 1, 1 CE
    if (this.jdn < ancient) {
      suggestions.push({
        calendar: "BP",
        reason: "Before Present - standard for ancient dates",
        priority: "primary",
      });
      suggestions.push({
        calendar: "JULIAN",
        reason: "Proleptic Julian calendar",
        priority: "alternative",
      });
    }

    return suggestions;
  }

  // ========== Interoperability ==========

  toJSDate(): Date {
    const gregorian = this.to("GREGORIAN");
    return new Date(
      gregorian.year,
      (gregorian.month ?? 1) - 1,
      gregorian.day ?? 1,
    );
  }

  toUnixTimestamp(): number {
    const unixDate = this.to("UNIX");
    return unixDate.year;
  }

  toJSON(): any {
    return {
      jdn: this.jdn.toString(),
      calendar: this.calendar,
      year: this.year,
      month: this.month,
      day: this.day,
      era: this.era,
      display: this.display,
      metadata: this.metadata,
    };
  }

  // ========== Static Factory Methods ==========

  /**
   * Create a NeoDate from a JDN and calendar context
   * @internal - Use NeoCalendar factory methods instead
   */
  static fromJDN(
    jdn: BrandedJDN,
    calendar: CalendarSystemId,
    metadata?: DateMetadata,
  ): NeoDate {
    const plugin = Registry.get(calendar);
    const record = plugin.fromJDN(jdn);
    return new NeoDate(jdn, calendar, record, metadata || {});
  }

  /**
   * Create a NeoDate from date input
   * @internal - Use NeoCalendar factory methods instead
   */
  static from(
    input: DateInput,
    calendar: CalendarSystemId,
    metadata?: DateMetadata,
  ): NeoDate {
    const plugin = Registry.get(calendar);
    const jdn = plugin.toJDN(input);
    const record = plugin.fromJDN(jdn);
    return new NeoDate(jdn, calendar, record, metadata || {});
  }

  // ========== Helper Methods ==========

  private normalizeUnit(unit: TimeUnit): "day" | "week" | "month" | "year" {
    const unitMap: Partial<
      Record<TimeUnit, "day" | "week" | "month" | "year">
    > = {
      day: "day",
      days: "day",
      week: "week",
      weeks: "week",
      month: "month",
      months: "month",
      year: "year",
      years: "year",
      // Note: hour/hours not supported in calendar-level arithmetic
    };

    const normalized = unitMap[unit];
    if (!normalized) {
      throw new ValidationError(`Invalid or unsupported time unit: ${unit}`, [
        "Supported units: day, days, week, weeks, month, months, year, years",
      ]);
    }

    return normalized;
  }

  /**
   * Handle overflow strategies for month/year arithmetic
   * @private
   */
  private handleOverflow(
    originalRecord: DateRecord,
    newRecord: DateRecord,
    plugin: any,
    strategy: "snap" | "overflow" | "strict",
  ): DateRecord {
    // If the day stayed the same or isn't defined, no overflow occurred
    if (
      originalRecord.day === undefined ||
      originalRecord.day === newRecord.day
    ) {
      return newRecord;
    }

    // Detect if overflow occurred (day changed unexpectedly)
    const overflow = originalRecord.day !== newRecord.day;

    if (!overflow) {
      return newRecord;
    }

    switch (strategy) {
      case "snap":
        // Already snapped by the plugin's addMonths/addYears
        return newRecord;

      case "overflow":
        // Calculate the overflow and add as days
        // This is already the default behavior from most plugins
        return newRecord;

      case "strict":
        throw new ValidationError(
          "Date arithmetic resulted in invalid date (overflow)",
          [
            `Original day: ${originalRecord.day}`,
            `Result day: ${newRecord.day}`,
            `Use overflow: 'snap' or 'overflow' to handle this case`,
          ],
        );

      default:
        return newRecord;
    }
  }
}
