import { describe, it, expect, beforeEach } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";

describe("Hardcoding Removal Verification", () => {
  beforeEach(() => {
    Registry.clear();
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
  });
  it("toISOString() should use current calendar, not force GREGORIAN", () => {
    const gregorianDate = NeoCalendar.calendar(2024, "AD", 3, 15);
    const holoDate = gregorianDate.to("HOLOCENE");

    expect(gregorianDate.toISOString()).toBe("2024-03-15");
    expect(holoDate.toISOString()).toBe("12024-03-15");
    expect(gregorianDate.toISOString()).not.toBe(holoDate.toISOString());
  });

  it("getProlepticallyWarning() should use plugin metadata dynamically", () => {
    const prolepticGregorian = NeoCalendar.calendar(1500, "AD", 1, 1);
    const warning = prolepticGregorian.getProlepticallyWarning();

    expect(warning).toBeTruthy();
    expect(warning?.isProleptic).toBe(true);
    expect(warning?.warning).toContain("1582");
    expect(warning?.warning).toContain("10-15"); // Month-day format from plugin metadata
    expect(warning?.warning).toContain("JULIAN"); // Should mention replaced calendar
  });

  it("normalizeUnit() should handle hour/hours with clear error message", () => {
    const date = NeoCalendar.calendar(2024, "AD", 3, 1);

    // Should work for supported units
    expect(() => date.add(5, "days")).not.toThrow();
    expect(() => date.add(2, "months")).not.toThrow();

    // Should reject hour units with clear message
    expect(() => date.add(5, "hours")).toThrow(
      "Invalid or unsupported time unit: hours",
    );

    // Should reject week units (not implemented in add() method)
    expect(() => date.add(2, "weeks")).toThrow("Unsupported time unit: weeks");
  });
});
