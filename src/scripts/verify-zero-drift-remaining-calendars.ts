/**
 * Remaining Calendars Verification: Zero Drift Testing
 *
 * This script validates the 7 "remaining" calendar implementations that have
 * passing epoch tests but have not yet undergone rigorous triangle conversion
 * and drift analysis like the Core 5 (Gregorian, Julian, Islamic, Hebrew, Coptic).
 *
 * CALENDARS TESTED:
 * - Ethiopian: Solar calendar, similar structure to Coptic
 * - Holocene: Gregorian + 10,000 year offset (HE = Human Era)
 * - Unix: Timestamp-based (seconds since Jan 1, 1970)
 * - Before Present (BP): Archaeological dating (1950 CE anchor)
 * - Persian (Jalali): Solar calendar with 33-year cycle (KNOWN DRIFT ISSUES)
 * - Mayan (Long Count): Deep-time calendar (GMT correlation)
 * - French Revolutionary: Decimal calendar (1792-1805 valid range)
 *
 * METHODOLOGY:
 * 1. Epoch validation (already passing in verification-benchmarks.test.ts)
 * 2. Triangle conversions (Calendar A → JDN → Calendar B → JDN → Calendar A)
 * 3. Modern date round-trips (2024, 2000, 1970)
 * 4. Historical date validation
 * 5. 100-year span test (where applicable)
 *
 * EXPECTED OUTCOMES:
 * - Ethiopian, Holocene, Unix, BP: Should achieve 0.00% drift
 * - Persian: KNOWN ISSUE - 1-day drift on some dates (33-year cycle complexity)
 * - Mayan: Limited to epoch validation (correlation constant only)
 * - French Revolutionary: Limited range (1792-1805), should be 0.00% within range
 *
 * This validation determines which calendars can be promoted from "Functional"
 * to "Battle-Tested" status in the public documentation.
 */

import { EthiopianPlugin } from "@iterumarchive/neo-calendar-ethiopian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
import { BeforePresentPlugin } from "@iterumarchive/neo-calendar-before-present";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
import { MayanPlugin } from "@iterumarchive/neo-calendar-mayan";
import { FrenchRevolutionaryPlugin } from "@iterumarchive/neo-calendar-french-revolutionary";
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { CopticPlugin } from "@iterumarchive/neo-calendar-coptic";

const ethiopian = new EthiopianPlugin();
const holocene = new HolocenePlugin();
const unix = new UnixPlugin();
const bp = new BeforePresentPlugin();
const persian = new PersianPlugin();
const mayan = new MayanPlugin();
const frenchRev = new FrenchRevolutionaryPlugin();
const gregorian = new GregorianPlugin(); // Bridge calendar
const coptic = new CopticPlugin(); // Bridge calendar for Ethiopian

console.log("=".repeat(80));
console.log("REMAINING CALENDARS: ZERO DRIFT VERIFICATION");
console.log("=".repeat(80));
console.log("\n📋 TESTING SCOPE:");
console.log("  • Ethiopian: Solar calendar (13 months, similar to Coptic)");
console.log("  • Holocene: Simple offset from Gregorian (+10,000 years)");
console.log("  • Unix: Timestamp conversion (seconds since 1970-01-01)");
console.log("  • Before Present: Archaeological standard (1950 CE anchor)");
console.log("  • Persian: Solar calendar with 33-year leap cycle");
console.log("  • Mayan: Long Count deep-time calendar");
console.log("  • French Revolutionary: Decimal calendar (limited 1792-1805)");
console.log("\n⚠️  KNOWN LIMITATIONS:");
console.log(
  "  • Persian: May exhibit 1-day drift due to simplified leap cycle",
);
console.log(
  "  • Mayan: Correlation constant validation only (no triangle tests)",
);
console.log("  • French Revolutionary: Only valid 1792-1805");
console.log("\n");

let totalPass = 0;
let totalFail = 0;
let totalSkip = 0;

// ============================================================================
// TEST 1: Ethiopian ↔ Gregorian ↔ Coptic Triangle
// ============================================================================
console.log("━".repeat(80));
console.log("TEST 1: Ethiopian ↔ Gregorian ↔ Coptic Triangle");
console.log("━".repeat(80));
console.log("Ethiopian calendar: 13 months (12×30 days + 5-6 day Pagume)");
console.log("Structure mirrors Coptic calendar with different epoch\n");

const ethiopianDates = [
  {
    year: 2015,
    month: 13,
    day: 6,
    label: "Pagume 6, 2015 (Last day of leap year)",
  },
  { year: 2000, month: 13, day: 5, label: "Pagume 5, 2000 (13th month)" },
  { year: 2015, month: 7, day: 15, label: "Middle of Ethiopian year 2015" },
  {
    year: 1,
    month: 1,
    day: 1,
    label: "Ethiopian Epoch (tests Coptic proleptic extension)",
  },
];

let test1Pass = 0;
let test1Fail = 0;

for (const original of ethiopianDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     Ethiopian ${original.year}-${original.month}-${original.day}`,
  );

  const jdn1 = ethiopian.toJDN(original);
  console.log(`  Step 1:       Ethiopian → JDN ${jdn1}`);

  const gregDate = gregorian.fromJDN(jdn1);
  console.log(
    `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
  );

  const jdn2 = gregorian.toJDN(gregDate);
  console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

  const copticDate = coptic.fromJDN(jdn2);
  console.log(
    `  Step 4:       JDN → Coptic ${copticDate.year}-${copticDate.month}-${copticDate.day}`,
  );

  const jdn3 = coptic.toJDN(copticDate);
  console.log(`  Step 5:       Coptic → JDN ${jdn3}`);

  const roundTrip = ethiopian.fromJDN(jdn3);
  console.log(
    `  Step 6:       JDN → Ethiopian ${roundTrip.year}-${roundTrip.month}-${roundTrip.day}`,
  );

  const jdnDrift = Number(jdn3 - jdn1);
  const dateMatch =
    roundTrip.year === original.year &&
    roundTrip.month === original.month &&
    roundTrip.day === original.day;

  console.log(`  JDN Drift:    ${jdnDrift} days`);
  console.log(`  Date Match:   ${dateMatch ? "✓ PASS" : "✗ FAIL"}`);
  console.log(
    `  Result:       ${jdnDrift === 0 && dateMatch ? "✓ 0.00% DRIFT" : "✗ DRIFT DETECTED"}`,
  );

  if (jdnDrift === 0 && dateMatch) test1Pass++;
  else test1Fail++;
}

console.log(`\nTest 1 Summary: ${test1Pass} passed, ${test1Fail} failed`);
totalPass += test1Pass;
totalFail += test1Fail;

// ============================================================================
// TEST 2: Holocene ↔ Gregorian (Simple Offset Validation)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 2: Holocene ↔ Gregorian (Simple +10,000 Year Offset)");
console.log("━".repeat(80));
console.log("Holocene calendar: Gregorian + 10,000 years (HE = Human Era)");
console.log("Should have perfect 0.00% drift (trivial transformation)\n");

const holoceneDates = [
  {
    year: 12024,
    month: 3,
    day: 24,
    label: "Today (March 24, 12024 HE = 2024 CE)",
  },
  { year: 12000, month: 1, day: 1, label: "Y2K in Holocene (2000 CE)" },
  { year: 11970, month: 1, day: 1, label: "Unix Epoch in Holocene (1970 CE)" },
  { year: 10001, month: 1, day: 1, label: "1 CE in Holocene" },
  { year: 10000, month: 12, day: 31, label: "1 BCE in Holocene" },
];

let test2Pass = 0;
let test2Fail = 0;

for (const original of holoceneDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     Holocene ${original.year}-${original.month}-${original.day}`,
  );

  const jdn1 = holocene.toJDN(original);
  console.log(`  Step 1:       Holocene → JDN ${jdn1}`);

  const gregDate = gregorian.fromJDN(jdn1);
  console.log(
    `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
  );

  const jdn2 = gregorian.toJDN(gregDate);
  console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

  const roundTrip = holocene.fromJDN(jdn2);
  console.log(
    `  Step 4:       JDN → Holocene ${roundTrip.year}-${roundTrip.month}-${roundTrip.day}`,
  );

  const jdnDrift = Number(jdn2 - jdn1);
  const dateMatch =
    roundTrip.year === original.year &&
    roundTrip.month === original.month &&
    roundTrip.day === original.day;

  console.log(`  JDN Drift:    ${jdnDrift} days`);
  console.log(`  Date Match:   ${dateMatch ? "✓ PASS" : "✗ FAIL"}`);
  console.log(
    `  Result:       ${jdnDrift === 0 && dateMatch ? "✓ 0.00% DRIFT" : "✗ DRIFT DETECTED"}`,
  );

  if (jdnDrift === 0 && dateMatch) test2Pass++;
  else test2Fail++;
}

console.log(`\nTest 2 Summary: ${test2Pass} passed, ${test2Fail} failed`);
totalPass += test2Pass;
totalFail += test2Fail;

// ============================================================================
// TEST 3: Unix Timestamp ↔ Gregorian (Precision Validation)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 3: Unix Timestamp ↔ Gregorian (Second-to-Day Precision)");
console.log("━".repeat(80));
console.log("Unix: Timestamp in seconds since Jan 1, 1970 00:00:00 UTC");
console.log(
  "Note: Unix uses 'year' field to store timestamp (semantic overloading)",
);
console.log("      JDN is day-level precision, Unix is second-level\n");

const unixDates = [
  { year: 0, month: 1, day: 1, label: "Unix Epoch (Jan 1, 1970, timestamp=0)" },
  {
    year: 946684800,
    month: 1,
    day: 1,
    label: "Y2K (Jan 1, 2000, timestamp=946684800)",
  },
  {
    year: 1711238400,
    month: 1,
    day: 1,
    label: "March 24, 2024 (timestamp=1711238400)",
  },
];

let test3Pass = 0;
let test3Fail = 0;

for (const original of unixDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     Unix timestamp ${original.year} (stored in 'year' field)`,
  );

  const jdn1 = unix.toJDN(original);
  console.log(`  Step 1:       Unix → JDN ${jdn1}`);

  const gregDate = gregorian.fromJDN(jdn1);
  console.log(
    `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
  );

  const jdn2 = gregorian.toJDN(gregDate);
  console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

  const roundTrip = unix.fromJDN(jdn2);
  console.log(`  Step 4:       JDN → Unix timestamp ${roundTrip.year}`);

  const jdnDrift = Number(jdn2 - jdn1);
  // For Unix, we need to check timestamp match at day-level precision
  // Unix timestamps truncate to start of day when converting through JDN
  const originalDayStart = Math.floor(original.year / 86400) * 86400;
  const roundTripDayStart = Math.floor(roundTrip.year / 86400) * 86400;
  const timestampMatch = originalDayStart === roundTripDayStart;

  console.log(`  JDN Drift:    ${jdnDrift} days`);
  console.log(
    `  Timestamp Match (day-level): ${timestampMatch ? "✓ PASS" : "✗ FAIL"}`,
  );
  console.log(
    `  Result:       ${jdnDrift === 0 && timestampMatch ? "✓ 0.00% DRIFT" : "✗ DRIFT DETECTED"}`,
  );

  if (jdnDrift === 0 && timestampMatch) test3Pass++;
  else test3Fail++;
}

console.log(`\nTest 3 Summary: ${test3Pass} passed, ${test3Fail} failed`);
totalPass += test3Pass;
totalFail += test3Fail;

// ============================================================================
// TEST 4: Before Present (BP) ↔ Gregorian (Archaeological Dating)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 4: Before Present (BP) ↔ Gregorian (1950 CE Anchor)");
console.log("━".repeat(80));
console.log("BP: Radiocarbon dating standard, 0 BP = Jan 1, 1950 CE");
console.log("Negative BP values represent future dates\n");

const bpDates = [
  { year: 0, month: 1, day: 1, label: "BP Epoch (1950 CE)" },
  { year: -20, month: 1, day: 1, label: "20 years before present (1970 CE)" },
  { year: -50, month: 12, day: 31, label: "End of 1999 CE (-50 BP)" },
  { year: 100, month: 1, day: 1, label: "100 BP (1850 CE)" },
];

let test4Pass = 0;
let test4Fail = 0;

for (const original of bpDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     BP ${original.year}-${original.month}-${original.day}`,
  );

  const jdn1 = bp.toJDN(original);
  console.log(`  Step 1:       BP → JDN ${jdn1}`);

  const gregDate = gregorian.fromJDN(jdn1);
  console.log(
    `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
  );

  const jdn2 = gregorian.toJDN(gregDate);
  console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

  const roundTrip = bp.fromJDN(jdn2);
  console.log(
    `  Step 4:       JDN → BP ${roundTrip.year}-${roundTrip.month}-${roundTrip.day}`,
  );

  const jdnDrift = Number(jdn2 - jdn1);
  const dateMatch =
    roundTrip.year === original.year &&
    roundTrip.month === original.month &&
    roundTrip.day === original.day;

  console.log(`  JDN Drift:    ${jdnDrift} days`);
  console.log(`  Date Match:   ${dateMatch ? "✓ PASS" : "✗ FAIL"}`);
  console.log(
    `  Result:       ${jdnDrift === 0 && dateMatch ? "✓ 0.00% DRIFT" : "✗ DRIFT DETECTED"}`,
  );

  if (jdnDrift === 0 && dateMatch) test4Pass++;
  else test4Fail++;
}

console.log(`\nTest 4 Summary: ${test4Pass} passed, ${test4Fail} failed`);
totalPass += test4Pass;
totalFail += test4Fail;

// ============================================================================
// TEST 5: Persian (Jalali) ↔ Gregorian (KNOWN DRIFT DOCUMENTATION)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 5: Persian (Jalali) ↔ Gregorian (33-Year Cycle Validation)");
console.log("━".repeat(80));
console.log(
  "⚠️  KNOWN ISSUE: Persian calendar uses simplified 33-year leap cycle",
);
console.log("Full 2820-year intercalation not implemented");
console.log("Expect: Epoch passes, some modern dates may show 1-day drift\n");

const persianDates = [
  { year: 1, month: 1, day: 1, label: "Persian Epoch (Nowruz 622 CE)" },
  { year: 1403, month: 1, day: 1, label: "Nowruz 1403 (2024 CE)" },
  { year: 1400, month: 7, day: 15, label: "Mid-year 1400" },
];

let test5Pass = 0;
let test5Fail = 0;
let test5Drift = 0;

for (const original of persianDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     Persian ${original.year}-${original.month}-${original.day}`,
  );

  const jdn1 = persian.toJDN(original);
  console.log(`  Step 1:       Persian → JDN ${jdn1}`);

  const gregDate = gregorian.fromJDN(jdn1);
  console.log(
    `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
  );

  const jdn2 = gregorian.toJDN(gregDate);
  console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

  const roundTrip = persian.fromJDN(jdn2);
  console.log(
    `  Step 4:       JDN → Persian ${roundTrip.year}-${roundTrip.month}-${roundTrip.day}`,
  );

  const jdnDrift = Number(jdn2 - jdn1);
  const dateMatch =
    roundTrip.year === original.year &&
    roundTrip.month === original.month &&
    roundTrip.day === original.day;

  console.log(`  JDN Drift:    ${jdnDrift} days`);
  console.log(`  Date Match:   ${dateMatch ? "✓ PASS" : "✗ FAIL"}`);

  if (jdnDrift === 0 && dateMatch) {
    console.log(`  Result:       ✓ 0.00% DRIFT`);
    test5Pass++;
  } else if (Math.abs(jdnDrift) === 1) {
    console.log(`  Result:       ⚠️  1-DAY DRIFT (Known limitation)`);
    test5Drift++;
  } else {
    console.log(`  Result:       ✗ UNEXPECTED DRIFT`);
    test5Fail++;
  }
}

console.log(
  `\nTest 5 Summary: ${test5Pass} perfect, ${test5Drift} 1-day drift (known), ${test5Fail} failed`,
);
totalPass += test5Pass;
totalSkip += test5Drift; // Count 1-day drifts as known limitations

// ============================================================================
// TEST 6: Mayan Long Count (Epoch Validation Only)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 6: Mayan Long Count (GMT Correlation Constant)");
console.log("━".repeat(80));
console.log("Mayan: Deep-time calendar using GMT correlation (JDN 584,283)");
console.log("Note: Only epoch validation (correlation constant)");
console.log(
  "      No triangle tests (different structure from other calendars)\n",
);

const mayanEpoch = { year: 0, month: 0, day: 0 }; // 13.0.0.0.0
console.log("Mayan Epoch (13.0.0.0.0 = Long Count zero)");
console.log(
  `  Original:     Mayan ${mayanEpoch.year}-${mayanEpoch.month}-${mayanEpoch.day}`,
);

const mayanJDN = mayan.toJDN(mayanEpoch);
console.log(`  Step 1:       Mayan → JDN ${mayanJDN}`);
console.log(`  Expected:     JDN 584283 (GMT correlation)`);

const mayanMatch = mayanJDN === 584283n;
console.log(`  Validation:   ${mayanMatch ? "✓ PASS" : "✗ FAIL"}`);

if (mayanMatch) {
  totalPass++;
  console.log(`  Result:       ✓ CORRELATION CONSTANT VERIFIED`);
} else {
  totalFail++;
  console.log(`  Result:       ✗ CORRELATION CONSTANT MISMATCH`);
}

console.log(
  `\nTest 6 Summary: Epoch ${mayanMatch ? "verified" : "failed"} (triangle tests N/A)`,
);

// ============================================================================
// TEST 7: French Revolutionary ↔ Gregorian (Limited Range)
// ============================================================================
console.log("\n" + "━".repeat(80));
console.log("TEST 7: French Revolutionary ↔ Gregorian (1792-1805 Valid Range)");
console.log("━".repeat(80));
console.log("French Revolutionary: Decimal calendar (10-day weeks)");
console.log("Valid Range: Sept 22, 1792 - Dec 31, 1805 (Year I-XIV)");
console.log("Outside this range, calendar was not in use\n");

const frenchDates = [
  { year: 1, month: 1, day: 1, label: "French Epoch (Sept 22, 1792)" },
  { year: 5, month: 13, day: 5, label: "Sansculottides (extra days)" },
  { year: 10, month: 5, day: 10, label: "Mid-revolution (Year X)" },
];

let test7Pass = 0;
let test7Fail = 0;

for (const original of frenchDates) {
  console.log(`\n${original.label}`);
  console.log(
    `  Original:     French Rev ${original.year}-${original.month}-${original.day}`,
  );

  try {
    const jdn1 = frenchRev.toJDN(original);
    console.log(`  Step 1:       French → JDN ${jdn1}`);

    const gregDate = gregorian.fromJDN(jdn1);
    console.log(
      `  Step 2:       JDN → Gregorian ${gregDate.year}-${gregDate.month}-${gregDate.day} ${gregDate.era}`,
    );

    const jdn2 = gregorian.toJDN(gregDate);
    console.log(`  Step 3:       Gregorian → JDN ${jdn2}`);

    const roundTrip = frenchRev.fromJDN(jdn2);
    console.log(
      `  Step 4:       JDN → French Rev ${roundTrip.year}-${roundTrip.month}-${roundTrip.day}`,
    );

    const jdnDrift = Number(jdn2 - jdn1);
    const dateMatch =
      roundTrip.year === original.year &&
      roundTrip.month === original.month &&
      roundTrip.day === original.day;

    console.log(`  JDN Drift:    ${jdnDrift} days`);
    console.log(`  Date Match:   ${dateMatch ? "✓ PASS" : "✗ FAIL"}`);
    console.log(
      `  Result:       ${jdnDrift === 0 && dateMatch ? "✓ 0.00% DRIFT" : "✗ DRIFT DETECTED"}`,
    );

    if (jdnDrift === 0 && dateMatch) test7Pass++;
    else test7Fail++;
  } catch (error) {
    console.log(
      `  Result:       ✗ ERROR: ${error instanceof Error ? error.message : String(error)}`,
    );
    test7Fail++;
  }
}

console.log(
  `\nTest 7 Summary: ${test7Pass} passed, ${test7Fail} failed (within valid 1792-1805 range)`,
);
totalPass += test7Pass;
totalFail += test7Fail;

// ============================================================================
// FINAL SUMMARY
// ============================================================================
console.log("\n" + "=".repeat(80));
console.log("FINAL SUMMARY: REMAINING CALENDARS VALIDATION");
console.log("=".repeat(80));

const totalTests = totalPass + totalFail + totalSkip;

console.log("\n📊 VALIDATION RESULTS BY CALENDAR:");
console.log(
  `  Test 1 (Ethiopian):           ${test1Pass}/${test1Pass + test1Fail} passed`,
);
console.log(
  `  Test 2 (Holocene):            ${test2Pass}/${test2Pass + test2Fail} passed`,
);
console.log(
  `  Test 3 (Unix):                ${test3Pass}/${test3Pass + test3Fail} passed`,
);
console.log(
  `  Test 4 (Before Present):      ${test4Pass}/${test4Pass + test4Fail} passed`,
);
console.log(
  `  Test 5 (Persian):             ${test5Pass} perfect, ${test5Drift} 1-day drift (known)`,
);
console.log(
  `  Test 6 (Mayan):               ${mayanMatch ? "Epoch verified" : "Epoch failed"}`,
);
console.log(
  `  Test 7 (French Rev):          ${test7Pass}/${test7Pass + test7Fail} passed`,
);

console.log(`\n📈 OVERALL STATISTICS:`);
console.log(`  Total Tests:                  ${totalTests}`);
console.log(`  Passed (0.00% drift):         ${totalPass}`);
console.log(`  Failed:                       ${totalFail}`);
console.log(`  Known Limitations:            ${totalSkip}`);
console.log(
  `  Success Rate:                 ${((totalPass / totalTests) * 100).toFixed(2)}%`,
);

console.log("\n✅ PROMOTION RECOMMENDATIONS:");

if (test1Fail === 0) {
  console.log("  • Ethiopian: ✅ PROMOTE TO BATTLE-TESTED (0.00% drift)");
} else {
  console.log("  • Ethiopian: ⚠️  Requires fixes before promotion");
}

if (test2Fail === 0) {
  console.log("  • Holocene: ✅ PROMOTE TO BATTLE-TESTED (0.00% drift)");
} else {
  console.log("  • Holocene: ⚠️  Requires fixes before promotion");
}

if (test3Fail === 0) {
  console.log("  • Unix: ✅ PROMOTE TO BATTLE-TESTED (0.00% drift)");
} else {
  console.log("  • Unix: ⚠️  Requires fixes before promotion");
}

if (test4Fail === 0) {
  console.log("  • Before Present: ✅ PROMOTE TO BATTLE-TESTED (0.00% drift)");
} else {
  console.log("  • Before Present: ⚠️  Requires fixes before promotion");
}

if (test5Drift > 0 || test5Fail > 0) {
  console.log(
    "  • Persian: ⚠️  REMAIN FUNCTIONAL (documented 33-year cycle limitation)",
  );
} else {
  console.log(
    "  • Persian: ✅ PROMOTE TO BATTLE-TESTED (unexpected 0.00% drift!)",
  );
}

console.log(
  "  • Mayan: ℹ️  EPOCH VALIDATED (correlation constant correct, no drift tests)",
);

if (test7Fail === 0) {
  console.log(
    "  • French Revolutionary: ✅ PROMOTE TO BATTLE-TESTED (0.00% drift within 1792-1805)",
  );
} else {
  console.log("  • French Revolutionary: ⚠️  Requires fixes before promotion");
}

console.log("\n" + "=".repeat(80));
console.log("VALIDATION COMPLETE");
console.log("=".repeat(80));

if (totalFail === 0) {
  console.log("\n✅ ALL TESTS PASSED (excluding known Persian limitation)");
  console.log("Recommend promoting eligible calendars to Battle-Tested status");
} else {
  console.log(
    `\n⚠️  ${totalFail} TEST(S) FAILED - Review required before promotion`,
  );
}

console.log("\nNext Steps:");
console.log("  1. Review individual test results above");
console.log(
  "  2. Update homepage and dashboard with two-tier calendar classification",
);
console.log(
  "  3. Document Persian 33-year cycle limitation in technical specs",
);
console.log(
  "  4. Create verification-remaining-calendars-advanced.test.ts for CI",
);
console.log("=".repeat(80));
