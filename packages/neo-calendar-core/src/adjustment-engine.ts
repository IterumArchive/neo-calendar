/**
 * @file Adjustment Engine - Core adjustment application system
 * @description Applies administrative adjustments to calendar dates
 *
 * This engine handles:
 * - Priority-based rule sorting
 * - Geographic and temporal filtering
 * - Dependency resolution
 * - Conflict detection
 * - Observational data integration
 */

import type {
  AdjustmentContext,
  AdjustmentResult,
  AdjustmentRule,
  AppliedAdjustment,
  GeographicScope,
  GeographicContext,
  DatePrecision,
  RuleSetVersion,
  JDN,
} from "./ontology.types.js";
import { AdjustmentPriority } from "./ontology.types.js";

/**
 * Core adjustment application engine
 *
 * This is the "brain" that applies adjustment rules with:
 * - Priority-based ordering
 * - Geographic/temporal filtering
 * - Dependency resolution
 * - Conflict detection
 */
export class AdjustmentEngine {
  /**
   * Apply adjustment rules with priority sorting and filtering
   */
  static async applyAdjustments(
    context: AdjustmentContext,
    rules: AdjustmentRule[],
    options: {
      ruleSetVersion?: string;
      strictConflicts?: boolean; // Throw on conflicts vs skip
    } = {},
  ): Promise<{
    result: AdjustmentContext;
    applied: AppliedAdjustment[];
  }> {
    // Filter applicable rules
    const applicableRules = rules.filter(rule =>
      this.isApplicable(rule, context),
    );

    // Sort by priority (descending - highest first)
    const sortedRules = [...applicableRules].sort(
      (a, b) => b.priority - a.priority,
    );

    const applied: AppliedAdjustment[] = [];
    let current = { ...context };

    for (const rule of sortedRules) {
      // Check dependencies
      if (!this.checkDependencies(rule, applied)) {
        console.warn(`Rule ${rule.id} skipped: dependencies not met`);
        continue;
      }

      // Check exclusions
      if (this.hasExclusions(rule, applied)) {
        if (rule.conflictResolution === "error" || options.strictConflicts) {
          throw new AdjustmentConflictError(rule, applied);
        } else if (rule.conflictResolution === "skip") {
          continue;
        }
        // "override" or "compose" - continue applying
      }

      // Apply the rule (may be async for observational)
      const result = await Promise.resolve(rule.apply(current));

      if (result.applied) {
        // Apply the adjustment
        if (result.delta) {
          current.jdn = (current.jdn + BigInt(result.delta)) as JDN;
        }

        if (result.skipTo) {
          current.jdn = result.skipTo;
        }

        // Record the adjustment
        applied.push({
          ruleId: rule.id,
          category: rule.category,
          reason: rule.reason,
          delta: result.delta ?? 0,
          description: rule.description,
          timestamp: new Date(),
        });

        // Update context for next rule
        current.previousAdjustments = [...applied];
      }
    }

    return { result: current, applied };
  }

  /**
   * Check if a rule is applicable based on all constraints
   */
  private static isApplicable(
    rule: AdjustmentRule,
    context: AdjustmentContext,
  ): boolean {
    // Temporal scope check
    if (rule.validFrom && context.jdn < rule.validFrom) return false;
    if (rule.validTo && context.jdn > rule.validTo) return false;

    // Geographic scope check
    if (rule.geographicScope) {
      // Global scope always matches
      if (rule.geographicScope.type === "global") {
        return true;
      }

      // Other scope types require geographic context
      if (!context.geographic) {
        return false;
      }

      if (!this.matchesGeographic(rule.geographicScope, context.geographic)) {
        return false;
      }
    }

    // Precision check
    if (rule.minPrecision && context.precision) {
      if (!this.hasSufficientPrecision(context.precision, rule.minPrecision)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if geographic context matches rule scope
   */
  private static matchesGeographic(
    scope: GeographicScope,
    context: GeographicContext,
  ): boolean {
    if (scope.type === "global") return true;

    if (scope.type === "country" && scope.countries) {
      return context.country
        ? scope.countries.includes(context.country)
        : false;
    }

    if (scope.type === "region" && scope.regions) {
      return context.region ? scope.regions.includes(context.region) : false;
    }

    if (scope.type === "custom" && scope.matcher) {
      return scope.matcher(context);
    }

    return false;
  }

  /**
   * Check if context has sufficient precision for rule
   */
  private static hasSufficientPrecision(
    contextPrecision: DatePrecision,
    requiredPrecision: DatePrecision,
  ): boolean {
    const precisionOrder: DatePrecision[] = [
      "millennium",
      "century",
      "decade",
      "year",
      "month",
      "day",
    ];

    const contextIdx = precisionOrder.indexOf(contextPrecision);
    const requiredIdx = precisionOrder.indexOf(requiredPrecision);

    // Context must be at least as precise (higher index) as required
    return contextIdx >= requiredIdx;
  }

  /**
   * Check if rule dependencies are satisfied
   */
  private static checkDependencies(
    rule: AdjustmentRule,
    applied: AppliedAdjustment[],
  ): boolean {
    if (!rule.requires?.length) return true;

    const appliedIds = new Set(applied.map(a => a.ruleId));
    return rule.requires.every(reqId => appliedIds.has(reqId));
  }

  /**
   * Check if rule has exclusions with already-applied rules
   */
  private static hasExclusions(
    rule: AdjustmentRule,
    applied: AppliedAdjustment[],
  ): boolean {
    if (!rule.excludes?.length) return false;

    const appliedIds = new Set(applied.map(a => a.ruleId));
    return rule.excludes.some(excId => appliedIds.has(excId));
  }

  /**
   * Select appropriate rule set version
   */
  static selectRuleSetVersion(
    jdn: JDN,
    versions: RuleSetVersion[],
    preferredVersion?: string,
  ): RuleSetVersion | null {
    // If user specifies a version, use it
    if (preferredVersion && preferredVersion !== "auto") {
      return versions.find(v => v.id === preferredVersion) ?? null;
    }

    // Auto-select based on JDN
    const applicable = versions.filter(v => {
      if (v.effectiveFrom && jdn < v.effectiveFrom) return false;
      if (v.effectiveTo && jdn > v.effectiveTo) return false;
      return true;
    });

    // Sort by effectiveFrom (most recent first)
    applicable.sort((a, b) =>
      Number(
        (b.effectiveFrom ?? b.validFrom ?? BigInt(0)) -
          (a.effectiveFrom ?? a.validFrom ?? BigInt(0)),
      ),
    );

    return applicable[0] ?? null;
  }

  /**
   * Filter rules by version
   */
  static filterRulesByVersion(
    rules: AdjustmentRule[],
    version: RuleSetVersion | null,
  ): AdjustmentRule[] {
    if (!version) return rules;

    return rules.filter(rule => {
      return !rule.version || rule.version === version.id;
    });
  }

  /**
   * Validate that a date exists (not skipped)
   */
  static validateNotSkipped(
    jdn: JDN,
    rules: AdjustmentRule[],
  ): { valid: boolean; skipTo?: JDN; reason?: string } {
    const skipRules = rules.filter(r => r.category === "skip");

    for (const rule of skipRules) {
      if (rule.validFrom && rule.validTo) {
        if (jdn >= rule.validFrom && jdn <= rule.validTo) {
          return {
            valid: false,
            skipTo: (rule.validTo + BigInt(1)) as JDN,
            reason: rule.description,
          };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Quick check if any rules might apply (for lazy evaluation)
   */
  static hasApplicableRules(
    context: AdjustmentContext,
    rules: AdjustmentRule[],
  ): boolean {
    return rules.some(rule => this.isApplicable(rule, context));
  }
}

/**
 * Helper for creating common adjustment patterns
 */
export class AdjustmentPatterns {
  /**
   * Create a postponement rule
   *
   * Example: Hebrew Rosh Hashanah postponement
   */
  static createPostponement(config: {
    id: string;
    description: string;
    reason:
      | "religious"
      | "astronomical"
      | "political"
      | "mathematical"
      | "cultural";
    priority?: AdjustmentPriority; // Defaults to HIGH
    condition: (ctx: AdjustmentContext) => boolean;
    days: number; // How many days to shift (can be negative)
    validFrom?: JDN;
    validTo?: JDN;
    geographicScope?: GeographicScope;
  }): AdjustmentRule {
    const rule: AdjustmentRule = {
      id: config.id,
      category: "postponement",
      reason: config.reason,
      description: config.description,
      priority: config.priority ?? AdjustmentPriority.HIGH,
      apply: ctx => {
        if (config.condition(ctx)) {
          return {
            applied: true,
            delta: config.days,
            metadata: {
              originalJDN: ctx.jdn,
              adjustedJDN: ctx.jdn + BigInt(config.days),
            },
          };
        }
        return { applied: false };
      },
    };

    // Add optional fields only if provided
    if (config.validFrom !== undefined) rule.validFrom = config.validFrom;
    if (config.validTo !== undefined) rule.validTo = config.validTo;
    if (config.geographicScope !== undefined)
      rule.geographicScope = config.geographicScope;

    return rule;
  }

  /**
   * Create a skip range rule
   *
   * Example: Gregorian adoption skipped Oct 5-14, 1582
   */
  static createSkipRange(config: {
    id: string;
    description: string;
    reason:
      | "religious"
      | "astronomical"
      | "political"
      | "mathematical"
      | "cultural";
    priority?: AdjustmentPriority; // Defaults to CRITICAL
    skipFrom: JDN;
    skipTo: JDN;
    geographicScope?: GeographicScope;
  }): AdjustmentRule {
    const rule: AdjustmentRule = {
      id: config.id,
      category: "skip",
      reason: config.reason,
      description: config.description,
      priority: config.priority ?? AdjustmentPriority.CRITICAL, // Skip rules are critical
      validFrom: config.skipFrom,
      validTo: config.skipTo,
      apply: ctx => {
        // If JDN is in skip range, jump to next valid date
        if (ctx.jdn >= config.skipFrom && ctx.jdn <= config.skipTo) {
          return {
            applied: true,
            skipTo: (config.skipTo + BigInt(1)) as JDN,
            metadata: {
              originalJDN: ctx.jdn,
              skipReason: config.description,
            },
          };
        }
        return { applied: false };
      },
    };

    // Add optional geographic scope if provided
    if (config.geographicScope !== undefined)
      rule.geographicScope = config.geographicScope;

    return rule;
  }

  /**
   * Create a variable length rule
   *
   * Example: Hebrew Cheshvan can be 29 or 30 days
   */
  static createVariableLength(config: {
    id: string;
    description: string;
    reason:
      | "religious"
      | "astronomical"
      | "political"
      | "mathematical"
      | "cultural";
    priority?: AdjustmentPriority; // Defaults to NORMAL
    condition: (ctx: AdjustmentContext) => boolean;
    calculateLength: (ctx: AdjustmentContext) => number;
  }): AdjustmentRule {
    return {
      id: config.id,
      category: "variable_length",
      reason: config.reason,
      description: config.description,
      priority: config.priority ?? AdjustmentPriority.NORMAL,
      apply: ctx => {
        if (config.condition(ctx)) {
          const newLength = config.calculateLength(ctx);
          return {
            applied: true,
            newLength,
            metadata: {
              month: ctx.month,
              calculatedLength: newLength,
            },
          };
        }
        return { applied: false };
      },
    };
  }

  /**
   * Create a lookup table rule
   *
   * For historical dates with known adjustments
   */
  static createLookupTable(config: {
    id: string;
    description: string;
    reason:
      | "religious"
      | "astronomical"
      | "political"
      | "mathematical"
      | "cultural";
    priority?: AdjustmentPriority;
    table: Map<JDN, number>; // JDN -> delta days
  }): AdjustmentRule {
    return {
      id: config.id,
      category: "observational",
      reason: config.reason,
      priority: config.priority ?? AdjustmentPriority.NORMAL,
      description: config.description,
      apply: ctx => {
        const delta = config.table.get(ctx.jdn);
        if (delta !== undefined) {
          return {
            applied: true,
            delta,
            metadata: {
              source: "lookup_table",
              originalJDN: ctx.jdn,
            },
          };
        }
        return { applied: false };
      },
    };
  }
}

/**
 * Error thrown when conflicting rules are detected
 */
export class AdjustmentConflictError extends Error {
  constructor(
    public rule: AdjustmentRule,
    public conflictingAdjustments: AppliedAdjustment[],
  ) {
    super(
      `Rule ${rule.id} conflicts with ${conflictingAdjustments.map(a => a.ruleId).join(", ")}`,
    );
    this.name = "AdjustmentConflictError";
  }
}
