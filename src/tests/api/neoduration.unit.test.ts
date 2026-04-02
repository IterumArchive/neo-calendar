/**
 * @file NeoDuration Unit Tests
 * @description Unit tests for NeoDuration class covering all documented methods
 */

import { describe, it, expect, beforeAll } from "vitest";
import { NeoDuration } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";

describe("NeoDuration Unit Tests", () => {
  beforeAll(() => {
    Registry.register(new GregorianPlugin());
  });

  describe("Constructor", () => {
    it("should create duration from days", () => {
      const duration = new NeoDuration(100);
      expect(duration.days).toBe(100);
    });

    it("should handle zero duration", () => {
      const duration = new NeoDuration(0);
      expect(duration.days).toBe(0);
    });

    it("should handle negative durations", () => {
      const duration = new NeoDuration(-10);
      expect(duration.days).toBe(-10);
    });

    it("should handle fractional days", () => {
      const duration = new NeoDuration(10.5);
      expect(duration.days).toBe(10.5);
    });
  });

  describe("Static Factory Methods", () => {
    describe("fromWeeks()", () => {
      it("should create duration from weeks", () => {
        const duration = NeoDuration.fromWeeks(2);
        expect(duration.days).toBe(14);
      });

      it("should handle fractional weeks", () => {
        const duration = NeoDuration.fromWeeks(1.5);
        expect(duration.days).toBe(10.5);
      });

      it("should handle zero weeks", () => {
        const duration = NeoDuration.fromWeeks(0);
        expect(duration.days).toBe(0);
      });
    });

    describe("fromMonths()", () => {
      it("should create duration from months", () => {
        const duration = NeoDuration.fromMonths(1, "GREGORIAN");
        expect(duration.toDays()).toBeCloseTo(30.44, 1);
      });

      it("should handle multiple months", () => {
        const duration = NeoDuration.fromMonths(12, "GREGORIAN");
        expect(duration.toDays()).toBeCloseTo(365.24, 1);
      });

      it("should default to Gregorian if no calendar specified", () => {
        const duration1 = NeoDuration.fromMonths(1);
        const duration2 = NeoDuration.fromMonths(1, "GREGORIAN");
        expect(duration1.days).toBeCloseTo(duration2.days, 2);
      });
    });

    describe("fromYears()", () => {
      it("should create duration from years", () => {
        const duration = NeoDuration.fromYears(1, "GREGORIAN");
        expect(duration.toDays()).toBeCloseTo(365.24, 1);
      });

      it("should handle multiple years", () => {
        const duration = NeoDuration.fromYears(5, "GREGORIAN");
        expect(duration.toDays()).toBeCloseTo(1826.2, 1);
      });

      it("should default to Gregorian if no calendar specified", () => {
        const duration1 = NeoDuration.fromYears(1);
        const duration2 = NeoDuration.fromYears(1, "GREGORIAN");
        expect(duration1.days).toBeCloseTo(duration2.days, 2);
      });
    });

    describe("from()", () => {
      it("should create duration from components", () => {
        const duration = NeoDuration.from({
          years: 1,
          months: 6,
          days: 15,
        });
        expect(duration.toDays()).toBeGreaterThan(500);
      });

      it("should handle only days", () => {
        const duration = NeoDuration.from({ days: 100 });
        expect(duration.days).toBe(100);
      });

      it("should handle only years", () => {
        const duration = NeoDuration.from({ years: 2 });
        expect(duration.toDays()).toBeCloseTo(730.5, 1);
      });

      it("should handle only months", () => {
        const duration = NeoDuration.from({ months: 3 });
        expect(duration.toDays()).toBeCloseTo(91.3, 1);
      });

      it("should combine all components", () => {
        const duration = NeoDuration.from({
          years: 1,
          months: 2,
          weeks: 1,
          days: 5,
        });
        // 1 year + 2 months + 1 week + 5 days
        expect(duration.toDays()).toBeGreaterThan(400);
      });
    });
  });

  describe("Unit Conversion Methods", () => {
    describe("toDays()", () => {
      it("should return days", () => {
        const duration = new NeoDuration(100);
        expect(duration.toDays()).toBe(100);
      });

      it("should return fractional days", () => {
        const duration = new NeoDuration(10.5);
        expect(duration.toDays()).toBe(10.5);
      });
    });

    describe("toWeeks()", () => {
      it("should convert days to weeks", () => {
        const duration = new NeoDuration(14);
        expect(duration.toWeeks()).toBe(2);
      });

      it("should handle fractional weeks", () => {
        const duration = new NeoDuration(10.5);
        expect(duration.toWeeks()).toBe(1.5);
      });

      it("should handle zero duration", () => {
        const duration = new NeoDuration(0);
        expect(duration.toWeeks()).toBe(0);
      });
    });

    describe("toMonths()", () => {
      it("should convert days to months (approximate)", () => {
        const duration = new NeoDuration(365.2425);
        expect(duration.toMonths("GREGORIAN")).toBeCloseTo(12, 1);
      });

      it("should handle partial months", () => {
        const duration = new NeoDuration(45);
        expect(duration.toMonths("GREGORIAN")).toBeCloseTo(1.48, 1);
      });

      it("should default to Gregorian if no calendar specified", () => {
        const duration = new NeoDuration(30.44);
        expect(duration.toMonths()).toBeCloseTo(1, 1);
      });
    });

    describe("toYears()", () => {
      it("should convert days to years (approximate)", () => {
        const duration = new NeoDuration(365.2425);
        expect(duration.toYears("GREGORIAN")).toBeCloseTo(1, 2);
      });

      it("should handle multiple years", () => {
        const duration = new NeoDuration(730.485);
        expect(duration.toYears("GREGORIAN")).toBeCloseTo(2, 1);
      });

      it("should default to Gregorian if no calendar specified", () => {
        const duration = new NeoDuration(365.2425);
        expect(duration.toYears()).toBeCloseTo(1, 2);
      });
    });
  });

  describe("Formatting Methods", () => {
    describe("toISODuration()", () => {
      it("should format as ISO 8601 duration", () => {
        const duration = new NeoDuration(100);
        const iso = duration.toISODuration();
        expect(iso).toContain("P");
        expect(iso).toContain("D");
      });

      it("should handle zero duration", () => {
        const duration = new NeoDuration(0);
        const iso = duration.toISODuration();
        expect(iso).toBe("P0D");
      });
    });

    describe("toComponents()", () => {
      it("should return duration components", () => {
        const duration = new NeoDuration(400);
        const components = duration.toComponents();

        expect(components).toBeDefined();
        if (components.years !== undefined) {
          expect(typeof components.years).toBe("number");
        }
        if (components.months !== undefined) {
          expect(typeof components.months).toBe("number");
        }
        if (components.days !== undefined) {
          expect(typeof components.days).toBe("number");
        }
      });

      it("should break down large durations", () => {
        const duration = new NeoDuration(730); // ~2 years
        const components = duration.toComponents();

        expect(components.years).toBeGreaterThan(0);
      });
    });
  });

  describe("Arithmetic Operations", () => {
    describe("add()", () => {
      it("should add two durations", () => {
        const d1 = new NeoDuration(10);
        const d2 = new NeoDuration(5);
        const result = d1.add(d2);

        expect(result.days).toBe(15);
      });

      it("should handle negative durations", () => {
        const d1 = new NeoDuration(10);
        const d2 = new NeoDuration(-5);
        const result = d1.add(d2);

        expect(result.days).toBe(5);
      });

      it("should not mutate original duration", () => {
        const d1 = new NeoDuration(10);
        const d2 = new NeoDuration(5);
        d1.add(d2);

        expect(d1.days).toBe(10); // Unchanged
      });
    });

    describe("subtract()", () => {
      it("should subtract two durations", () => {
        const d1 = new NeoDuration(10);
        const d2 = new NeoDuration(5);
        const result = d1.subtract(d2);

        expect(result.days).toBe(5);
      });

      it("should handle negative results", () => {
        const d1 = new NeoDuration(5);
        const d2 = new NeoDuration(10);
        const result = d1.subtract(d2);

        expect(result.days).toBe(-5);
      });

      it("should not mutate original duration", () => {
        const d1 = new NeoDuration(10);
        const d2 = new NeoDuration(5);
        d1.subtract(d2);

        expect(d1.days).toBe(10); // Unchanged
      });
    });

    describe("multiply()", () => {
      it("should multiply duration by scalar", () => {
        const duration = new NeoDuration(10);
        const result = duration.multiply(3);

        expect(result.days).toBe(30);
      });

      it("should handle fractional multipliers", () => {
        const duration = new NeoDuration(10);
        const result = duration.multiply(1.5);

        expect(result.days).toBe(15);
      });

      it("should not mutate original duration", () => {
        const duration = new NeoDuration(10);
        duration.multiply(3);

        expect(duration.days).toBe(10); // Unchanged
      });
    });

    describe("divide()", () => {
      it("should divide duration by scalar", () => {
        const duration = new NeoDuration(30);
        const result = duration.divide(3);

        expect(result.days).toBe(10);
      });

      it("should handle fractional results", () => {
        const duration = new NeoDuration(10);
        const result = duration.divide(3);

        expect(result.days).toBeCloseTo(3.33, 2);
      });

      it("should not mutate original duration", () => {
        const duration = new NeoDuration(30);
        duration.divide(3);

        expect(duration.days).toBe(30); // Unchanged
      });

      it("should throw on division by zero", () => {
        const duration = new NeoDuration(10);
        expect(() => duration.divide(0)).toThrow();
      });
    });
  });

  describe("Comparison Methods", () => {
    describe("equals()", () => {
      it("should return true for equal durations", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(100);

        expect(d1.equals(d2)).toBe(true);
      });

      it("should return false for different durations", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(50);

        expect(d1.equals(d2)).toBe(false);
      });

      it("should handle negative durations", () => {
        const d1 = new NeoDuration(-100);
        const d2 = new NeoDuration(-100);

        expect(d1.equals(d2)).toBe(true);
      });
    });

    describe.skip("isGreaterThan() - NOT IMPLEMENTED", () => {
      it("should return true when duration is greater", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(50);

        expect(d1.days > d2.days).toBe(true);
      });

      it("should return false when duration is less", () => {
        const d1 = new NeoDuration(50);
        const d2 = new NeoDuration(100);

        expect(d1.days > d2.days).toBe(false);
      });

      it("should return false when durations are equal", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(100);

        expect(d1.days > d2.days).toBe(false);
      });
    });

    describe.skip("isLessThan() - NOT IMPLEMENTED", () => {
      it("should return true when duration is less", () => {
        const d1 = new NeoDuration(50);
        const d2 = new NeoDuration(100);

        expect(d1.days < d2.days).toBe(true);
      });

      it("should return false when duration is greater", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(50);

        expect(d1.days < d2.days).toBe(false);
      });

      it("should return false when durations are equal", () => {
        const d1 = new NeoDuration(100);
        const d2 = new NeoDuration(100);

        expect(d1.days < d2.days).toBe(false);
      });
    });
  });

  describe("Immutability", () => {
    it("should not mutate on add", () => {
      const original = new NeoDuration(10);
      const added = original.add(new NeoDuration(5));

      expect(original.days).toBe(10);
      expect(added.days).toBe(15);
    });

    it("should not mutate on subtract", () => {
      const original = new NeoDuration(10);
      const subtracted = original.subtract(new NeoDuration(5));

      expect(original.days).toBe(10);
      expect(subtracted.days).toBe(5);
    });

    it("should not mutate on multiply", () => {
      const original = new NeoDuration(10);
      const multiplied = original.multiply(3);

      expect(original.days).toBe(10);
      expect(multiplied.days).toBe(30);
    });

    it("should not mutate on divide", () => {
      const original = new NeoDuration(30);
      const divided = original.divide(3);

      expect(original.days).toBe(30);
      expect(divided.days).toBe(10);
    });
  });
});
