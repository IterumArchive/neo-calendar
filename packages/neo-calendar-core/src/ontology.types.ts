/**
 * @file Neo Calendar Ontology - Pure Type System
 * @description Complete domain model derived from Concepts.md
 *
 * This file contains ONLY types - no logic, no implementations.
 * It represents the conceptual hierarchy from physical reality to cultural expression.
 *
 * Hierarchy:
 * - Level 0: Physical Reality (The Day)
 * - Level 1: Mathematical Truth (JDN)
 * - Level 2: Synchronization Rules (Astronomical Basis)
 * - Level 3: Cultural Interface (Calendar Systems)
 */

// ============================================================================
// LEVEL 0: PHYSICAL REALITY
// ============================================================================

/**
 * The fundamental unit of time - one Earth rotation.
 * This is the universal quantum all calendars share.
 */
export type Day = bigint;

/**
 * When does a calendar day begin?
 * Different cultures start their day at different times.
 */
export type DiurnalStart =
  | "midnight" // Modern civil calendars (Gregorian, Unix)
  | "sunrise" // Ancient Egyptian, Vedic
  | "noon" // Astronomical Julian Date
  | "sunset"; // Hebrew, Islamic, Babylonian

// ============================================================================
// LEVEL 1: MATHEMATICAL TRUTH (The Hub)
// ============================================================================

/**
 * Julian Day Number - The universal day count.
 * Continuous integer count from a single reference point.
 * This is Neo Calendar's foundation.
 */
export type JDN = bigint;

/**
 * Fractional Julian Date - for sub-day precision.
 * Used in astronomy (0.5 = noon).
 */
export type JD = number;

/**
 * Modified Julian Date - convenience variant.
 * MJD = JD - 2400000.5
 */
export type MJD = number;

/**
 * Astronomical year numbering (has year 0).
 * Year 0 = 1 BC, Year -1 = 2 BC
 */
export type AstronomicalYear = number;

/**
 * Historical year numbering (no year 0).
 * 1 BC → 1 AD (skip zero)
 */
export type HistoricalYear = number;

// ============================================================================
// LEVEL 2: SYNCHRONIZATION RULES (Astronomical Basis)
// ============================================================================

/**
 * What astronomical phenomenon does this calendar track?
 */
export type AstronomicalBasis =
  | "solar" // Earth's orbit around Sun (seasons)
  | "lunar" // Moon's orbit around Earth (phases)
  | "lunisolar" // Both lunar months AND solar year
  | "computational" // No astronomical basis (pure counting)
  | "stellar"; // Star positions (rare, e.g., Sothic cycle)

/**
 * Solar cycle types
 */
export type SolarCycle = {
  type: "tropical" | "sidereal";
  daysPerYear: number; // ~365.24219 for tropical
};

/**
 * Lunar cycle types
 */
export type LunarCycle = {
  type: "synodic" | "sidereal";
  daysPerMonth: number; // ~29.53059 for synodic
};

/**
 * Fundamental astronomical periods
 */
export type AstronomicalPeriod =
  | { kind: "day"; rotations: number }
  | { kind: "synodic_month"; days: number } // ~29.53
  | { kind: "sidereal_month"; days: number } // ~27.32
  | { kind: "tropical_year"; days: number } // ~365.24219
  | { kind: "sidereal_year"; days: number }; // ~365.25636

// ============================================================================
// LEVEL 3: CALENDAR SYSTEMS (Cultural Interface)
// ============================================================================

/**
 * Complete calendar system identifier
 */
export type CalendarSystemId =
  // Solar calendars
  | "GREGORIAN"
  | "JULIAN"
  | "HOLOCENE"
  | "COPTIC"
  | "ETHIOPIAN"
  | "PERSIAN" // Alias for PERSIAN_ALGORITHMIC
  | "PERSIAN_ALGORITHMIC" // 33-year cycle approximation (current implementation)
  | "PERSIAN_ASTRONOMICAL" // Full equinox calculation (not yet implemented)
  | "PERSIAN_SOLAR_HIJRI"
  | "INDIAN_NATIONAL"
  | "REVISED_JULIAN"
  | "FRENCH_REPUBLICAN"
  | "FRENCH_REVOLUTIONARY"
  | "BAHAI"

  // Lunar calendars
  | "ISLAMIC_CIVIL"
  | "ISLAMIC_OBSERVATIONAL"

  // Lunisolar calendars
  | "HEBREW"
  | "CHINESE"
  | "HINDU"
  | "BUDDHIST"
  | "ATTIC"

  // Computational/Technical
  | "UNIX"
  | "BEFORE_PRESENT"
  | "BP"
  | "JULIAN_DAY_NUMBER"
  | "MODIFIED_JULIAN_DATE"
  | "TAI"
  | "GPS_TIME"
  | "EXCEL"

  // Mesoamerican
  | "MAYAN_LONG_COUNT"
  | "MAYAN_HAAB"
  | "MAYAN_TZOLKIN"

  // Historical
  | "EGYPTIAN_CIVIL"
  | "ROMAN_REPUBLICAN"
  | "JAPANESE_NENGO"

  // Other
  | "ISO_WEEK_DATE"
  | "ZOROASTRIAN_SHAHENSHAHI"
  | "ZOROASTRIAN_QADIMI"
  | "ZOROASTRIAN_FASLI";

// ============================================================================
// CALENDAR ANATOMY - TEMPORAL FOUNDATION
// ============================================================================

/**
 * Day structure within a calendar
 */
export type CalendarDay = {
  /** Day number within month (1-31 typically) */
  dayOfMonth: number;

  /** Day number within year (1-365/366) */
  dayOfYear: number;

  /** Day of week (if calendar has weeks) */
  dayOfWeek?: number;

  /** Diurnal boundary convention */
  boundaryTime: DiurnalStart;
};

/**
 * Week structure (not all calendars have weeks)
 */
export type CalendarWeek = {
  /** Number of days in week */
  daysPerWeek: number;

  /** Day names (if named) */
  dayNames?: string[];

  /** Which day starts the week */
  weekStartDay: number;
};

/**
 * Month structure
 */
export type CalendarMonth = {
  /** Month number (1-12 typically, or 1-13 for lunisolar) */
  monthNumber: number;

  /** Days in this month */
  daysInMonth: number;

  /** Month name (if named) */
  name?: string;

  /** Is this an intercalary month? */
  isIntercalary: boolean;

  /** Is this month based on lunar phases? */
  isLunarBased: boolean;
};

/**
 * Year structure
 */
export type CalendarYear = {
  /** Year number in calendar's counting system */
  yearNumber: number;

  /** Total days in this year */
  daysInYear: number;

  /** Months in this year */
  monthsInYear: number;

  /** Is this a leap year? */
  isLeapYear: boolean;

  /** Era designation */
  era?: string;
};

// ============================================================================
// CALENDAR ANATOMY - EPOCH & ERA
// ============================================================================

/**
 * Era directionality - how time is counted
 */
export type EraDirection =
  | { type: "forward"; startYear: number } // 1, 2, 3, ...
  | { type: "backward"; startYear: number } // ..., 3, 2, 1
  | { type: "bidirectional"; pivotYear: number }; // BC ← | → AD

/**
 * Era cycle type
 */
export type EraCycle =
  | { type: "continuous" } // Infinite counting
  | { type: "consecutive"; trigger: string } // Resets on events (emperor reigns)
  | { type: "cyclical"; period: number }; // Repeats every N years

/**
 * Era system
 */
export type EraSystem = {
  /** Era label(s) */
  labels: string[]; // ["AD", "BC"] or ["CE", "BCE"] or ["HE"]

  /** How time is counted */
  direction: EraDirection;

  /** Does this era cycle? */
  cycle: EraCycle;

  /** Does this system have year zero? */
  hasYearZero: boolean;
};

/**
 * Common era labels
 */
export type EraLabel =
  | "AD"
  | "BC" // Religious (Anno Domini, Before Christ)
  | "CE"
  | "BCE" // Secular (Common Era, Before Common Era)
  | "HE" // Holocene Era
  | "AH" // Anno Hegirae (Islamic)
  | "AM" // Anno Mundi (Hebrew)
  | "BP"
  | "AP" // Before/After Present (archaeological)
  | "OS"
  | "NS" // Old Style (Julian), New Style (Gregorian)
  | "BE" // Buddhist Era
  | "SE" // Saka Era
  | "KY" // Kali Yuga
  | "AUC" // Ab Urbe Condita (Roman)
  | "MLC" // Mayan Long Count
  | "Unix"; // Unix Timestamp

/**
 * Epoch definition - the starting point
 */
export type Epoch = {
  /** JDN of the epoch moment */
  jdn: JDN;

  /** Human description */
  description: string;

  /** Proleptic Gregorian representation (for reference) */
  gregorianDate: {
    year: number;
    month: number;
    day: number;
  };
};

// ============================================================================
// CALENDAR ANATOMY - INTERCALATION
// ============================================================================

/**
 * Intercalation strategy type
 */
export type IntercalationType =
  | "algorithmic" // Predictable mathematical rules
  | "observational" // Based on physical observation
  | "administrative"; // Political/cultural decisions

/**
 * Leap year rule (for solar calendars)
 */
export type LeapYearRule =
  | { type: "julian"; divisor: 4 }
  | { type: "gregorian"; divisors: [4, 100, 400] }
  | { type: "revised_julian"; modulo: 900; remainders: [200, 600] }
  | {
      type: "persian";
      calculation: "astronomical" | "algorithmic";
      note?: string;
    }
  | { type: "custom"; predicate: string }; // Description only

/**
 * Leap month rule (for lunisolar calendars)
 */
export type LeapMonthRule =
  | { type: "metonic"; cycle: 19; leapYears: number[] } // Hebrew
  | { type: "solar_terms"; calculation: "chinese" } // Chinese
  | { type: "custom"; description: string };

/**
 * Intercalary day rule
 */
export type IntercalaryDayRule = {
  /** Which month receives the extra day? */
  targetMonth: number;

  /** How many days are added? */
  daysAdded: number;

  /** When does this happen? */
  trigger: LeapYearRule;
};

/**
 * Intercalation system
 */
export type IntercalationSystem = {
  /** Type of intercalation */
  type: IntercalationType;

  /** Leap year rules (if applicable) */
  leapYearRule?: LeapYearRule;

  /** Leap month rules (if applicable) */
  leapMonthRule?: LeapMonthRule;

  /** Intercalary day rules */
  intercalaryDayRules?: IntercalaryDayRule[];

  /** Religious postponements (e.g., Hebrew dehiyyot) */
  postponements?: Array<{
    condition: string;
    daysShifted: number;
    reason: string;
  }>;
};

// ============================================================================
// CALENDAR ANATOMY - PRECISION & GRANULARITY
// ============================================================================

/**
 * Time unit precision
 */
export type Precision =
  | { unit: "year" }
  | { unit: "month" }
  | { unit: "day" }
  | { unit: "hour" }
  | { unit: "minute" }
  | { unit: "second" }
  | { unit: "millisecond" }
  | { unit: "nanosecond" }
  | { unit: "fractional_day"; decimals: number }; // Astronomical JD

/**
 * Calendar granularity - smallest meaningful unit
 */
export type Granularity = {
  /** Finest resolution this calendar supports */
  resolution: Precision;

  /** Can represent partial units? */
  supportsFractional: boolean;
};

// ============================================================================
// CALENDAR ANATOMY - PROLEPTIC EXTENSION
// ============================================================================

/**
 * Proleptic mode - how to handle dates outside historical range
 */
export type ProlepticMode =
  | "strict" // Only dates within historical range
  | "proleptic" // Extend rules backward/forward
  | "hybrid"; // Switch between systems at adoption date

/**
 * Historical adoption information
 */
export type HistoricalAdoption = {
  /** Geographic region */
  region: string;

  /** Date of adoption (in target calendar) */
  adoptionDate: {
    year: number;
    month: number;
    day: number;
  };

  /** Calendar replaced */
  replacedCalendar?: CalendarSystemId;

  /** Days skipped during transition */
  daysSkipped?: number;
};

// ============================================================================
// CALENDAR ANATOMY - DISPLAY & FORMATTING
// ============================================================================

/**
 * Date field ordering
 */
export type DateFieldOrder =
  | "YMD" // 2024-03-18 (ISO, sortable)
  | "MDY" // 03/18/2024 (US)
  | "DMY"; // 18/03/2024 (European)

/**
 * Date separator
 */
export type DateSeparator = "-" | "/" | "." | " ";

/**
 * Month representation format
 */
export type MonthFormat =
  | { type: "numeric"; padded: boolean } // "03" or "3"
  | { type: "short_name" } // "Mar"
  | { type: "full_name" } // "March"
  | { type: "localized"; locale: string }; // Locale-specific

/**
 * Display convention
 */
export type DisplayConvention = {
  /** Field ordering */
  fieldOrder: DateFieldOrder;

  /** Separator character */
  separator: DateSeparator;

  /** Month format */
  monthFormat: MonthFormat;

  /** Show era label? */
  showEra: boolean;

  /** Era position (if shown) */
  eraPosition?: "prefix" | "suffix";
};

// ============================================================================
// CALENDAR ANATOMY - COMPLETE SYSTEM
// ============================================================================

/**
 * Complete calendar system definition.
 * This represents the full anatomy of a calendar.
 */
export type CalendarSystem = {
  // Identity
  id: CalendarSystemId;
  name: string;
  aliases: string[];

  // Fundamental properties
  astronomicalBasis: AstronomicalBasis;
  epoch: Epoch;
  eraSystem: EraSystem;

  // Structure
  daysPerWeek?: number;
  weeksPerYear?: number;
  monthsPerYear: number;
  daysPerYear: number; // Average for regular year

  // Temporal foundation
  diurnalStart: DiurnalStart;
  weekStructure?: CalendarWeek;

  // Intercalation
  intercalation: IntercalationSystem;

  // Precision
  granularity: Granularity;

  // Proleptic extension
  prolepticMode: ProlepticMode;
  historicalAdoptions?: HistoricalAdoption[];

  // Display
  defaultDisplay: DisplayConvention;

  // Metadata
  culturalContext?: string[];
  religiousContext?: string[];
  geographicRegions?: string[];
  historicalPeriod?: {
    start?: number; // Year of first use
    end?: number; // Year of last use (if discontinued)
  };

  // Usage
  usedFor?: Array<"civil" | "religious" | "scientific" | "historical">;
};

// ============================================================================
// DATE REPRESENTATION
// ============================================================================

/**
 * Input for creating dates - minimal required info
 */
export type DateInput = {
  year: number;
  month?: number;
  day?: number;
  era?: string;
};

/**
 * Complete date representation with all metadata
 */
export type DateRecord = {
  // Core identity
  jdn: JDN;

  // Calendar-specific
  calendar: CalendarSystemId;
  year: number;
  month?: number;
  day?: number;

  // Era
  era: string;

  // Display
  display: string;

  // Astronomical context
  astronomicalBasis: AstronomicalBasis;

  // Epoch offset
  epochOffset: JDN;

  // Metadata flags
  isProleptic: boolean; // Outside historical range?
  isLeapYear: boolean;
  isIntercalaryMonth: boolean;

  // Uncertainty markers (ISO 8601-2)
  isCirca: boolean; // ~ (approximate)
  isUncertain: boolean; // ? (uncertain)
  isAmbiguous: boolean; // Multiple valid interpretations
  precision?: "century" | "decade" | "year" | "month" | "day"; // Precision level
};

// ============================================================================
// DURATION & ARITHMETIC
// ============================================================================

/**
 * Duration unit types
 */
export type DurationUnit =
  | "days"
  | "weeks"
  | "months"
  | "years"
  | "decades"
  | "centuries"
  | "millennia"
  // Astronomical
  | "synodic_months"
  | "tropical_years"
  // Specialized
  | "olympiads" // 4 years (Greek)
  | "baktuns" // ~394 years (Mayan)
  | "katuns"; // ~20 years (Mayan)

/**
 * Duration representation
 */
export type Duration = {
  /** Base value in days (universal unit) */
  days: number;

  /** Original unit (for display/context) */
  originalUnit: DurationUnit;

  /** Original value */
  originalValue: number;

  /** Calendar context (required for month/year arithmetic) */
  calendarContext?: CalendarSystemId;

  /** Is this a variable-length duration? */
  isVariable: boolean; // Months/years vary, days don't
};

/**
 * Conversion strategy for ambiguous dates
 */
export type ConversionStrategy =
  | "snap" // Choose closest valid date
  | "overflow" // Allow month/day overflow
  | "strict"; // Throw error on invalid dates

// ============================================================================
// COMPARISON & ANALYSIS
// ============================================================================

/**
 * Comparison result between two dates
 */
export type DateComparison = {
  isBefore: boolean;
  isAfter: boolean;
  isEqual: boolean;

  /** JDN difference */
  jdnDelta: bigint;

  /** Duration between dates */
  duration: Duration;
};

/**
 * Calendar drift analysis
 */
export type CalendarDrift = {
  calendar: CalendarSystemId;

  /** Days gained/lost per year */
  daysPerYear: number;

  /** Years until 1 day drift */
  yearsToDrift: number;

  /** Description of drift pattern */
  description: string;
};

// ============================================================================
// ERROR & VALIDATION
// ============================================================================

/**
 * Validation result for date inputs
 */
export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

/**
 * Date constraint violations
 */
export type ConstraintViolation = {
  field: "year" | "month" | "day" | "era";
  value: number | string;
  constraint: string;
  suggestion?: string;
};

// ============================================================================
// CROSS-CALENDAR ANALYSIS
// ============================================================================

/**
 * Simultaneous date representation across multiple calendars
 */
export type SimultaneousDate = {
  /** Universal hub */
  jdn: JDN;

  /** Same moment in different calendar systems */
  representations: Map<CalendarSystemId, DateRecord>;
};

/**
 * Historical event with multiple calendar notations
 */
export type HistoricalEvent = {
  description: string;

  /** Primary date (as recorded) */
  primaryDate: DateRecord;

  /** Same event in other calendars */
  alternateNotations: DateRecord[];

  /** Confidence level */
  certainty: "certain" | "probable" | "approximate" | "uncertain";
};

// ============================================================================
// SPECIALIZED TYPES
// ============================================================================

/**
 * ISO Week Date representation
 */
export type ISOWeekDate = {
  year: number;
  week: number; // 1-53
  day: number; // 1-7 (Monday = 1)
};

/**
 * Mayan Long Count representation
 */
export type MayanLongCount = {
  baktun: number; // 144,000 days
  katun: number; // 7,200 days
  tun: number; // 360 days
  uinal: number; // 20 days
  kin: number; // 1 day
};

/**
 * Unix timestamp representation
 */
export type UnixTimestamp = {
  seconds: bigint;
  milliseconds?: number;
  nanoseconds?: number;
};

/**
 * Before Present notation
 */
export type BeforePresent = {
  yearsBP: number;
  referenceYear: 1950;
};

/**
 * Japanese era (Nengō) representation
 */
export type JapaneseNengo = {
  era: string; // "Reiwa", "Heisei", etc.
  year: number; // Year within era
  startJDN: JDN; // When this era began
  endJDN?: JDN; // When this era ended (if ended)
};

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

/**
 * Type guard utilities (type-level only, no runtime logic)
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Branded types for type safety
 */
export type Brand<K, T> = K & { __brand: T };
export type BrandedJDN = Brand<bigint, "JDN">;
export type BrandedYear = Brand<number, "Year">;
export type BrandedMonth = Brand<number, "Month">;
export type BrandedDay = Brand<number, "Day">;

// ============================================================================
// ADMINISTRATIVE ADJUSTMENTS SYSTEM (V2 Enhancement)
// ============================================================================

/**
 * Categories of administrative adjustments
 * These are cultural/political modifications not covered by pure astronomy
 */
export type AdjustmentCategory =
  | "postponement" // Shift date forward/backward (Hebrew dehiyyot)
  | "skip" // Date range doesn't exist (Gregorian adoption)
  | "variable_length" // Month/year length varies (Hebrew months)
  | "observational" // Override calculation with observation
  | "intercalation" // Extra day/month insertion
  | "epoch_shift" // Calendar era change
  | "day_boundary"; // Adjust for day boundary crossing (sunset vs midnight)

/**
 * Why was this adjustment made?
 */
export type AdjustmentReason =
  | "religious" // Religious observance (Shabbat conflicts)
  | "astronomical" // Astronomical observation (moon sighting)
  | "political" // Political decision (calendar reform)
  | "mathematical" // Mathematical correction (leap year)
  | "cultural"; // Cultural convention

/**
 * Rule priority levels (higher = evaluated first)
 */
export enum AdjustmentPriority {
  CRITICAL = 100, // Skip days, epoch shifts (must apply first)
  HIGH = 75, // Religious postponements (dehiyyot)
  NORMAL = 50, // Variable lengths, standard intercalation
  LOW = 25, // Observational overrides (can be ignored)
  INFORMATIONAL = 0, // Tracing only, doesn't modify values
}

/**
 * Geographic scope for adjustment rules
 */
export type GeographicScope = {
  type: "global" | "country" | "region" | "custom";

  /** ISO 3166-1 alpha-2 country codes */
  countries?: string[]; // ["IT", "ES", "FR"]

  /** Custom region identifiers */
  regions?: string[]; // ["Catholic Europe", "Protestant Europe"]

  /** Geographic coordinates (for observational calendars) */
  coordinates?: {
    latitude: number;
    longitude: number;
    radius?: number; // km
  };

  /** Custom matcher function */
  matcher?: (context: GeographicContext) => boolean;
};

/**
 * Geographic context for rule evaluation
 */
export type GeographicContext = {
  country?: string; // ISO code
  region?: string;
  coordinates?: { latitude: number; longitude: number };
  timezone?: string; // IANA timezone
};

/**
 * Day boundary definition
 */
export type DayBoundary = {
  type: "fixed" | "astronomical";

  /** For fixed boundaries */
  fixedTime?: "midnight" | "noon" | "sunrise" | "sunset" | "custom";
  time?: "midnight" | "noon" | "sunrise" | "sunset" | "custom"; // Alias for fixedTime
  customHour?: number; // 0-23 for custom fixed time

  /** For astronomical boundaries */
  astronomicalEvent?: "sunset" | "sunrise" | "moonrise" | "moonset";

  /** Geographic dependency */
  requiresCoordinates?: boolean; // True for sunrise/sunset
};

/**
 * Time-of-day for sub-day precision
 */
export type TimeOfDay = {
  hour: number; // 0-23
  minute: number; // 0-59
  second?: number; // 0-59 (optional)
};

/**
 * Date precision level
 */
export type DatePrecision =
  | "day" // Full Y-M-D
  | "month" // Y-M only
  | "year" // Y only
  | "decade" // ~10 year range
  | "century" // ~100 year range
  | "millennium"; // ~1000 year range

/**
 * Partial date representation
 */
export type PartialDate = {
  year: number;
  month?: number; // undefined for year-only
  day?: number; // undefined for month-only
  precision: DatePrecision;

  /** Uncertainty markers */
  circa?: boolean; // Approximate date
  uncertaintyRange?: number; // ± years
};

/**
 * Rule set version for historical accuracy
 */
export type RuleSetVersion = {
  id: string; // "hebrew-v1", "hebrew-modern"
  name?: string; // Human-readable name
  description: string;
  effectiveFrom?: JDN; // When this version takes effect (optional if validFrom is provided)
  effectiveTo?: JDN; // When this version is superseded
  validFrom?: JDN; // Alias for effectiveFrom
  validTo?: JDN; // Alias for effectiveTo
  authority?: string; // "Hillel II", "Umm al-Qura Institute"
  notes?: string; // Additional notes
};

/**
 * External data source for observational calendars
 */
export type ObservationalDataSource = {
  id: string;
  type: "moon_sighting" | "astronomical_calc" | "witness_testimony" | "custom";

  /**
   * Query observational data for a specific date
   */
  query(context: ObservationalQuery): Promise<ObservationalData | null>;
};

/**
 * Query parameters for observational data
 */
export type ObservationalQuery = {
  calendar: CalendarSystemId;
  jdn?: JDN;
  date?: { year: number; month: number; day: number };
  event: "month_start" | "year_start" | "sunset" | "sunrise" | "custom";
  geographic?: GeographicContext;
};

/**
 * Result from observational data query
 */
export type ObservationalData = {
  observed: boolean; // Was observation successful?
  jdn?: JDN; // Observed JDN
  confidence?: number; // 0-1 confidence score
  source: string; // Authority (e.g., "Saudi Arabia Hilal Committee")
  timestamp: Date; // When observation was made
  metadata?: Record<string, unknown>;
};

/**
 * Context passed to adjustment rules
 */
export type AdjustmentContext = {
  calendar: CalendarSystemId;
  jdn: JDN;
  date?: DateRecord; // If converting FROM date
  direction: "toJDN" | "fromJDN"; // Which conversion direction

  /** Intermediate calculation state */
  year?: number;
  month?: number;
  day?: number;

  /** For composite adjustments */
  previousAdjustments?: AppliedAdjustment[];

  /** Geographic context for regional rules */
  geographic?: GeographicContext;

  /** Time of day (for day boundary calculations) */
  timeOfDay?: TimeOfDay;

  /** Day boundary definition (from plugin) */
  dayBoundary?: DayBoundary;

  /** Date precision level */
  precision?: DatePrecision;

  /** Flexible metadata storage */
  metadata?: Record<string, unknown>;
};

/**
 * Result of applying an adjustment
 */
export type AdjustmentResult = {
  applied: boolean; // Was this rule triggered?
  delta?: number; // Days shifted (can be negative)
  reason?: string; // Reason for adjustment

  /** For skip rules */
  skipTo?: JDN; // Next valid JDN after skip

  /** For variable length rules */
  newLength?: number; // Adjusted month/year length

  /** Metadata */
  metadata?: {
    originalValue?: number | JDN;
    adjustedValue?: number | JDN;
    [key: string]: unknown;
  };
};

/**
 * Single adjustment rule
 */
export type AdjustmentRule = {
  id: string; // Unique identifier
  category: AdjustmentCategory;
  reason: AdjustmentReason;
  description: string; // Human-readable explanation
  priority: AdjustmentPriority; // Evaluation order

  /** Temporal scope - when does this rule apply? */
  validFrom?: JDN; // Start of validity (inclusive)
  validTo?: JDN; // End of validity (inclusive)

  /** Geographic scope - where does this rule apply? */
  geographicScope?: GeographicScope;

  /** Rule dependencies & conflicts */
  requires?: string[]; // Rule IDs that must apply first
  excludes?: string[]; // Rule IDs that conflict with this one
  conflictResolution?: "override" | "compose" | "error" | "skip";

  /** Precision requirements */
  minPrecision?: DatePrecision; // Minimum date precision needed

  /** Versioning */
  version?: string; // Links to RuleSetVersion.id

  /** Application logic (implemented by plugin) */
  apply: (
    context: AdjustmentContext,
  ) => AdjustmentResult | Promise<AdjustmentResult>;
};

/**
 * Record of an applied adjustment (for tracing)
 */
export type AppliedAdjustment = {
  ruleId: string;
  category: AdjustmentCategory;
  reason: AdjustmentReason;
  delta: number;
  description: string;
  timestamp?: Date; // When was this adjustment applied
};

/**
 * DateRecord with adjustment tracing
 */
export type TracedDateRecord = DateRecord & {
  adjustments?: AppliedAdjustment[]; // Stack of applied adjustments
  isAdjusted: boolean; // Quick flag
  originalJDN?: JDN; // JDN before adjustments
};
