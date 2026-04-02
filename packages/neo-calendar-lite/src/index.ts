/**
 * @file Neo Calendar Lite
 * @description Minimal API wrapper around core calendar plugins for sorting dates
 *
 * Bundle size: ~6kb (80% smaller than Standard package)
 * Core use case: Sort dates by JDN + basic calendar conversion
 * Uses same core/plugins as Standard, just lighter API surface
 */

import type {
  JDN,
  BrandedJDN,
  ICalendarPlugin,
} from "@iterumarchive/neo-calendar-core";

// Auto-register defaults
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";

/**
 * Registry of calendar systems
 */
const registeredCalendars = new Map<string, ICalendarPlugin>();

/**
 * Register a calendar plugin
 * Calendars are indexed by both their ID and all their eras
 */
export function registerCalendar(plugin: ICalendarPlugin): void {
  // Register by calendar ID
  registeredCalendars.set(plugin.id, plugin);

  // Register by each era for easy lookup
  if (plugin.eras) {
    plugin.eras.forEach(era => {
      registeredCalendars.set(era, plugin);
    });
  }
}

/**
 * Get calendar by era or ID
 */
function getCalendar(eraOrId: string): ICalendarPlugin {
  const calendar = registeredCalendars.get(eraOrId);
  if (!calendar) {
    const available = Array.from(registeredCalendars.keys()).join(", ");
    throw new Error(
      `Calendar for era "${eraOrId}" not registered. Available: ${available}`,
    );
  }
  return calendar;
}

/**
 * Lightweight date object for sorting and conversion
 */
export interface LiteDate {
  /** Year in the source calendar */
  year: number;
  /** Month (1-12) */
  month: number;
  /** Day (1-31) */
  day: number;
  /** Era of the source calendar */
  era: string;
  /** Julian Day Number (for sorting) */
  jdn: BrandedJDN;

  /**
   * Convert to another calendar system
   * @example
   * const ancient = calendar('300', 'AD').to('HE');
   */
  to(targetEra: string): LiteDate;

  /**
   * Get numeric value for sorting
   * @example
   * dates.sort((a, b) => a.valueOf() - b.valueOf());
   */
  valueOf(): number;

  /**
   * Format the date as ISO string with era
   * @example
   * calendar(2024, 'AD').format() // "2024-01-01 AD"
   */
  format(): string;
}

/**
 * Create a date in a specific calendar system
 *
 * @example
 * // Ancient date
 * const ancient = calendar('300', 'BC');
 *
 * // Convert to Holocene Era
 * const he = ancient.to('HE');
 *
 * // Modern date
 * const modern = calendar(2024, 'AD');
 *
 * // Sort dates
 * const sorted = [ancient, modern].sort((a, b) => a.valueOf() - b.valueOf());
 */
export function calendar(
  year: number | string,
  era: string,
  month: number = 1,
  day: number = 1,
): LiteDate {
  const cal = getCalendar(era);
  const yearNum = typeof year === "string" ? parseInt(year, 10) : year;
  const jdn = cal.toJDN({ year: yearNum, month, day });

  return {
    year: yearNum,
    month,
    day,
    era,
    jdn,

    to(targetEra: string): LiteDate {
      const targetCal = getCalendar(targetEra);
      const date = targetCal.fromJDN(this.jdn);
      return calendar(date.year, targetEra, date.month ?? 1, date.day ?? 1);
    },

    valueOf(): number {
      return Number(this.jdn);
    },

    format(): string {
      const yearStr = String(this.year).padStart(4, "0");
      const monthStr = String(this.month).padStart(2, "0");
      const dayStr = String(this.day).padStart(2, "0");
      return `${yearStr}-${monthStr}-${dayStr} ${this.era}`;
    },
  };
}

/**
 * SQL Query Builders that work with any registered calendar
 */
export const SQLHelpers = {
  /**
   * Generate SQL WHERE clause for a year range in any calendar
   * @example
   * SQLHelpers.yearRange('HE', 12024, 'event_jdn')
   * // → "event_jdn >= 2460311 AND event_jdn <= 2460676"
   */
  yearRange(era: string, year: number, jdnColumn: string = "jdn"): string {
    const cal = getCalendar(era);
    const startJDN = cal.toJDN({ year, month: 1, day: 1 });
    const endJDN = cal.toJDN({ year, month: 12, day: 31 });
    return `${jdnColumn} >= ${startJDN} AND ${jdnColumn} <= ${endJDN}`;
  },

  /**
   * Generate SQL WHERE clause for a JDN range
   */
  jdnRange(jdnColumn: string, startJDN: JDN, endJDN: JDN): string {
    return `${jdnColumn} >= ${startJDN} AND ${jdnColumn} <= ${endJDN}`;
  },

  /**
   * Generate SQL expression to extract year from JDN column (approximate)
   */
  jdnToYear(jdnColumn: string): string {
    return `FLOOR((${jdnColumn} - 1721120) / 365.25)`;
  },
};

// Auto-register default calendars: Unix, Gregorian, Holocene
registerCalendar(new UnixPlugin());
registerCalendar(new GregorianPlugin());
registerCalendar(new HolocenePlugin());

/**
 * Re-export types
 */
export type {
  JDN,
  BrandedJDN,
  ICalendarPlugin,
} from "@iterumarchive/neo-calendar-core";
