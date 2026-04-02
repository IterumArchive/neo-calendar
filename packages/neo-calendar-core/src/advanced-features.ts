/**
 * @file Advanced Adjustment Features
 * @description Demonstrations of Week 4 extensibility features:
 * - Day boundary adjustments
 * - Observational data sources
 * - Partial date support
 * - Rule versioning
 *
 * These examples validate that the adjustment system can handle
 * advanced use cases beyond the core Hebrew/Gregorian implementations.
 */

import type {
  AdjustmentRule,
  AdjustmentContext,
  AdjustmentResult,
  DayBoundary,
  TimeOfDay,
  ObservationalDataSource,
  ObservationalQuery,
  ObservationalData,
  DatePrecision,
  RuleSetVersion,
  JDN,
} from "./ontology.types.js";
import { AdjustmentPriority } from "./ontology.types.js";

// ============================================================================
// 1. DAY BOUNDARY ADJUSTMENTS
// ============================================================================

/**
 * Helper: Check if time is after the day boundary
 */
function isAfterBoundary(timeOfDay: TimeOfDay, boundary: DayBoundary): boolean {
  if (boundary.type === "fixed") {
    // Convert both to fractional day (0.0 = midnight, 0.5 = noon, 0.75 = 18:00)
    const timeFraction =
      timeOfDay.hour / 24 +
      timeOfDay.minute / 1440 +
      (timeOfDay.second || 0) / 86400;

    let boundaryFraction: number;
    switch (boundary.time) {
      case "midnight":
        boundaryFraction = 0.0;
        break;
      case "noon":
        boundaryFraction = 0.5;
        break;
      case "sunset":
        boundaryFraction = 0.75;
        break; // Approximate
      case "sunrise":
        boundaryFraction = 0.25;
        break; // Approximate
      default:
        boundaryFraction = 0.0;
    }

    return timeFraction >= boundaryFraction;
  }

  // Astronomical boundaries would require calculation
  // For now, treat as approximate fixed time
  return timeOfDay.hour >= 18; // Approximate sunset
}

/**
 * Example: Hebrew sunset boundary rule
 *
 * Hebrew days begin at sunset (~18:00). Events after sunset
 * belong to the next calendar day.
 */
export const HebrewSunsetBoundaryRule: AdjustmentRule = {
  id: "hebrew.day_boundary.sunset",
  category: "day_boundary",
  priority: AdjustmentPriority.CRITICAL, // Must apply first
  reason: "religious",
  description:
    "Hebrew day begins at sunset. Events after sunset belong to the next day.",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    // Only apply if we have time-of-day information
    if (!ctx.timeOfDay) {
      return { applied: false };
    }

    const boundary: DayBoundary = {
      type: "fixed",
      time: "sunset",
    };

    // If event is after sunset, advance to next day
    if (isAfterBoundary(ctx.timeOfDay, boundary)) {
      return {
        applied: true,
        delta: 1, // Advance by 1 day
        reason: "religious",
        metadata: {
          boundary: "sunset",
          originalJDN: ctx.jdn,
          adjustedJDN: ctx.jdn + BigInt(1),
          timeOfDay: ctx.timeOfDay,
        },
      };
    }

    return { applied: false };
  },
};

/**
 * Example: Islamic sunset boundary rule
 *
 * Islamic days also begin at sunset.
 */
export const IslamicSunsetBoundaryRule: AdjustmentRule = {
  id: "islamic.day_boundary.sunset",
  category: "day_boundary",
  priority: AdjustmentPriority.CRITICAL,
  reason: "religious",
  description:
    "Islamic day begins at sunset (maghrib). Events after sunset belong to the next day.",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    if (!ctx.timeOfDay) {
      return { applied: false };
    }

    const boundary: DayBoundary = {
      type: "fixed",
      time: "sunset",
    };

    if (isAfterBoundary(ctx.timeOfDay, boundary)) {
      return {
        applied: true,
        delta: 1,
        reason: "religious",
        metadata: {
          boundary: "sunset (maghrib)",
          note: "In observational practice, maghrib time varies by location and season",
        },
      };
    }

    return { applied: false };
  },
};

/**
 * Example: Astronomical Julian Date boundary rule
 *
 * Astronomical JD begins at noon (not midnight).
 */
export const AstronomicalNoonBoundaryRule: AdjustmentRule = {
  id: "astronomical.day_boundary.noon",
  category: "day_boundary",
  priority: AdjustmentPriority.CRITICAL,
  reason: "astronomical",
  description:
    "Astronomical Julian Date begins at noon (12:00 UT). Events before noon belong to previous JD.",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    if (!ctx.timeOfDay) {
      return { applied: false };
    }

    const boundary: DayBoundary = {
      type: "fixed",
      time: "noon",
    };

    // If event is before noon, it's still the previous JD
    if (!isAfterBoundary(ctx.timeOfDay, boundary)) {
      return {
        applied: true,
        delta: -1, // Go back 1 day
        reason: "astronomical",
        metadata: {
          boundary: "noon",
          note: "Astronomical convention: JD starts at noon UT",
        },
      };
    }

    return { applied: false };
  },
};

// ============================================================================
// 2. OBSERVATIONAL DATA SOURCES
// ============================================================================

/**
 * Mock observational data source for testing
 *
 * In production, this would query:
 * - Saudi Hilal Committee for Islamic months
 * - Ancient witness records for historical Hebrew dates
 * - Astronomical databases for moon sighting
 */
export class MockObservationalDataSource implements ObservationalDataSource {
  id = "mock.observational";
  type: "custom" = "custom";
  name = "Mock Observational Data";
  description = "Test data source for demonstration";

  // Mock data: map of query key → observation
  private mockData = new Map<string, ObservationalData>();

  /**
   * Add mock observation for testing
   */
  addMockObservation(
    calendar: string,
    jdn: JDN,
    event: string,
    data: ObservationalData,
  ): void {
    const key = `${calendar}:${jdn}:${event}`;
    this.mockData.set(key, data);
  }

  async query(query: ObservationalQuery): Promise<ObservationalData | null> {
    const key = `${query.calendar}:${query.jdn}:${query.event}`;
    return this.mockData.get(key) || null;
  }
}

/**
 * Example: Islamic moon sighting rule
 *
 * Traditional Islamic calendar uses actual moon sighting
 * to determine month start, not calculation.
 */
export function createIslamicMoonSightingRule(
  dataSource: ObservationalDataSource,
): AdjustmentRule {
  return {
    id: "islamic.observational.moon_sighting",
    category: "observational",
    priority: AdjustmentPriority.HIGH,
    reason: "astronomical",
    description:
      "Islamic month begins when crescent moon is sighted (observational variant)",

    apply: async (ctx: AdjustmentContext): Promise<AdjustmentResult> => {
      // Only apply for Islamic calendar
      if (ctx.calendar !== "ISLAMIC_OBSERVATIONAL") {
        return { applied: false };
      }

      // Query observational data
      const observation = await dataSource.query({
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn: ctx.jdn,
        event: "month_start",
        ...(ctx.geographic && { geographic: ctx.geographic }),
      });

      // If we have observational data, use it
      if (observation?.observed) {
        const calculatedJDN = ctx.jdn;
        const observedJDN = observation.jdn!;
        const delta = Number(observedJDN - calculatedJDN);

        if (delta !== 0) {
          return {
            applied: true,
            delta,
            reason: "astronomical",
            metadata: {
              calculatedJDN,
              observedJDN,
              source: observation.source,
              confidence: observation.confidence,
              note: "Observational data overrides calculation",
            },
          };
        }
      }

      // No observation available, use calculation (fallback)
      return { applied: false };
    },
  };
}

// ============================================================================
// 3. PARTIAL DATE SUPPORT
// ============================================================================

/**
 * Helper: Check if date has sufficient precision
 */
function hasSufficientPrecision(
  available: DatePrecision,
  required: DatePrecision,
): boolean {
  const hierarchy: DatePrecision[] = [
    "millennium",
    "century",
    "decade",
    "year",
    "month",
    "day",
  ];

  const availableLevel = hierarchy.indexOf(available);
  const requiredLevel = hierarchy.indexOf(required);

  return availableLevel >= requiredLevel;
}

/**
 * Example: Year-only adjustment rule
 *
 * Some rules only make sense for full dates, not year-only.
 * This demonstrates the minPrecision filtering.
 */
export const YearOnlyFilterExample: AdjustmentRule = {
  id: "example.year_only_filter",
  category: "skip",
  priority: AdjustmentPriority.NORMAL,
  minPrecision: "day", // Requires day-level precision
  reason: "mathematical",
  description: "Example rule that requires full date (not just year)",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    // Engine will filter this out if precision < day
    // This code only runs for full dates

    return {
      applied: true,
      delta: 0,
      reason: "mathematical",
      metadata: {
        note: "This rule only applies to full dates (year-month-day)",
        precision: "day",
      },
    };
  },
};

/**
 * Example: BP calendar year-only rule
 *
 * Archaeological dates like "5000 BP" are year-only.
 * Month-level rules should be skipped.
 */
export const BPYearOnlyRule: AdjustmentRule = {
  id: "bp.year_only_support",
  category: "epoch_shift",
  priority: AdjustmentPriority.LOW,
  minPrecision: "year", // Only requires year precision
  reason: "cultural",
  description: "BP calendar supports year-only dates for archaeological use",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    // This rule can handle partial dates (year-only)

    return {
      applied: true,
      delta: 0,
      reason: "cultural",
      metadata: {
        note: "Year-only date is valid for BP calendar",
        precision: ctx.date?.precision || "year",
      },
    };
  },
};

// ============================================================================
// 4. RULE VERSIONING
// ============================================================================

/**
 * Example: Hebrew calendar versions
 *
 * The Hebrew calendar has evolved:
 * - Ancient: Observational (witness-based, before ~358 CE)
 * - Medieval: Fixed calculation with dehiyyot (358 CE - present)
 * - Modern: Same rules, different historical context
 */
export const HebrewRuleVersions: RuleSetVersion[] = [
  {
    id: "hebrew.ancient",
    name: "Ancient Hebrew Calendar (Observational)",
    description: "Witness-based moon sighting, before Hillel II reforms",
    validFrom: BigInt(1000000) as JDN, // Ancient times
    validTo: BigInt(1842542) as JDN, // ~358 CE
    authority: "Sanhedrin witness testimony",
    notes: "Month start determined by two witnesses seeing new moon",
  },
  {
    id: "hebrew.medieval",
    name: "Fixed Hebrew Calendar (Hillel II)",
    description: "Calculated calendar with dehiyyot rules",
    validFrom: BigInt(1842543) as JDN, // 358 CE
    // validTo: undefined, // Still in use (omit property instead of explicit undefined)
    authority: "Hillel II reforms (~358 CE)",
    notes: "Modern fixed calculation with postponement rules",
  },
];

/**
 * Example: Ancient Hebrew observational rule (pre-358 CE)
 */
export const HebrewAncientObservationalRule: AdjustmentRule = {
  id: "hebrew.ancient.observational",
  category: "observational",
  priority: AdjustmentPriority.HIGH,
  version: "hebrew.ancient",
  validFrom: BigInt(1000000) as JDN,
  validTo: BigInt(1842542) as JDN,
  reason: "religious",
  description: "Ancient Hebrew calendar based on witness testimony of new moon",

  apply: async (ctx: AdjustmentContext): Promise<AdjustmentResult> => {
    // This rule only applies before 358 CE
    // Would query historical records or astronomical reconstruction

    return {
      applied: false,
      reason: "religious",
      metadata: {
        note: "Historical observational calendar - requires data source",
        version: "hebrew.ancient",
      },
    };
  },
};

/**
 * Example: Modern Hebrew fixed rule (post-358 CE)
 */
export const HebrewModernFixedRule: AdjustmentRule = {
  id: "hebrew.modern.fixed",
  category: "postponement",
  priority: AdjustmentPriority.HIGH,
  version: "hebrew.medieval",
  validFrom: BigInt(1842543) as JDN,
  reason: "religious",
  description: "Modern Hebrew calendar with fixed dehiyyot rules",

  apply: (ctx: AdjustmentContext): AdjustmentResult => {
    // This is what we implemented in Week 2
    // Modern calculated calendar with postponements

    return {
      applied: true,
      delta: 0,
      reason: "religious",
      metadata: {
        note: "Modern fixed calculation with dehiyyot",
        version: "hebrew.medieval",
      },
    };
  },
};

/**
 * Helper: Select appropriate rule version
 */
export function selectRuleVersion(
  versions: RuleSetVersion[],
  jdn: JDN,
  preferredVersion?: string,
): RuleSetVersion | undefined {
  // If user specified a version, use it (if valid for this JDN)
  if (preferredVersion) {
    const preferred = versions.find(v => v.id === preferredVersion);
    if (preferred) {
      const inRange =
        (!preferred.validFrom || jdn >= preferred.validFrom) &&
        (!preferred.validTo || jdn <= preferred.validTo);
      if (inRange) return preferred;
    }
  }

  // Otherwise, find version valid for this JDN
  return versions.find(
    v =>
      (!v.validFrom || jdn >= v.validFrom) && (!v.validTo || jdn <= v.validTo),
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export const AdvancedFeatures = {
  // Day Boundary
  dayBoundary: {
    hebrew: HebrewSunsetBoundaryRule,
    islamic: IslamicSunsetBoundaryRule,
    astronomical: AstronomicalNoonBoundaryRule,
  },

  // Observational
  observational: {
    MockDataSource: MockObservationalDataSource,
    createIslamicMoonSightingRule,
  },

  // Partial Dates
  partialDates: {
    yearOnlyFilter: YearOnlyFilterExample,
    bpYearOnly: BPYearOnlyRule,
    hasSufficientPrecision,
  },

  // Rule Versioning
  versioning: {
    hebrewVersions: HebrewRuleVersions,
    ancient: HebrewAncientObservationalRule,
    modern: HebrewModernFixedRule,
    selectRuleVersion,
  },
};
