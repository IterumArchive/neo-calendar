/**
 * @file NeoSeries Unit Tests
 * @description Unit tests for NeoSeries class created via NeoCalendar.series()
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";

describe("NeoSeries Unit Tests", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
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

    it("should handle step > 1", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 7, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(1);
      expect(dates[1]?.day).toBe(8); // 1 + 7
    });
  });

  describe("Lazy Iteration", () => {
    it("should implement iterator protocol", () => {
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

    it("should handle infinite series with limit", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const series = NeoCalendar.series(start, null, {
        every: { amount: 1, unit: "day" },
        limit: 10,
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(10);
    });
  });

  describe("Limiting Operations", () => {
    describe("take()", () => {
      it("should limit series to specified count", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        }).take(10);

        const dates = series.toArray();
        expect(dates).toHaveLength(10);
      });

      it("should handle take(0)", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        }).take(0);

        const dates = series.toArray();
        expect(dates).toHaveLength(0);
      });
    });

    describe("limit option", () => {
      it("should limit series with option", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
          limit: 100,
        });

        const dates = series.toArray();
        expect(dates).toHaveLength(100);
      });
    });

    describe("skip()", () => {
      it("should skip specified number of dates", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 10, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        }).skip(5);

        const dates = series.toArray();
        expect(dates).toHaveLength(5);
        expect(dates[0]?.day).toBe(6);
      });

      it("should combine skip() and take()", () => {
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
  });

  describe("Filtering", () => {
    describe("filter() method", () => {
      it("should filter dates by predicate", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        }).filter(date => (date.day ?? 0) % 2 === 0);

        const dates = series.toArray();
        expect(dates.length).toBeGreaterThan(0);
        dates.forEach(date => expect((date.day ?? 0) % 2).toBe(0));
      });

      it("should maintain lazy evaluation", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        })
          .filter(date => date.month === 3)
          .take(5);

        const dates = series.toArray();
        expect(dates).toHaveLength(5);
        dates.forEach(date => expect(date.month).toBe(3));
      });

      it("should chain multiple filters", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        })
          .filter(date => date.month === 3)
          .filter(date => (date.day ?? 0) % 5 === 0);

        const dates = series.toArray();
        expect(dates.length).toBeGreaterThan(0);
        dates.forEach(date => {
          expect(date.month).toBe(3);
          expect((date.day ?? 0) % 5).toBe(0);
        });
      });
    });

    describe("filter option", () => {
      it("should filter with option", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
          filter: date => date.month === 3,
        });

        const dates = series.toArray();
        expect(dates.length).toBeGreaterThan(0);
        dates.forEach(date => expect(date.month).toBe(3));
      });
    });
  });

  describe("Mapping Operations", () => {
    describe("map()", () => {
      it("should transform dates", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");
        const days = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        })
          .toArray()
          .map(date => date.day);

        expect(days).toEqual([1, 2, 3, 4, 5]);
      });

      it("should maintain lazy evaluation", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 3, 31, "GREGORIAN");
        const dates = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        })
          .take(5)
          .toArray();

        const days = dates.map(date => date.day);
        expect(days).toHaveLength(5);
      });
    });
  });

  describe("Utility Operations", () => {
    describe("toArray()", () => {
      it("should convert series to array", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        });

        const dates = series.toArray();
        expect(Array.isArray(dates)).toBe(true);
        expect(dates).toHaveLength(5);
      });
    });

    describe("for...of iteration", () => {
      it("should iterate over all dates", () => {
        const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
        const end = NeoCalendar.at(2024, 1, 5, "GREGORIAN");
        const series = NeoCalendar.series(start, end, {
          every: { amount: 1, unit: "day" },
        });

        const days: number[] = [];
        for (const date of series) {
          days.push(date.day ?? 0);
        }

        expect(days).toEqual([1, 2, 3, 4, 5]);
      });
    });
  });

  describe("Complex Workflows", () => {
    it("should chain multiple operations", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      })
        .filter(date => date.month === 6)
        .filter(date => (date.day ?? 0) % 2 === 0)
        .take(5);

      const dates = series.toArray();
      expect(dates).toHaveLength(5);
      dates.forEach(date => {
        expect(date.month).toBe(6);
        expect((date.day ?? 0) % 2).toBe(0);
      });
    });

    it("should handle week-based steps", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2024, 3, 1, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 7, unit: "day" }, // Week = 7 days
      });

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(1);

      // Check that each date is 7 days apart
      for (let i = 1; i < dates.length; i++) {
        const diff = dates[i].diff(dates[i - 1]);
        expect(Math.abs(diff.days)).toBe(7);
      }
    });

    it("should handle year boundaries", () => {
      const start = NeoCalendar.at(2023, 12, 15, "GREGORIAN");
      const end = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 1, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(1);

      const years = dates.map(d => d.year);
      expect(years).toContain(2023);
      expect(years).toContain(2024);
    });
  });

  describe("Edge Cases", () => {
    it("should handle same start and end dates", () => {
      const date = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const series = NeoCalendar.series(date, date, {
        every: { amount: 1, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(1);
      expect(dates[0]?.jdn).toBe(date.jdn);
    });

    it("should handle large steps", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const end = NeoCalendar.at(2025, 1, 1, "GREGORIAN");
      const series = NeoCalendar.series(start, end, {
        every: { amount: 100, unit: "day" },
      });

      const dates = series.toArray();
      expect(dates.length).toBeGreaterThan(1);

      // Check spacing
      for (let i = 1; i < dates.length; i++) {
        const diff = dates[i].diff(dates[i - 1]);
        expect(Math.abs(diff.days)).toBe(100);
      }
    });

    it("should handle null end date with limit", () => {
      const start = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const series = NeoCalendar.series(start, null, {
        every: { amount: 1, unit: "month" },
        limit: 12,
      });

      const dates = series.toArray();
      expect(dates).toHaveLength(12);
      expect(dates[0]?.month).toBe(1);
      expect(dates[11]?.month).toBe(12);
    });
  });
});
