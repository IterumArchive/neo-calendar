/**
 * @file Date Formatting Utilities
 * @description Token-based date formatting for NeoDate
 *
 * Supports tokens like:
 * - YYYY: 4-digit year
 * - YY: 2-digit year
 * - MM: 2-digit month
 * - M: Month without padding
 * - DD: 2-digit day
 * - D: Day without padding
 * - EE: Era label
 * - MMM: Short month name
 * - MMMM: Full month name
 */

import type { DateRecord, CalendarSystemId } from "@iterumarchive/neo-calendar-core";
import type { FormatOptions, DateMetadata } from "./api.types.js";
import { Registry } from "./registry.js";

/**
 * Format a date using template tokens
 */
export function formatDate(
  record: DateRecord,
  calendar: CalendarSystemId,
  template: string,
  metadata?: DateMetadata,
  options?: FormatOptions,
): string {
  let result = template;
  const opts = options || {};

  // Get plugin metadata for month names
  const plugin = Registry.get(calendar);
  const calendarMetadata = plugin?.metadata;

  // Year tokens
  const year = record.year;
  const yearStr = Math.abs(year).toString();
  result = result.replace(/YYYY/g, yearStr.padStart(4, "0"));
  result = result.replace(/YY/g, yearStr.slice(-2).padStart(2, "0"));
  // Don't replace standalone Y to avoid matching inside words

  // Month tokens
  if (record.month !== undefined) {
    const month = record.month;
    result = result.replace(/MM/g, month.toString().padStart(2, "0"));
    // Only replace M when followed by non-M character or at end
    result = result.replace(/\bM\b/g, month.toString());

    // Month names (if available from plugin)
    // This is a simplified version - full implementation would need month name mappings
    const monthName = `Month ${month}`;
    result = result.replace(/MMMM/g, monthName);
    result = result.replace(/MMM/g, monthName.slice(0, 3));
  } else {
    // Remove month tokens if no month
    result = result.replace(/MMMM|MMM|MM|\bM\b/g, "??");
  }

  // Day tokens
  if (record.day !== undefined) {
    const day = record.day;
    result = result.replace(/DD/g, day.toString().padStart(2, "0"));
    // Only replace D when followed by non-D character or at end
    result = result.replace(/\bD\b/g, day.toString());
  } else {
    // Remove day tokens if no day
    result = result.replace(/DD|\bD\b/g, "??");
  }

  // Era tokens
  if (record.era && opts.showEra !== false) {
    result = result.replace(/EE/g, record.era);
    result = result.replace(/E(?!E)/g, record.era);
  } else {
    result = result.replace(/EE|E/g, "");
  }

  // Uncertainty markers
  if (metadata && opts.showUncertainty) {
    if (metadata.circa) {
      result = `~${result}`;
    }
    if (metadata.uncertain) {
      result = `${result}?`;
    }
    if (metadata.approximate) {
      result = `ca. ${result}`;
    }
  }

  return result.trim();
}

/**
 * Get month name from calendar metadata
 * @internal
 */
export function getMonthName(
  month: number,
  calendar: CalendarSystemId,
  locale = "en-US",
): string | null {
  // This would need to be enhanced with actual month name mappings
  // For now, return null to indicate month names aren't available
  return null;
}

/**
 * Get era label display name
 * @internal
 */
export function getEraDisplay(
  era: string,
  calendar: CalendarSystemId,
  locale = "en-US",
): string {
  // Can be enhanced with localized era names
  return era;
}
