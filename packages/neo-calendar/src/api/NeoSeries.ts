/**
 * @file NeoSeries Implementation
 * @description Lazy date sequence generation with filtering and mapping
 *
 * NeoSeries provides memory-efficient iteration over date sequences,
 * supporting common patterns like "every Friday", "monthly billing dates", etc.
 */

import type { NeoDate as INeoDate } from "./api.types.js";
import type { NeoSeries as INeoSeries, TimeUnit } from "./api.types.js";
import { NeoDate } from "./NeoDate.js";

/**
 * NeoSeries - Lazy date sequence generator
 *
 * Design principles:
 * - Lazy evaluation: generates dates on-demand
 * - Memory efficient: doesn't materialize entire sequence
 * - Composable: filter, map, take, skip can be chained
 * - Safe: prevents accidental generation of massive sequences
 */
export class NeoSeries implements INeoSeries {
  private start: NeoDate;
  private end: NeoDate | null;
  private intervalAmount: number;
  private intervalUnit: TimeUnit;
  private maxCount: number;
  private skipCount: number;
  private filterFn: ((date: NeoDate) => boolean) | null;

  private constructor(
    start: NeoDate,
    end: NeoDate | null,
    intervalAmount: number,
    intervalUnit: TimeUnit,
    maxCount: number,
    skipCount: number,
    filterFn: ((date: NeoDate) => boolean) | null,
  ) {
    this.start = start;
    this.end = end;
    this.intervalAmount = intervalAmount;
    this.intervalUnit = intervalUnit;
    this.maxCount = maxCount;
    this.skipCount = skipCount;
    this.filterFn = filterFn;
  }

  /**
   * Create a new series from start to end with an interval
   */
  static from(
    start: NeoDate,
    end: NeoDate | null,
    intervalAmount: number,
    intervalUnit: TimeUnit,
  ): NeoSeries {
    return new NeoSeries(
      start,
      end,
      intervalAmount,
      intervalUnit,
      Infinity,
      0,
      null,
    );
  }

  /**
   * Generate all dates in the series as an array
   * WARNING: Eagerly evaluates the entire series
   */
  toArray(): NeoDate[] {
    const MAX_SAFE_SIZE = 100000;
    const result: NeoDate[] = [];

    let count = 0;
    for (const date of this) {
      result.push(date);
      count++;

      if (count > MAX_SAFE_SIZE) {
        throw new Error(
          `Series exceeds safe memory bounds (${MAX_SAFE_SIZE} dates). Use take() or limit() to cap the series.`,
        );
      }
    }

    return result;
  }

  /**
   * Lazy iterator over dates
   */
  *[Symbol.iterator](): Iterator<NeoDate> {
    let current = this.start;
    let generated = 0;
    let skipped = 0;
    let yielded = 0;

    while (true) {
      // Check if we've reached the end date
      if (this.end && current.isAfter(this.end)) {
        break;
      }

      // Check if we've reached the max count
      if (yielded >= this.maxCount) {
        break;
      }

      // Skip initial dates if needed
      if (skipped < this.skipCount) {
        skipped++;
        current = current.add(this.intervalAmount, this.intervalUnit);
        generated++;
        continue;
      }

      // Apply filter if present
      if (this.filterFn && !this.filterFn(current)) {
        current = current.add(this.intervalAmount, this.intervalUnit);
        generated++;
        continue;
      }

      // Yield the date
      yield current;
      yielded++;

      // Move to next date
      current = current.add(this.intervalAmount, this.intervalUnit);
      generated++;
    }
  }

  /**
   * Get the nth date in the series (0-indexed)
   */
  nth(n: number): NeoDate | null {
    if (n < 0) {
      return null;
    }

    let index = 0;
    for (const date of this) {
      if (index === n) {
        return date;
      }
      index++;
    }

    return null;
  }

  /**
   * Count total dates in the series
   */
  count(): number {
    if (this.isInfinite()) {
      return Infinity;
    }

    let count = 0;
    for (const _ of this) {
      count++;
    }
    return count;
  }

  /**
   * Limit the series to the first n dates
   */
  take(n: number): NeoSeries {
    return new NeoSeries(
      this.start,
      this.end,
      this.intervalAmount,
      this.intervalUnit,
      Math.min(this.maxCount, n),
      this.skipCount,
      this.filterFn,
    );
  }

  /**
   * Alias for take()
   */
  limit(n: number): NeoSeries {
    return this.take(n);
  }

  /**
   * Skip the first n dates
   */
  skip(n: number): NeoSeries {
    return new NeoSeries(
      this.start,
      this.end,
      this.intervalAmount,
      this.intervalUnit,
      this.maxCount,
      this.skipCount + n,
      this.filterFn,
    );
  }

  /**
   * Filter the series (maintains laziness)
   */
  filter(predicate: (date: NeoDate) => boolean): NeoSeries {
    const combinedFilter = this.filterFn
      ? (date: NeoDate) => this.filterFn!(date) && predicate(date)
      : predicate;

    return new NeoSeries(
      this.start,
      this.end,
      this.intervalAmount,
      this.intervalUnit,
      this.maxCount,
      this.skipCount,
      combinedFilter,
    );
  }

  /**
   * Map the series (eager evaluation)
   */
  map<T>(fn: (date: NeoDate) => T): T[] {
    const result: T[] = [];
    for (const date of this) {
      result.push(fn(date));
    }
    return result;
  }

  /**
   * Check if the series is potentially infinite
   */
  isInfinite(): boolean {
    return this.end === null && this.maxCount === Infinity;
  }
}
