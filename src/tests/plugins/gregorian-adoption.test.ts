/**
 * @file Gregorian Adoption Rules Tests
 * @description Tests for country-specific Gregorian calendar adoption skip dates
 */

import { describe, it, expect } from "vitest";
import {
  GregorianAdoptionRules,
  NotableAdoptions,
  adoptionData,
} from "@iterumarchive/neo-calendar-gregorian";
import type { JDN } from "@iterumarchive/neo-calendar-core";

describe("Gregorian Adoption Data", () => {
  it("should have 19 adoption records", () => {
    expect(adoptionData.adoptions).toHaveLength(19);
  });

  it("should have valid structure for all records", () => {
    adoptionData.adoptions.forEach(adoption => {
      expect(adoption).toHaveProperty("countries");
      expect(adoption).toHaveProperty("regions");
      expect(adoption).toHaveProperty("adoptionDate");
      expect(adoption).toHaveProperty("julianLastDate");
      expect(adoption).toHaveProperty("skipRange");
      expect(adoption).toHaveProperty("daysSkipped");
      expect(adoption).toHaveProperty("source");
      expect(adoption).toHaveProperty("notes");

      // Validate countries array
      expect(Array.isArray(adoption.countries)).toBe(true);
      expect(adoption.countries.length).toBeGreaterThan(0);

      // Validate skip range
      expect(adoption.skipRange.startJDN).toBeLessThan(
        adoption.skipRange.endJDN,
      );

      // Validate days skipped matches range
      const actualDaysSkipped =
        adoption.skipRange.endJDN - adoption.skipRange.startJDN + 1;
      expect(actualDaysSkipped).toBe(adoption.daysSkipped);
    });
  });

  it("should have increasing days skipped over time", () => {
    // As time passes, more days need to be skipped due to accumulated drift
    // 1582: 10 days, 1752: 11 days, 1918: 13 days
    const papal1582 = adoptionData.adoptions[0]; // 1582
    const british1752 = adoptionData.adoptions.find(
      a => a.adoptionDate.year === 1752 && a.countries.includes("GB"),
    );
    const soviet1918 = adoptionData.adoptions.find(
      a => a.adoptionDate.year === 1918 && a.countries.includes("RU"),
    );

    expect(papal1582.daysSkipped).toBe(10);
    expect(british1752?.daysSkipped).toBe(11);
    expect(soviet1918?.daysSkipped).toBe(13);
  });
});

describe("GregorianAdoptionRules", () => {
  describe("ALL_RULES", () => {
    it("should generate 19 adjustment rules", () => {
      expect(GregorianAdoptionRules.ALL_RULES).toHaveLength(19);
    });

    it("should have unique rule IDs", () => {
      const ids = GregorianAdoptionRules.ALL_RULES.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should all be skip category rules", () => {
      GregorianAdoptionRules.ALL_RULES.forEach(rule => {
        expect(rule.category).toBe("skip");
      });
    });

    it("should all have HIGH priority", () => {
      GregorianAdoptionRules.ALL_RULES.forEach(rule => {
        expect(rule.priority).toBe(75); // HIGH priority
      });
    });

    it("should all have geographic scope", () => {
      GregorianAdoptionRules.ALL_RULES.forEach(rule => {
        expect(rule.geographicScope).toBeDefined();
        expect(rule.geographicScope?.type).toBe("country");
        expect(rule.geographicScope?.countries).toBeDefined();
        expect(rule.geographicScope!.countries!.length).toBeGreaterThan(0);
      });
    });

    it("should all have temporal scope", () => {
      GregorianAdoptionRules.ALL_RULES.forEach(rule => {
        expect(rule.validFrom).toBeDefined();
        expect(rule.validTo).toBeDefined();
        expect(rule.validFrom).toBeLessThanOrEqual(rule.validTo!);
      });
    });
  });

  describe("forCountry()", () => {
    it("should find rules for Italy", () => {
      const rules = GregorianAdoptionRules.forCountry("IT");
      expect(rules.length).toBeGreaterThan(0);
      expect(rules[0].geographicScope?.countries).toContain("IT");
    });

    it("should find rules for Great Britain", () => {
      const rules = GregorianAdoptionRules.forCountry("GB");
      expect(rules.length).toBe(1);
      expect(rules[0].geographicScope?.countries).toContain("GB");
    });

    it("should find rules for United States", () => {
      const rules = GregorianAdoptionRules.forCountry("US");
      expect(rules.length).toBe(1);
      // US inherited British adoption
      expect(rules[0].geographicScope?.countries).toContain("US");
    });

    it("should find rules for Russia", () => {
      const rules = GregorianAdoptionRules.forCountry("RU");
      expect(rules.length).toBe(1);
      expect(rules[0].geographicScope?.countries).toContain("RU");
    });

    it("should return empty array for countries without rules", () => {
      const rules = GregorianAdoptionRules.forCountry("XX");
      expect(rules).toHaveLength(0);
    });

    it("should handle Germany with multiple adoption dates", () => {
      const rules = GregorianAdoptionRules.forCountry("DE");
      expect(rules.length).toBeGreaterThanOrEqual(2);
      // Catholic regions 1584, Protestant regions 1700
    });
  });

  describe("forDateRange()", () => {
    it("should find rules in 1582", () => {
      const start = BigInt(2299000) as JDN; // Around 1582
      const end = BigInt(2299500) as JDN;
      const rules = GregorianAdoptionRules.forDateRange(start, end);
      expect(rules.length).toBeGreaterThan(0);
    });

    it("should find rules in 1752", () => {
      const start = BigInt(2361000) as JDN; // Around 1752
      const end = BigInt(2361500) as JDN;
      const rules = GregorianAdoptionRules.forDateRange(start, end);
      expect(rules.length).toBeGreaterThan(0);
    });

    it("should not find rules in modern era", () => {
      const start = BigInt(2450000) as JDN; // Around 1995
      const end = BigInt(2451000) as JDN;
      const rules = GregorianAdoptionRules.forDateRange(start, end);
      expect(rules).toHaveLength(0);
    });

    it("should not find rules in ancient times", () => {
      const start = BigInt(1000000) as JDN; // Ancient
      const end = BigInt(1500000) as JDN;
      const rules = GregorianAdoptionRules.forDateRange(start, end);
      expect(rules).toHaveLength(0);
    });
  });

  describe("isImpossibleDate()", () => {
    it("should detect impossible dates for Vatican 1582", () => {
      // October 5-14, 1582 don't exist in Vatican
      const jdn1 = BigInt(2299152) as JDN; // October 5
      const jdn2 = BigInt(2299160) as JDN; // October 14

      expect(GregorianAdoptionRules.isImpossibleDate(jdn1, "VA")).toBe(true);
      expect(GregorianAdoptionRules.isImpossibleDate(jdn2, "VA")).toBe(true);
    });

    it("should not detect valid dates as impossible", () => {
      const jdn1 = BigInt(2299150) as JDN; // October 4, 1582 (last Julian day)
      const jdn2 = BigInt(2299161) as JDN; // October 15, 1582 (first Gregorian day)

      expect(GregorianAdoptionRules.isImpossibleDate(jdn1, "VA")).toBe(false);
      expect(GregorianAdoptionRules.isImpossibleDate(jdn2, "VA")).toBe(false);
    });

    it("should detect impossible dates for Britain 1752", () => {
      // September 3-13, 1752 don't exist in Britain
      const jdn = BigInt(2361210) as JDN; // Within skip range

      expect(GregorianAdoptionRules.isImpossibleDate(jdn, "GB")).toBe(true);
    });

    it("should check all jurisdictions without country code", () => {
      // A date that was skipped somewhere
      const jdn = BigInt(2299155) as JDN; // In Vatican skip range

      expect(GregorianAdoptionRules.isImpossibleDate(jdn)).toBe(true);
    });
  });

  describe("getAdoptionInfo()", () => {
    it("should return adoption info for Italy", () => {
      const info = GregorianAdoptionRules.getAdoptionInfo("IT");
      expect(info).not.toBeNull();
      expect(info?.countries).toContain("IT");
      expect(info?.adoptionDate.year).toBe(1582);
    });

    it("should return adoption info for Great Britain", () => {
      const info = GregorianAdoptionRules.getAdoptionInfo("GB");
      expect(info).not.toBeNull();
      expect(info?.countries).toContain("GB");
      expect(info?.adoptionDate.year).toBe(1752);
    });

    it("should return null for unknown countries", () => {
      const info = GregorianAdoptionRules.getAdoptionInfo("XX");
      expect(info).toBeNull();
    });
  });
});

describe("NotableAdoptions", () => {
  it("should have Papal States 1582 rule", () => {
    expect(NotableAdoptions.PAPAL_STATES_1582).toBeDefined();
    expect(
      NotableAdoptions.PAPAL_STATES_1582.geographicScope?.countries,
    ).toContain("VA");
  });

  it("should have France 1582 rule", () => {
    expect(NotableAdoptions.FRANCE_1582).toBeDefined();
    expect(NotableAdoptions.FRANCE_1582.geographicScope?.countries).toContain(
      "FR",
    );
  });

  it("should have British Empire 1752 rule", () => {
    expect(NotableAdoptions.BRITISH_EMPIRE_1752).toBeDefined();
    expect(
      NotableAdoptions.BRITISH_EMPIRE_1752.geographicScope?.countries,
    ).toContain("GB");
    expect(
      NotableAdoptions.BRITISH_EMPIRE_1752.geographicScope?.countries,
    ).toContain("US");
  });

  it("should have Soviet Russia 1918 rule", () => {
    expect(NotableAdoptions.SOVIET_RUSSIA_1918).toBeDefined();
    expect(
      NotableAdoptions.SOVIET_RUSSIA_1918.geographicScope?.countries,
    ).toContain("RU");
  });

  it("should have Greece 1924 rule", () => {
    expect(NotableAdoptions.GREECE_1924).toBeDefined();
    expect(NotableAdoptions.GREECE_1924.geographicScope?.countries).toContain(
      "GR",
    );
  });
});

describe("Rule Application", () => {
  it("should apply rule for date in skip range", () => {
    const rule = NotableAdoptions.PAPAL_STATES_1582;
    const jdn = BigInt(2299155) as JDN; // October 10, 1582 (skipped)

    const result = rule.apply({
      calendar: "GREGORIAN",
      jdn,
      direction: "fromJDN",
    });

    expect(result.applied).toBe(true);
    expect(result.delta).toBe(0); // Skip rules don't modify JDN
    expect(result.reason).toBe("political");
    expect(result.metadata).toBeDefined();
    expect(result.metadata?.daysSkipped).toBe(10);
  });

  it("should not apply rule for date outside skip range", () => {
    const rule = NotableAdoptions.PAPAL_STATES_1582;
    const jdn = BigInt(2299150) as JDN; // October 4, 1582 (valid)

    const result = rule.apply({
      calendar: "GREGORIAN",
      jdn,
      direction: "fromJDN",
    });

    expect(result.applied).toBe(false);
  });

  it("should provide rich metadata when applied", () => {
    const rule = NotableAdoptions.BRITISH_EMPIRE_1752;
    const jdn = BigInt(2361215) as JDN; // Within skip range

    const result = rule.apply({
      calendar: "GREGORIAN",
      jdn,
      direction: "fromJDN",
    });

    expect(result.applied).toBe(true);
    expect(result.metadata).toHaveProperty("adoptionDate");
    expect(result.metadata).toHaveProperty("julianLastDate");
    expect(result.metadata).toHaveProperty("daysSkipped");
    expect(result.metadata).toHaveProperty("source");
    expect(result.metadata).toHaveProperty("countries");
    expect(result.metadata).toHaveProperty("regions");
    expect(result.metadata).toHaveProperty("notes");

    expect(result.metadata?.daysSkipped).toBe(11);
    expect(result.metadata?.adoptionDate).toEqual({
      year: 1752,
      month: 9,
      day: 14,
    });
  });
});

describe("Historical Validation", () => {
  it("should validate October 1582 skip in Vatican", () => {
    const info = GregorianAdoptionRules.getAdoptionInfo("VA");
    expect(info?.adoptionDate).toEqual({ year: 1582, month: 10, day: 15 });
    expect(info?.julianLastDate).toEqual({ year: 1582, month: 10, day: 4 });
    expect(info?.daysSkipped).toBe(10);
  });

  it("should validate September 1752 skip in Britain", () => {
    const info = GregorianAdoptionRules.getAdoptionInfo("GB");
    expect(info?.adoptionDate).toEqual({ year: 1752, month: 9, day: 14 });
    expect(info?.julianLastDate).toEqual({ year: 1752, month: 9, day: 2 });
    expect(info?.daysSkipped).toBe(11);
  });

  it("should validate February 1918 skip in Russia", () => {
    const info = GregorianAdoptionRules.getAdoptionInfo("RU");
    expect(info?.adoptionDate).toEqual({ year: 1918, month: 2, day: 14 });
    expect(info?.julianLastDate).toEqual({ year: 1918, month: 1, day: 31 });
    expect(info?.daysSkipped).toBe(13);
  });

  it("should validate source citations exist", () => {
    adoptionData.adoptions.forEach(adoption => {
      expect(adoption.source).toBeTruthy();
      expect(adoption.source.length).toBeGreaterThan(10);
    });
  });
});
