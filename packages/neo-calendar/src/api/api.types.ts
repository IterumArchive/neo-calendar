/**
 * @file High-Level API Types
 * @description Type definitions for the NeoCalendar user-facing API layer
 *
 * This layer sits above the core plugin architecture and provides a fluent,
 * developer-friendly interface for working with dates across multiple calendar systems.
 *
 * Architecture: API Layer → Core Layer → Plugins
 *
 * CALENDAR CLASSIFICATION:
 * ========================
 *
 * ESSENTIAL CALENDARS (Auto-registered in @iterumarchive/neo-calendar):
 * - GREGORIAN: ISO 8601 / Gregorian calendar (global business standard)
 * - HOLOCENE: Holocene Era (HE) - the "Linear History" vision (core identity)
 * - UNIX: Unix timestamp (technical synchronization)
 * - JULIAN: Julian calendar (pre-1582 European history)
 *
 * EXTENSION CALENDARS (Available as separate plugins or in @iterumarchive/neo-calendar-full):
 * - ISLAMIC: Islamic/Hijri calendar (AH)
 * - HEBREW: Hebrew calendar (AM)
 * - MAYAN: Mayan Long Count (vigesimal system)
 * - BEFORE_PRESENT: Before Present (BP) - scientific dating
 * - COPTIC: Coptic Orthodox calendar (AM - Anno Martyrum)
 * - ETHIOPIAN: Ethiopian calendar (EE - Ethiopian Era)
 * - PERSIAN: Persian/Solar Hijri calendar (AP)
 * - FRENCH_REVOLUTIONARY: French Revolutionary calendar (ER)
 *
 * PACKAGE STRUCTURE:
 * - @iterumarchive/neo-calendar: Core API + Essentials (~20kb)
 * - @iterumarchive/neo-calendar-full: Core API + All Plugins (~150kb+)
 * - @iterumarchive/neo-calendar-core: Engine only (for custom implementations)
 * - @iterumarchive/neo-calendar-plugin-*: Individual plugins
 */

import type {
  BrandedJDN,
  CalendarSystemId,
  DateInput,
  DateRecord,
  EraLabel,
} from "@iterumarchive/neo-calendar-core";

// ============================================================================
// CORE API OBJECTS
// ============================================================================

/**
 * NeoDate - The primary user-facing date object
 *
 * Immutable object representing a moment in time. Internally anchored to a JDN,
 * but maintains a "home calendar" context for display and arithmetic.
 *
 * Design principles:
 * - Immutable: All operations return new instances
 * - JDN-anchored: Source of truth is always the JDN
 * - Calendar-aware: Remembers its context for formatting
 * - Metadata-rich: Can carry uncertainty, precision, and observational data
 */
export interface NeoDate {
  // ========== Core Identity ==========
  /** The Julian Day Number - immutable source of truth */
  readonly jdn: BrandedJDN;

  /** The "home" calendar system this date was created in or last converted to */
  readonly calendar: CalendarSystemId;

  /** The date representation in the home calendar */
  readonly record: DateRecord;

  // ========== Convenience Properties ==========
  /** Year component (convenience accessor for record.year) - always present */
  readonly year: number;

  /** Month component (convenience accessor for record.month) - may be undefined for year-only dates */
  readonly month: number | undefined;

  /** Day component (convenience accessor for record.day) - may be undefined for month-only dates */
  readonly day: number | undefined;

  /** Era label (convenience accessor for record.era) - may be undefined */
  readonly era: EraLabel | undefined;

  // ========== Display & Formatting ==========
  /** Auto-formatted display string using calendar metadata (e.g., "12026-03-18 HE") */
  readonly display: string;

  /** Custom format using token-based templates */
  format(template: string, options?: FormatOptions): string;

  /** Convert to ISO 8601 string (always uses Gregorian) */
  toISOString(): string;

  /** Convert to ISO 8601-2 extended format (with uncertainty markers) */
  toISO8601Extended(): string;

  // ========== Conversion & Translation ==========
  /**
   * Convert to another calendar system by era suffix
   * Returns a formatted string (e.g., "12024 HE")
   * @example date.to('HE') → "12024 HE"
   */
  to(
    eraSuffix: EraLabel,
    options?: { includeSuffix?: boolean; includeDate?: boolean },
  ): string;

  /**
   * Convert to multiple calendar systems by era suffixes
   * Returns an array of formatted strings
   * @example date.to(['HE', 'AD', 'OS']) → ["12024 HE", "2024 AD", "2024 OS"]
   */
  to(
    eraSuffixes: EraLabel[],
    options?: { includeSuffix?: boolean; includeDate?: boolean },
  ): string[];

  /**
   * Convert to another calendar system
   * Single calendar: Returns a new NeoDate in that system
   */
  to(calendarId: CalendarSystemId): NeoDate;

  /**
   * Convert to multiple calendar systems at once
   * Returns a map of calendar IDs to NeoDate objects
   */
  to(calendarIds: CalendarSystemId[]): Record<CalendarSystemId, NeoDate>;

  /**
   * Project this date across multiple calendars
   * Similar to to() but returns a structured ProjectionResult
   */
  project(calendarIds: CalendarSystemId[]): ProjectionResult;

  /**
   * Change the "home" calendar without changing the JDN
   * Subsequent arithmetic will use the new calendar's rules
   */
  as(calendarId: CalendarSystemId): NeoDate;

  // ========== Arithmetic ==========
  /**
   * Add a duration using the home calendar's rules
   * Units: 'year' | 'month' | 'day'
   */
  add(amount: number, unit: TimeUnit, options?: ArithmeticOptions): NeoDate;

  /**
   * Subtract a duration using the home calendar's rules
   */
  subtract(
    amount: number,
    unit: TimeUnit,
    options?: ArithmeticOptions,
  ): NeoDate;

  /**
   * Calculate the difference between two dates
   * Returns a NeoDuration object
   */
  diff(other: NeoDate, options?: DiffOptions): NeoDuration;

  /**
   * Calculate the distance in a specific unit
   */
  diffIn(other: NeoDate, unit: TimeUnit): number;

  // ========== Comparison ==========
  /** Check if this date is before another */
  isBefore(other: NeoDate): boolean;

  /** Check if this date is after another */
  isAfter(other: NeoDate): boolean;

  /** Check if this date equals another (same JDN) */
  equals(other: NeoDate): boolean;

  /** Alias for equals() - check if this date is the same as another */
  isSame(other: NeoDate): boolean;

  /** Check if this date is within a span/range */
  isBetween(start: NeoDate, end: NeoDate, inclusive?: boolean): boolean;

  /**
   * Check if two dates could be contemporary (accounting for uncertainty)
   *
   * This method considers:
   * - Precision levels (e.g., "year" precision gives ±365 day tolerance)
   * - Uncertainty markers (circa, uncertain)
   * - Explicit tolerance parameter (in days)
   * - Scientific dating errors (e.g., C14 ± error)
   *
   * @param other The date to compare with
   * @param tolerance Additional tolerance in days (added to uncertainty)
   * @returns true if the dates could plausibly overlap given their uncertainty
   *
   * @example
   * // Date A: "ca. 12000 HE" (circa, ±50 years)
   * // Date B: "12005 HE" (precise)
   * // Result: true (they overlap within uncertainty)
   */
  isContemporaryWith(other: NeoDate, tolerance?: number): boolean;

  // ========== Metadata & Context ==========
  /**
   * Create a new NeoDate with updated metadata
   * Useful for adding uncertainty, precision, or context markers
   */
  with(metadata: Partial<DateMetadata>): NeoDate;

  /**
   * Create a new NeoDate with updated date fields
   * Example: date.with({ month: 5, day: 1 })
   */
  with(fields: Partial<DateInput>): NeoDate;

  /** Get the metadata for this date */
  readonly metadata: DateMetadata;

  // ========== Interoperability ==========
  /** Convert to JavaScript Date object (Gregorian only, loses precision before 1970) */
  toJSDate(): Date;

  /** Convert to Unix timestamp (seconds since 1970-01-01) */
  toUnixTimestamp(): number;

  /** Convert to plain object for serialization */
  toJSON(): NeoDateJSON;
}

/**
 * Metadata that can be attached to a date
 * Based on ISO 8601-2:2019 extended features
 */
export interface DateMetadata {
  /** Date is approximate (circa, ~) */
  circa?: boolean;

  /** Date is uncertain (?) */
  uncertain?: boolean;

  /** Date is both approximate and uncertain (%) */
  approximate?: boolean;

  /** Precision level (year, month, day) */
  precision?: "century" | "decade" | "year" | "month" | "day";

  /** Unspecified digits (e.g., "120XX" for 12000-12099) */
  unspecified?: {
    year?: number; // Number of trailing X digits
    month?: boolean;
    day?: boolean;
  };

  /** Range instead of single date */
  range?: {
    start: NeoDate;
    end: NeoDate;
  };

  /** Diurnal boundary information (Level 0) */
  diurnal?: {
    /** When the calendar day begins */
    startsAt: "midnight" | "sunrise" | "sunset" | "noon";

    /** Flag if this date spans two Gregorian days */
    spansTwoDays?: boolean;

    /**
     * Whether the day start is observation-based (requires location context)
     * True for calendars like Hebrew/Islamic where sunset varies by location
     * False for fixed-time calendars like Gregorian (always midnight)
     */
    isObservationBased?: boolean;

    /**
     * The JDN fraction (0.0-1.0) when this calendar day begins
     * 0.0 = midnight, 0.5 = noon, ~0.75 = sunset (varies by location/season)
     * Only meaningful for fixed-time calendars (midnight, noon)
     */
    transitionFraction?: number;

    /**
     * Geographic context for observation-based transitions
     * When isObservationBased is true, this indicates the reference location
     */
    observationContext?: {
      /** Latitude in decimal degrees */
      latitude?: number;
      /** Longitude in decimal degrees */
      longitude?: number;
      /** Named location (e.g., "Jerusalem", "Mecca") */
      location?: string;
    };
  };

  /** Scientific dating context */
  scientific?: {
    /** Before Present (1950 AD reference) */
    bp?: number;
    /** Carbon-14 dating metadata */
    c14?: {
      age: number;
      error: number;
      labCode?: string;
    };
  };

  /** Custom user metadata */
  custom?: Record<string, unknown>;
}

/**
 * Formatting options
 */
export interface FormatOptions {
  /** Locale for month/era names */
  locale?: string;

  /** Include era label */
  showEra?: boolean;

  /** Show uncertainty markers */
  showUncertainty?: boolean;

  /** Custom separator */
  separator?: string;

  /** Padding for numbers */
  padded?: boolean;
}

/**
 * Arithmetic operation options
 */
export interface ArithmeticOptions {
  /**
   * Strategy for handling day overflow
   * - 'snap': Clamp to last valid day (Jan 31 + 1 month = Feb 28/29)
   * - 'overflow': Allow overflow (Jan 31 + 1 month = Mar 3)
   * - 'strict': Throw error on overflow
   */
  overflow?: "snap" | "overflow" | "strict";

  /**
   * Override the calendar system for this operation
   * By default, uses the home calendar's rules
   */
  calendar?: CalendarSystemId;

  /**
   * Preserve day of month or day of week
   * - 'month': Keep day number (e.g., 15th)
   * - 'week': Keep weekday (e.g., Monday)
   */
  preserve?: "month" | "week";

  /**
   * For month arithmetic, specify which month definition to use
   * Defaults to 'calendar' (uses the home calendar's month length)
   */
  monthType?: MonthType;
}

/**
 * Difference calculation options
 */
export interface DiffOptions {
  /** Unit to return the difference in */
  unit?: TimeUnit;

  /** Whether to return absolute value */
  absolute?: boolean;

  /** Whether to account for uncertainty */
  accountForUncertainty?: boolean;
}

/**
 * Time units for arithmetic and formatting
 *
 * IMPORTANT: "month" and "year" are calendar-specific:
 * - Gregorian month: 28-31 days
 * - Islamic month: 29-30 days (lunar)
 * - Mayan month (Uinal): fixed 20 days
 * - French Revolutionary month: fixed 30 days
 *
 * Use ArithmeticOptions.calendar to specify which calendar's rules to use
 */
export type TimeUnit =
  | "year"
  | "years"
  | "month"
  | "months"
  | "week"
  | "weeks"
  | "day"
  | "days"
  | "hour"
  | "hours";

/**
 * Month types for duration calculations
 * Allows explicit distinction between different month definitions
 */
export type MonthType =
  | "calendar" // Use the active calendar's month definition
  | "solar" // Average solar month (30.436875 days)
  | "lunar" // Average synodic month (29.53059 days)
  | "standardized"; // Fixed 30-day month

/**
 * Result of projecting a date across multiple calendars
 */
export interface ProjectionResult {
  /** The source date that was projected */
  source: NeoDate;

  /** Map of calendar IDs to their representations */
  calendars: Record<CalendarSystemId, DateRecord>;

  /** Array format for easier iteration */
  toArray(): Array<{ calendar: CalendarSystemId; record: DateRecord }>;

  /** Check if all projections are valid */
  allValid(): boolean;
}

/**
 * Serializable representation of a NeoDate
 */
export interface NeoDateJSON {
  jdn: string; // Serialized BigInt
  calendar: CalendarSystemId;
  year: number;
  month?: number;
  day?: number;
  era?: EraLabel;
  display: string;
  metadata?: DateMetadata;
}

// ============================================================================
// DURATION & SPAN OBJECTS
// ============================================================================

/**
 * NeoDuration - Represents a length of time
 *
 * Unlike a date, a duration is relative and can be expressed in
 * different calendar systems (e.g., "3 lunar months" vs "3 solar months").
 *
 * KEY CONCEPT: Duration interpretation is calendar-dependent:
 * - "1 month" in Gregorian: 28-31 days (variable)
 * - "1 month" in Islamic: 29-30 days (lunar)
 * - "1 month" in Mayan: exactly 20 days (Uinal)
 * - "1 month" standardized: exactly 30 days
 *
 * Use toMonths(calendar) and toYears(calendar) to specify which
 * calendar's definition to use for conversion.
 */
export interface NeoDuration {
  /** Total duration in days (normalized) */
  readonly days: number;

  /** Convert to specific unit */
  toDays(): number;
  toWeeks(): number;
  toMonths(calendar?: CalendarSystemId): number;
  toYears(calendar?: CalendarSystemId): number;

  /** ISO 8601 duration string (e.g., "P3Y6M4D") */
  toISODuration(): string;

  /** Breakdown into components */
  toComponents(calendar?: CalendarSystemId): DurationComponents;

  /** Arithmetic with other durations */
  add(other: NeoDuration): NeoDuration;
  subtract(other: NeoDuration): NeoDuration;
  multiply(factor: number): NeoDuration;
  divide(divisor: number): NeoDuration;

  /** Comparison */
  equals(other: NeoDuration): boolean;
  isLongerThan(other: NeoDuration): boolean;
  isShorterThan(other: NeoDuration): boolean;
}

/**
 * Duration broken down into components
 */
export interface DurationComponents {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
}

/**
 * NeoSpan - Represents an interval between two dates
 *
 * Essential for historical periods (reigns, wars, dynasties)
 */
export interface NeoSpan {
  /** Start date of the span */
  readonly start: NeoDate;

  /** End date of the span */
  readonly end: NeoDate;

  /** Duration of the span */
  readonly duration: NeoDuration;

  /** Get the midpoint of the span */
  midpoint(): NeoDate;

  /** Check if a date falls within this span */
  contains(date: NeoDate, inclusive?: boolean): boolean;

  /** Check if two spans overlap */
  intersects(other: NeoSpan): boolean;

  /** Get the intersection of two spans */
  intersection(other: NeoSpan): NeoSpan | null;

  /** Get the gap between two spans */
  gap(other: NeoSpan): NeoDuration | null;

  /** Check if spans are adjacent (no gap) */
  isAdjacentTo(other: NeoSpan): boolean;

  /** Convert the span to a specific calendar */
  to(calendar: CalendarSystemId): NeoSpan;

  /** Format the span */
  format(template: string): string;
}

/**
 * NeoSeries - Represents a lazy sequence of dates
 *
 * IMPORTANT: NeoSeries is LAZY by design to prevent memory issues
 * when working with large historical spans (e.g., "every day for 5000 years").
 *
 * Dates are generated on-demand during iteration. Use take() or limit()
 * before converting to an array to avoid memory overflows.
 *
 * Useful for generating recurring dates or historical markers.
 */
export interface NeoSeries {
  /**
   * Generate all dates in the series as an array
   *
   * WARNING: This eagerly evaluates the entire series.
   * For large series, use take() or limit() first to prevent memory issues.
   *
   * @throws Error if series exceeds reasonable memory bounds
   */
  toArray(): NeoDate[];

  /**
   * Lazy iterator over dates
   * Generates dates on-demand, memory-efficient for large series
   */
  [Symbol.iterator](): Iterator<NeoDate>;

  /**
   * Get the nth date in the series (0-indexed)
   * Does not generate all intermediate dates
   */
  nth(n: number): NeoDate | null;

  /**
   * Count total dates in the series
   * For infinite series, returns Infinity
   */
  count(): number;

  /**
   * Limit the series to the first n dates
   * Returns a new lazy series
   *
   * @example
   * series.take(100).toArray() // Safe: only 100 dates
   */
  take(n: number): NeoSeries;

  /**
   * Alias for take() - limit to n dates
   * Returns a new lazy series
   */
  limit(n: number): NeoSeries;

  /**
   * Skip the first n dates
   * Returns a new lazy series
   */
  skip(n: number): NeoSeries;

  /**
   * Filter the series (maintains laziness)
   * Returns a new lazy series
   */
  filter(predicate: (date: NeoDate) => boolean): NeoSeries;

  /**
   * Map the series (eager evaluation)
   * For large series, use take() first
   */
  map<T>(fn: (date: NeoDate) => T): T[];

  /**
   * Check if the series is potentially infinite
   */
  isInfinite(): boolean;
}

// ============================================================================
// FACTORY & PARSER TYPES
// ============================================================================

/**
 * Options for the NeoCalendar factory
 */
export interface NeoCalendarOptions {
  /** Default calendar system for ambiguous inputs */
  defaultCalendar?: CalendarSystemId;

  /** Strict mode (throw errors vs return warnings) */
  strict?: boolean;

  /** Default metadata for all created dates */
  defaultMetadata?: Partial<DateMetadata>;

  /** Locale for parsing/formatting */
  locale?: string;
}

/**
 * Parse result with potential errors/warnings
 */
export interface ParseResult {
  /** Successfully parsed date (null if failed) */
  date: NeoDate | null;

  /** Whether parsing was successful */
  success: boolean;

  /** Errors that prevented parsing */
  errors: string[];

  /** Warnings (e.g., ambiguous input, assumed values) */
  warnings: string[];

  /** Detected calendar system */
  detectedCalendar?: CalendarSystemId;

  /** Confidence level (0-1) */
  confidence?: number;
}

/**
 * Options for span creation
 */
export interface SpanOptions {
  /** Whether to include the end date */
  inclusive?: boolean;

  /** Validate that start is before end */
  validate?: boolean;
}

/**
 * Options for series generation
 */
export interface SeriesOptions {
  /** Interval between dates */
  every: {
    amount: number;
    unit: TimeUnit;
  };

  /** Maximum number of dates to generate */
  limit?: number;

  /** Calendar system to use for interval calculation */
  calendar?: CalendarSystemId;

  /** Filter function */
  filter?: (date: NeoDate) => boolean;
}

/**
 * Input types that can be converted to NeoDate
 */
export type NeoDateInput =
  | NeoDate
  | DateInput
  | Date
  | number // Unix timestamp
  | bigint // JDN
  | string // Parseable string
  | { jdn: BrandedJDN; calendar: CalendarSystemId };

// ============================================================================
// CALENDAR REGISTRY
// ============================================================================

/**
 * CalendarRegistry - Manages plugin registration and discovery
 *
 * The registry is the central hub for calendar plugins. It handles:
 * - Plugin registration and unregistration
 * - Calendar lookup by ID
 * - Era detection across all registered calendars
 * - Auto-registration of essential calendars
 */
export interface CalendarRegistry {
  /**
   * Register a calendar plugin
   * @throws Error if a plugin with the same ID is already registered
   */
  register(plugin: unknown): void; // BaseCalendarPlugin from core

  /**
   * Unregister a calendar plugin
   * @returns true if plugin was found and removed
   */
  unregister(id: CalendarSystemId): boolean;

  /**
   * Get a registered calendar plugin
   * @throws Error if calendar is not registered
   */
  get(id: CalendarSystemId): unknown; // BaseCalendarPlugin from core

  /**
   * Check if a calendar is registered
   */
  has(id: CalendarSystemId): boolean;

  /**
   * List all registered calendar IDs
   */
  list(): CalendarSystemId[];

  /**
   * Get metadata for all registered calendars
   */
  listAll(): Array<{ id: CalendarSystemId; name: string; aliases: string[] }>;

  /**
   * Find calendars that support a specific era marker
   * Example: findByEra('HE') -> [HOLOCENE]
   */
  findByEra(era: string): CalendarSystemId[];

  /**
   * Get all registered era markers
   * Returns a list of all era abbreviations from all registered calendars
   */
  getAllEras(): string[];

  /**
   * Clear all registered calendars (useful for testing)
   */
  clear(): void;
}

// ============================================================================
// STATIC FACTORY INTERFACE
// ============================================================================

/**
 * Static factory methods for creating NeoDate objects
 * This is the primary entry point for users
 */
export interface NeoCalendarFactory {
  // ========== Creation Methods ==========

  /**
   * Create a date with explicit calendar and fields
   * Example: NeoCalendar.at(2024, 3, 18, 'GREGORIAN')
   */
  at(
    year: number,
    month: number,
    day: number,
    calendar: CalendarSystemId,
  ): NeoDate;

  /**
   * Create from DateInput object
   * Example: NeoCalendar.from({ year: 12026, month: 3, day: 18, era: 'HE' }, 'HOLOCENE')
   */
  from(input: DateInput, calendar: CalendarSystemId): NeoDate;

  /**
   * Create from Julian Day Number
   */
  fromJDN(jdn: BrandedJDN, calendar?: CalendarSystemId): NeoDate;

  /**
   * Create from JavaScript Date object
   */
  fromJSDate(date: Date): NeoDate;

  /**
   * Create from Unix timestamp (seconds or milliseconds)
   */
  fromUnix(timestamp: number, isMilliseconds?: boolean): NeoDate;

  /**
   * Get current date/time
   */
  now(calendar?: CalendarSystemId): NeoDate;

  // ========== Parsing Methods ==========

  /**
   * Parse a date string with automatic calendar detection
   * Example: NeoCalendar.parse("12026-03-18 HE")
   *
   * Detects era markers and routes to appropriate calendar
   */
  parse(input: string, options?: ParseOptions): ParseResult;

  /**
   * Parse a date string with explicit calendar
   */
  parseWith(
    input: string,
    calendar: CalendarSystemId,
    options?: ParseOptions,
  ): ParseResult;

  // ========== Span & Series Methods ==========

  /**
   * Create a span between two dates
   */
  span(start: NeoDateInput, end: NeoDateInput, options?: SpanOptions): NeoSpan;

  /**
   * Generate a series of dates
   */
  series(
    start: NeoDateInput,
    end: NeoDateInput,
    options: SeriesOptions,
  ): NeoSeries;

  // ========== Utility Methods ==========

  /**
   * Check if a value can be converted to a NeoDate
   */
  isValid(input: unknown): boolean;

  /**
   * Configure global options
   */
  configure(options: Partial<NeoCalendarOptions>): void;

  /**
   * Get current configuration
   */
  getConfig(): NeoCalendarOptions;

  /**
   * Access the calendar registry
   * Allows users to register custom plugins
   */
  registry: CalendarRegistry;

  /**
   * Register a custom calendar plugin
   * Convenience method that delegates to registry.register()
   */
  register(plugin: unknown): void; // BaseCalendarPlugin from core
}

/**
 * Options for parsing
 */
export interface ParseOptions {
  /** Strict mode (throw on parse errors) */
  strict?: boolean;

  /** Default calendar if detection fails */
  defaultCalendar?: CalendarSystemId;

  /** Locale for month/era names */
  locale?: string;

  /** Whether to parse uncertainty markers (~, ?, %) */
  parseUncertainty?: boolean;

  /** Whether to parse ranges */
  parseRanges?: boolean;
}

// ============================================================================
// CONVENIENCE TYPE ALIASES
// ============================================================================

/**
 * Result of a date operation that might fail
 */
export type DateOperationResult<T> =
  | { success: true; value: T; warnings?: string[] }
  | { success: false; errors: string[]; warnings?: string[] };

/**
 * Callback for filtering/mapping dates
 */
export type DatePredicate = (date: NeoDate) => boolean;
export type DateMapper<T> = (date: NeoDate) => T;

/**
 * Comparison function for sorting dates
 */
export type DateComparator = (a: NeoDate, b: NeoDate) => number;
