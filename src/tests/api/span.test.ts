/**
 * @file NeoSpan Tests
 * @description Test suite for the NeoSpan class
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoSpan } from "@iterumarchive/neo-calendar";
import { NeoDate } from "@iterumarchive/neo-calendar";
import { NeoDuration } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";

describe("NeoSpan", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
  });

  describe("Creation", () => {
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

    it("should create span using static factory", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = NeoSpan.from(start, end);

      expect(span).toBeInstanceOf(NeoSpan);
    });

    it("should create span from start and duration", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const duration = new NeoDuration(100);
      const span = NeoSpan.fromStartAndDuration(start, duration);

      expect(span.duration.days).toBe(100);
      expect(span.start.jdn).toBe(start.jdn);
    });

    it("should create span from end and duration", () => {
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const duration = new NeoDuration(100);
      const span = NeoSpan.fromEndAndDuration(end, duration);

      expect(span.duration.days).toBe(100);
      expect(span.end.jdn).toBe(end.jdn);
    });
  });

  describe("Midpoint", () => {
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

      // Midpoint is Dec 30, 2023 (15 days from start, 16 days to end)
      expect(mid.year).toBe(2023);
      expect(mid.month).toBe(12);
      expect(mid.day).toBe(30);
    });
  });

  describe("Containment", () => {
    it("should check if date is within span (inclusive)", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const insideDate = NeoDate.from(
        { year: 2024, month: 6, day: 15 },
        "GREGORIAN",
      );
      expect(span.contains(insideDate)).toBe(true);
    });

    it("should include boundary dates when inclusive", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.contains(start, true)).toBe(true);
      expect(span.contains(end, true)).toBe(true);
    });

    it("should exclude boundary dates when not inclusive", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      expect(span.contains(start, false)).toBe(false);
      expect(span.contains(end, false)).toBe(false);
    });

    it("should return false for dates outside span", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const beforeDate = NeoDate.from(
        { year: 2023, month: 12, day: 31 },
        "GREGORIAN",
      );
      const afterDate = NeoDate.from(
        { year: 2025, month: 1, day: 1 },
        "GREGORIAN",
      );

      expect(span.contains(beforeDate)).toBe(false);
      expect(span.contains(afterDate)).toBe(false);
    });
  });

  describe("Intersection and Overlap", () => {
    it("should detect overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 6, day: 30 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 3, day: 1 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 9, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      expect(span1.intersects(span2)).toBe(true);
      expect(span2.intersects(span1)).toBe(true);
    });

    it("should detect non-overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 3, day: 31 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 6, day: 1 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 9, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      expect(span1.intersects(span2)).toBe(false);
    });

    it("should compute intersection of overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 6, day: 30 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 3, day: 1 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 9, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      const intersection = span1.intersection(span2);
      expect(intersection).not.toBeNull();
      expect(intersection!.start.month).toBe(3);
      expect(intersection!.end.month).toBe(6);
    });

    it("should return null for non-overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 3, day: 31 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 6, day: 1 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 9, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      const intersection = span1.intersection(span2);
      expect(intersection).toBeNull();
    });
  });

  describe("Gap Calculation", () => {
    it("should calculate gap between non-overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 1, day: 10 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 1, day: 20 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 1, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      const gap = span1.gap(span2);
      expect(gap).not.toBeNull();
      expect(gap!.days).toBe(10);
    });

    it("should return null for overlapping spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 6, day: 30 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 3, day: 1 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 9, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      const gap = span1.gap(span2);
      expect(gap).toBeNull();
    });

    it("should detect adjacent spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 1, day: 10 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 1, day: 11 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 1, day: 20 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      expect(span1.isAdjacentTo(span2)).toBe(true);
    });

    it("should return false for non-adjacent spans", () => {
      const span1Start = NeoDate.from(
        { year: 2024, month: 1, day: 1 },
        "GREGORIAN",
      );
      const span1End = NeoDate.from(
        { year: 2024, month: 1, day: 10 },
        "GREGORIAN",
      );
      const span1 = new NeoSpan(span1Start, span1End);

      const span2Start = NeoDate.from(
        { year: 2024, month: 1, day: 20 },
        "GREGORIAN",
      );
      const span2End = NeoDate.from(
        { year: 2024, month: 1, day: 30 },
        "GREGORIAN",
      );
      const span2 = new NeoSpan(span2Start, span2End);

      expect(span1.isAdjacentTo(span2)).toBe(false);
    });
  });

  describe("Calendar Conversion", () => {
    it("should convert span to another calendar", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const holoceneSpan = span.to("HOLOCENE");
      expect(holoceneSpan.start.year).toBe(12024);
      expect(holoceneSpan.end.year).toBe(12024);
      expect(holoceneSpan.start.calendar).toBe("HOLOCENE");
    });
  });

  describe("Formatting", () => {
    it("should format span with custom template", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const formatted = span.format("YYYY-MM-DD");
      expect(formatted).toContain("to");
    });

    it("should generate human-readable description", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const human = span.toHuman();
      expect(human).toContain("to");
      expect(human).toContain("month");
    });
  });

  describe("Serialization", () => {
    it("should convert to JSON", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const json = span.toJSON();
      expect(json.start).toBeDefined();
      expect(json.end).toBeDefined();
      expect(json.duration).toBeDefined();
    });

    it("should convert to string", () => {
      const start = NeoDate.from({ year: 2024, month: 1, day: 1 }, "GREGORIAN");
      const end = NeoDate.from({ year: 2024, month: 12, day: 31 }, "GREGORIAN");
      const span = new NeoSpan(start, end);

      const str = span.toString();
      expect(str).toContain("to");
    });
  });
});
