#!/bin/bash
set -e

echo "🧪 Testing installation from npm registry..."
echo ""

# Create a clean test directory
TEST_DIR=$(mktemp -d)
cd "$TEST_DIR"

echo "📁 Test directory: $TEST_DIR"
echo ""

# Create test package
cat > package.json << 'EOF'
{
  "name": "test-npm-neocalendar",
  "version": "1.0.0",
  "type": "module"
}
EOF

echo "📥 Installing @iterumarchive/neo-calendar-full from npm registry..."
npm install @iterumarchive/neo-calendar-full

echo ""
echo "📋 Checking installed versions..."
npm list --depth=2

echo ""
echo "🔍 Verifying dependencies in installed package..."
cat node_modules/@iterumarchive/neo-calendar-full/package.json | grep -A 15 '"dependencies"'

echo ""
echo "🧪 Testing imports and functionality..."
cat > test.mjs << 'EOF'
import { NeoCalendar, Registry } from '@iterumarchive/neo-calendar-full';

console.log('✅ Import successful!');

// Check all 12 calendars are registered
const systems = Registry.list();
console.log('✅ Registered systems:', systems.length);

if (systems.length !== 12) {
  console.error('❌ ERROR: Expected 12 systems, got', systems.length);
  process.exit(1);
}

// Test basic functionality
const date = NeoCalendar.at(2024, 3, 15, 'GREGORIAN');
const julian = date.as('JULIAN');
console.log('✅ Date conversion works:', julian.record.display);

console.log('\n🎉 All tests passed! Package works from npm registry.');
EOF

node test.mjs

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ NPM REGISTRY TEST PASSED"
echo "════════════════════════════════════════════════════════"
echo ""
echo "The packages are working correctly on npm!"
echo ""
echo "Cleaning up test directory: $TEST_DIR"
cd -
rm -rf "$TEST_DIR"
