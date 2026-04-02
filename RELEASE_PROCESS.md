# Professional Release Process for NeoCalendar

**Last Updated:** April 2, 2026  
**NPM Account:** https://www.npmjs.com/~iterumarchive  
**Scope:** @iterumarchive

---

## 📋 Current Status Assessment

### ✅ What's Already Set Up
- ✅ All packages properly scoped to `@iterumarchive`
- ✅ TypeScript build configuration
- ✅ Yarn 4 workspaces (modern monorepo)
- ✅ Basic build scripts (`yarn build`)
- ✅ Test suite (vitest)
- ✅ Package descriptions and keywords
- ✅ Proper `exports` fields in package.json
- ✅ `files` field for npm package inclusion
- ✅ Version 0.1.0 set across all packages

### ❌ What's Missing
- ❌ Git repository not initialized (`rm -rf .git` was run)
- ❌ Automated versioning workflow
- ❌ Changelog generation
- ❌ Pre-publish validation
- ❌ Publishing scripts for monorepo
- ❌ NPM authentication setup
- ❌ GitHub repository connection
- ❌ CI/CD pipeline
- ❌ Package dependency version management (currently using `*`)
- ❌ Author information in package.json files
- ❌ Proper license field (ISC vs MIT decision needed)

---

## 🎯 Professional Release Process - Implementation Steps

### Phase 1: Repository & Git Setup (CRITICAL - Do This First)

#### 1.1 Initialize Git Repository
```bash
cd /Users/avpuser/Projects/neo-calendar

# Initialize git
git init

# Add GitHub remote
git remote add origin https://github.com/IterumArchive/neo-calendar.git

# Create initial commit
git add .
git commit -m "chore: initial commit"
```

✅ **COMPLETED** - Git repository is initialized and connected to GitHub.

#### 1.2 Update Repository URLs in package.json
All packages currently reference `https://github.com/iterumarchive/calendar`.  
This needs to be updated to: `https://github.com/IterumArchive/neo-calendar`

**Files to update:** Every `packages/*/package.json`

---

### Phase 2: Package Configuration

#### 2.1 Fix Package Metadata

**Required updates to ALL package.json files:**

1. **Author field** - Add your information:
   ```json
   "author": "Your Name <your.email@example.com>",
   ```

2. **License** - Decide on MIT or ISC and be consistent:
   ```json
   "license": "MIT",
   ```

3. **Repository URLs** - Update to neo-calendar:
   ```json
   "repository": {
     "type": "git",
     "url": "https://github.com/IterumArchive/neo-calendar",
     "directory": "packages/neo-calendar-core"
   },
   ```

4. **Homepage** (optional but professional):
   ```json
   "homepage": "https://github.com/IterumArchive/neo-calendar#readme",
   ```

5. **Bugs** (optional but professional):
   ```json
   "bugs": {
     "url": "https://github.com/IterumArchive/neo-calendar/issues"
   },
   ```

#### 2.2 Fix Workspace Dependencies

Currently using `"*"` for internal dependencies. This is **problematic for publishing**.

**Change from:**
```json
"dependencies": {
  "@iterumarchive/neo-calendar-core": "*"
}
```

**Change to:**
```json
"dependencies": {
  "@iterumarchive/neo-calendar-core": "workspace:*"
}
```

Yarn will automatically replace `workspace:*` with the actual version during publishing.

---

### Phase 3: Release Tooling Setup

#### 3.1 Install Release Tools

```bash
# Install changesets (recommended for monorepos)
yarn add -D -W @changesets/cli @changesets/changelog-github

# Initialize changesets
yarn changeset init
```

**Why Changesets?**
- ✅ Designed specifically for monorepos
- ✅ Handles versioning across packages
- ✅ Generates changelogs automatically
- ✅ Manages interdependencies
- ✅ Industry standard (used by React, Remix, etc.)

**Alternative: Lerna**
```bash
yarn add -D -W lerna
```

#### 3.2 Configure Changesets

Edit `.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/changelog-github",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

---

### Phase 4: NPM Setup & Publishing

#### 4.1 Enable 2FA on npm Account (REQUIRED)

**npm requires 2FA for publishing scoped packages** like `@iterumarchive/*`. You must enable it:

1. Go to: https://www.npmjs.com/settings/iterumarchive/tfa
2. Click **"Enable 2FA"**
3. Choose **"Authorization and Publishing"** (requires 2FA for login and publish)
4. Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
5. Enter the 6-digit code to confirm
6. **Save your recovery codes** in a safe place!

✅ **COMPLETED** - You have 2FA enabled for publishing.

#### 4.2 NPM Authentication

```bash
# Login to npm (interactive)
npm login
# Enter username, password, email, and OTP code from authenticator

# Verify you're logged in
npm whoami
# Should show: iterumarchive
```

#### 4.3 Verify Scope Access

```bash
# Check if you have access to @iterumarchive scope
npm access ls-packages iterumarchive

# Should list your packages or show you have access
```

#### 4.4 Create Automation Token (Optional - for CI/CD)

**For GitHub Actions to publish automatically:**

1. Go to: https://www.npmjs.com/settings/iterumarchive/tokens
2. Click "Generate New Token"
3. Select **"Automation"** type (bypasses 2FA for CI/CD)
4. Copy the token
5. Add to GitHub Secrets:
   - Go to: https://github.com/IterumArchive/neo-calendar/settings/secrets/actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste your token
   - Click "Add secret"

**Note:** Don't commit tokens to git!

---

### Phase 5: Release Scripts

#### 5.1 Update Root package.json Scripts

```json
{
  "scripts": {
    "build": "yarn workspaces foreach -Apt run build",
    "clean": "yarn workspaces foreach -Ap run clean && rm -rf dist",
    "rebuild": "yarn clean && yarn build",
    
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit",
    
    "changeset": "changeset",
    "version-packages": "changeset version",
    "release": "yarn build && changeset publish",
    
    "prepublishOnly": "yarn build && yarn test",
    
    "verify:drift": "tsx src/scripts/verify-zero-drift.ts",
    "verify:drift-advanced": "tsx src/scripts/verify-zero-drift-advanced.ts"
  }
}
```

#### 5.2 Pre-publish Checklist Script

Create `scripts/pre-publish-check.sh`:

```bash
#!/bin/bash
set -e

echo "🔍 Pre-publish Validation Checklist"
echo "===================================="

# 1. Check git status
if [[ -n $(git status -s) ]]; then
  echo "❌ Git working directory not clean"
  exit 1
fi
echo "✅ Git working directory clean"

# 2. Check we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [[ "$BRANCH" != "main" ]]; then
  echo "❌ Not on main branch (currently on $BRANCH)"
  exit 1
fi
echo "✅ On main branch"

# 3. Run tests
echo "Running tests..."
yarn test
echo "✅ Tests passed"

# 4. Type check
echo "Type checking..."
yarn type-check
echo "✅ Type check passed"

# 5. Build all packages
echo "Building packages..."
yarn clean && yarn build
echo "✅ Build successful"

# 6. Check for TypeScript errors
echo "Checking for build artifacts..."
MISSING_DIST=$(find packages -name "package.json" -not -path "*/node_modules/*" | while read pkg; do
  dir=$(dirname "$pkg")
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

echo ""
echo "🎉 All pre-publish checks passed!"
echo "Ready to version and publish."
```

Make it executable:
```bash
chmod +x scripts/pre-publish-check.sh
```

---

### Phase 6: The Release Workflow

#### 6.1 Development Workflow

```bash
# 1. Make changes to code
# ... edit files ...

# 2. Add changeset (documents what changed)
yarn changeset
# - Select packages that changed
# - Select bump type (major/minor/patch)
# - Write summary of changes

# 3. Commit changes + changeset
git add .
git commit -m "feat: add new feature X"

# 4. Push to GitHub
git push origin main
```

#### 6.2 Release Workflow

```bash
# 1. Run pre-publish checks
./scripts/pre-publish-check.sh

# 2. Version packages (updates package.json versions + generates CHANGELOG.md)
yarn changeset version

# 3. Review changes
git diff

# 4. Commit version bump
git add .
git commit -m "chore: version packages"

# 5. Build and publish to npm
yarn release

# 6. Push tags and commits
git push --follow-tags
```

#### 6.3 First-Time Publishing (For 0.1.0)

Since packages are already at 0.1.0:

```bash
# 1. Ensure everything is committed
git add .
git commit -m "chore: prepare for initial release"
git push

# 2. Run pre-publish check
./scripts/pre-publish-check.sh

# 3. Login to npm (if not already)
npm login
# Enter username, password, email, and OTP from your authenticator app

# 4. Publish all packages with 2FA
./scripts/publish-with-2fa.sh
# When prompted, press Enter to skip batch OTP
# For each package, enter your 6-digit OTP code when prompted

# Alternative: Use the simple publish script (requires OTP for each package)
# ./scripts/publish-all.sh

# 5. Tag the release
git tag v0.1.0
git push origin v0.1.0
```

**What happens during publishing:**
- Each package is built and packed into a tarball
- npm uploads the package to the registry
- You'll need to enter your 2FA code (from authenticator app) for each package
- Packages are published in dependency order (core first, then plugins, then main packages)

**If a package fails:**
- Note which package failed
- Fix the issue
- Publish that specific package manually:
  ```bash
  cd packages/PACKAGE_NAME
  npm publish --access public --otp YOUR_OTP_CODE
  ```

---

### Phase 7: CI/CD Setup (GitHub Actions)

#### 7.1 Create .github/workflows/publish.yml

```yaml
name: Publish to NPM

on:
  push:
    branches:
      - main
    paths:
      - '.changeset/**'
      - 'packages/**'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: yarn install --immutable

      - name: Build packages
        run: yarn build

      - name: Run tests
        run: yarn test

      - name: Create Release Pull Request or Publish
        uses: changesets/action@v1
        with:
          publish: yarn release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

#### 7.2 Create .github/workflows/test.yml

```yaml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: yarn install --immutable

      - name: Type check
        run: yarn type-check

      - name: Run tests
        run: yarn test

      - name: Build
        run: yarn build
```

---

## 🚀 Quick Reference: Common Release Tasks

### Publish a Patch Release (0.1.0 → 0.1.1)
```bash
# 1. Make your code changes
# 2. Create a changeset
yarn changeset           # Select packages, choose "patch", write summary

# 3. Commit the changeset
git add .
git commit -m "feat: description of your changes"
git push

# 4. Version packages (updates package.json and creates CHANGELOG.md)
yarn changeset version

# 5. Commit version changes
git add .
git commit -m "chore: version packages"
git push

# 6. Build packages
yarn build

# 7. Publish to npm (requires 2FA OTP codes)
./scripts/publish-with-2fa.sh
# Enter your 6-digit OTP code when prompted for each package

# 8. Push tags
git push --follow-tags
```

### Publish a Minor Release (0.1.0 → 0.2.0)
```bash
yarn changeset           # Select packages, choose "minor"
yarn changeset version
yarn release
git push --follow-tags
```

### Publish a Major Release (0.1.0 → 1.0.0)
```bash
yarn changeset           # Select packages, choose "major"
yarn changeset version
yarn release
git push --follow-tags
```

### Publish Only Specific Packages
```bash
# Get your 2FA OTP code from authenticator app
# Then publish the specific package
cd packages/neo-calendar-core
npm publish --access public --otp YOUR_6_DIGIT_CODE
```

### Unpublish a Package (Within 72 hours)
```bash
npm unpublish @iterumarchive/neo-calendar@0.1.0
```

### Check Published Versions
```bash
npm view @iterumarchive/neo-calendar versions
npm view @iterumarchive/neo-calendar-core versions

# Check all your published packages
npm access ls-packages iterumarchive
```

### Verify Packages Were Published Successfully
```bash
# Check that a package is available
npm info @iterumarchive/neo-calendar

# Try installing in a test project
mkdir /tmp/test-neocalendar
cd /tmp/test-neocalendar
npm init -y
npm install @iterumarchive/neo-calendar
node -e "console.log(require('@iterumarchive/neo-calendar'))"
```

---

## 📝 Best Practices

### 1. **Semantic Versioning**
- **Patch (0.0.x)** - Bug fixes, no breaking changes
- **Minor (0.x.0)** - New features, no breaking changes
- **Major (x.0.0)** - Breaking changes

### 2. **Changesets**
- Create a changeset for EVERY meaningful change
- Write clear, user-facing descriptions
- Group related changes together

### 3. **Testing**
- ALWAYS run full test suite before publishing
- Test the built artifacts, not just source
- Consider testing in a separate project before publishing

### 4. **Documentation**
- Update README.md files before releasing
- Keep CHANGELOG.md accurate (changesets handles this)
- Document breaking changes prominently

### 5. **Git Tags**
- Tag every release with `v{version}` (e.g., v0.1.0)
- Push tags to GitHub: `git push --follow-tags`

### 6. **Never Modify Published Versions**
- Once published, a version is immutable
- If you need to fix, publish a new version
- Use `npm deprecate` for broken versions

---

## ⚠️ Common Pitfalls

1. **Publishing with uncommitted changes** → Use pre-publish checks
2. **Wrong dependency versions** → Use `workspace:*` in package.json
3. **Missing build artifacts** → Always run `yarn build` first
4. **Publishing private packages** → Use `--access public` flag
5. **Forgetting to push tags** → Use `--follow-tags` flag
6. **Breaking changes without major bump** → Be careful with versioning

---

## 🔧 Troubleshooting

### "Package not found" after publishing
Wait 5-10 minutes - npm registry propagation delay

### "You do not have permission to publish"
- Run `npm login` again
- Check you're logged in: `npm whoami`
- Verify scope access: `npm access ls-packages iterumarchive`

### "Version already exists"
- Can't republish same version
- Bump version and try again

### Workspace dependencies not resolving
- Make sure you're using `workspace:*` in package.json
- Run `yarn install` after changes

---

## 📚 Additional Resources

- [Changesets Documentation](https://github.com/changesets/changesets)
- [NPM Publishing Guide](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
- [Semantic Versioning](https://semver.org/)
- [Yarn Workspaces](https://yarnpkg.com/features/workspaces)
