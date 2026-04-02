#!/bin/bash
set -e

echo "🔍 Pre-publish Validation Checklist"
echo "===================================="

# 1. Check git status
if [[ -n $(git status -s) ]]; then
  echo "❌ Git working directory not clean"
  echo "Please commit or stash your changes first"
  exit 1
fi
echo "✅ Git working directory clean"

# 2. Check we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "⚠️  Warning: Not on main branch (currently on $BRANCH)"
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ On main branch"
fi

# 3. Run tests
echo ""
echo "📋 Running tests..."
if ! yarn test; then
  echo "❌ Tests failed"
  exit 1
fi
echo "✅ Tests passed"

# 4. Type check
echo ""
echo "🔧 Type checking..."
if ! yarn type-check; then
  echo "❌ Type check failed"
  exit 1
fi
echo "✅ Type check passed"

# 5. Build all packages
echo ""
echo "🏗️  Building packages..."
if ! yarn rebuild; then
  echo "❌ Build failed"
  exit 1
fi
echo "✅ Build successful"

# 6. Check for build artifacts
echo ""
echo "📦 Checking for build artifacts..."
MISSING_DIST=$(find packages -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
  dir=$(dirname "$pkg")
  # Skip private packages and packages without build
  if grep -q '"private": true' "$pkg" 2>/dev/null; then
    continue
  fi
  if [[ ! -d "$dir/dist" ]]; then
    echo "$dir"
  fi
done)

if [[ -n "$MISSING_DIST" ]]; then
  echo "❌ Missing dist folders:"
  echo "$MISSING_DIST"
  exit 1
fi
echo "✅ All packages have dist folders"

# 7. Check package.json files have required fields
echo ""
echo "📝 Validating package.json files..."
INVALID_PACKAGES=$(find packages -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
  dir=$(dirname "$pkg")
  
  # Skip private packages
  if grep -q '"private": true' "$pkg" 2>/dev/null; then
    continue
  fi
  
  # Check for required fields
  if ! grep -q '"author"' "$pkg" || grep -q '"author": ""' "$pkg"; then
    echo "$dir: missing author"
  fi
  if ! grep -q '"license"' "$pkg"; then
    echo "$dir: missing license"
  fi
  if ! grep -q '"repository"' "$pkg"; then
    echo "$dir: missing repository"
  fi
done)

if [[ -n "$INVALID_PACKAGES" ]]; then
  echo "⚠️  Warning: Some packages have missing fields:"
  echo "$INVALID_PACKAGES"
  echo ""
  read -p "Continue anyway? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
else
  echo "✅ All package.json files valid"
fi

echo ""
echo "🎉 All pre-publish checks passed!"
echo ""
echo "Next steps:"
echo "  1. yarn changeset         # Create a changeset"
echo "  2. yarn changeset version # Version packages"
echo "  3. yarn release           # Publish to npm"
echo "  4. git push --follow-tags # Push to GitHub"
