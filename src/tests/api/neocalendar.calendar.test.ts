/**
 * Tests for NeoCalendar.calendar() - Era-driven calendar selection
 */

import { describe, it, expect, beforeEach } from "vitest";
import { NeoCalendar } from "@iterumarchive/neo-calendar";
import { Registry } from "@iterumarchive/neo-calendar";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";

describe("NeoCalendar.calendar() - Ergonomic API", () => {
  beforeEach(() => {
    Registry.clear();
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new HebrewPlugin());
    Registry.register(new IslamicPlugin());
  });

  describe("Era-driven calendar selection", () => {
    it("should auto-select GREGORIAN for AD era", () => {
      const date = NeoCalendar.calendar(1800, "AD");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBe(1800);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
      expect(date.era).toBe("AD");
    });

    it("should auto-select GREGORIAN for CE era", () => {
      const date = NeoCalendar.calendar(2026, "CE");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBe(2026);
      // Note: Plugin normalizes CE → AD internally
      expect(date.era).toBe("AD");
    });

    it("should auto-select GREGORIAN for BC era", () => {
      const date = NeoCalendar.calendar(500, "BC");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBe(500);
      expect(date.era).toBe("BC");
    });

    it("should auto-select HOLOCENE for HE era", () => {
      const date = NeoCalendar.calendar(12026, "HE");

      expect(date.calendar).toBe("HOLOCENE");
      expect(date.year).toBe(12026);
      expect(date.era).toBe("HE");
    });

    it("should auto-select JULIAN for OS (Old Style) era", () => {
      const date = NeoCalendar.calendar(1066, "OS");

      expect(date.calendar).toBe("JULIAN");
      expect(date.year).toBe(1066);
      // Note: Plugin normalizes OS → AD internally
      expect(date.era).toBe("AD");
    });

    it("should auto-select GREGORIAN for NS (New Style) era", () => {
      const date = NeoCalendar.calendar(1732, "NS");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.year).toBe(1732);
      // Note: Plugin normalizes NS → AD internally
      expect(date.era).toBe("AD");
    });

    it("should auto-select HEBREW for AM era", () => {
      const date = NeoCalendar.calendar(5784, "AM");

      expect(date.calendar).toBe("HEBREW");
      expect(date.year).toBe(5784);
      expect(date.era).toBe("AM");
    });

    it("should auto-select ISLAMIC for AH era", () => {
      const date = NeoCalendar.calendar(1445, "AH");

      expect(date.calendar).toBe("ISLAMIC_CIVIL");
      expect(date.year).toBe(1445);
      expect(date.era).toBe("AH");
    });
  });

  describe("Month and day parameters", () => {
    it("should support month and day", () => {
      const date = NeoCalendar.calendar(2026, "AD", 3, 16);

      expect(date.year).toBe(2026);
      expect(date.month).toBe(3);
      expect(date.day).toBe(16);
      expect(date.calendar).toBe("GREGORIAN");
    });

    it("should default to month=1, day=1 if not provided", () => {
      const date = NeoCalendar.calendar(12026, "HE");

      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });

    it("should support month without day", () => {
      const date = NeoCalendar.calendar(1800, "AD", 6);

      expect(date.month).toBe(6);
      expect(date.day).toBe(1);
    });
  });

  describe("Calendar override", () => {
    it("should allow explicit calendar override", () => {
      // Force Julian even though AD would normally select Gregorian
      const date = NeoCalendar.calendar(1500, "AD", 1, 1, {
        calendar: "JULIAN",
      });

      expect(date.calendar).toBe("JULIAN");
      expect(date.year).toBe(1500);
      expect(date.era).toBe("AD");
    });

    it("should validate era is supported by overridden calendar", () => {
      expect(() => {
        // HE is not supported by JULIAN
        NeoCalendar.calendar(12026, "HE", 1, 1, { calendar: "JULIAN" });
      }).toThrow(/not supported/);
    });
  });

  describe("Error handling", () => {
    it("should throw for unknown era", () => {
      expect(() => {
        NeoCalendar.calendar(2026, "INVALID");
      }).toThrow(/Unknown era/);
    });

    it("should throw if era not supported by selected calendar", () => {
      expect(() => {
        // Try to force Holocene era on Gregorian explicitly
        NeoCalendar.calendar(12026, "HE", 1, 1, { calendar: "GREGORIAN" });
      }).toThrow(/not supported/);
    });
  });

  describe("Case insensitivity", () => {
    it("should handle lowercase era labels", () => {
      const date = NeoCalendar.calendar(2026, "ad");

      expect(date.calendar).toBe("GREGORIAN");
      expect(date.era).toBe("AD");
    });

    it("should handle mixed case era labels", () => {
      const date = NeoCalendar.calendar(12026, "He");

      expect(date.calendar).toBe("HOLOCENE");
      expect(date.era).toBe("HE");
    });
  });
});

describe("NeoDate.toStrings() - Multi-calendar string output", () => {
  beforeEach(() => {
    Registry.clear();
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new IslamicPlugin());
  });

  it("should return array of display strings", () => {
    const date = NeoCalendar.calendar(2026, "AD", 3, 16);
    const displays = date.toStrings(["GREGORIAN", "HOLOCENE", "JULIAN"]);

    expect(displays).toHaveLength(3);
    expect(displays[0]).toContain("2026");
    expect(displays[1]).toContain("12026");
    expect(displays[1]).toContain("HE");
    expect(displays[2]).toContain("2026");
  });

  it("should work with single calendar", () => {
    const date = NeoCalendar.calendar(12026, "HE");
    const displays = date.toStrings(["GREGORIAN"]);

    expect(displays).toHaveLength(1);
    expect(displays[0]).toContain("2026");
  });

  it("should preserve moment in time across calendars", () => {
    const date = NeoCalendar.calendar(2026, "AD", 3, 16);
    const displays = date.toStrings(["GREGORIAN", "HOLOCENE"]);

    // Both should represent the same JDN
    const greg = NeoCalendar.calendar(2026, "AD", 3, 16);
    const holo = NeoCalendar.calendar(12026, "HE", 3, 16);

    expect(greg.jdn).toBe(holo.jdn);
  });
});

describe("Integration: Ergonomic workflow", () => {
  beforeEach(() => {
    Registry.clear();
    Registry.register(new GregorianPlugin());
    Registry.register(new HolocenePlugin());
    Registry.register(new JulianPlugin());
    Registry.register(new IslamicPlugin());
    Registry.register(new HebrewPlugin());
  });

  it("should support full ergonomic workflow: calendar() -> to() -> toStrings()", () => {
    // Create date with era-driven selection
    const date = NeoCalendar.calendar(1800, "AD");

    // Convert to Holocene
    const holocene = date.to("HOLOCENE");
    expect(holocene.year).toBe(11800);
    expect(holocene.era).toBe("HE");

    // Multi-calendar output
    const displays = date.toStrings(["GREGORIAN", "HOLOCENE", "JULIAN"]);
    expect(displays).toHaveLength(3);
  });

  it("should support method chaining", () => {
    const result = NeoCalendar.calendar(2026, "AD", 3, 16)
      .to("HOLOCENE")
      .toStrings(["GREGORIAN", "HOLOCENE", "JULIAN"]);

    expect(result).toHaveLength(3);
  });

  it("should work with arithmetic operations", () => {
    const date1 = NeoCalendar.calendar(2026, "AD");
    const date2 = date1.add(10, "year");

    expect(date2.year).toBe(2036);
  });

  it("should work with cross-calendar arithmetic", () => {
    const ad = NeoCalendar.calendar(2026, "AD");
    const he = NeoCalendar.calendar(12026, "HE");

    const duration = ad.diff(he);
    expect(duration.toDays()).toBe(0); // Same moment (2026 AD = 12026 HE)
  });

  it("should handle historical dates: Battle of Hastings", () => {
    // October 14, 1066 (Old Style Julian)
    const hastings = NeoCalendar.calendar(1066, "OS", 10, 14);

    expect(hastings.calendar).toBe("JULIAN");

    // Convert to modern Gregorian
    const modern = hastings.to("GREGORIAN");
    expect(modern.calendar).toBe("GREGORIAN");
    expect(modern.year).toBe(1066);
  });

  it("should handle Holocene Era dates", () => {
    const he = NeoCalendar.calendar(12026, "HE", 3, 16);
    const displays = he.toStrings(["HOLOCENE", "GREGORIAN"]);

    expect(displays[0]).toContain("12026");
    expect(displays[0]).toContain("HE");
    expect(displays[1]).toContain("2026");
  });
});
