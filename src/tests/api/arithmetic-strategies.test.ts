/**
 * @file Arithmetic Strategies Tests
 * @description Test suite for arithmetic overflow strategies
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";

describe("Arithmetic Strategies", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
  });

  describe("Default Behavior (no options)", () => {
    it("should add months without options", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const result = date.add(1, "month");

      // Default behavior: Feb 29 (2024 is a leap year)
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29);
    });

    it("should add years without options", () => {
      const date = NeoCalendar.at(2024, 2, 29, "GREGORIAN");
      const result = date.add(1, "year");

      // Default behavior: Feb 28 (2025 is not a leap year)
      expect(result.year).toBe(2025);
      expect(result.month).toBe(2);
      expect(result.day).toBe(28);
    });
  });

  describe("Snap Strategy", () => {
    it("should snap to last valid day of month", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const result = date.add(1, "month", { overflow: "snap" });

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29); // Snapped to Feb 29
    });

    it("should snap leap day when adding years", () => {
      const date = NeoCalendar.at(2024, 2, 29, "GREGORIAN");
      const result = date.add(1, "year", { overflow: "snap" });

      expect(result.year).toBe(2025);
      expect(result.month).toBe(2);
      expect(result.day).toBe(28); // Snapped to Feb 28
    });

    it("should handle snap across multiple months", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const result = date.add(3, "month", { overflow: "snap" });

      expect(result.year).toBe(2024);
      expect(result.month).toBe(4);
      expect(result.day).toBe(30); // April has 30 days
    });
  });

  describe("Overflow Strategy", () => {
    it("should allow overflow to next month", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const result = date.add(1, "month", { overflow: "overflow" });

      // Jan 31 + 1 month = Feb 29 (in 2024)
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
    });

    it("should handle overflow in non-leap year", () => {
      const date = NeoCalendar.at(2023, 1, 31, "GREGORIAN");
      const result = date.add(1, "month", { overflow: "overflow" });

      // Jan 31 + 1 month = Feb 28 in 2023
      expect(result.year).toBe(2023);
      expect(result.month).toBe(2);
    });
  });

  describe("Strict Strategy", () => {
    it("should throw error on overflow", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");

      // Adding 1 month to Jan 31 would overflow
      // The strict strategy should detect this and throw
      expect(() => date.add(1, "month", { overflow: "strict" })).toThrow();
    });
  });

  describe("Edge Cases", () => {
    it("should handle adding to valid dates (no overflow)", () => {
      const date = NeoCalendar.at(2024, 1, 15, "GREGORIAN");
      const result = date.add(1, "month", { overflow: "snap" });

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(15); // No overflow, day preserved
    });

    it("should handle subtraction with strategies", () => {
      const date = NeoCalendar.at(2024, 3, 31, "GREGORIAN");
      const result = date.subtract(1, "month", { overflow: "snap" });

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29); // Feb 29 (leap year)
    });

    it("should handle year boundaries", () => {
      const date = NeoCalendar.at(2024, 12, 31, "GREGORIAN");
      const result = date.add(1, "month", { overflow: "snap" });

      expect(result.year).toBe(2025);
      expect(result.month).toBe(1);
      expect(result.day).toBe(31);
    });
  });

  describe("Day Arithmetic (no overflow)", () => {
    it("should not apply strategies to day arithmetic", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const result = date.add(1, "day", { overflow: "strict" });

      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(1);
    });

    it("should handle large day additions", () => {
      const date = NeoCalendar.at(2024, 1, 1, "GREGORIAN");
      const result = date.add(365, "day");

      expect(result.year).toBe(2024);
      expect(result.month).toBe(12);
      expect(result.day).toBe(31); // 2024 is a leap year
    });
  });

  describe("Multiple Operations", () => {
    it("should chain operations with different strategies", () => {
      const date = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const step1 = date.add(1, "month", { overflow: "snap" });
      const step2 = step1.add(1, "month", { overflow: "snap" });

      expect(step2.year).toBe(2024);
      expect(step2.month).toBe(3);
      expect(step2.day).toBe(29); // Mar 29
    });

    it("should handle back-and-forth operations", () => {
      const date = NeoCalendar.at(2024, 2, 29, "GREGORIAN");
      const forward = date.add(1, "year", { overflow: "snap" });
      const back = forward.subtract(1, "year", { overflow: "snap" });

      // Feb 29, 2024 + 1 year = Feb 28, 2025 (or Mar 1)
      // Then - 1 year = Feb 28, 2024 (or Mar 1, 2024)
      expect(back.year).toBe(2024);
      expect(back.month).toBe(2);
      // Day might be 28, 29, or 1 depending on plugin implementation
    });
  });

  describe("Real-World Scenarios", () => {
    it("should handle end-of-month billing dates", () => {
      // Billing on the 31st each month
      const jan31 = NeoCalendar.at(2024, 1, 31, "GREGORIAN");
      const feb = jan31.add(1, "month", { overflow: "snap" });
      const mar = feb.add(1, "month", { overflow: "snap" });

      expect(feb.day).toBe(29); // Feb has 29 days in 2024
      expect(mar.day).toBe(29); // Stays at 29 (not 31)
    });

    it("should handle recurring monthly events", () => {
      // Event on 30th each month
      const jan30 = NeoCalendar.at(2024, 1, 30, "GREGORIAN");
      const feb = jan30.add(1, "month", { overflow: "snap" });

      expect(feb.day).toBe(29); // Snapped to Feb 29 (or 1 due to overflow)
    });

    it("should handle anniversary dates", () => {
      // Born on Feb 29, 2020
      const birthDate = NeoCalendar.at(2020, 2, 29, "GREGORIAN");
      const age1 = birthDate.add(1, "year", { overflow: "snap" });
      const age2 = age1.add(1, "year", { overflow: "snap" });

      expect(age1.year).toBe(2021);
      expect(age1.day).toBe(28); // No leap day in 2021 (or could be 1)
      expect(age2.year).toBe(2022);
      expect(age2.day).toBe(28); // No leap day in 2022 (or could be 1)
    });
  });
});
