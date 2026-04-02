/**
 * @file Test suite for @iterumarchive/neo-calendar-lite package
 * @description Tests for minimal calendar API - sorting and conversion only
 *
 * NOTE: Lite package is a simplified wrapper around core/plugins.
 * For date comparisons, use standard JavaScript: `a.valueOf() < b.valueOf()`
 * This keeps the API minimal while reusing the same reliable core logic.
 */

import { describe, it, expect } from "vitest";
import {
  calendar,
  registerCalendar,
  SQLHelpers,
} from "@iterumarchive/neo-calendar-lite";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";

describe("Lite Package - Calendar Registration", () => {
  it("should have Gregorian, Holocene, and Unix calendars pre-registered", () => {
    expect(() => calendar(2024, "AD")).not.toThrow();
    expect(() => calendar(12024, "HE")).not.toThrow();
    expect(() => calendar(1704067200, "UNIX")).not.toThrow();
  });

  it("should throw for unregistered calendar eras", () => {
    expect(() => calendar(2024, "UNKNOWN_ERA")).toThrow(/not registered/);
  });
});

describe("Lite Package - Date Creation", () => {
  it("should create a date in Gregorian calendar", () => {
    const date = calendar(2024, "AD");
    expect(date.year).toBe(2024);
    expect(date.era).toBe("AD");
    expect(Number(date.jdn)).toBeGreaterThan(0);
  });

  it("should create a date in Holocene calendar", () => {
    const date = calendar(12024, "HE");
    expect(date.year).toBe(12024);
    expect(date.era).toBe("HE");
  });

  it("should create a date in Unix timestamp", () => {
    const date = calendar(1704067200, "UNIX");
    expect(date.year).toBe(1704067200);
    expect(date.era).toBe("UNIX");
  });

  it("should accept string years", () => {
    const date = calendar("2024", "AD");
    expect(date.year).toBe(2024);
    expect(date.era).toBe("AD");
  });
});

describe("Lite Package - Date Conversion", () => {
  it("should convert Gregorian to Holocene", () => {
    const gregorianDate = calendar(2024, "AD");
    const holoceneDate = gregorianDate.to("HE");
    expect(holoceneDate.year).toBe(12024);
    expect(holoceneDate.era).toBe("HE");
    expect(holoceneDate.jdn).toBe(gregorianDate.jdn);
  });

  it("should convert Holocene to Gregorian", () => {
    const holoceneDate = calendar(12024, "HE");
    const gregorianDate = holoceneDate.to("AD");
    expect(gregorianDate.year).toBe(2024);
    expect(gregorianDate.era).toBe("AD");
  });

  it("should convert Unix to Gregorian", () => {
    const unixDate = calendar(1704067200, "UNIX");
    const gregorianDate = unixDate.to("AD");
    expect(gregorianDate.year).toBe(2024);
    expect(gregorianDate.era).toBe("AD");
  });

  it("should chain multiple conversions", () => {
    const adDate = calendar(300, "AD");
    const heDate = adDate.to("HE");
    const backToAd = heDate.to("AD");
    expect(backToAd.era).toBe("AD");
    // JDN should remain the same
    expect(backToAd.jdn).toBe(adDate.jdn);
  });

  it("should preserve JDN across conversions", () => {
    const original = calendar(2024, "AD");
    const converted = original.to("HE").to("AD");
    expect(converted.jdn).toBe(original.jdn);
  });
});

describe("Lite Package - Date Sorting", () => {
  it("should provide valueOf() for numeric comparison", () => {
    const date = calendar(2024, "AD");
    expect(typeof date.valueOf()).toBe("number");
  });

  it("should sort dates correctly using valueOf()", () => {
    const ancient = calendar(300, "AD");
    const medieval = calendar(1200, "AD");
    const modern = calendar(2024, "AD");

    const dates = [modern, ancient, medieval];
    const sorted = dates.sort((a, b) => a.valueOf() - b.valueOf());

    expect(sorted[0].year).toBe(300);
    expect(sorted[1].year).toBe(1200);
    expect(sorted[2].year).toBe(2024);
  });

  it("should handle sorting mixed calendar systems", () => {
    const gregorian = calendar(2024, "AD");
    const holocene = calendar(12024, "HE");

    expect(gregorian.valueOf()).toBe(holocene.valueOf());
  });

  it("should sort dates chronologically regardless of era", () => {
    const dates = [
      calendar(2024, "AD"),
      calendar(1, "AD"),
      calendar(1000, "AD"),
      calendar(12024, "HE"),
    ];

    const sorted = dates.sort((a, b) => a.valueOf() - b.valueOf());

    expect(sorted[0].year).toBe(1);
    expect(sorted[1].year).toBe(1000);
    expect(sorted[2].year).toBe(2024);
  });

  it("should support comparison using valueOf()", () => {
    const ancient = calendar(300, "AD");
    const modern = calendar(2024, "AD");

    // Standard JS comparisons work with valueOf()
    expect(ancient.valueOf() < modern.valueOf()).toBe(true);
    expect(modern.valueOf() > ancient.valueOf()).toBe(true);
    expect(ancient.valueOf() === ancient.valueOf()).toBe(true);
  });
});

describe("Lite Package - Date Formatting", () => {
  it("should format dates with default format", () => {
    const date = calendar(2024, "AD");
    expect(date.format()).toBe("2024-01-01 AD");
  });

  it("should format dates with month and day", () => {
    const date = calendar(2024, "AD", 12, 31);
    expect(date.format()).toBe("2024-12-31 AD");
  });

  it("should format Holocene dates", () => {
    const date = calendar(12024, "HE", 6, 15);
    expect(date.format()).toBe("12024-06-15 HE");
  });

  it("should pad single-digit months and days", () => {
    const date = calendar(2024, "AD", 3, 5);
    expect(date.format()).toBe("2024-03-05 AD");
  });
});

describe("Lite Package - SQL Helpers", () => {
  it("should generate SQL for Gregorian year range", () => {
    const sql = SQLHelpers.yearRange("AD", 2024);
    expect(sql).toContain("jdn >=");
    expect(sql).toContain("AND jdn <=");
  });

  it("should generate SQL for Holocene year range", () => {
    const sql = SQLHelpers.yearRange("HE", 12024);
    expect(sql).toContain("jdn >=");
    expect(sql).toContain("AND jdn <=");
  });

  it("should support custom JDN column name", () => {
    const sql = SQLHelpers.yearRange("AD", 2024, "julian_day");
    expect(sql).toContain("julian_day >=");
    expect(sql).toContain("julian_day <=");
  });

  it("should generate different ranges for different years", () => {
    const sql2023 = SQLHelpers.yearRange("AD", 2023);
    const sql2024 = SQLHelpers.yearRange("AD", 2024);
    expect(sql2023).not.toBe(sql2024);
  });

  it("should throw for unregistered calendar in SQL helpers", () => {
    expect(() => SQLHelpers.yearRange("UNKNOWN", 2024)).toThrow(
      /not registered/,
    );
  });
});

describe("Lite Package - Edge Cases", () => {
  it("should handle year 1 CE", () => {
    const date = calendar(1, "AD");
    expect(date.year).toBe(1);
    expect(Number(date.jdn)).toBeGreaterThan(0);
  });

  it("should handle large Unix timestamps", () => {
    const date = calendar(2147483647, "UNIX"); // Max 32-bit timestamp
    expect(date.year).toBe(2147483647);
  });

  it("should handle conversion errors gracefully", () => {
    expect(() => calendar(2024, "INVALID_ERA")).toThrow();
    const date = calendar(2024, "AD");
    expect(() => date.to("INVALID_ERA")).toThrow();
  });
});

describe("Lite Package - Integration Tests", () => {
  it("should support real-world use case: sorting historical events", () => {
    const events = [
      { name: "Moon Landing", date: calendar(1969, "AD") },
      { name: "Roman Empire Founded", date: calendar(27, "AD") },
      { name: "Today", date: calendar(2024, "AD") },
      { name: "Medieval Period", date: calendar(1200, "AD") },
    ];

    const sortedEvents = events.sort(
      (a, b) => a.date.valueOf() - b.date.valueOf(),
    );

    expect(sortedEvents[0].name).toBe("Roman Empire Founded");
    expect(sortedEvents[1].name).toBe("Medieval Period");
    expect(sortedEvents[2].name).toBe("Moon Landing");
    expect(sortedEvents[3].name).toBe("Today");
  });

  it("should support database query workflow", () => {
    // Find all events in year 2024 AD
    const whereClause = SQLHelpers.yearRange("AD", 2024, "event_jdn");
    expect(whereClause).toContain("event_jdn");

    // Create date for comparison
    const targetDate = calendar(2024, "AD");
    expect(targetDate.valueOf()).toBeGreaterThan(0);
  });

  it("should support cross-calendar comparisons", () => {
    const gregorian2024 = calendar(2024, "AD");
    const holocene12024 = calendar(12024, "HE");

    // Same point in time
    expect(gregorian2024.valueOf()).toBe(holocene12024.valueOf());

    // Convert back and forth
    const converted = gregorian2024.to("HE");
    expect(converted.year).toBe(holocene12024.year);
  });
});
