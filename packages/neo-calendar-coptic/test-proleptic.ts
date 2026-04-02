/**
 * Test script to verify proleptic date handling in Coptic calendar
 */

import { CopticPlugin } from "./src/coptic.plugin";

const coptic = new CopticPlugin();

// Test case from the bug report: December 25, 1 CE
// JDN 1,721,784 (approximately)
const testJDN = 1721784n as any; // December 25, 1 CE

console.log("Testing Coptic Calendar Proleptic Date Handling");
console.log("================================================\n");

console.log("Test: December 25, 1 CE (before Coptic calendar started in 284 CE)");
console.log(`Input JDN: ${testJDN}`);

try {
  const result = coptic.fromJDN(testJDN);
  
  console.log("\n✓ Result:");
  console.log(`  Year: ${result.year}`);
  console.log(`  Month: ${result.month}`);
  console.log(`  Day: ${result.day}`);
  console.log(`  Era: ${result.era}`);
  console.log(`  Display: ${result.display}`);
  console.log(`  Is Proleptic: ${result.isProleptic}`);
  
  // Verify all components are valid
  const isValid = result.month >= 1 && result.month <= 13 && 
                  result.day >= 1 && result.day <= 30;
  
  if (isValid) {
    console.log("\n✅ SUCCESS: Month and day are positive and within valid ranges!");
  } else {
    console.log("\n❌ FAIL: Invalid month or day values!");
  }
  
  // Additional test cases
  console.log("\n\nAdditional Test Cases:");
  console.log("======================\n");
  
  const testCases = [
    { jdn: 1825030n, desc: "Coptic Epoch (Aug 29, 284 CE)" },
    { jdn: 1825029n, desc: "One day before epoch" },
    { jdn: 1721784n, desc: "Dec 25, 1 CE" },
    { jdn: 1721424n, desc: "Jan 1, 1 CE" },
  ];
  
  for (const test of testCases) {
    const r = coptic.fromJDN(test.jdn as any);
    console.log(`${test.desc}:`);
    console.log(`  ${r.display} (Year: ${r.year}, Month: ${r.month}, Day: ${r.day})`);
  }
  
} catch (error) {
  console.error("❌ ERROR:", error);
}
