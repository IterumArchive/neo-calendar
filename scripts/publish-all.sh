#!/bin/bash
set -e

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_ROOT"

echo "📦 Publishing NeoCalendar packages to npm..."
echo "Working directory: $PROJECT_ROOT"
echo ""

# Array of packages in dependency order
PACKAGES=(
  "neo-calendar-core"
  "neo-calendar-gregorian"
  "neo-calendar-holocene"
  "neo-calendar-julian"
  "neo-calendar-unix"
  "neo-calendar-hebrew"
  "neo-calendar-islamic"
  "neo-calendar-persian"
  "neo-calendar-coptic"
  "neo-calendar-ethiopian"
  "neo-calendar-mayan"
  "neo-calendar-french-revolutionary"
  "neo-calendar-before-present"
  "neo-calendar"
  "neo-calendar-full"
  # "neo-calendar-lite"  # Commented out - coming soon
)

PUBLISHED=0
FAILED=0

for pkg in "${PACKAGES[@]}"; do
  PKG_DIR="packages/$pkg"
  
  if [ ! -d "$PKG_DIR" ]; then
    echo "⚠️  Skipping $pkg (directory not found)"
    continue
  fi
  
  # Skip if package.json has "private": true
  if grep -q '"private": true' "$PKG_DIR/package.json" 2>/dev/null; then
    echo "⏭️  Skipping $pkg (private package)"
    continue
  fi
  
  echo "📤 Publishing @iterumarchive/$pkg..."
  
  if (cd "$PKG_DIR" && npm publish --access public); then
    echo "✅ Published @iterumarchive/$pkg"
    ((PUBLISHED++))
  else
    echo "❌ Failed to publish @iterumarchive/$pkg"
    ((FAILED++))
  fi
  
  echo ""
done

echo "================================"
echo "📊 Publishing Summary"
echo "================================"
echo "✅ Published: $PUBLISHED packages"
echo "❌ Failed: $FAILED packages"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All packages published successfully!"
  exit 0
else
  echo "⚠️  Some packages failed to publish"
  exit 1
fi
