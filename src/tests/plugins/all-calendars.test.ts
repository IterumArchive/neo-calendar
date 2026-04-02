/**
 * @file Comprehensive Calendar Tests
 * @description Tests all calendar plugins and cross-calendar conversions
 *
 * Validates:
 * - Round-trip conversions (Date → JDN → Date)
 * - Known date conversions
 * - Registry operations
 * - Cross-calendar conversions via JDN hub
 * - Leap year handling
 */

import { describe, it, expect } from "vitest";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { CalendarRegistry } from "@iterumarchive/neo-calendar-core";
import type { BrandedJDN } from "@iterumarchive/neo-calendar-core";

describe("Holocene Calendar", () => {
  const registry = new CalendarRegistry();
  const holoPlugin = new HolocenePlugin();

  it("should round-trip 12024-03-18", () => {
    const input = { year: 12024, month: 3, day: 18 };
    const jdn = holoPlugin.toJDN(input);
    const result = holoPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should convert 11970-01-01 to JDN 2440588", () => {
    const jdn = holoPlugin.toJDN({ year: 11970, month: 1, day: 1 });
    expect(jdn).toBe(2440588n);
  });

  it("should round-trip 11980-06-15", () => {
    const input = { year: 11980, month: 6, day: 15 };
    const jdn = holoPlugin.toJDN(input);
    const result = holoPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should register successfully", () => {
    registry.register(holoPlugin);
    expect(registry.has(holoPlugin.id)).toBe(true);
  });
});

describe("Unix Timestamp", () => {
  const registry = new CalendarRegistry();
  const unixPlugin = new UnixPlugin();

  it("should convert epoch (0 seconds) to JDN 2440588", () => {
    const jdn = unixPlugin.toJDN({ year: 0, month: 1, day: 1 });
    expect(jdn).toBe(2440588n);
  });

  it("should round-trip 86400 seconds (1 day)", () => {
    const input = { year: 86400, month: 1, day: 1 };
    const jdn = unixPlugin.toJDN(input);
    const result = unixPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
  });

  it("should register successfully", () => {
    registry.register(unixPlugin);
    expect(registry.has(unixPlugin.id)).toBe(true);
  });
});

describe("Gregorian Calendar", () => {
  const registry = new CalendarRegistry();
  const gregorianPlugin = new GregorianPlugin();

  it("should convert 2000-01-01 AD to JDN 2451545", () => {
    const jdn = gregorianPlugin.toJDN({
      year: 2000,
      month: 1,
      day: 1,
      era: "AD",
    });
    expect(jdn).toBe(2451545n);
  });

  it("should convert 2024-03-18 AD to JDN 2460388", () => {
    const jdn = gregorianPlugin.toJDN({
      year: 2024,
      month: 3,
      day: 18,
      era: "AD",
    });
    expect(jdn).toBe(2460388n);
  });

  it("should round-trip 1 BC 01-01", () => {
    const input = { year: 1, month: 1, day: 1, era: "BC" as const };
    const jdn = gregorianPlugin.toJDN(input);
    const result = gregorianPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should round-trip 1582-10-15 AD (Gregorian adoption)", () => {
    const input = { year: 1582, month: 10, day: 15, era: "AD" as const };
    const jdn = gregorianPlugin.toJDN(input);
    const result = gregorianPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should register successfully", () => {
    registry.register(gregorianPlugin);
    expect(registry.has(gregorianPlugin.id)).toBe(true);
  });
});

describe("Hebrew Calendar", () => {
  const registry = new CalendarRegistry();
  const hebrewPlugin = new HebrewPlugin();

  it("should convert and display date (simplified algorithm)", () => {
    const hebrewJDN = hebrewPlugin.toJDN({
      year: 5784,
      month: 7,
      day: 1,
      era: "AM",
    });
    const hebrewResult = hebrewPlugin.fromJDN(hebrewJDN);
    expect(hebrewResult.display).toBeDefined();
  });

  it("should register successfully", () => {
    registry.register(hebrewPlugin);
    expect(registry.has(hebrewPlugin.id)).toBe(true);
  });
});

describe("Islamic Calendar", () => {
  const registry = new CalendarRegistry();
  const islamicPlugin = new IslamicPlugin();

  it("should convert 1 AH 01-01 to JDN 1948440", () => {
    const jdn = islamicPlugin.toJDN({ year: 1, month: 1, day: 1, era: "AH" });
    expect(jdn).toBe(1948440n);
  });

  it("should round-trip 1445-09-01 AH", () => {
    const input = { year: 1445, month: 9, day: 1, era: "AH" as const };
    const jdn = islamicPlugin.toJDN(input);
    const result = islamicPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should round-trip leap year date 2-12-30 AH", () => {
    const input = { year: 2, month: 12, day: 30, era: "AH" as const };
    const jdn = islamicPlugin.toJDN(input);
    const result = islamicPlugin.fromJDN(jdn);
    expect(result.year).toBe(input.year);
    expect(result.month).toBe(input.month);
    expect(result.day).toBe(input.day);
  });

  it("should register successfully", () => {
    registry.register(islamicPlugin);
    expect(registry.has(islamicPlugin.id)).toBe(true);
  });
});

describe("Registry Operations", () => {
  const registry = new CalendarRegistry();
  registry.register(new HolocenePlugin());
  registry.register(new UnixPlugin());
  registry.register(new GregorianPlugin());
  registry.register(new HebrewPlugin());
  registry.register(new IslamicPlugin());

  it("should have 5 registered calendars", () => {
    expect(registry.size).toBe(5);
  });

  it("should find 2 solar calendars", () => {
    const solarCalendars = registry.getByBasis("solar");
    expect(solarCalendars.length).toBe(2);
  });

  it("should find 1 lunar calendar", () => {
    const lunarCalendars = registry.getByBasis("lunar");
    expect(lunarCalendars.length).toBe(1);
    expect(lunarCalendars[0]).toBeDefined();
  });
});

describe("Cross-Calendar Conversions", () => {
  const testJDN = 2460388n as BrandedJDN;
  const holoPlugin = new HolocenePlugin();
  const unixPlugin = new UnixPlugin();
  const gregorianPlugin = new GregorianPlugin();
  const hebrewPlugin = new HebrewPlugin();
  const islamicPlugin = new IslamicPlugin();

  it("should convert JDN across all calendars", () => {
    const holoDate = holoPlugin.fromJDN(testJDN);
    const unixDate = unixPlugin.fromJDN(testJDN);
    const gregDate = gregorianPlugin.fromJDN(testJDN);
    const hebrewDate = hebrewPlugin.fromJDN(testJDN);
    const islamicDate = islamicPlugin.fromJDN(testJDN);

    expect(holoDate.display).toBeDefined();
    expect(unixDate.display).toBeDefined();
    expect(gregDate.display).toBeDefined();
    expect(hebrewDate.display).toBeDefined();
    expect(islamicDate.display).toBeDefined();
  });
});
