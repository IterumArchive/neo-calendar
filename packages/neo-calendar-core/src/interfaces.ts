/**
 * @file Neo Calendar Core Interfaces
 * @description Pure interfaces for calendar conversion engine
 *
 * NO IMPLEMENTATIONS - only contracts.
 * These define HOW the ontology types interact.
 *
 * Architecture:
 * - ICalendarPlugin: Calendar-specific conversion logic
 * - IDateConverter: Universal JDN ↔ DateRecord conversion
 * - ICalendarRegistry: Plugin management
 * - IDurationCalculator: Calendar-aware arithmetic
 *
 * DESIGN PHILOSOPHY:
 *
 * **Proleptic by Design:**
 * This engine is PROLEPTIC - it calculates what a calendar *would* have said,
 * even before it existed. This is mathematically valid but historically
 * anachronistic. "January 1, 1000 BC in Gregorian" is a valid calculation
 * even though Gregorian didn't exist until 1582 CE.
 *
 * **Administrative Irregularities:**
 * Calendar systems have TWO types of complexity:
 *
 * 1. **Algorithmic** (handled in plugin logic):
 *    - Leap year rules (Gregorian 4/100/400)
 *    - Intercalation patterns (Hebrew Metonic cycle)
 *    - Month lengths (Islamic alternating 29/30)
 *
 * 2. **Administrative** (handled via plugin metadata/lookup tables):
 *    - Historical adoption dates (Oct 1582 switch)
 *    - Postponements (Hebrew dehiyyot)
 *    - Political adjustments (Swedish 1700-1712)
 *    - Regional variations (different adoption dates)
 *
 * Plugins CAN include lookup tables or conditional logic for administrative
 * irregularities, but the core interfaces remain purely mathematical.
 *
 * **Extensibility:**
 * Users can create custom calendar variants by:
 * - Implementing ICalendarPlugin
 * - Extending existing plugins
 * - Registering custom calendars
 * - Overriding specific rules
 */

import type {
  JDN,
  BrandedJDN,
  CalendarSystemId,
  CalendarSystem,
  DateInput,
  DateRecord,
  Duration,
  DurationUnit,
  ConversionStrategy,
  DateComparison,
  ValidationResult,
  ConstraintViolation,
  SimultaneousDate,
  EraLabel,
  DiurnalStart,
  AstronomicalBasis,
} from "./ontology.types.js";

// ============================================================================
// CALENDAR PLUGIN INTERFACE
// ============================================================================

/**
 * Core plugin interface - the "spoke" in hub-and-spoke architecture.
 *
 * Every calendar system must implement this interface to convert between
 * JDN (the hub) and calendar-specific date representations (the skin).
 *
 * CRITICAL: Plugins are STATELESS. All operations are pure functions.
 * Same JDN always produces same DateRecord.
 */
export interface ICalendarPlugin {
  // ============================================================================
  // IDENTITY
  // ============================================================================

  /**
   * Calendar system identifier (must be unique)
   */
  readonly id: CalendarSystemId;

  /**
   * Complete calendar system definition
   */
  readonly metadata: CalendarSystem;

  /**
   * Optional list of supported era labels for era-driven calendar selection
   * If not provided, falls back to metadata.eraSystem.labels
   */
  readonly eras?: readonly EraLabel[];

  // ============================================================================
  // CORE CONVERSIONS (The Hub-and-Spoke)
  // ============================================================================

  /**
   * Convert FROM calendar-specific date TO JDN (The Hub)
   *
   * This is the "spoke to hub" transformation.
   *
   * @param input - Calendar-specific date (year, month, day, era)
   * @returns JDN - Universal day count
   * @throws CalendarError if date is invalid
   *
   * @example
   * ```ts
   * gregorian.toJDN({ year: 2024, month: 3, day: 18, era: "CE" })
   * // Returns: 2460390n
   * ```
   */
  toJDN(input: DateInput): BrandedJDN;

  /**
   * Convert FROM JDN TO calendar-specific date (The Skin)
   *
   * This is the "hub to spoke" transformation.
   *
   * @param jdn - Universal day count
   * @returns DateRecord - Complete calendar-specific representation
   *
   * @example
   * ```ts
   * gregorian.fromJDN(2460390n)
   * // Returns: { year: 2024, month: 3, day: 18, era: "CE", ... }
   * ```
   */
  fromJDN(jdn: BrandedJDN): DateRecord;

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate date input before conversion
   *
   * @param input - Date to validate
   * @returns Validation result with errors/warnings
   *
   * @example
   * ```ts
   * gregorian.validate({ year: 2024, month: 2, day: 30 })
   * // Returns: { isValid: false, errors: ["February has 29 days in 2024"] }
   * ```
   */
  validate(input: DateInput): ValidationResult;

  /**
   * Check if date is valid (quick boolean check)
   *
   * @param input - Date to check
   * @returns true if valid, false otherwise
   */
  isValid(input: DateInput): boolean;

  /**
   * Normalize invalid date to closest valid date
   *
   * @param input - Potentially invalid date
   * @param strategy - How to handle invalid dates
   * @returns Normalized DateInput
   *
   * @example
   * ```ts
   * // February 30 doesn't exist - snap to Feb 28/29
   * gregorian.normalize({ year: 2024, month: 2, day: 30 }, "snap")
   * // Returns: { year: 2024, month: 2, day: 29 }
   * ```
   */
  normalize(input: DateInput, strategy: ConversionStrategy): DateInput;

  // ============================================================================
  // CALENDAR-SPECIFIC QUERIES
  // ============================================================================

  /**
   * Is this a leap year?
   *
   * @param year - Year to check
   * @returns true if leap year, false otherwise
   */
  isLeapYear(year: number): boolean;

  /**
   * How many days in this month?
   *
   * @param year - Year
   * @param month - Month number
   * @returns Number of days in month
   */
  daysInMonth(year: number, month: number): number;

  /**
   * How many days in this year?
   *
   * @param year - Year
   * @returns Total days in year (365 or 366 typically)
   */
  daysInYear(year: number): number;

  /**
   * How many months in this year?
   *
   * @param year - Year
   * @returns Number of months (12 typically, 13 for lunisolar leap years)
   */
  monthsInYear(year: number): number;

  // ============================================================================
  // DIURNAL BOUNDARY (Level 0)
  // ============================================================================

  /**
   * When does this calendar's day begin?
   *
   * @returns Diurnal start convention
   *
   * @example
   * ```ts
   * gregorian.getDiurnalStart() // Returns: "midnight"
   * hebrew.getDiurnalStart()    // Returns: "sunset"
   * ```
   */
  getDiurnalStart(): DiurnalStart;

  /**
   * Get diurnal boundary offset in fractional days from midnight
   *
   * Used for calendars that don't start at midnight.
   *
   * @returns Offset from midnight (0.0 = midnight, 0.5 = noon, ~0.75 = sunset)
   *
   * **Precision Note:**
   * Returns a `number` (IEEE 754 float) which provides ~15 decimal digits of
   * precision - sufficient for civil day boundaries:
   * - 0.75 = 18:00 ± ~1 millisecond
   * - 0.5 = 12:00 (exact)
   *
   * This precision is adequate for determining which calendar day an event
   * belongs to. For high-precision astronomical timing (eclipses, transits),
   * use separate time-of-day representation layered on top of JDN.
   *
   * **Future Consideration:**
   * If sub-millisecond boundary precision becomes necessary, consider:
   * - Returning offset in milliseconds (integer): `number` (0-86400000)
   * - Returning offset in nanoseconds (bigint): `bigint` (0n-86400000000000n)
   * - Adding separate astronomical timing interface
   *
   * @example
   * ```ts
   * gregorian.getDiurnalOffset() // Returns: 0.0 (midnight)
   * hebrew.getDiurnalOffset()    // Returns: 0.75 (approx sunset, ~18:00)
   * julian_astronomical.getDiurnalOffset() // Returns: 0.5 (noon, exact)
   * ```
   */
  getDiurnalOffset(): number;

  // ============================================================================
  // ERA HANDLING
  // ============================================================================

  /**
   * Resolve era label to calendar-specific year representation
   *
   * Handles complex era systems:
   * - Simple multiplier (Gregorian BC/AD)
   * - Era epochs (Japanese Nengō, Regnal years)
   * - Era offsets (Islamic AH, Hebrew AM)
   *
   * @param year - Display year (as written in calendar)
   * @param era - Era label
   * @returns Resolved era information for JDN calculation
   *
   * @example
   * ```ts
   * // Gregorian: simple multiplier
   * gregorian.resolveEra(500, "BC")
   * // Returns: { astronomicalYear: -499, displayYear: 500, eraStart: ... }
   *
   * // Japanese: era offset
   * japanese.resolveEra(6, "Reiwa")
   * // Returns: { astronomicalYear: 2024, displayYear: 6, eraStart: JDN(2458605) }
   * ```
   */
  resolveEra(
    year: number,
    era: EraLabel,
  ): {
    /** Year for JDN calculation (astronomical numbering) */
    astronomicalYear: number;
    /** Year for display (as written in calendar) */
    displayYear: number;
    /** JDN when this era began */
    eraStart: BrandedJDN;
    /** Era label */
    era: EraLabel;
  };

  /**
   * Get era label for a given astronomical year
   *
   * @param year - Astronomical year (can be negative)
   * @returns Era label
   *
   * @example
   * ```ts
   * gregorian.eraLabel(-500) // Returns: "BC"
   * gregorian.eraLabel(2024) // Returns: "CE"
   * ```
   */
  eraLabel(year: number): EraLabel;

  // ============================================================================
  // ARITHMETIC SUPPORT (Required for Duration)
  // ============================================================================

  /**
   * Add months to a date (calendar-aware)
   *
   * CRITICAL: This CANNOT use constant month lengths.
   * Must call toJDN with adjusted month value.
   *
   * @param input - Starting date
   * @param months - Number of months to add (can be negative)
   * @returns New date after adding months
   *
   * @example
   * ```ts
   * // January 31 + 1 month = February 28/29 (snap to valid date)
   * gregorian.addMonths({ year: 2024, month: 1, day: 31 }, 1)
   * // Returns: { year: 2024, month: 2, day: 29 } (2024 is leap year)
   * ```
   */
  addMonths(input: DateInput, months: number): DateInput;

  /**
   * Add years to a date (calendar-aware)
   *
   * @param input - Starting date
   * @param years - Number of years to add (can be negative)
   * @returns New date after adding years
   *
   * @example
   * ```ts
   * // February 29 + 1 year = February 28 (if not leap year)
   * gregorian.addYears({ year: 2024, month: 2, day: 29 }, 1)
   * // Returns: { year: 2025, month: 2, day: 28 }
   * ```
   */
  addYears(input: DateInput, years: number): DateInput;

  /**
   * Calculate duration between two dates in calendar-specific units
   *
   * @param start - Starting date
   * @param end - Ending date
   * @param unit - Unit to express duration in
   * @returns Duration in requested unit
   *
   * @example
   * ```ts
   * gregorian.durationBetween(
   *   { year: 2024, month: 1, day: 1 },
   *   { year: 2024, month: 4, day: 1 },
   *   "months"
   * )
   * // Returns: { days: 91, originalUnit: "months", originalValue: 3, ... }
   * ```
   */
  durationBetween(
    start: DateInput,
    end: DateInput,
    unit: DurationUnit,
  ): Duration;
}

// ============================================================================
// DATE CONVERTER INTERFACE (The Hub)
// ============================================================================

/**
 * Universal date converter - operates on JDN hub.
 *
 * This is the "traffic controller" that coordinates plugin conversions.
 * All cross-calendar operations flow through here.
 */
export interface IDateConverter {
  /**
   * Convert date from one calendar to another
   *
   * @param input - Source date
   * @param fromCalendar - Source calendar system
   * @param toCalendar - Target calendar system
   * @returns Converted date in target calendar
   *
   * @example
   * ```ts
   * converter.convert(
   *   { year: 2024, month: 3, day: 18 },
   *   "GREGORIAN",
   *   "HEBREW"
   * )
   * // Returns: { year: 5784, month: 13, day: 8, era: "AM", ... }
   * ```
   */
  convert(
    input: DateInput,
    fromCalendar: CalendarSystemId,
    toCalendar: CalendarSystemId,
  ): DateRecord;

  /**
   * Get simultaneous representation across multiple calendars
   *
   * @param jdn - Universal day count
   * @param calendars - Which calendars to represent in
   * @param options - Display options
   * @returns Same moment in all requested calendars
   *
   * @example
   * ```ts
   * converter.simultaneousView(
   *   2460390n,
   *   ["GREGORIAN", "HEBREW", "ISLAMIC"],
   *   { sort: "alphabetical" }
   * )
   * // Returns: Map with all three calendar representations, sorted by ID
   * ```
   */
  simultaneousView(
    jdn: BrandedJDN,
    calendars: CalendarSystemId[],
    options?: {
      /** How to order results (default: input order) */
      sort?: "input-order" | "alphabetical" | "registration-order";
    },
  ): SimultaneousDate;

  /**
   * Create date from JDN in specific calendar
   *
   * @param jdn - Universal day count
   * @param calendar - Target calendar system
   * @returns Date in requested calendar
   */
  fromJDN(jdn: BrandedJDN, calendar: CalendarSystemId): DateRecord;

  /**
   * Convert date to JDN
   *
   * @param input - Date in any calendar
   * @param calendar - Which calendar this date is in
   * @returns Universal day count
   */
  toJDN(input: DateInput, calendar: CalendarSystemId): BrandedJDN;
}

// ============================================================================
// CALENDAR REGISTRY INTERFACE
// ============================================================================

/**
 * Plugin registry - manages calendar system plugins.
 *
 * This is the "map" that connects calendar IDs to plugin implementations.
 */
export interface ICalendarRegistry {
  /**
   * Register a calendar plugin
   *
   * @param plugin - Calendar plugin to register
   * @throws RegistryError if calendar ID already registered
   */
  register(plugin: ICalendarPlugin): void;

  /**
   * Get calendar plugin by ID
   *
   * @param id - Calendar system identifier
   * @returns Calendar plugin
   * @throws RegistryError if calendar not found
   */
  get(id: CalendarSystemId): ICalendarPlugin;

  /**
   * Check if calendar is registered
   *
   * @param id - Calendar system identifier
   * @returns true if registered, false otherwise
   */
  has(id: CalendarSystemId): boolean;

  /**
   * Get all registered calendar IDs
   *
   * @returns Array of calendar system IDs
   */
  list(): CalendarSystemId[];

  /**
   * Get all registered plugins
   *
   * @returns Array of calendar plugins
   */
  all(): ICalendarPlugin[];

  /**
   * Unregister a calendar plugin
   *
   * @param id - Calendar system identifier
   */
  unregister(id: CalendarSystemId): void;

  /**
   * Clear all registered plugins
   */
  clear(): void;

  /**
   * Get all calendars with specific astronomical basis
   *
   * @param basis - Astronomical basis to filter by
   * @returns Array of matching calendar plugins
   *
   * @example
   * ```ts
   * registry.getByBasis("lunar")
   * // Returns: [IslamicPlugin, ...]
   * ```
   */
  getByBasis(basis: AstronomicalBasis): ICalendarPlugin[];

  /**
   * Get all calendars used in a specific region
   *
   * @param region - Geographic region
   * @returns Array of matching calendar plugins
   *
   * @example
   * ```ts
   * registry.getByRegion("Middle East")
   * // Returns: [IslamicPlugin, PersianPlugin, HebrewPlugin, ...]
   * ```
   */
  getByRegion(region: string): ICalendarPlugin[];

  /**
   * Get all calendars used for a specific purpose
   *
   * @param usage - Usage type
   * @returns Array of matching calendar plugins
   *
   * @example
   * ```ts
   * registry.getByUsage("religious")
   * // Returns: [HebrewPlugin, IslamicPlugin, CopticPlugin, ...]
   * ```
   */
  getByUsage(
    usage: "civil" | "religious" | "scientific" | "historical",
  ): ICalendarPlugin[];
}

// ============================================================================
// DURATION CALCULATOR INTERFACE
// ============================================================================

/**
 * Calendar-aware duration calculator.
 *
 * CRITICAL: Duration arithmetic MUST use calendar plugin conversion,
 * NOT constant month/year lengths.
 */
export interface IDurationCalculator {
  /**
   * Create duration from value and unit
   *
   * @param value - Numeric value
   * @param unit - Duration unit
   * @param calendar - Calendar context (required for variable units)
   * @returns Duration object
   *
   * @example
   * ```ts
   * calculator.create(3, "months", "GREGORIAN")
   * // Returns: Duration with calendar context
   * ```
   */
  create(
    value: number,
    unit: DurationUnit,
    calendar?: CalendarSystemId,
  ): Duration;

  /**
   * Convert duration to different unit
   *
   * @param duration - Source duration
   * @param targetUnit - Unit to convert to
   * @param referenceDate - Reference date for variable conversions
   * @returns Duration in new unit
   *
   * @example
   * ```ts
   * // 3 months from January = 90 days
   * // 3 months from August = 92 days
   * calculator.convert(
   *   { days: 90, originalUnit: "months", originalValue: 3 },
   *   "days",
   *   { year: 2024, month: 1, day: 1 }
   * )
   * ```
   */
  convert(
    duration: Duration,
    targetUnit: DurationUnit,
    referenceDate?: DateInput,
  ): Duration;

  /**
   * Add duration to date
   *
   * @param date - Starting date
   * @param duration - Duration to add
   * @param calendar - Calendar system
   * @returns New date after adding duration
   */
  add(
    date: DateInput,
    duration: Duration,
    calendar: CalendarSystemId,
  ): DateInput;

  /**
   * Subtract duration from date
   *
   * @param date - Starting date
   * @param duration - Duration to subtract
   * @param calendar - Calendar system
   * @returns New date after subtracting duration
   */
  subtract(
    date: DateInput,
    duration: Duration,
    calendar: CalendarSystemId,
  ): DateInput;

  /**
   * Calculate duration between two dates
   *
   * @param start - Starting date
   * @param end - Ending date
   * @param calendar - Calendar system
   * @param unit - Unit to express result in
   * @returns Duration between dates
   */
  between(
    start: DateInput,
    end: DateInput,
    calendar: CalendarSystemId,
    unit: DurationUnit,
  ): Duration;
}

// ============================================================================
// DATE COMPARATOR INTERFACE
// ============================================================================

/**
 * Date comparison operations.
 *
 * All comparisons operate on JDN level (universal comparison).
 */
export interface IDateComparator {
  /**
   * Compare two dates
   *
   * @param date1 - First date
   * @param calendar1 - Calendar of first date
   * @param date2 - Second date
   * @param calendar2 - Calendar of second date
   * @returns Comparison result
   */
  compare(
    date1: DateInput,
    calendar1: CalendarSystemId,
    date2: DateInput,
    calendar2: CalendarSystemId,
  ): DateComparison;

  /**
   * Check if date1 is before date2
   */
  isBefore(
    date1: DateInput,
    calendar1: CalendarSystemId,
    date2: DateInput,
    calendar2: CalendarSystemId,
  ): boolean;

  /**
   * Check if date1 is after date2
   */
  isAfter(
    date1: DateInput,
    calendar1: CalendarSystemId,
    date2: DateInput,
    calendar2: CalendarSystemId,
  ): boolean;

  /**
   * Check if dates are equal (same JDN)
   */
  isEqual(
    date1: DateInput,
    calendar1: CalendarSystemId,
    date2: DateInput,
    calendar2: CalendarSystemId,
  ): boolean;

  /**
   * Check if date is between two other dates (inclusive)
   */
  isBetween(
    date: DateInput,
    calendar: CalendarSystemId,
    start: DateInput,
    startCalendar: CalendarSystemId,
    end: DateInput,
    endCalendar: CalendarSystemId,
    inclusive?: boolean,
  ): boolean;
}

// ============================================================================
// DATE FORMATTER INTERFACE
// ============================================================================

/**
 * Date formatting and display.
 *
 * NOTE: This is a simplified interface. Full localization should be
 * delegated to specialized libraries (ICU, Intl.DateTimeFormat).
 */
export interface IDateFormatter {
  /**
   * Format date as string using calendar's default convention
   *
   * @param date - Date to format
   * @returns Formatted string
   *
   * @example
   * ```ts
   * formatter.format({ year: 2024, month: 3, day: 18, calendar: "GREGORIAN" })
   * // Returns: "2024-03-18 CE"
   * ```
   */
  format(date: DateRecord): string;

  /**
   * Format date using custom pattern
   *
   * @param date - Date to format
   * @param pattern - Format pattern (ISO 8601-like)
   * @returns Formatted string
   *
   * @example
   * ```ts
   * formatter.formatCustom(date, "YYYY-MM-DD")
   * // Returns: "2024-03-18"
   * ```
   */
  formatCustom(date: DateRecord, pattern: string): string;

  /**
   * Format date as ISO 8601 string
   *
   * @param date - Date to format
   * @returns ISO 8601 string
   */
  toISO(date: DateRecord): string;

  /**
   * Parse date string
   *
   * @param dateString - String to parse
   * @param calendar - Calendar system
   * @returns Parsed date
   */
  parse(dateString: string, calendar: CalendarSystemId): DateInput;
}

// ============================================================================
// VALIDATION INTERFACE
// ============================================================================

/**
 * Date validation and constraint checking.
 */
export interface IDateValidator {
  /**
   * Validate date input
   *
   * @param input - Date to validate
   * @param calendar - Calendar system
   * @returns Validation result
   */
  validate(input: DateInput, calendar: CalendarSystemId): ValidationResult;

  /**
   * Check specific constraints
   *
   * @param input - Date to check
   * @param calendar - Calendar system
   * @returns List of constraint violations
   */
  checkConstraints(
    input: DateInput,
    calendar: CalendarSystemId,
  ): ConstraintViolation[];

  /**
   * Check if date is in calendar's valid range
   *
   * @param input - Date to check
   * @param calendar - Calendar system
   * @returns true if in range, false otherwise
   */
  isInRange(input: DateInput, calendar: CalendarSystemId): boolean;

  /**
   * Check if date is proleptic (outside historical range)
   *
   * @param input - Date to check
   * @param calendar - Calendar system
   * @returns true if proleptic, false otherwise
   */
  isProleptic(input: DateInput, calendar: CalendarSystemId): boolean;
}
