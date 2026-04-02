#!/bin/bash
set -e

echo "🔧 Fixing workspace:* dependencies to use actual version ranges..."
echo ""

# Array of all packages with dependencies
packages=(
  "neo-calendar"
  "neo-calendar-full"
  "neo-calendar-lite"
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

# Function to update a package.json
update_package() {
  local pkg=$1
  local pkg_file="packages/$pkg/package.json"
  
  if [ -f "$pkg_file" ]; then
    echo "📦 Updating $pkg..."
    
    # Use node to update the JSON properly
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('$pkg_file', 'utf8'));
      
      if (pkg.dependencies) {
        for (const [key, value] of Object.entries(pkg.dependencies)) {
          if (value === 'workspace:*') {
            pkg.dependencies[key] = '^0.1.0';
          }
        }
      }
      
      fs.writeFileSync('$pkg_file', JSON.stringify(pkg, null, 2) + '\n');
    "
  fi
}

# Update all packages
for pkg in "${packages[@]}"; do
  update_package "$pkg"
done

echo ""
echo "✅ All workspace:* dependencies replaced with ^0.1.0"
echo ""
echo "Next steps:"
echo "1. Regenerate lockfile: yarn install"
echo "2. Commit changes: git add . && git commit -m 'fix: replace workspace:* with version ranges for npm'"
echo "3. Deprecate broken 0.1.0 packages on npm (see deprecate-broken-packages.sh)"
echo "4. Create patch release: yarn changeset (select all packages, choose patch)"
echo "5. Version: yarn changeset version (will bump to 0.1.1)"
echo "6. Publish: ./scripts/publish-with-2fa.sh"
