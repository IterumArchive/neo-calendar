/**
 * @file API Layer Entry Point
 * @description Exports the high-level user-facing API
 */

// Main API classes
export { NeoDate } from "./NeoDate.js";
export { NeoCalendar } from "./NeoCalendar.js";
export { Registry } from "./registry.js";
export { NeoDuration } from "./NeoDuration.js";
export { NeoSpan } from "./NeoSpan.js";

// Type exports
export type {
  // Core interfaces
  NeoDate as INeoDate, // Export interface as INeoDate to avoid naming conflict
  NeoCalendarFactory,
  CalendarRegistry,

  // Metadata & options
  DateMetadata,
  FormatOptions,
  ArithmeticOptions,
  DiffOptions,
  NeoCalendarOptions,
  ParseOptions,

  // Results
  ParseResult,
  ProjectionResult,
  NeoDateJSON,

  // Duration & Span
  NeoDuration as INeoDuration,
  DurationComponents,
  NeoSpan as INeoSpan,
  NeoSeries,

  // Supporting types
  TimeUnit,
  MonthType,
  SpanOptions,
  SeriesOptions,
  NeoDateInput,
  DateOperationResult,
  DatePredicate,
  DateMapper,
  DateComparator,
} from "./api.types.js";
