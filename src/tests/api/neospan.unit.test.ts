/**
 * @file NeoSpan Unit Tests
 * @description Unit tests for NeoSpan class methods in isolation
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoDate } from "@iterumarchive/neo-calendar";
import { NeoSpan } from "@iterumarchive/neo-calendar";
import { NeoDuration } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";

describe("NeoSpan Unit Tests", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
  });

  describe("Constructor", () => {
    it("should create span from two dates", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.start.jdn).toBeLessThan(span.end.jdn);
      expect(span.duration).toBeDefined();
    });

    it("should normalize order (start before end)", () => {
      const date1 = NeoDate.from(
        { year: 2024, month: 12, day: 31 },
        "GREGORIAN",
      );
      const date2 = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const span = new NeoSpan(date1, date2);

      expect(span.start.year).toBe(2024);
      expect(span.start.month).toBe(1);
      expect(span.end.month).toBe(12);
    });

    it("should calculate duration on creation", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 1, day: 10 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.duration.days).toBe(9);
    });

    it("should handle same dates", () => {
      const date = NeoDate.from({ year: 2024, month: 6, day: 15 }, "GREGORIAN");
      const span = new NeoSpan(date, date);

      expect(span.start.jdn).toBe(span.end.jdn);
      expect(span.duration.days).toBe(0);
    });
  });

  describe("Static Factory Methods", () => {
    describe("from()", () => {
      it("should create span from two dates", () => {
        const start = NeoDate.from(
          { year: 2024, month: 1, day: 1 },
          "GREGORIAN",
        );
        const end = NeoDate.from(
          { year: 2024, month: 12, day: 31 },
          "GREGORIAN",
        );
        const span = NeoSpan.from(start, end);

        expect(span).toBeInstanceOf(NeoSpan);
        expect(span.start.jdn).toBe(start.jdn);
        expect(span.end.jdn).toBe(end.jdn);
      });
    });

    describe("fromStartAndDuration()", () => {
      it("should create span from start date and duration", () => {
        const start = NeoDate.from(
          { year: 2024, month: 1, day: 1 },
          "GREGORIAN",
        );
        const duration = new NeoDuration(100);
        const span = NeoSpan.fromStartAndDuration(start, duration);

        expect(span.duration.days).toBe(100);
        expect(span.start.jdn).toBe(start.jdn);
      });

      it("should handle zero duration", () => {
        const start = NeoDate.from(
          { year: 2024, month: 1, day: 1 },
          "GREGORIAN",
        );
        const duration = new NeoDuration(0);
        const span = NeoSpan.fromStartAndDuration(start, duration);

        expect(span.duration.days).toBe(0);
        expect(span.start.jdn).toBe(span.end.jdn);
      });
    });

    describe("fromEndAndDuration()", () => {
      it("should create span from end date and duration", () => {
        const end = NeoDate.from(
          { year: 2024, month: 12, day: 31 },
          "GREGORIAN",
        );
        const duration = new NeoDuration(100);
        const span = NeoSpan.fromEndAndDuration(end, duration);

        expect(span.duration.days).toBe(100);
        expect(span.end.jdn).toBe(end.jdn);
      });

      it("should calculate correct start date", () => {
        const end = NeoDate.from(
          { year: 2024, month: 1, day: 31 },
          "GREGORIAN",
        );
        const duration = new NeoDuration(30);
        const span = NeoSpan.fromEndAndDuration(end, duration);

        expect(span.start.day).toBe(1);
        expect(span.start.month).toBe(1);
      });
    });
  });

  describe("Core Properties", () => {
    it("should expose start date", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.start.jdn).toBe(start.jdn);
    });

    it("should expose end date", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.end.jdn).toBe(end.jdn);
    });

    it("should expose cached duration", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 1, day: 10 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.duration).toBeInstanceOf(NeoDuration);
      expect(span.duration.days).toBe(9);
    });
  });

  describe("midpoint()", () => {
    it("should calculate midpoint of span", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 1, day: 11 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const mid = span.midpoint();

      expect(mid.day).toBe(6);
    });

    it("should handle year boundaries", () => {
      const start = NeoDate.from(
        { year: 2023, month: 12, day: 15 },
        "GREGORIAN",
      );
      const end = NeoDate.from({ year: 2024, month: 1, day: 15 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const mid = span.midpoint();

      expect(mid.year).toBe(2023);
      expect(mid.month).toBe(12);
      expect(mid.day).toBe(30);
    });

    it("should use same calendar as start date", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const mid = span.midpoint();

      expect(mid.calendar).toBe("GREGORIAN");
    });
  });

  describe("contains()", () => {
    it("should check if date is within span (inclusive by default)", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const inside = NeoDate.from(
        { year: 2024, month: 6, day: 15 },
        "GREGORIAN",
      );

      expect(span.contains(inside)).toBe(true);
    });

    it("should include boundary dates when inclusive=true", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.contains(start, true)).toBe(true);
      expect(span.contains(end, true)).toBe(true);
    });

    it("should exclude boundary dates when inclusive=false", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.contains(start, false)).toBe(false);
      expect(span.contains(end, false)).toBe(false);
    });

    it("should return false for dates before span", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const before = NeoDate.from(
        { year: 2023, month: 12, day: 31 },
        "GREGORIAN",
      );

      expect(span.contains(before)).toBe(false);
    });

    it("should return false for dates after span", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);
      const after = NeoDate.from({ year: 2025, month: 1, day: 1 }, "GREGORIAN");

      expect(span.contains(after)).toBe(false);
    });
  });

  describe("intersects()", () => {
    it("should detect overlapping spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 6, day: 30 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 3, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );

      expect(span1.intersects(span2)).toBe(true);
      expect(span2.intersects(span1)).toBe(true);
    });

    it("should detect non-overlapping spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 3, day: 31 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 6, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );

      expect(span1.intersects(span2)).toBe(false);
      expect(span2.intersects(span1)).toBe(false);
    });

    it("should detect adjacent spans as non-intersecting", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 6, day: 30 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 7, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN"),
      );

      expect(span1.intersects(span2)).toBe(false);
    });
  });

  describe("intersection()", () => {
    it("should return overlapping region", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 6, day: 30 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 3, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );
      const result = span1.intersection(span2);

      expect(result).not.toBeNull();
      expect(result!.start.month).toBe(3);
      expect(result!.end.month).toBe(6);
    });

    it("should return null for non-overlapping spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 3, day: 31 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 6, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );
      const result = span1.intersection(span2);

      expect(result).toBeNull();
    });
  });

  describe("gap()", () => {
    it("should calculate gap between non-overlapping spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 1, day: 10 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 20 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 1, day: 30 }, "GREGORIAN"),
      );
      const gap = span1.gap(span2);

      expect(gap).not.toBeNull();
      expect(gap!.days).toBe(10);
    });

    it("should return null for overlapping spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 6, day: 30 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 3, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );
      const gap = span1.gap(span2);

      expect(gap).toBeNull();
    });
  });

  describe("isAdjacentTo()", () => {
    it("should detect adjacent spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 6, day: 30 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 7, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN"),
      );

      expect(span1.isAdjacentTo(span2)).toBe(true);
    });

    it("should return false for non-adjacent spans", () => {
      const span1 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 3, day: 31 }, "GREGORIAN"),
      );
      const span2 = new NeoSpan(
        NeoDate.from({ year: 2024, month: 6, day: 1 }, "GREGORIAN"),
        NeoDate.from({ year: 2024, month: 9, day: 30 }, "GREGORIAN"),
      );

      expect(span1.isAdjacentTo(span2)).toBe(false);
    });
  });

  describe("Immutability", () => {
    it("should not mutate original dates", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const startJDN = start.jdn;
      const endJDN = end.jdn;

      new NeoSpan(start, end);

      expect(start.jdn).toBe(startJDN);
      expect(end.jdn).toBe(endJDN);
    });

    it("should normalize without mutating input", () => {
      const date1 = NeoDate.from(
        { year: 2024, month: 12, day: 31 },
        "GREGORIAN",
      );
      const date2 = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const span = new NeoSpan(date1, date2);

      // Original dates unchanged
      expect(date1.month).toBe(12);
      expect(date2.month).toBe(1);

      // Span is normalized
      expect(span.start.month).toBe(1);
      expect(span.end.month).toBe(12);
    });
  });
});
