/**
 * @file Adjustment Engine Tests
 * @description Comprehensive unit tests for the adjustment system
 */

import { describe, it, expect } from "vitest";
import {
  AdjustmentEngine,
  AdjustmentPatterns,
  AdjustmentConflictError,
} from "@iterumarchive/neo-calendar-core";
import { AdjustmentPriority } from "@iterumarchive/neo-calendar-core";
import type {
  AdjustmentContext,
  AdjustmentRule,
  JDN,
  GeographicScope,
  DatePrecision,
  RuleSetVersion,
} from "@iterumarchive/neo-calendar-core";

describe("AdjustmentEngine", () => {
  // ============================================================================
  // BASIC RULE APPLICATION
  // ============================================================================

  describe("applyAdjustments()", () => {
    it("should apply single adjustment rule", async () => {
      const rule: AdjustmentRule = {
        id: "test.postponement",
        category: "postponement",
        reason: "religious",
        description: "Test rule",
        priority: AdjustmentPriority.NORMAL,
        apply: ctx => ({ applied: true, delta: 1 }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [rule],
      );

      expect(result.jdn).toBe(BigInt(2460001));
      expect(applied).toHaveLength(1);
      expect(applied[0].ruleId).toBe("test.postponement");
      expect(applied[0].delta).toBe(1);
    });

    it("should apply multiple adjustments cumulatively", async () => {
      const rule1 = AdjustmentPatterns.createPostponement({
        id: "test.postpone1",
        description: "First postponement",
        reason: "religious",
        condition: () => true,
        days: 1,
      });

      const rule2 = AdjustmentPatterns.createPostponement({
        id: "test.postpone2",
        description: "Second postponement",
        reason: "religious",
        condition: () => true,
        days: 2,
      });

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [rule1, rule2],
      );

      expect(result.jdn).toBe(BigInt(2460003)); // 1 + 2 days
      expect(applied).toHaveLength(2);
    });

    it("should skip rules that don't apply", async () => {
      const rule: AdjustmentRule = {
        id: "test.conditional",
        category: "postponement",
        reason: "religious",
        description: "Only applies on condition",
        priority: AdjustmentPriority.NORMAL,
        apply: ctx => ({ applied: false }), // Never applies
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [rule],
      );

      expect(result.jdn).toBe(BigInt(2460000)); // No change
      expect(applied).toHaveLength(0);
    });

    it("should handle negative deltas (backward shift)", async () => {
      const rule = AdjustmentPatterns.createPostponement({
        id: "test.backward",
        description: "Shift backward",
        reason: "mathematical",
        condition: () => true,
        days: -3,
      });

      const context: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [rule],
      );

      expect(result.jdn).toBe(BigInt(2459997));
      expect(applied[0].delta).toBe(-3);
    });
  });

  // ============================================================================
  // PRIORITY SORTING
  // ============================================================================

  describe("Priority Sorting", () => {
    it("should apply rules in priority order", async () => {
      const appliedOrder: string[] = [];

      const lowPriority: AdjustmentRule = {
        id: "low",
        category: "postponement",
        reason: "cultural",
        description: "Low priority",
        priority: AdjustmentPriority.LOW,
        apply: ctx => {
          appliedOrder.push("low");
          return { applied: true, delta: 0 };
        },
      };

      const highPriority: AdjustmentRule = {
        id: "high",
        category: "postponement",
        reason: "religious",
        description: "High priority",
        priority: AdjustmentPriority.HIGH,
        apply: ctx => {
          appliedOrder.push("high");
          return { applied: true, delta: 0 };
        },
      };

      const criticalPriority: AdjustmentRule = {
        id: "critical",
        category: "skip",
        reason: "political",
        description: "Critical priority",
        priority: AdjustmentPriority.CRITICAL,
        apply: ctx => {
          appliedOrder.push("critical");
          return { applied: true, delta: 0 };
        },
      };

      const context: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      await AdjustmentEngine.applyAdjustments(context, [
        lowPriority,
        highPriority,
        criticalPriority,
      ]);

      // Should be applied in priority order: CRITICAL, HIGH, LOW
      expect(appliedOrder).toEqual(["critical", "high", "low"]);
    });
  });

  // ============================================================================
  // TEMPORAL SCOPE FILTERING
  // ============================================================================

  describe("Temporal Scope", () => {
    it("should respect validFrom range", async () => {
      const rule: AdjustmentRule = {
        id: "test.temporal",
        category: "postponement",
        reason: "religious",
        description: "Only valid from JDN 2460100",
        priority: AdjustmentPriority.NORMAL,
        validFrom: BigInt(2460100) as JDN,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Before range - should not apply
      const ctx1: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460050) as JDN,
        direction: "toJDN",
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(0);

      // In range - should apply
      const ctx2: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460100) as JDN,
        direction: "toJDN",
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(1);
    });

    it("should respect validTo range", async () => {
      const rule: AdjustmentRule = {
        id: "test.temporal",
        category: "postponement",
        reason: "religious",
        description: "Only valid until JDN 2460200",
        priority: AdjustmentPriority.NORMAL,
        validTo: BigInt(2460200) as JDN,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // In range - should apply
      const ctx1: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460200) as JDN,
        direction: "toJDN",
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(1);

      // After range - should not apply
      const ctx2: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460300) as JDN,
        direction: "toJDN",
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(0);
    });

    it("should respect both validFrom and validTo", async () => {
      const rule: AdjustmentRule = {
        id: "test.temporal",
        category: "postponement",
        reason: "religious",
        description: "Valid in specific range",
        priority: AdjustmentPriority.NORMAL,
        validFrom: BigInt(2460100) as JDN,
        validTo: BigInt(2460200) as JDN,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Before - should not apply
      const ctx1: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460050) as JDN,
        direction: "toJDN",
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(0);

      // In range - should apply
      const ctx2: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460150) as JDN,
        direction: "toJDN",
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(1);

      // After - should not apply
      const ctx3: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460250) as JDN,
        direction: "toJDN",
      };
      const result3 = await AdjustmentEngine.applyAdjustments(ctx3, [rule]);
      expect(result3.applied).toHaveLength(0);
    });
  });

  // ============================================================================
  // GEOGRAPHIC SCOPE FILTERING
  // ============================================================================

  describe("Geographic Scope", () => {
    it("should filter by country", async () => {
      const scope: GeographicScope = {
        type: "country",
        countries: ["IT", "ES"],
      };

      const rule: AdjustmentRule = {
        id: "test.geographic",
        category: "skip",
        reason: "political",
        description: "Only applies in Italy/Spain",
        priority: AdjustmentPriority.CRITICAL,
        geographicScope: scope,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Matching country - should apply
      const ctx1: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        geographic: { country: "IT" },
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(1);

      // Non-matching country - should not apply
      const ctx2: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        geographic: { country: "GB" },
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(0);

      // No geographic context - should not apply
      const ctx3: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };
      const result3 = await AdjustmentEngine.applyAdjustments(ctx3, [rule]);
      expect(result3.applied).toHaveLength(0);
    });

    it("should handle global scope", async () => {
      const scope: GeographicScope = {
        type: "global",
      };

      const rule: AdjustmentRule = {
        id: "test.global",
        category: "postponement",
        reason: "religious",
        description: "Applies everywhere",
        priority: AdjustmentPriority.NORMAL,
        geographicScope: scope,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Should apply without geographic context
      const ctx: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };
      const result = await AdjustmentEngine.applyAdjustments(ctx, [rule]);
      expect(result.applied).toHaveLength(1);
    });

    it("should filter by custom matcher", async () => {
      const scope: GeographicScope = {
        type: "custom",
        matcher: ctx => {
          // Custom logic: only apply if country starts with "U"
          return ctx.country?.startsWith("U") ?? false;
        },
      };

      const rule: AdjustmentRule = {
        id: "test.custom",
        category: "postponement",
        reason: "cultural",
        description: "Custom geographic matching",
        priority: AdjustmentPriority.NORMAL,
        geographicScope: scope,
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Matching custom condition
      const ctx1: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        geographic: { country: "US" },
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(1);

      // Non-matching custom condition
      const ctx2: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        geographic: { country: "FR" },
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(0);
    });
  });

  // ============================================================================
  // PRECISION FILTERING
  // ============================================================================

  describe("Precision Filtering", () => {
    it("should require sufficient precision", async () => {
      const rule: AdjustmentRule = {
        id: "test.precision",
        category: "postponement",
        reason: "religious",
        description: "Requires day-level precision",
        priority: AdjustmentPriority.NORMAL,
        minPrecision: "day",
        apply: () => ({ applied: true, delta: 1 }),
      };

      // Day precision - should apply
      const ctx1: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        precision: "day",
      };
      const result1 = await AdjustmentEngine.applyAdjustments(ctx1, [rule]);
      expect(result1.applied).toHaveLength(1);

      // Year precision (insufficient) - should not apply
      const ctx2: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        precision: "year",
      };
      const result2 = await AdjustmentEngine.applyAdjustments(ctx2, [rule]);
      expect(result2.applied).toHaveLength(0);
    });

    it("should understand precision hierarchy", async () => {
      const rule: AdjustmentRule = {
        id: "test.precision",
        category: "postponement",
        reason: "religious",
        description: "Requires at least month precision",
        priority: AdjustmentPriority.NORMAL,
        minPrecision: "month",
        apply: () => ({ applied: true, delta: 1 }),
      };

      const contexts: Array<{
        precision: DatePrecision;
        shouldApply: boolean;
      }> = [
        { precision: "millennium", shouldApply: false },
        { precision: "century", shouldApply: false },
        { precision: "decade", shouldApply: false },
        { precision: "year", shouldApply: false },
        { precision: "month", shouldApply: true },
        { precision: "day", shouldApply: true },
      ];

      for (const { precision, shouldApply } of contexts) {
        const ctx: AdjustmentContext = {
          calendar: "HEBREW",
          jdn: BigInt(2460000) as JDN,
          direction: "toJDN",
          precision,
        };
        const result = await AdjustmentEngine.applyAdjustments(ctx, [rule]);
        expect(result.applied.length).toBe(shouldApply ? 1 : 0);
      }
    });
  });

  // ============================================================================
  // DEPENDENCIES & EXCLUSIONS
  // ============================================================================

  describe("Dependencies", () => {
    it("should require dependencies to be met", async () => {
      const rule1: AdjustmentRule = {
        id: "base",
        category: "variable_length",
        reason: "mathematical",
        description: "Base rule",
        priority: AdjustmentPriority.NORMAL, // Lower priority - evaluated first
        apply: () => ({ applied: true, delta: 0 }),
      };

      const rule2: AdjustmentRule = {
        id: "dependent",
        category: "postponement",
        reason: "religious",
        description: "Depends on base",
        priority: AdjustmentPriority.LOW, // Higher priority but depends on base
        requires: ["base"],
        apply: () => ({ applied: true, delta: 1 }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      // With both rules - should apply both
      const result1 = await AdjustmentEngine.applyAdjustments(context, [
        rule1,
        rule2,
      ]);
      expect(result1.applied).toHaveLength(2);

      // Without base rule - dependent should not apply
      const result2 = await AdjustmentEngine.applyAdjustments(context, [rule2]);
      expect(result2.applied).toHaveLength(0);
    });

    it("should handle exclusions with skip strategy", async () => {
      const rule1: AdjustmentRule = {
        id: "rule1",
        category: "postponement",
        reason: "religious",
        description: "First rule",
        priority: AdjustmentPriority.HIGH,
        apply: () => ({ applied: true, delta: 1 }),
      };

      const rule2: AdjustmentRule = {
        id: "rule2",
        category: "postponement",
        reason: "religious",
        description: "Conflicts with rule1",
        priority: AdjustmentPriority.NORMAL,
        excludes: ["rule1"],
        conflictResolution: "skip",
        apply: () => ({ applied: true, delta: 2 }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const result = await AdjustmentEngine.applyAdjustments(context, [
        rule1,
        rule2,
      ]);

      // rule1 should apply (higher priority), rule2 should be skipped
      expect(result.applied).toHaveLength(1);
      expect(result.applied[0].ruleId).toBe("rule1");
    });

    it("should throw on conflict with error strategy", async () => {
      const rule1: AdjustmentRule = {
        id: "rule1",
        category: "postponement",
        reason: "religious",
        description: "First rule",
        priority: AdjustmentPriority.HIGH,
        apply: () => ({ applied: true, delta: 1 }),
      };

      const rule2: AdjustmentRule = {
        id: "rule2",
        category: "postponement",
        reason: "religious",
        description: "Conflicts with rule1",
        priority: AdjustmentPriority.NORMAL,
        excludes: ["rule1"],
        conflictResolution: "error",
        apply: () => ({ applied: true, delta: 2 }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      await expect(
        AdjustmentEngine.applyAdjustments(context, [rule1, rule2]),
      ).rejects.toThrow(AdjustmentConflictError);
    });
  });

  // ============================================================================
  // SKIP DATE VALIDATION
  // ============================================================================

  describe("validateNotSkipped()", () => {
    it("should detect skipped dates", () => {
      const skipRule = AdjustmentPatterns.createSkipRange({
        id: "gregorian.skip.italy",
        description: "Gregorian adoption in Italy",
        reason: "political",
        skipFrom: BigInt(2299161) as JDN, // Oct 5, 1582
        skipTo: BigInt(2299170) as JDN, // Oct 14, 1582
      });

      // Date in skip range
      const result1 = AdjustmentEngine.validateNotSkipped(
        BigInt(2299165) as JDN,
        [skipRule],
      );
      expect(result1.valid).toBe(false);
      expect(result1.skipTo).toBe(BigInt(2299171));
      expect(result1.reason).toContain("Gregorian adoption");

      // Date outside skip range
      const result2 = AdjustmentEngine.validateNotSkipped(
        BigInt(2299171) as JDN,
        [skipRule],
      );
      expect(result2.valid).toBe(true);
    });
  });

  // ============================================================================
  // RULE SET VERSIONING
  // ============================================================================

  describe("selectRuleSetVersion()", () => {
    it("should select version based on JDN", () => {
      const versions: RuleSetVersion[] = [
        {
          id: "v1",
          description: "Original version",
          effectiveFrom: BigInt(2400000) as JDN,
          effectiveTo: BigInt(2450000) as JDN,
        },
        {
          id: "v2",
          description: "Modern version",
          effectiveFrom: BigInt(2450001) as JDN,
        },
      ];

      // JDN in v1 range
      const v1 = AdjustmentEngine.selectRuleSetVersion(
        BigInt(2425000) as JDN,
        versions,
      );
      expect(v1?.id).toBe("v1");

      // JDN in v2 range
      const v2 = AdjustmentEngine.selectRuleSetVersion(
        BigInt(2460000) as JDN,
        versions,
      );
      expect(v2?.id).toBe("v2");
    });

    it("should respect preferred version", () => {
      const versions: RuleSetVersion[] = [
        {
          id: "modern",
          description: "Modern version",
          effectiveFrom: BigInt(2450000) as JDN,
        },
        {
          id: "traditional",
          description: "Traditional version",
          effectiveFrom: BigInt(2400000) as JDN,
        },
      ];

      const selected = AdjustmentEngine.selectRuleSetVersion(
        BigInt(2460000) as JDN,
        versions,
        "traditional",
      );
      expect(selected?.id).toBe("traditional");
    });
  });

  // ============================================================================
  // LAZY EVALUATION
  // ============================================================================

  describe("hasApplicableRules()", () => {
    it("should quickly check if any rules apply", () => {
      const rule1: AdjustmentRule = {
        id: "test.temporal",
        category: "postponement",
        reason: "religious",
        description: "Only valid far in future",
        priority: AdjustmentPriority.NORMAL,
        validFrom: BigInt(3000000) as JDN,
        apply: () => ({ applied: true, delta: 1 }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const hasApplicable = AdjustmentEngine.hasApplicableRules(context, [
        rule1,
      ]);
      expect(hasApplicable).toBe(false);
    });
  });

  // ============================================================================
  // ADJUSTMENT PATTERNS HELPERS
  // ============================================================================

  describe("AdjustmentPatterns", () => {
    describe("createPostponement()", () => {
      it("should create postponement rule", async () => {
        const rule = AdjustmentPatterns.createPostponement({
          id: "test.postpone",
          description: "Test postponement",
          reason: "religious",
          condition: ctx => ctx.year === 5784,
          days: 2,
        });

        expect(rule.category).toBe("postponement");
        expect(rule.priority).toBe(AdjustmentPriority.HIGH);

        const ctx: AdjustmentContext = {
          calendar: "HEBREW",
          jdn: BigInt(2460000) as JDN,
          direction: "toJDN",
          year: 5784,
        };

        const result = rule.apply(ctx);
        expect(result.applied).toBe(true);
        expect(result.delta).toBe(2);
      });
    });

    describe("createSkipRange()", () => {
      it("should create skip rule", () => {
        const rule = AdjustmentPatterns.createSkipRange({
          id: "test.skip",
          description: "Skip dates",
          reason: "political",
          skipFrom: BigInt(100) as JDN,
          skipTo: BigInt(110) as JDN,
        });

        expect(rule.category).toBe("skip");
        expect(rule.priority).toBe(AdjustmentPriority.CRITICAL);

        // In skip range
        const ctx1: AdjustmentContext = {
          calendar: "GREGORIAN",
          jdn: BigInt(105) as JDN,
          direction: "toJDN",
        };
        const result1 = rule.apply(ctx1);
        expect(result1.applied).toBe(true);
        expect(result1.skipTo).toBe(BigInt(111));

        // Outside skip range
        const ctx2: AdjustmentContext = {
          calendar: "GREGORIAN",
          jdn: BigInt(120) as JDN,
          direction: "toJDN",
        };
        const result2 = rule.apply(ctx2);
        expect(result2.applied).toBe(false);
      });
    });

    describe("createVariableLength()", () => {
      it("should create variable length rule", () => {
        const rule = AdjustmentPatterns.createVariableLength({
          id: "test.variable",
          description: "Variable month length",
          reason: "mathematical",
          condition: ctx => ctx.month === 2,
          calculateLength: ctx => (ctx.year! % 4 === 0 ? 29 : 30),
        });

        expect(rule.category).toBe("variable_length");

        // Leap year
        const ctx1: AdjustmentContext = {
          calendar: "HEBREW",
          jdn: BigInt(2460000) as JDN,
          direction: "toJDN",
          year: 5784,
          month: 2,
        };
        const result1 = rule.apply(ctx1);
        expect(result1.applied).toBe(true);
        expect(result1.newLength).toBe(29);
      });
    });

    describe("createLookupTable()", () => {
      it("should create lookup table rule", () => {
        const table = new Map<JDN, number>([
          [BigInt(2460000) as JDN, 1],
          [BigInt(2460100) as JDN, 2],
          [BigInt(2460200) as JDN, -1],
        ]);

        const rule = AdjustmentPatterns.createLookupTable({
          id: "test.lookup",
          description: "Lookup table",
          reason: "observational",
          table,
        });

        expect(rule.category).toBe("observational");

        // Found in table
        const ctx1: AdjustmentContext = {
          calendar: "ISLAMIC",
          jdn: BigInt(2460100) as JDN,
          direction: "toJDN",
        };
        const result1 = rule.apply(ctx1);
        expect(result1.applied).toBe(true);
        expect(result1.delta).toBe(2);

        // Not in table
        const ctx2: AdjustmentContext = {
          calendar: "ISLAMIC",
          jdn: BigInt(2460150) as JDN,
          direction: "toJDN",
        };
        const result2 = rule.apply(ctx2);
        expect(result2.applied).toBe(false);
      });
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe("Edge Cases", () => {
    it("should handle empty rules array", async () => {
      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [],
      );

      expect(result.jdn).toBe(BigInt(2460000)); // No change
      expect(applied).toHaveLength(0);
    });

    it("should handle async rule application", async () => {
      const asyncRule: AdjustmentRule = {
        id: "test.async",
        category: "observational",
        reason: "astronomical",
        description: "Async rule",
        priority: AdjustmentPriority.NORMAL,
        apply: async ctx => {
          // Simulate async operation
          await new Promise(resolve => setTimeout(resolve, 1));
          return { applied: true, delta: 1 };
        },
      };

      const context: AdjustmentContext = {
        calendar: "ISLAMIC",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { result, applied } = await AdjustmentEngine.applyAdjustments(
        context,
        [asyncRule],
      );

      expect(result.jdn).toBe(BigInt(2460001));
      expect(applied).toHaveLength(1);
    });

    it("should preserve metadata through adjustments", async () => {
      const rule: AdjustmentRule = {
        id: "test.metadata",
        category: "postponement",
        reason: "religious",
        description: "Rule with metadata",
        priority: AdjustmentPriority.NORMAL,
        apply: ctx => ({
          applied: true,
          delta: 1,
          metadata: {
            reason: "test",
            customField: "value",
          },
        }),
      };

      const context: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const { applied } = await AdjustmentEngine.applyAdjustments(context, [
        rule,
      ]);

      expect(applied[0].description).toBe("Rule with metadata");
    });
  });
});
