/**
 * @file Gregorian Calendar Adoption Rules
 * @description Adjustment rules for country-specific Gregorian calendar adoption dates
 *
 * When countries transitioned from Julian to Gregorian calendar, they skipped
 * several days (typically 10-13) to realign with the solar year. These dates
 * are "impossible" - they never occurred in those jurisdictions.
 *
 * Example: In Britain, September 2, 1752 was followed by September 14, 1752.
 * Dates September 3-13, 1752 do not exist in the British calendar.
 */

import type {
  AdjustmentRule,
  GeographicScope,
  JDN,
} from "@iterumarchive/neo-calendar-core";
import { AdjustmentPriority } from "@iterumarchive/neo-calendar-core";
import adoptionData from "./gregorian-adoption.json" with { type: "json" };

/**
 * Interface matching the JSON structure
 */
interface AdoptionRecord {
  countries: string[];
  regions: string[];
  adoptionDate: { year: number; month: number; day: number };
  julianLastDate: { year: number; month: number; day: number };
  skipRange: { startJDN: number; endJDN: number };
  daysSkipped: number;
  source: string;
  notes: string;
}

/**
 * Create a skip range adjustment rule for a specific adoption
 */
function createSkipRule(adoption: AdoptionRecord): AdjustmentRule {
  // Create geographic scope for this adoption
  const scope: GeographicScope = {
    type: "country",
    countries: adoption.countries,
  };

  const rule: AdjustmentRule = {
    id: `gregorian.adoption.${adoption.countries.join("_").toLowerCase()}`,
    category: "skip",
    priority: AdjustmentPriority.HIGH,
    validFrom: BigInt(adoption.skipRange.startJDN) as JDN,
    validTo: BigInt(adoption.skipRange.endJDN) as JDN,
    geographicScope: scope,
    reason: "political",
    description: `Gregorian calendar adoption: ${adoption.countries.join(", ")}. Days ${adoption.skipRange.startJDN}-${adoption.skipRange.endJDN} (${adoption.daysSkipped} days) were skipped.`,

    apply: ctx => {
      const jdn = ctx.jdn;

      // Check if this JDN falls in the skip range
      if (
        jdn >= BigInt(adoption.skipRange.startJDN) &&
        jdn <= BigInt(adoption.skipRange.endJDN)
      ) {
        return {
          applied: true,
          delta: 0, // Skip doesn't add/subtract days, it marks dates as impossible
          reason: "political",
          metadata: {
            adoptionDate: adoption.adoptionDate,
            julianLastDate: adoption.julianLastDate,
            daysSkipped: adoption.daysSkipped,
            source: adoption.source,
            countries: adoption.countries,
            regions: adoption.regions,
            notes: adoption.notes,
          },
        };
      }

      return { applied: false };
    },
  };

  return rule;
}

/**
 * All Gregorian adoption skip rules
 */
export const GregorianAdoptionRules = {
  /**
   * Generate all skip rules from the adoption data
   */
  ALL_RULES: adoptionData.adoptions.map(createSkipRule),

  /**
   * Get rules applicable to a specific country
   */
  forCountry: (countryCode: string): AdjustmentRule[] => {
    return GregorianAdoptionRules.ALL_RULES.filter(rule => {
      const scope = rule.geographicScope;
      if (!scope || scope.type !== "country") return false;
      return scope.countries?.includes(countryCode);
    });
  },

  /**
   * Get rules applicable within a date range
   */
  forDateRange: (startJDN: JDN, endJDN: JDN): AdjustmentRule[] => {
    return GregorianAdoptionRules.ALL_RULES.filter(rule => {
      if (!rule.validFrom || !rule.validTo) return false;

      // Check if ranges overlap
      return rule.validFrom <= endJDN && rule.validTo >= startJDN;
    });
  },

  /**
   * Check if a specific JDN is an impossible date in any jurisdiction
   */
  isImpossibleDate: (jdn: JDN, countryCode?: string): boolean => {
    const rulesToCheck = countryCode
      ? GregorianAdoptionRules.forCountry(countryCode)
      : GregorianAdoptionRules.ALL_RULES;

    return rulesToCheck.some(rule => {
      if (!rule.validFrom || !rule.validTo) return false;
      return jdn >= rule.validFrom && jdn <= rule.validTo;
    });
  },

  /**
   * Get adoption info for a specific country
   */
  getAdoptionInfo: (countryCode: string) => {
    const adoption = adoptionData.adoptions.find(a =>
      a.countries.includes(countryCode),
    );
    return adoption || null;
  },
};

/**
 * Pre-defined notable adoption rules for easy access
 */
export const NotableAdoptions = {
  /**
   * Original Gregorian adoption (Vatican, Italy, Spain, Portugal, Poland)
   * October 4, 1582 → October 15, 1582 (10 days skipped)
   */
  PAPAL_STATES_1582: GregorianAdoptionRules.ALL_RULES[0],

  /**
   * France adoption
   * December 9, 1582 → December 20, 1582 (10 days skipped)
   */
  FRANCE_1582: GregorianAdoptionRules.ALL_RULES[1],

  /**
   * British Empire adoption (including American colonies)
   * September 2, 1752 → September 14, 1752 (11 days skipped)
   */
  BRITISH_EMPIRE_1752: GregorianAdoptionRules.ALL_RULES[8],

  /**
   * Soviet Russia adoption
   * January 31, 1918 → February 14, 1918 (13 days skipped)
   */
  SOVIET_RUSSIA_1918: GregorianAdoptionRules.ALL_RULES[15],

  /**
   * Greece adoption (civil calendar)
   * March 9, 1924 → March 23, 1924 (13 days skipped)
   */
  GREECE_1924: GregorianAdoptionRules.ALL_RULES[17],
};

/**
 * Export adoption data for reference
 */
export { adoptionData };
