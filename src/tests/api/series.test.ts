/**
 * @file NeoSeries Tests
 * @description Tests for lazy date sequence generation
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { Registry } from "@iterumarchive/neo-calendar";

describe("NeoSeries", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
  });

  describe("Basic Series Generation", () => {
    it("should generate daily series", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(5);
      expect(dates[0]?.day).toBe(1);
      expect(dates[4]?.day).toBe(5);
    });

    it("should generate monthly series", () => {
      const start = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const end = NeoCalendar.at(2024, 6, 15, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "month" },
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(6);
      expect(dates[0]?.month).toBe(1);
      expect(dates[5]?.month).toBe(6);
      dates.forEach(date => expect(date.day).toBe(15));
    });

    it("should generate yearly series", () => {
      const start = NeoCalendar.at(2020, 3, 18, "GREGORIAN");
      const end = NeoCalendar.at(2025, 3, 18, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "year" },
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(6);
      expect(dates[0]?.year).toBe(2020);
      expect(dates[5]?.year).toBe(2025);
    });
  });

  describe("Lazy Iteration", () => {
    it("should use iterator protocol", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 3, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const dates = [];
      for (const date of series) {
        dates.push(date);
      }

      expect(dates).toHaveLength(3);
    });

    it("should not materialize entire series when iterating", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");

      const series = NeoCalendar.series(start, null, {
        every: { amount: 1, unit: "day" },
        limit: 5,
      });

      const dates = [];
      for (const date of series) {
        dates.push(date);
      }

      expect(dates).toHaveLength(5);
    });
  });

  describe("Limiting and Pagination", () => {
    it("should limit series with take()", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      }).take(10);

      const dates = series.toArray();
      expect(dates).toHaveLength(10);
    });

    it("should limit series with limit option", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
        limit: 100,
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(100);
    });

    it("should skip dates with skip()", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 10, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      }).skip(5);

      const dates = series.toArray();
      expect(dates).toHaveLength(5);
      expect(dates[0]?.day).toBe(6);
    });

    it("should combine take() and skip()", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 20, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      })
        .skip(5)
        .take(5);

      const dates = series.toArray();
      expect(dates).toHaveLength(5);
      expect(dates[0]?.day).toBe(6);
      expect(dates[4]?.day).toBe(10);
    });
  });

  describe("Filtering", () => {
    it("should filter dates", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      }).filter(date => (date.day ?? 0) % 2 === 0); // Only even days

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(0);
      dates.forEach(date => expect((date.day ?? 0) % 2).toBe(0));
    });

    it("should filter with option", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
        filter: date => date.month === 3, // Only March dates
      });

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(0);
      dates.forEach(date => expect(date.month).toBe(3));
    });

    it("should chain multiple filters", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      })
        .filter(date => date.month === 3) // March
        .filter(date => (date.day ?? 0) % 5 === 0); // Day divisible by 5

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(0);
      dates.forEach(date => {
        expect(date.month).toBe(3);
        expect((date.day ?? 0) % 5).toBe(0);
      });
    });
  });

  describe("Mapping", () => {
    it("should map dates to values", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const displays = series.map(date => date.display);
      expect(displays).toHaveLength(5);
      expect(typeof displays[0]).toBe("string");
    });

    it("should map to custom objects", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 3, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const objects = series.map(date => ({
        date: date.toISOString(),
        jdn: date.jdn,
      }));

      expect(objects).toHaveLength(3);
      expect(objects[0]).toHaveProperty("date");
      expect(objects[0]).toHaveProperty("jdn");
    });
  });

  describe("Nth Element Access", () => {
    it("should get nth element without materializing", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 31, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const tenth = series.nth(9); // 0-indexed
      expect(tenth?.day).toBe(10);
    });

    it("should return null for out of range", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const outOfRange = series.nth(100);
      expect(outOfRange).toBeNull();
    });
  });

  describe("Count", () => {
    it("should count finite series", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 10, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      expect(series.count()).toBe(10);
    });

    it("should detect infinite series", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");

      const series = NeoCalendar.series(start, null, {
        every: { amount: 1, unit: "day" },
      });

      expect(series.isInfinite()).toBe(true);
      expect(series.count()).toBe(Infinity);
    });
  });

  describe("Real-World Use Cases", () => {
    it("should generate weekly billing dates", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const billingDates = NeoCalendar.series(start, end, {
        every: { amount: 7, unit: "day" },
      }).toArray();

      expect(billingDates.length).toBeGreaterThan(50);
    });

    it("should find all Fridays in a year", () => {
      const start = NeoCalendar.at(2024, 1, 5, "GREGORIAN"); // A Friday
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");

      const fridays = NeoCalendar.series(start, end, {
        every: { amount: 7, unit: "day" },
      }).toArray();

      expect(fridays.length).toBeGreaterThan(50);
    });

    it("should generate monthly anniversaries", () => {
      const start = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 15, "GREGORIAN");

      const anniversaries = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "month" },
      }).toArray();

      expect(anniversaries).toHaveLength(12);
      anniversaries.forEach(date => expect(date.day).toBe(15));
    });

    it("should generate leap days in a century", () => {
      const start = NeoCalendar.at(2000, 2, 29, "GREGORIAN");
      const end = NeoCalendar.at(2100, 2, 28, "GREGORIAN");

      const leapDays = NeoCalendar.series(start, end, {
        every: { amount: 4, unit: "year" },
      })
        .filter(date => {
          // Verify it's actually a leap year
          const year = date.year;
          return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
        })
        .toArray();

      expect(leapDays.length).toBe(25); // 2000-2096 (25 leap years: 2000, 2004...2096)
    });

    it("should generate first 10 dates after a point", () => {
      const start = NeoCalendar.at(12024, 3, 18, "HOLOCENE");

      const nextTen = NeoCalendar.series(start, null, {
        every: { amount: 1, unit: "day" },
        limit: 10,
      }).toArray();

      expect(nextTen).toHaveLength(10);
      expect(nextTen[0]?.day).toBe(18);
      expect(nextTen[9]?.day).toBe(27);
    });
  });

  describe("Safety Checks", () => {
    it("should throw on excessive toArray() without limit", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(3024, 1, 1, "GREGORIAN"); // 1000 years

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      expect(() => series.toArray()).toThrow(/safe memory bounds/);
    });

    it("should be safe with take() before toArray()", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(3024, 1, 1, "GREGORIAN");

      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      }).take(100);

      expect(() => series.toArray()).not.toThrow();
      expect(series.toArray()).toHaveLength(100);
    });
  });
});
