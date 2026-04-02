/**
 * @file Template Formatting Tests
 * @description Test suite for template-based date formatting
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";

describe("Template Formatting", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
  });

  describe("Year Tokens", () => {
    it("should format YYYY as 4-digit year", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YYYY")).toBe("2024");
    });

    it("should format YY as 2-digit year", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YY")).toBe("24");
    });

    it("should pad year with zeros", () => {
      const date = NeoCalendar.at(99, 3, 18, "GREGORIAN");
      expect(date.format("YYYY")).toBe("0099");
    });

    it("should handle large years", () => {
      const date = NeoCalendar.at(12024, 3, 18, "HOLOCENE");
      expect(date.format("YYYY")).toBe("12024");
    });
  });

  describe("Month Tokens", () => {
    it("should format MM as 2-digit month", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("MM")).toBe("03");
    });

    it("should format M as month without padding", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("M")).toBe("3");
    });

    it("should handle single-digit months", () => {
      const date = NeoCalendar.at(2024, 1, 18, "GREGORIAN");
      expect(date.format("MM")).toBe("01");
      expect(date.format("M")).toBe("1");
    });

    it("should handle double-digit months", () => {
      const date = NeoCalendar.at(2024, 12, 18, "GREGORIAN");
      expect(date.format("MM")).toBe("12");
      expect(date.format("M")).toBe("12");
    });
  });

  describe("Day Tokens", () => {
    it("should format DD as 2-digit day", () => {
      const date = NeoCalendar.at(2024, 3, 8, "GREGORIAN");
      expect(date.format("DD")).toBe("08");
    });

    it("should format D as day without padding", () => {
      const date = NeoCalendar.at(2024, 3, 8, "GREGORIAN");
      expect(date.format("D")).toBe("8");
    });

    it("should handle single-digit days", () => {
      const date = NeoCalendar.at(2024, 3, 1, "GREGORIAN");
      expect(date.format("DD")).toBe("01");
      expect(date.format("D")).toBe("1");
    });

    it("should handle double-digit days", () => {
      const date = NeoCalendar.at(2024, 3, 31, "GREGORIAN");
      expect(date.format("DD")).toBe("31");
      expect(date.format("D")).toBe("31");
    });
  });

  describe("Era Tokens", () => {
    it("should format EE as era label", () => {
      const date = NeoCalendar.at(12024, 3, 18, "HOLOCENE");
      const formatted = date.format("YYYY EE");
      expect(formatted).toContain("12024");
      expect(formatted).toContain("HE");
    });

    it("should handle dates without era in template", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const formatted = date.format("YYYY-MM-DD"); // No EE token
      expect(formatted).toBe("2024-03-18");
    });
  });

  describe("Combined Templates", () => {
    it("should format ISO-like template YYYY-MM-DD", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YYYY-MM-DD")).toBe("2024-03-18");
    });

    it("should format US-style MM/DD/YYYY", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("MM/DD/YYYY")).toBe("03/18/2024");
    });

    it("should format European-style DD.MM.YYYY", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("DD.MM.YYYY")).toBe("18.03.2024");
    });

    it("should format with text separators", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("Year YYYY, Month MM, Day DD")).toBe(
        "Year 2024, Month 03, Day 18",
      );
    });

    it("should format Holocene with era", () => {
      const date = NeoCalendar.at(12024, 3, 18, "HOLOCENE");
      const formatted = date.format("YYYY-MM-DD EE");
      expect(formatted).toContain("12024-03-18");
      expect(formatted).toContain("HE");
    });
  });

  describe("Edge Cases", () => {
    it("should handle year-only dates", () => {
      const date = NeoCalendar.from({ year: 2024 }, "GREGORIAN");
      const formatted = date.format("YYYY-MM-DD");
      // from() creates a complete date with defaults (month 1, day 1)
      expect(formatted).toContain("2024");
      expect(formatted).toBe("2024-01-01");
    });

    it("should handle empty template", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("")).toBe("");
    });

    it("should handle template with no tokens", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("Hello World")).toBe("Hello World");
    });

    it("should not confuse adjacent tokens", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YYYYMMDD")).toBe("20240318");
    });
  });

  describe("Format Options", () => {
    it("should respect showEra option", () => {
      const date = NeoCalendar.at(12024, 3, 18, "HOLOCENE");
      const withEra = date.format("YYYY EE", { showEra: true });
      const withoutEra = date.format("YYYY EE", { showEra: false });

      expect(withEra).toContain("HE");
      expect(withoutEra).not.toContain("HE");
    });
  });

  describe("Real-World Formats", () => {
    it("should format for database storage", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YYYY-MM-DD")).toBe("2024-03-18");
    });

    it("should format for display", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      const formatted = date.format("MM/DD/YYYY");
      expect(formatted).toBe("03/18/2024");
    });

    it("should format for file names", () => {
      const date = NeoCalendar.at(2024, 3, 18, "GREGORIAN");
      expect(date.format("YYYY_MM_DD")).toBe("2024_03_18");
    });
  });
});
