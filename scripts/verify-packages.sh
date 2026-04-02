#!/bin/bash
set -e

echo "🔍 Verifying packages are ready for npm..."
echo ""

# Clean and build
echo "📦 Building all packages..."
yarn clean
yarn build

echo ""
echo "✅ Build successful"
echo ""

# Check for workspace:* in any package.json
echo "🔎 Checking for lingering workspace:* dependencies..."
if grep -r "workspace:\*" packages/*/package.json; then
  echo "❌ ERROR: Found workspace:* dependencies! These must be fixed."
  exit 1
fi
echo "✅ No workspace:* dependencies found"
echo ""

# Pack all packages
echo "📦 Creating npm tarballs for all packages..."
mkdir -p .verify-temp/tarballs
cd packages/neo-calendar-core && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-before-present && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-coptic && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-ethiopian && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-french-revolutionary && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-gregorian && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-hebrew && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-holocene && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-islamic && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-julian && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-mayan && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-persian && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-unix && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../neo-calendar-full && npm pack --pack-destination ../../.verify-temp/tarballs
cd ../..

echo ""
echo "✅ Created tarballs:"
ls -lh .verify-temp/tarballs/*.tgz
echo ""

# Inspect a package to verify dependencies
echo "🔍 Inspecting neo-calendar-full package contents..."
tar -tzf .verify-temp/tarballs/iterumarchive-neo-calendar-full-0.1.0.tgz | head -20
echo ""

# Extract and check package.json
echo "📋 Checking package.json dependencies in tarball..."
tar -xzf .verify-temp/tarballs/iterumarchive-neo-calendar-full-0.1.0.tgz -O package/package.json | grep -A 20 '"dependencies"'
echo ""

# Create test project
echo "🧪 Creating test installation..."
mkdir -p .verify-temp/test-project
cd .verify-temp/test-project

# Initialize a test project
cat > package.json << 'EOF'
{
  "name": "test-neocalendar",
  "version": "1.0.0",
  "type": "module"
}
EOF

# Install from local tarballs
echo ""
echo "📥 Installing neo-calendar-full from local tarball..."
npm install ../tarballs/iterumarchive-neo-calendar-full-0.1.0.tgz

echo ""
echo "✅ Installation successful!"
echo ""

# Check what was installed
echo "📋 Installed packages:"
npm list --depth=2
echo ""

# Test imports
echo "🧪 Testing imports..."
cat > test.mjs << 'EOF'
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

console.log('✅ Import successful!');
console.log('NeoCalendar:', typeof NeoCalendar);

// Try creating an instance
const cal = new NeoCalendar();
console.log('✅ NeoCalendar instantiated!');

// Check plugins are registered
const plugins = cal.getRegisteredPlugins();
console.log('✅ Registered plugins:', plugins.length);
console.log('   Plugins:', plugins.join(', '));

if (plugins.length < 12) {
  console.error('❌ ERROR: Expected 12+ plugins but got', plugins.length);
  process.exit(1);
}

console.log('\n🎉 All tests passed!');
EOF

node test.mjs

cd ../..

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ VERIFICATION COMPLETE"
echo "════════════════════════════════════════════════════════"
echo ""
echo "The packages are ready to publish! They will work correctly on npm."
echo ""
echo "To clean up test files: rm -rf .verify-temp"
echo ""
