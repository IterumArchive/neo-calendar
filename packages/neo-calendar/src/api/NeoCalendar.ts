/**
 * @file NeoCalendar Factory
 * @description Static factory methods for creating NeoDate objects
 *
 * This is the primary entry point for users of the library.
 * Provides convenient methods for creating dates from various inputs.
 */

import type {
  BrandedJDN,
  CalendarSystemId,
  DateInput,
} from "@iterumarchive/neo-calendar-core";
import type {
  NeoCalendarOptions,
  ParseOptions,
  ParseResult,
  SpanOptions,
  SeriesOptions,
  NeoSpan as INeoSpan,
  NeoSeries as INeoSeries,
  NeoDateInput,
} from "./api.types.js";
import { NeoDate } from "./NeoDate.js";
import { NeoSpan } from "./NeoSpan.js";
import { NeoSeries } from "./NeoSeries.js";
import { Registry } from "./registry.js";
import type { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";

/**
 * Global configuration
 */
let globalConfig: NeoCalendarOptions = {
  defaultCalendar: "GREGORIAN",
  strict: false,
  locale: "en-US",
};

/**
 * NeoCalendar - Static factory for creating NeoDate objects
 *
 * This is the main API entry point. Users interact with this class to create dates.
 *
 * @example
 * ```typescript
 * import { NeoCalendar } from '@iterumarchive/neo-calendar';
 *
 * // Create a date
 * const date = NeoCalendar.at(2024, 3, 18, 'GREGORIAN');
 *
 * // Convert to another calendar
 * const holocene = date.to('HOLOCENE');
 * console.log(holocene.display); // "12024-03-18 HE"
 * ```
 */
export const NeoCalendar = {
  // ========== Creation Methods ==========

  /**
   * Create a date using era-driven calendar selection (ergonomic API)
   *
   * Automatically selects the appropriate calendar based on era suffix.
   * This is the simplified interface for common use cases.
   *
   * @param year - Year value
   * @param era - Era label (e.g., 'AD', 'HE', 'AH', 'AM', 'OS')
   * @param month - Month (default: 1)
   * @param day - Day (default: 1)
   * @param options - Optional calendar override and configuration
   *
   * @example
   * ```typescript
   * // Auto-selects Gregorian for AD
   * NeoCalendar.calendar(1800, 'AD')
   *
   * // Auto-selects Holocene for HE
   * NeoCalendar.calendar(12026, 'HE')
   *
   * // Auto-selects Julian for OS (Old Style)
   * NeoCalendar.calendar(1066, 'OS')
   *
   * // With month and day
   * NeoCalendar.calendar(2026, 'AD', 3, 16)
   *
   * // Override calendar selection
   * NeoCalendar.calendar(1500, 'AD', 1, 1, { calendar: 'JULIAN' })
   * ```
   */
  calendar(
    year: number,
    era: string,
    month?: number,
    day?: number,
    options?: { calendar?: CalendarSystemId },
  ): NeoDate {
    // Normalize era to uppercase
    const normalizedEra = era.toUpperCase();

    // Determine calendar to use
    let calendar: CalendarSystemId;

    if (options?.calendar) {
      // Use explicit override
      calendar = options.calendar;
    } else {
      // Auto-select based on era
      const candidates = Registry.findByEra(normalizedEra);

      if (candidates.length === 0) {
        throw new Error(
          `Unknown era '${era}'. Cannot determine calendar. ` +
            `Available eras: ${Registry.getAllEras().join(", ")}`,
        );
      }

      if (candidates.length === 1) {
        // Unambiguous - use the only candidate
        calendar = candidates[0]!;
      } else {
        // Multiple candidates - use smart defaults
        calendar = NeoCalendar.selectBestCalendar(normalizedEra, candidates);
      }
    }

    // Validate that the selected calendar supports this era
    const plugin = Registry.get(calendar);
    const supportedEras = plugin.eras || [];

    if (
      !supportedEras.some(
        (e: string) => e.toUpperCase() === normalizedEra.toUpperCase(),
      )
    ) {
      throw new Error(
        `Era '${era}' is not supported by calendar '${calendar}'. ` +
          `Supported eras: ${supportedEras.join(", ")}`,
      );
    }

    // Create the date
    const input: DateInput = {
      year,
      month: month ?? 1,
      day: day ?? 1,
      era: normalizedEra,
    };

    return NeoDate.from(input, calendar);
  },

  /**
   * Smart calendar selection when multiple calendars support an era
   * @internal
   */
  selectBestCalendar(
    era: string,
    candidates: CalendarSystemId[],
  ): CalendarSystemId {
    // Era-specific defaults for ambiguous cases
    const defaults: Record<string, CalendarSystemId> = {
      AD: "GREGORIAN", // AD defaults to Gregorian (proleptic)
      CE: "GREGORIAN", // CE is modern secular form of AD
      BC: "GREGORIAN", // BC defaults to proleptic Gregorian
      BCE: "GREGORIAN", // BCE is modern secular form of BC
      NS: "GREGORIAN", // New Style is explicitly Gregorian
      OS: "JULIAN", // Old Style is explicitly Julian
    };

    const preferred = defaults[era];
    if (preferred && candidates.includes(preferred)) {
      return preferred;
    }

    // Fallback: return first candidate
    return candidates[0]!;
  },

  at(
    year: number,
    month: number,
    day: number,
    calendar: CalendarSystemId,
  ): NeoDate {
    const input: DateInput = { year, month, day };
    return NeoDate.from(input, calendar);
  },

  from(input: DateInput, calendar: CalendarSystemId): NeoDate {
    return NeoDate.from(input, calendar);
  },

  fromJDN(jdn: BrandedJDN, calendar: CalendarSystemId = "GREGORIAN"): NeoDate {
    return NeoDate.fromJDN(jdn, calendar);
  },

  fromJSDate(date: Date): NeoDate {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JS months are 0-indexed
    const day = date.getDate();
    return NeoCalendar.at(year, month, day, "GREGORIAN");
  },

  fromUnix(timestamp: number, isMilliseconds = false): NeoDate {
    // Convert to seconds if milliseconds
    const seconds = isMilliseconds ? Math.floor(timestamp / 1000) : timestamp;

    // Unix epoch is JDN 2440588
    const unixEpochJDN = 2440588n;
    const daysFromEpoch = Math.floor(seconds / 86400);
    const jdn = (unixEpochJDN + BigInt(daysFromEpoch)) as BrandedJDN;

    return NeoDate.fromJDN(jdn, "GREGORIAN");
  },

  now(calendar: CalendarSystemId = "GREGORIAN"): NeoDate {
    const jsDate = new Date();
    const gregorian = NeoCalendar.fromJSDate(jsDate);
    return calendar === "GREGORIAN" ? gregorian : gregorian.to(calendar);
  },

  // ========== Parsing Methods ==========

  parse(input: string, options?: ParseOptions): ParseResult {
    const opts = { ...globalConfig, ...options };
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Use default or specified calendar
      const calendar: CalendarSystemId = opts.defaultCalendar || "GREGORIAN";

      // Parse ISO-like format: YYYY-MM-DD
      const isoMatch = input.match(/^(\d+)-(\d+)-(\d+)/);
      if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
        const year = parseInt(isoMatch[1], 10);
        const month = parseInt(isoMatch[2], 10);
        const day = parseInt(isoMatch[3], 10);
        const date = NeoCalendar.at(year, month, day, calendar);
        return {
          date,
          success: true,
          errors: [],
          warnings,
          detectedCalendar: calendar,
          confidence: 0.7,
        };
      }

      errors.push(`Could not parse date string: ${input}`);
      return {
        date: null,
        success: false,
        errors,
        warnings,
        confidence: 0,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      return {
        date: null,
        success: false,
        errors,
        warnings,
        confidence: 0,
      };
    }
  },

  parseWith(
    input: string,
    calendar: CalendarSystemId,
    options?: ParseOptions,
  ): ParseResult {
    return NeoCalendar.parse(input, { ...options, defaultCalendar: calendar });
  },

  // ========== Span & Series Methods ==========

  span(
    start: NeoDateInput,
    end: NeoDateInput,
    options?: SpanOptions,
  ): INeoSpan {
    // Convert inputs to NeoDate if needed
    const startDate =
      start instanceof NeoDate
        ? start
        : NeoDate.from(
            start as DateInput,
            globalConfig.defaultCalendar || "GREGORIAN",
          );
    const endDate =
      end instanceof NeoDate
        ? end
        : NeoDate.from(
            end as DateInput,
            globalConfig.defaultCalendar || "GREGORIAN",
          );
    return NeoSpan.from(startDate, endDate);
  },

  series(
    start: NeoDateInput,
    end: NeoDateInput | null,
    options: SeriesOptions,
  ): INeoSeries {
    // Convert inputs to NeoDate if needed
    const startDate =
      start instanceof NeoDate
        ? start
        : NeoDate.from(
            start as DateInput,
            options.calendar || globalConfig.defaultCalendar || "GREGORIAN",
          );

    const endDate = end
      ? end instanceof NeoDate
        ? end
        : NeoDate.from(
            end as DateInput,
            options.calendar || globalConfig.defaultCalendar || "GREGORIAN",
          )
      : null;

    // Create series with interval
    let series = NeoSeries.from(
      startDate,
      endDate,
      options.every.amount,
      options.every.unit,
    );

    // Apply limit if specified
    if (options.limit) {
      series = series.limit(options.limit);
    }

    // Apply filter if specified
    if (options.filter) {
      series = series.filter(options.filter);
    }

    return series;
  },

  // ========== Utility Methods ==========

  isValid(input: unknown): boolean {
    if (input === null || input === undefined) {
      return false;
    }

    if (input instanceof NeoDate) {
      return true;
    }

    if (typeof input === "object" && "year" in input) {
      return typeof (input as any).year === "number";
    }

    return false;
  },

  configure(options: Partial<NeoCalendarOptions>): void {
    globalConfig = { ...globalConfig, ...options };
  },

  getConfig(): NeoCalendarOptions {
    return { ...globalConfig };
  },

  // ========== Registry Access ==========

  get registry() {
    // Return a public-only view of the registry
    return {
      register: Registry.register.bind(Registry),
      unregister: Registry.unregister.bind(Registry),
      get: Registry.get.bind(Registry),
      has: Registry.has.bind(Registry),
      list: Registry.list.bind(Registry),
      listAll: Registry.listAll.bind(Registry),
      findByEra: Registry.findByEra.bind(Registry),
      getAllEras: Registry.getAllEras.bind(Registry),
      clear: Registry.clear.bind(Registry),
    };
  },

  register(plugin: BaseCalendarPlugin): void {
    Registry.register(plugin);
  },
};
