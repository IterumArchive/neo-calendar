/**
 * @file Error Handling and Registry Tests
 * @description Test error conditions and registry edge cases
 */

import { describe, it, expect } from "vitest";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { CalendarRegistry } from "@iterumarchive/neo-calendar-core";
import { ValidationError, RegistryError } from "@iterumarchive/neo-calendar-core";

const gregorian = new GregorianPlugin();

describe("Invalid Era Labels", () => {
  it("should throw ValidationError for invalid era 'XYZ'", () => {
    try {
      gregorian.toJDN({ year: 2024, month: 1, day: 1, era: "XYZ" as any });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for invalid era 'BCE' on Holocene", () => {
    const holocene = new HolocenePlugin();
    try {
      holocene.toJDN({ year: 12024, month: 1, day: 1, era: "BCE" as any });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });

  it("should throw error for invalid era 'AD' on Islamic", () => {
    const islamic = new IslamicPlugin();
    try {
      islamic.toJDN({ year: 1445, month: 1, day: 1, era: "AD" as any });
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof ValidationError).toBe(true);
    }
  });
});

describe("Registry: Basic Operations", () => {
  it("should throw RegistryError when getting unregistered calendar", () => {
    const registry = new CalendarRegistry();
    try {
      registry.get("NONEXISTENT");
      throw new Error("Should have thrown");
    } catch (error) {
      expect(error instanceof RegistryError).toBe(true);
    }
  });

  it("should return false for has() on unregistered calendar", () => {
    const registry = new CalendarRegistry();
    expect(registry.has("NONEXISTENT")).toBe(false);
  });

  it("should return true for has() on registered calendar", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    expect(registry.has("GREGORIAN")).toBe(true);
  });

  it("should increase size after registration", () => {
    const registry = new CalendarRegistry();
    expect(registry.size).toBe(0);
    registry.register(new GregorianPlugin());
    expect(registry.size).toBe(1);
  });
});

describe("Registry: Duplicate Registration", () => {
  it("should replace existing plugin on duplicate registration", () => {
    const registry = new CalendarRegistry();
    const greg1 = new GregorianPlugin();
    const greg2 = new GregorianPlugin();

    registry.register(greg1);
    expect(registry.size).toBe(1);

    registry.register(greg2);
    expect(registry.size).toBe(1);

    const retrieved = registry.get("GREGORIAN");
    expect(retrieved).toBe(greg2);
  });
});

describe("Registry: Unregister", () => {
  it("should remove plugin when unregistered", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    expect(registry.size).toBe(1);

    registry.unregister("GREGORIAN");
    expect(registry.size).toBe(0);
    expect(registry.has("GREGORIAN")).toBe(false);
  });

  it("should do nothing when unregistering nonexistent calendar", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    expect(registry.size).toBe(1);

    registry.unregister("NONEXISTENT");
    expect(registry.size).toBe(1);
  });

  it("should allow re-registration after unregister", () => {
    const registry = new CalendarRegistry();
    const greg = new GregorianPlugin();

    registry.register(greg);
    registry.unregister("GREGORIAN");
    registry.register(greg);

    expect(registry.has("GREGORIAN")).toBe(true);
    expect(registry.size).toBe(1);
  });
});

describe("Registry: Clear", () => {
  it("should remove all plugins when cleared", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    registry.register(new IslamicPlugin());
    registry.register(new HolocenePlugin());
    expect(registry.size).toBe(3);

    registry.clear();
    expect(registry.size).toBe(0);
    expect(registry.isEmpty).toBe(true);
  });

  it("should be safe to clear empty registry", () => {
    const registry = new CalendarRegistry();
    expect(registry.size).toBe(0);

    registry.clear();
    expect(registry.size).toBe(0);
  });
});

describe("Registry: Filtering", () => {
  it("should filter by basis: solar", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    registry.register(new IslamicPlugin());
    registry.register(new HolocenePlugin());

    const solar = registry.getByBasis("solar");
    expect(solar.length).toBe(2);
    expect(solar.some(p => p.id === "GREGORIAN")).toBe(true);
    expect(solar.some(p => p.id === "HOLOCENE")).toBe(true);
  });

  it("should filter by basis: lunar", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    registry.register(new IslamicPlugin());

    const lunar = registry.getByBasis("lunar");
    expect(lunar.length).toBe(1);
    expect(lunar[0]?.id).toBe("ISLAMIC_CIVIL");
  });

  it("should return empty array when filtering by basis with no matches", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());

    const lunisolar = registry.getByBasis("lunisolar");
    expect(lunisolar.length).toBe(0);
  });

  it("should filter by region", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());

    const global = registry.getByRegion("Global");
    expect(global.length).toBe(1);
  });

  it("should filter by usage", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    registry.register(new IslamicPlugin());

    const religious = registry.getByUsage("religious");
    expect(religious.length).toBe(1);
  });
});

describe("Registry: List and All", () => {
  it("should return array of IDs from list()", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    registry.register(new IslamicPlugin());

    const ids = registry.list();
    expect(ids.length).toBe(2);
    expect(ids.includes("GREGORIAN")).toBe(true);
    expect(ids.includes("ISLAMIC_CIVIL")).toBe(true);
  });

  it("should return array of plugins from all()", () => {
    const registry = new CalendarRegistry();
    const greg = new GregorianPlugin();
    const islamic = new IslamicPlugin();
    registry.register(greg);
    registry.register(islamic);

    const all = registry.all();
    expect(all.length).toBe(2);
    expect(all.includes(greg)).toBe(true);
    expect(all.includes(islamic)).toBe(true);
  });

  it("should be empty for empty registry", () => {
    const registry = new CalendarRegistry();
    expect(registry.isEmpty).toBe(true);
  });

  it("should not be empty for non-empty registry", () => {
    const registry = new CalendarRegistry();
    registry.register(new GregorianPlugin());
    expect(registry.isEmpty).toBe(false);
  });
});
