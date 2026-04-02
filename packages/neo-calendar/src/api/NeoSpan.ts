/**
 * @file NeoSpan Implementation
 * @description Represents an interval between two dates
 *
 * Essential for historical periods like reigns, wars, dynasties.
 * Provides operations for checking containment, overlap, and gaps.
 */

import type { CalendarSystemId, BrandedJDN } from "@iterumarchive/neo-calendar-core";
import type { NeoSpan as INeoSpan } from "./api.types.js";
import { NeoDate } from "./NeoDate.js";
import { NeoDuration } from "./NeoDuration.js";

/**
 * NeoSpan - Immutable interval between two dates
 *
 * Represents a continuous period of time with defined start and end points.
 * Useful for historical analysis, period overlap detection, and timeline visualization.
 */
export class NeoSpan implements INeoSpan {
  /** Start date of the span */
  readonly start: NeoDate;

  /** End date of the span */
  readonly end: NeoDate;

  /** Duration of the span (cached for performance) */
  readonly duration: NeoDuration;

  /**
   * Create a new span
   * @param start - Starting date
   * @param end - Ending date
   */
  constructor(start: NeoDate, end: NeoDate) {
    // Normalize order - start should always be before end
    if (start.jdn <= end.jdn) {
      this.start = start;
      this.end = end;
    } else {
      this.start = end;
      this.end = start;
    }

    // Calculate and cache duration
    this.duration = this.start.diff(this.end);
  }

  // ========== Query Methods ==========

  midpoint(): NeoDate {
    const middleJDN = ((this.start.jdn + this.end.jdn) / 2n) as BrandedJDN;
    return NeoDate.fromJDN(middleJDN, this.start.calendar);
  }

  contains(date: NeoDate, inclusive = true): boolean {
    if (inclusive) {
      return date.jdn >= this.start.jdn && date.jdn <= this.end.jdn;
    } else {
      return date.jdn > this.start.jdn && date.jdn < this.end.jdn;
    }
  }

  intersects(other: NeoSpan): boolean {
    // Two spans intersect if one's start is within the other's range
    return (
      this.contains(other.start, true) ||
      this.contains(other.end, true) ||
      other.contains(this.start, true) ||
      other.contains(this.end, true)
    );
  }

  intersection(other: NeoSpan): NeoSpan | null {
    if (!this.intersects(other)) {
      return null;
    }

    // Find the overlapping region
    const intersectionStart =
      this.start.jdn > other.start.jdn ? this.start : other.start;
    const intersectionEnd = this.end.jdn < other.end.jdn ? this.end : other.end;

    return new NeoSpan(intersectionStart, intersectionEnd);
  }

  gap(other: NeoSpan): NeoDuration | null {
    if (this.intersects(other)) {
      return null; // No gap if spans overlap
    }

    // Find which span comes first
    const [earlier, later] =
      this.start.jdn < other.start.jdn ? [this, other] : [other, this];

    // Gap is between end of earlier span and start of later span
    return earlier.end.diff(later.start);
  }

  isAdjacentTo(other: NeoSpan): boolean {
    const gapDuration = this.gap(other);
    if (gapDuration === null) {
      return false; // Overlapping spans are not adjacent
    }

    // Adjacent if gap is zero or one day (depending on calendar precision)
    return Math.abs(gapDuration.days) <= 1;
  }

  // ========== Conversion ==========

  to(calendar: CalendarSystemId): NeoSpan {
    const convertedStart = this.start.to(calendar);
    const convertedEnd = this.end.to(calendar);
    return new NeoSpan(convertedStart, convertedEnd);
  }

  // ========== Formatting ==========

  format(template: string): string {
    // Simple formatting for now - can be enhanced later
    const startStr = this.start.format(template);
    const endStr = this.end.format(template);
    return `${startStr} to ${endStr}`;
  }

  toHuman(): string {
    const durationStr = this.duration.toHuman({ maxUnits: 2 });
    return `${this.start.display} to ${this.end.display} (${durationStr})`;
  }

  // ========== Serialization ==========

  toJSON(): {
    start: ReturnType<NeoDate["toJSON"]>;
    end: ReturnType<NeoDate["toJSON"]>;
    duration: { days: number };
  } {
    return {
      start: this.start.toJSON(),
      end: this.end.toJSON(),
      duration: this.duration.toJSON(),
    };
  }

  toString(): string {
    return this.toHuman();
  }

  // ========== Static Factory Methods ==========

  /**
   * Create a span from two dates
   */
  static from(start: NeoDate, end: NeoDate): NeoSpan {
    return new NeoSpan(start, end);
  }

  /**
   * Create a span starting at a date with a specific duration
   */
  static fromStartAndDuration(start: NeoDate, duration: NeoDuration): NeoSpan {
    const end = start.add(duration.days, "day");
    return new NeoSpan(start, end);
  }

  /**
   * Create a span ending at a date with a specific duration
   */
  static fromEndAndDuration(end: NeoDate, duration: NeoDuration): NeoSpan {
    const start = end.subtract(duration.days, "day");
    return new NeoSpan(start, end);
  }
}
