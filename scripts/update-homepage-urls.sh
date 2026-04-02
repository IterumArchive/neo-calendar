#!/bin/bash
set -e

echo "🔗 Updating homepage URLs to https://neocalendar.iterumarchive.org/"
echo ""

# Array of all packages
packages=(
  "neo-calendar"
  "neo-calendar-full"
  "neo-calendar-lite"
  "neo-calendar-core"
  "neo-calendar-before-present"
  "neo-calendar-coptic"
  "neo-calendar-ethiopian"
  "neo-calendar-french-revolutionary"
  "neo-calendar-gregorian"
  "neo-calendar-hebrew"
  "neo-calendar-holocene"
  "neo-calendar-islamic"
  "neo-calendar-julian"
  "neo-calendar-mayan"
  "neo-calendar-persian"
  "neo-calendar-unix"
)

# Update each package.json
for pkg in "${packages[@]}"; do
  pkg_file="packages/$pkg/package.json"
  
  if [ -f "$pkg_file" ]; then
    echo "📦 Updating $pkg..."
    
    # Use sed to replace the homepage URL
    sed -i '' 's|"homepage": "https://github.com/IterumArchive/neo-calendar#readme"|"homepage": "https://neocalendar.iterumarchive.org/"|g' "$pkg_file"
  fi
done

echo ""
echo "✅ All homepage URLs updated to https://neocalendar.iterumarchive.org/"
