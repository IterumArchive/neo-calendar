#!/bin/bash
# Script to update all package.json files with correct metadata

echo "📝 Updating package.json files with correct metadata..."
echo ""

AUTHOR="IterumArchive"
LICENSE="MIT"
REPO_URL="https://github.com/IterumArchive/neo-calendar"

# Find all package.json files in packages directory
find packages -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
  PKG_DIR=$(dirname "$pkg")
  PKG_NAME=$(basename "$PKG_DIR")
  
  echo "Updating $PKG_NAME..."
  
  # Update using Node.js for reliable JSON manipulation
  node -e "
    const fs = require('fs');
    const path = '$pkg';
    const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
    
    // Update author
    pkg.author = '$AUTHOR';
    
    // Update license
    pkg.license = '$LICENSE';
    
    // Update repository
    pkg.repository = {
      type: 'git',
      url: '$REPO_URL',
      directory: '$PKG_DIR'
    };
    
    // Add homepage
    pkg.homepage = '$REPO_URL#readme';
    
    // Add bugs
    pkg.bugs = {
      url: '$REPO_URL/issues'
    };
    
    // Fix workspace dependencies
    if (pkg.dependencies) {
      Object.keys(pkg.dependencies).forEach(dep => {
        if (dep.startsWith('@iterumarchive/') && pkg.dependencies[dep] === '*') {
          pkg.dependencies[dep] = 'workspace:*';
        }
      });
    }
    
    fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
  "
done

echo ""
echo "✅ All package.json files updated!"
echo ""
echo "Changes made:"
echo "  - Author: $AUTHOR"
echo "  - License: $LICENSE"
echo "  - Repository: $REPO_URL"
echo "  - Fixed workspace dependencies: * → workspace:*"
