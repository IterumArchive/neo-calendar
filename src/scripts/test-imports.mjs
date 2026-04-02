// Import Pattern Test Suite
// Tests all supported import patterns work correctly

import { NeoCalendar as StandardNeoCalendar } from "@iterumarchive/neo-calendar";
import { NeoCalendar as FullNeoCalendar } from "@iterumarchive/neo-calendar-full";
import { Registry } from "@iterumarchive/neo-calendar";
import { BaseCalendarPlugin } from "@iterumarchive/neo-calendar-core";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";

console.log("=== Import Pattern Tests ===\n");

// Test 1: Standard package with 4 auto-registered calendars
console.log("Test 1: Standard Package");
try {
  const date1 = StandardNeoCalendar.calendar(2024, "AD", 3, 21);
  console.log("  ✅ Gregorian:", date1.display);

  const date2 = date1.to("HOLOCENE");
  console.log("  ✅ Holocene:", date2.display);

  const date3 = date1.to("JULIAN");
  console.log("  ✅ Julian:", date3.display);

  const date4 = StandardNeoCalendar.calendar(1234567890, "UNIX");
  console.log("  ✅ Unix:", date4.display);
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 2: Manual plugin registration with Standard
console.log("\nTest 2: Manual Plugin Registration");
try {
  Registry.register(new HebrewPlugin());
  Registry.register(new IslamicPlugin());

  const date = StandardNeoCalendar.calendar(2024, "AD", 3, 21);
  const hebrew = date.to("HEBREW");
  console.log("  ✅ Hebrew:", hebrew.display);

  const islamic = date.to("ISLAMIC");
  console.log("  ✅ Islamic:", islamic.display);
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 3: Full package with all calendars
console.log("\nTest 3: Full Package (All Calendars)");
try {
  const date = FullNeoCalendar.calendar(2024, "AD", 3, 21);

  const calendars = [
    "GREGORIAN",
    "HEBREW",
    "ISLAMIC",
    "PERSIAN",
    "COPTIC",
    "ETHIOPIAN",
    "HOLOCENE",
    "JULIAN",
  ];

  const results = date.toStrings(calendars);
  calendars.forEach((cal, i) => {
    console.log(`  ✅ ${cal}: ${results[i]}`);
  });
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 4: Individual plugin import
console.log("\nTest 4: Individual Plugin Classes");
try {
  console.log("  ✅ HebrewPlugin:", HebrewPlugin.name);
  console.log("  ✅ IslamicPlugin:", IslamicPlugin.name);
  console.log("  ✅ GregorianPlugin:", GregorianPlugin.name);
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 5: Core types
console.log("\nTest 5: Core Package Types");
try {
  console.log("  ✅ BaseCalendarPlugin:", typeof BaseCalendarPlugin);
  console.log("  ✅ Registry:", typeof Registry);
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 6: Method chaining
console.log("\nTest 6: Method Chaining");
try {
  const result = StandardNeoCalendar.calendar(2024, "AD", 1, 1)
    .add(3, "months")
    .add(15, "days")
    .to("HOLOCENE");
  console.log("  ✅ Chained result:", result.display);
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

// Test 7: Cross-calendar arithmetic
console.log("\nTest 7: Cross-Calendar Arithmetic");
try {
  const ad2000 = StandardNeoCalendar.calendar(2000, "AD");
  const he12000 = StandardNeoCalendar.calendar(12000, "HE");
  const diff = ad2000.diff(he12000);
  console.log("  ✅ Diff days:", diff.toDays());
} catch (error) {
  console.log("  ❌ Error:", error.message);
}

console.log("\n=== All Import Pattern Tests Complete ===");
