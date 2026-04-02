/**
 * @file Registry Unit Tests
 * @description Unit tests for the CalendarRegistry class
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { CalendarRegistry } from "@iterumarchive/neo-calendar-core";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
import { RegistryError } from "@iterumarchive/neo-calendar-core";

describe("CalendarRegistry", () => {
  let registry: CalendarRegistry;

  beforeEach(() => {
    registry = new CalendarRegistry();
  });

  afterEach(() => {
    registry.clear();
  });

  describe("Construction and Singleton", () => {
    it("should create a new empty registry", () => {
      expect(registry).toBeInstanceOf(CalendarRegistry);
      expect(registry.size).toBe(0);
      expect(registry.isEmpty).toBe(true);
    });

    it("should provide singleton instance", () => {
      const instance1 = CalendarRegistry.getInstance();
      const instance2 = CalendarRegistry.getInstance();

      expect(instance1).toBe(instance2);
      expect(instance1).toBeInstanceOf(CalendarRegistry);
    });

    it("should allow creating separate registry instances", () => {
      const registry1 = new CalendarRegistry();
      const registry2 = new CalendarRegistry();

      registry1.register(new GregorianPlugin());

      expect(registry1.size).toBe(1);
      expect(registry2.size).toBe(0);
    });
  });

  describe("Basic Registration", () => {
    it("should register a plugin", () => {
      const gregorian = new GregorianPlugin();
      registry.register(gregorian);

      expect(registry.size).toBe(1);
      expect(registry.has("GREGORIAN")).toBe(true);
      expect(registry.isEmpty).toBe(false);
    });

    it("should register multiple plugins", () => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());

      expect(registry.size).toBe(3);
      expect(registry.has("GREGORIAN")).toBe(true);
      expect(registry.has("HEBREW")).toBe(true);
      expect(registry.has("ISLAMIC_CIVIL")).toBe(true);
    });

    it("should replace existing plugin with same ID", () => {
      const plugin1 = new GregorianPlugin();
      const plugin2 = new GregorianPlugin();

      registry.register(plugin1);
      expect(registry.size).toBe(1);

      registry.register(plugin2);
      expect(registry.size).toBe(1);

      const retrieved = registry.get("GREGORIAN");
      expect(retrieved).toBe(plugin2);
    });

    it("should maintain registration order", () => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());

      const all = registry.all();
      expect(all[0]?.id).toBe("GREGORIAN");
      expect(all[1]?.id).toBe("HEBREW");
      expect(all[2]?.id).toBe("ISLAMIC_CIVIL");
    });
  });

  describe("Retrieval", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
    });

    it("should retrieve registered plugin by ID", () => {
      const gregorian = registry.get("GREGORIAN");
      expect(gregorian.id).toBe("GREGORIAN");
    });

    it("should throw RegistryError for unregistered calendar", () => {
      expect(() => registry.get("NONEXISTENT" as any)).toThrow(RegistryError);
    });

    it("should check if calendar is registered", () => {
      expect(registry.has("GREGORIAN")).toBe(true);
      expect(registry.has("HEBREW")).toBe(true);
      expect(registry.has("NONEXISTENT" as any)).toBe(false);
    });

    it("should list all registered calendar IDs", () => {
      const ids = registry.list();
      expect(ids).toHaveLength(3);
      expect(ids).toContain("GREGORIAN");
      expect(ids).toContain("HEBREW");
      expect(ids).toContain("ISLAMIC_CIVIL");
    });

    it("should get all registered plugins", () => {
      const all = registry.all();
      expect(all).toHaveLength(3);
      expect(all.map(p => p.id)).toContain("GREGORIAN");
      expect(all.map(p => p.id)).toContain("HEBREW");
      expect(all.map(p => p.id)).toContain("ISLAMIC_CIVIL");
    });
  });

  describe("Unregistration", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
    });

    it("should unregister a plugin", () => {
      expect(registry.size).toBe(3);

      registry.unregister("GREGORIAN");

      expect(registry.size).toBe(2);
      expect(registry.has("GREGORIAN")).toBe(false);
      expect(registry.has("HEBREW")).toBe(true);
    });

    it("should handle unregistering non-existent plugin", () => {
      registry.unregister("NONEXISTENT" as any);
      expect(registry.size).toBe(3);
    });

    it("should maintain order after unregistration", () => {
      registry.unregister("HEBREW"); // Middle

      const ids = registry.list();
      expect(ids[0]).toBe("GREGORIAN");
      expect(ids[1]).toBe("ISLAMIC_CIVIL");
    });
  });

  describe("Query by Astronomical Basis", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
      registry.register(new HolocenePlugin());
      registry.register(new JulianPlugin());
    });

    it("should find solar calendars", () => {
      const solar = registry.getByBasis("solar");
      expect(solar.length).toBeGreaterThan(0);
      expect(solar.every(p => p.metadata.astronomicalBasis === "solar")).toBe(
        true,
      );
      expect(solar.some(p => p.id === "GREGORIAN")).toBe(true);
      expect(solar.some(p => p.id === "HOLOCENE")).toBe(true);
    });

    it("should find lunar calendars", () => {
      const lunar = registry.getByBasis("lunar");
      expect(lunar.length).toBeGreaterThan(0);
      expect(lunar.some(p => p.id === "ISLAMIC_CIVIL")).toBe(true);
    });

    it("should find lunisolar calendars", () => {
      const lunisolar = registry.getByBasis("lunisolar");
      expect(lunisolar.some(p => p.id === "HEBREW")).toBe(true);
    });

    it("should return empty array for no matches", () => {
      registry.clear();
      registry.register(new GregorianPlugin());

      const lunar = registry.getByBasis("lunar");
      expect(lunar).toEqual([]);
    });
  });

  describe("Query by Region", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
      registry.register(new PersianPlugin());
    });

    it("should find calendars by region (case insensitive)", () => {
      const middleEast = registry.getByRegion("middle east");
      expect(middleEast.length).toBeGreaterThan(0);
    });

    it("should find calendars by partial region match", () => {
      const results = registry.getByRegion("east");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should return empty array for non-matching region", () => {
      const results = registry.getByRegion("Antarctica");
      expect(results).toEqual([]);
    });
  });

  describe("Query by Usage", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
      registry.register(new JulianPlugin());
    });

    it("should find civil calendars", () => {
      const civil = registry.getByUsage("civil");
      expect(civil.length).toBeGreaterThan(0);
      expect(civil.some(p => p.id === "GREGORIAN")).toBe(true);
    });

    it("should find religious calendars", () => {
      const religious = registry.getByUsage("religious");
      expect(religious.length).toBeGreaterThan(0);
      expect(religious.some(p => p.id === "HEBREW")).toBe(true);
      expect(religious.some(p => p.id === "ISLAMIC_CIVIL")).toBe(true);
    });

    it("should find historical calendars", () => {
      const historical = registry.getByUsage("historical");
      expect(historical.length).toBeGreaterThan(0);
      expect(historical.some(p => p.id === "JULIAN")).toBe(true);
    });

    it("should return empty array for non-matching usage", () => {
      registry.clear();
      registry.register(new GregorianPlugin());

      const scientific = registry.getByUsage("scientific");
      // Gregorian is civil, not scientific
      expect(scientific).toEqual([]);
    });
  });

  describe("Search", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
      registry.register(new HolocenePlugin());
    });

    it("should search by calendar name", () => {
      const results = registry.search("gregorian");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(p => p.id === "GREGORIAN")).toBe(true);
    });

    it("should search by partial name", () => {
      const results = registry.search("greg");
      expect(results.some(p => p.id === "GREGORIAN")).toBe(true);
    });

    it("should search by alias", () => {
      const results = registry.search("hijri");
      expect(results.some(p => p.id === "ISLAMIC_CIVIL")).toBe(true);
    });

    it("should be case insensitive", () => {
      const lower = registry.search("gregorian");
      const upper = registry.search("GREGORIAN");
      const mixed = registry.search("GrEgOrIaN");

      expect(lower.length).toBe(upper.length);
      expect(lower.length).toBe(mixed.length);
    });

    it("should return empty array for no matches", () => {
      const results = registry.search("nonexistent");
      expect(results).toEqual([]);
    });
  });

  describe("Grouping", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
      registry.register(new HolocenePlugin());
      registry.register(new JulianPlugin());
    });

    it("should group calendars by astronomical basis", () => {
      const groups = registry.groupByBasis();

      expect(groups.has("solar")).toBe(true);
      expect(groups.has("lunar")).toBe(true);
      expect(groups.has("lunisolar")).toBe(true);

      const solar = groups.get("solar");
      expect(solar).toBeDefined();
      expect(solar!.length).toBeGreaterThan(0);
    });

    it("should return all calendars across groups", () => {
      const groups = registry.groupByBasis();
      let totalCount = 0;

      for (const [, plugins] of groups) {
        totalCount += plugins.length;
      }

      expect(totalCount).toBe(registry.size);
    });
  });

  describe("Clearing and Size", () => {
    it("should clear all registered plugins", () => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());

      expect(registry.size).toBe(3);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.isEmpty).toBe(true);
      expect(registry.has("GREGORIAN")).toBe(false);
    });

    it("should report correct size", () => {
      expect(registry.size).toBe(0);

      registry.register(new GregorianPlugin());
      expect(registry.size).toBe(1);

      registry.register(new HebrewPlugin());
      expect(registry.size).toBe(2);

      registry.register(new IslamicPlugin());
      expect(registry.size).toBe(3);
    });

    it("should report isEmpty correctly", () => {
      expect(registry.isEmpty).toBe(true);

      registry.register(new GregorianPlugin());
      expect(registry.isEmpty).toBe(false);

      registry.clear();
      expect(registry.isEmpty).toBe(true);
    });
  });

  describe("JSON Export", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());
    });

    it("should export to JSON format", () => {
      const json = registry.toJSON();

      expect(json.count).toBe(3);
      expect(json.calendars).toHaveLength(3);
    });

    it("should include calendar details in export", () => {
      const json = registry.toJSON();

      const gregorian = json.calendars.find(c => c.id === "GREGORIAN");
      expect(gregorian).toBeDefined();
      expect(gregorian!.name).toBeDefined();
      expect(gregorian!.basis).toBe("solar");
    });

    it("should export empty registry", () => {
      registry.clear();
      const json = registry.toJSON();

      expect(json.count).toBe(0);
      expect(json.calendars).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
    });

    it("should throw RegistryError with helpful message", () => {
      try {
        registry.get("NONEXISTENT" as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RegistryError);
        expect((error as Error).message).toContain("NONEXISTENT");
      }
    });

    it("should provide available calendars in error context", () => {
      try {
        registry.get("NONEXISTENT" as any);
        expect.fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(RegistryError);
        const registryError = error as RegistryError;
        expect(registryError.context?.available).toBeDefined();
        expect(registryError.context?.available).toContain("GREGORIAN");
        expect(registryError.context?.available).toContain("HEBREW");
      }
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty registry queries", () => {
      expect(registry.all()).toEqual([]);
      expect(registry.list()).toEqual([]);
      expect(registry.getByBasis("solar")).toEqual([]);
      expect(registry.search("anything")).toEqual([]);
    });

    it("should handle multiple registrations of same plugin instance", () => {
      const plugin = new GregorianPlugin();

      registry.register(plugin);
      registry.register(plugin);
      registry.register(plugin);

      expect(registry.size).toBe(1);
    });

    it("should maintain order after replacement", () => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());

      // Replace gregorian (first)
      registry.register(new GregorianPlugin());

      const ids = registry.list();
      expect(ids[0]).toBe("GREGORIAN");
      expect(ids[1]).toBe("HEBREW");
      expect(ids[2]).toBe("ISLAMIC_CIVIL");
    });

    it("should handle clearing empty registry", () => {
      registry.clear();
      registry.clear(); // Should not throw

      expect(registry.isEmpty).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should preserve plugin types", () => {
      const gregorian = new GregorianPlugin();
      registry.register(gregorian);

      const retrieved = registry.get("GREGORIAN");
      expect(retrieved).toBeInstanceOf(GregorianPlugin);
      expect(retrieved.id).toBe("GREGORIAN");
    });

    it("should handle different plugin implementations", () => {
      registry.register(new GregorianPlugin());
      registry.register(new HebrewPlugin());
      registry.register(new IslamicPlugin());

      const greg = registry.get("GREGORIAN");
      const heb = registry.get("HEBREW");
      const isl = registry.get("ISLAMIC_CIVIL");

      expect(greg).toBeInstanceOf(GregorianPlugin);
      expect(heb).toBeInstanceOf(HebrewPlugin);
      expect(isl).toBeInstanceOf(IslamicPlugin);
    });
  });
});
