/**
 * @file Advanced Features Tests
 * @description Tests for Week 4 extensibility features:
 * - Day boundary adjustments
 * - Observational data sources
 * - Partial date support
 * - Rule versioning
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  AdvancedFeatures,
  MockObservationalDataSource,
} from "@iterumarchive/neo-calendar-core";
import type { AdjustmentContext, JDN } from "@iterumarchive/neo-calendar-core";

describe("Advanced Features: Day Boundary", () => {
  describe("Hebrew Sunset Boundary", () => {
    it("should advance to next day after sunset", () => {
      const ctx: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 19, minute: 0, second: 0 }, // 7 PM (after sunset)
      };

      const result = AdvancedFeatures.dayBoundary.hebrew.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.delta).toBe(1);
      expect(result.reason).toBe("religious");
      expect(result.metadata?.boundary).toBe("sunset");
    });

    it("should not advance before sunset", () => {
      const ctx: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 16, minute: 0, second: 0 }, // 4 PM (before sunset)
      };

      const result = AdvancedFeatures.dayBoundary.hebrew.apply(ctx);

      expect(result.applied).toBe(false);
    });

    it("should not apply without timeOfDay", () => {
      const ctx: AdjustmentContext = {
        calendar: "HEBREW",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        // No timeOfDay
      };

      const result = AdvancedFeatures.dayBoundary.hebrew.apply(ctx);

      expect(result.applied).toBe(false);
    });

    it("should have CRITICAL priority", () => {
      expect(AdvancedFeatures.dayBoundary.hebrew.priority).toBe(100);
    });
  });

  describe("Islamic Sunset Boundary", () => {
    it("should advance to next day after maghrib", () => {
      const ctx: AdjustmentContext = {
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 18, minute: 30, second: 0 },
      };

      const result = AdvancedFeatures.dayBoundary.islamic.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.delta).toBe(1);
      expect(result.metadata?.boundary).toContain("maghrib");
    });

    it("should not advance before maghrib", () => {
      const ctx: AdjustmentContext = {
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 12, minute: 0, second: 0 },
      };

      const result = AdvancedFeatures.dayBoundary.islamic.apply(ctx);

      expect(result.applied).toBe(false);
    });
  });

  describe("Astronomical Noon Boundary", () => {
    it("should go back one day before noon", () => {
      const ctx: AdjustmentContext = {
        calendar: "UNIX",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 10, minute: 0, second: 0 }, // 10 AM (before noon)
      };

      const result = AdvancedFeatures.dayBoundary.astronomical.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.delta).toBe(-1);
      expect(result.reason).toBe("astronomical");
      expect(result.metadata?.boundary).toBe("noon");
    });

    it("should not adjust after noon", () => {
      const ctx: AdjustmentContext = {
        calendar: "UNIX",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 14, minute: 0, second: 0 }, // 2 PM (after noon)
      };

      const result = AdvancedFeatures.dayBoundary.astronomical.apply(ctx);

      expect(result.applied).toBe(false);
    });

    it("should handle exact noon correctly", () => {
      const ctx: AdjustmentContext = {
        calendar: "UNIX",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        timeOfDay: { hour: 12, minute: 0, second: 0 }, // Exactly noon
      };

      const result = AdvancedFeatures.dayBoundary.astronomical.apply(ctx);

      // At noon or after, no adjustment needed
      expect(result.applied).toBe(false);
    });
  });
});

describe("Advanced Features: Observational Data", () => {
  let mockSource: MockObservationalDataSource;

  beforeEach(() => {
    mockSource = new MockObservationalDataSource();
  });

  describe("MockObservationalDataSource", () => {
    it("should return null for unknown queries", async () => {
      const result = await mockSource.query({
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn: BigInt(2460000) as JDN,
        event: "month_start",
      });

      expect(result).toBeNull();
    });

    it("should return mock data when added", async () => {
      const jdn = BigInt(2460000) as JDN;

      mockSource.addMockObservation(
        "ISLAMIC_OBSERVATIONAL",
        jdn,
        "month_start",
        {
          observed: true,
          jdn: BigInt(2460001) as JDN,
          confidence: 0.95,
          source: "Test Observatory",
          timestamp: new Date(),
        },
      );

      const result = await mockSource.query({
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn,
        event: "month_start",
      });

      expect(result).not.toBeNull();
      expect(result?.observed).toBe(true);
      expect(result?.jdn).toBe(BigInt(2460001));
      expect(result?.confidence).toBe(0.95);
    });

    it("should have correct metadata", () => {
      expect(mockSource.id).toBe("mock.observational");
      expect(mockSource.name).toBeDefined();
      expect(mockSource.description).toBeDefined();
    });
  });

  describe("Islamic Moon Sighting Rule", () => {
    it("should use observational data when available", async () => {
      const jdn = BigInt(2460000) as JDN;
      const observedJDN = BigInt(2460001) as JDN;

      mockSource.addMockObservation(
        "ISLAMIC_OBSERVATIONAL",
        jdn,
        "month_start",
        {
          observed: true,
          jdn: observedJDN,
          confidence: 0.9,
          source: "Saudi Hilal Committee",
          timestamp: new Date(),
        },
      );

      const rule =
        AdvancedFeatures.observational.createIslamicMoonSightingRule(
          mockSource,
        );

      const ctx: AdjustmentContext = {
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn,
        direction: "toJDN",
      };

      const result = await rule.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.delta).toBe(1);
      expect(result.metadata?.observedJDN).toBe(observedJDN);
      expect(result.metadata?.source).toBe("Saudi Hilal Committee");
    });

    it("should fallback to calculation when no observation", async () => {
      const rule =
        AdvancedFeatures.observational.createIslamicMoonSightingRule(
          mockSource,
        );

      const ctx: AdjustmentContext = {
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const result = await rule.apply(ctx);

      expect(result.applied).toBe(false);
    });

    it("should not apply to non-Islamic calendars", async () => {
      const rule =
        AdvancedFeatures.observational.createIslamicMoonSightingRule(
          mockSource,
        );

      const ctx: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
      };

      const result = await rule.apply(ctx);

      expect(result.applied).toBe(false);
    });

    it("should not adjust when observation matches calculation", async () => {
      const jdn = BigInt(2460000) as JDN;

      // Observation matches calculation (delta = 0)
      mockSource.addMockObservation("ISLAMIC", jdn, "month_start", {
        observed: true,
        jdn: jdn, // Same as calculated
        confidence: 1.0,
        source: "Test",
        timestamp: new Date(),
      });

      const rule =
        AdvancedFeatures.observational.createIslamicMoonSightingRule(
          mockSource,
        );

      const ctx: AdjustmentContext = {
        calendar: "ISLAMIC_OBSERVATIONAL",
        jdn,
        direction: "toJDN",
      };

      const result = await rule.apply(ctx);

      expect(result.applied).toBe(false);
    });
  });
});

describe("Advanced Features: Partial Dates", () => {
  describe("hasSufficientPrecision", () => {
    it("should pass when precision is sufficient", () => {
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("day", "year"),
      ).toBe(true);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("day", "month"),
      ).toBe(true);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("day", "day"),
      ).toBe(true);
    });

    it("should fail when precision is insufficient", () => {
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("year", "month"),
      ).toBe(false);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("year", "day"),
      ).toBe(false);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision("month", "day"),
      ).toBe(false);
    });

    it("should handle precision hierarchy correctly", () => {
      // Millennium < Century < Decade < Year < Month < Day
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision(
          "day",
          "millennium",
        ),
      ).toBe(true);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision(
          "century",
          "millennium",
        ),
      ).toBe(true);
      expect(
        AdvancedFeatures.partialDates.hasSufficientPrecision(
          "millennium",
          "century",
        ),
      ).toBe(false);
    });
  });

  describe("Year-Only Filter Example", () => {
    it("should require day precision", () => {
      expect(AdvancedFeatures.partialDates.yearOnlyFilter.minPrecision).toBe(
        "day",
      );
    });

    it("should apply for full dates", () => {
      const ctx: AdjustmentContext = {
        calendar: "GREGORIAN",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        year: 2024,
        month: 3,
        day: 19,
      };

      const result = AdvancedFeatures.partialDates.yearOnlyFilter.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.metadata?.precision).toBe("day");
    });
  });

  describe("BP Year-Only Rule", () => {
    it("should only require year precision", () => {
      expect(AdvancedFeatures.partialDates.bpYearOnly.minPrecision).toBe(
        "year",
      );
    });

    it("should apply for year-only dates", () => {
      const ctx: AdjustmentContext = {
        calendar: "BP",
        jdn: BigInt(2460000) as JDN,
        direction: "toJDN",
        year: 5000,
        // No month or day
      };

      const result = AdvancedFeatures.partialDates.bpYearOnly.apply(ctx);

      expect(result.applied).toBe(true);
      expect(result.reason).toBe("cultural");
    });
  });
});

describe("Advanced Features: Rule Versioning", () => {
  describe("Hebrew Rule Versions", () => {
    it("should have ancient and medieval versions", () => {
      const versions = AdvancedFeatures.versioning.hebrewVersions;

      expect(versions).toHaveLength(2);
      expect(versions[0].id).toBe("hebrew.ancient");
      expect(versions[1].id).toBe("hebrew.medieval");
    });

    it("should have correct temporal ranges", () => {
      const ancient = AdvancedFeatures.versioning.hebrewVersions[0];
      const medieval = AdvancedFeatures.versioning.hebrewVersions[1];

      expect(ancient.validTo).toBeDefined();
      expect(medieval.validFrom).toBeDefined();
      expect(medieval.validTo).toBeUndefined(); // Still in use
    });

    it("should have authority and notes", () => {
      AdvancedFeatures.versioning.hebrewVersions.forEach(version => {
        expect(version.authority).toBeDefined();
        expect(version.notes).toBeDefined();
      });
    });
  });

  describe("selectRuleVersion", () => {
    const versions = AdvancedFeatures.versioning.hebrewVersions;

    it("should select ancient version for old dates", () => {
      const jdn = BigInt(1500000) as JDN; // Ancient times

      const selected = AdvancedFeatures.versioning.selectRuleVersion(
        versions,
        jdn,
      );

      expect(selected?.id).toBe("hebrew.ancient");
    });

    it("should select medieval version for modern dates", () => {
      const jdn = BigInt(2460000) as JDN; // Modern times

      const selected = AdvancedFeatures.versioning.selectRuleVersion(
        versions,
        jdn,
      );

      expect(selected?.id).toBe("hebrew.medieval");
    });

    it("should respect preferred version if valid", () => {
      const jdn = BigInt(2460000) as JDN; // Modern times

      // Prefer medieval (valid for this JDN)
      const selected = AdvancedFeatures.versioning.selectRuleVersion(
        versions,
        jdn,
        "hebrew.medieval",
      );

      expect(selected?.id).toBe("hebrew.medieval");
    });

    it("should ignore invalid preferred version", () => {
      const jdn = BigInt(2460000) as JDN; // Modern times

      // Prefer ancient (NOT valid for this JDN)
      const selected = AdvancedFeatures.versioning.selectRuleVersion(
        versions,
        jdn,
        "hebrew.ancient",
      );

      // Should fall back to valid version
      expect(selected?.id).toBe("hebrew.medieval");
    });

    it("should return undefined if no version valid", () => {
      const jdn = BigInt(999999) as JDN; // Before any version

      const selected = AdvancedFeatures.versioning.selectRuleVersion(
        versions,
        jdn,
      );

      expect(selected).toBeUndefined();
    });
  });

  describe("Ancient Hebrew Rule", () => {
    it("should have correct version metadata", () => {
      const rule = AdvancedFeatures.versioning.ancient;

      expect(rule.version).toBe("hebrew.ancient");
      expect(rule.validFrom).toBeDefined();
      expect(rule.validTo).toBeDefined();
    });

    it("should be observational category", () => {
      expect(AdvancedFeatures.versioning.ancient.category).toBe(
        "observational",
      );
    });
  });

  describe("Modern Hebrew Rule", () => {
    it("should have correct version metadata", () => {
      const rule = AdvancedFeatures.versioning.modern;

      expect(rule.version).toBe("hebrew.medieval");
      expect(rule.validFrom).toBeDefined();
      expect(rule.validTo).toBeUndefined(); // Still in use
    });

    it("should be postponement category", () => {
      expect(AdvancedFeatures.versioning.modern.category).toBe("postponement");
    });
  });
});

describe("Advanced Features: Integration", () => {
  it("should export all feature categories", () => {
    expect(AdvancedFeatures.dayBoundary).toBeDefined();
    expect(AdvancedFeatures.observational).toBeDefined();
    expect(AdvancedFeatures.partialDates).toBeDefined();
    expect(AdvancedFeatures.versioning).toBeDefined();
  });

  it("should have all day boundary rules", () => {
    expect(AdvancedFeatures.dayBoundary.hebrew).toBeDefined();
    expect(AdvancedFeatures.dayBoundary.islamic).toBeDefined();
    expect(AdvancedFeatures.dayBoundary.astronomical).toBeDefined();
  });

  it("should have observational tools", () => {
    expect(AdvancedFeatures.observational.MockDataSource).toBeDefined();
    expect(
      AdvancedFeatures.observational.createIslamicMoonSightingRule,
    ).toBeDefined();
  });

  it("should have partial date tools", () => {
    expect(AdvancedFeatures.partialDates.hasSufficientPrecision).toBeDefined();
    expect(AdvancedFeatures.partialDates.yearOnlyFilter).toBeDefined();
    expect(AdvancedFeatures.partialDates.bpYearOnly).toBeDefined();
  });

  it("should have versioning tools", () => {
    expect(AdvancedFeatures.versioning.hebrewVersions).toBeDefined();
    expect(AdvancedFeatures.versioning.selectRuleVersion).toBeDefined();
    expect(AdvancedFeatures.versioning.ancient).toBeDefined();
    expect(AdvancedFeatures.versioning.modern).toBeDefined();
  });
});
