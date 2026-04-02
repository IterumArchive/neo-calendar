# NeoCalendar

> A scientifically rigorous, architecturally sound calendar conversion library with proven internal consistency and external correctness.

[![Tests](https://img.shields.io/badge/tests-1095%2F1095%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-98.7%25-brightgreen)]()
[![Status](https://img.shields.io/badge/status-beta-yellow)]()

## ⚠️ Beta Status Notice

**This project is currently in beta.** While extensively tested (1100+ tests passing) with rigorous validation, please be aware:

- 🐛 **Bugs may exist** - Report issues on [GitHub Issues](https://github.com/iterumarchive/neo-calendar/issues)
- 📖 **Documentation may have inconsistencies** - Actively improving
- 💥 **Breaking changes may occur** - Pin to specific versions in production
- 🧪 **API may evolve** - Feedback welcome before v1.0 stabilization

**For production use**: Pin exact versions (`"@iterumarchive/neo-calendar": "0.x.x"`) and test thoroughly in your specific use case.

## Overview

NeoCalendar is a production-ready TypeScript library for accurate calendar conversions across 12 calendar systems. Built on a **plugin-based architecture** with **Julian Day Number** as the universal conversion point, it provides proven correctness through comprehensive validation against authoritative sources.

## Quick Start

### Installation

Choose the package that fits your use case:

```bash
# Standard package - Most users start here
npm install @iterumarchive/neo-calendar

# Full package - All 12 calendars included, zero configuration
npm install @iterumarchive/neo-calendar-full

# Lite package - Minimal JDN helpers (🚧 Coming in v0.3.0)
# npm install @iterumarchive/neo-calendar-lite

# Core package - For building custom calendar plugins
npm install @iterumarchive/neo-calendar-core
```

### Basic Usage

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Era-driven calendar selection (auto-detects calendar from era)
const date = NeoCalendar.calendar(1800, 'AD');
// → Gregorian: January 1, 1800

// Convert to other calendars
const holocene = date.to('HOLOCENE');
console.log(holocene.display); // "11800-01-01 HE"

// Multi-calendar display
console.log(date.toStrings(['GREGORIAN', 'HOLOCENE', 'HEBREW']));
// → ["+001800-01-01 AD", "+011800-01-01 HE", "5560/10/7 AM"]
```

## 📦 Which Package Should I Use?

| Package | Size | Calendars | Best For |
|---------|------|-----------|----------|
| **[neo-calendar]** (Standard) | ~30kb | 4 auto-registered<br/>(Gregorian, Holocene, Julian, Unix) | Most applications, web apps |
| **[neo-calendar-full]** | ~50kb | All 12 calendars<br/>auto-registered | Historical research, comprehensive apps |
| **[neo-calendar-lite]** 🚧 | ~8kb | None (JDN only) | Database queries, backend microservices<br/>**(Coming Soon)** |
| **[neo-calendar-core]** | ~5kb | None (engine only) | Building custom calendar plugins |

### Decision Guide

**Choose Standard** if you:
- Need Gregorian, Julian, or Unix conversions
- Want the full API (NeoDate, arithmetic, formatting)
- Can add other calendars manually if needed

**Choose Full** if you:
- Need multiple non-Western calendars (Hebrew, Islamic, Persian, etc.)
- Want zero configuration
- Don't mind the larger bundle size

**Choose Lite** if you:
- Only need JDN conversions for database queries
- Don't need the NeoDate API or arithmetic
- Want the smallest possible bundle
- **(🚧 Coming in v0.3.0)**

**Choose Core** if you:
- Are building a custom calendar plugin
- Need just the type system and base classes

[neo-calendar]: #standard-package-neo-calendar
[neo-calendar-full]: #full-package-neo-calendar-full
[neo-calendar-lite]: #lite-package-neo-calendar-lite
[neo-calendar-core]: #core-package-neo-calendar-core

## Monorepo Structure

NeoCalendar is organized as a **Yarn workspace monorepo** with 17 packages:

```
iterum-calendar/
├── packages/
│   ├── neo-calendar-core/          # ~5kb - Engine, types, base plugin
│   ├── neo-calendar/               # ~30kb - Standard API + 4 calendars
│   ├── neo-calendar-full/          # ~50kb - All 12 calendars
│   ├── neo-calendar-lite/          # ~8kb - JDN helpers (stub)
│   ├── neo-calendar-gregorian/     # ~3kb - Gregorian plugin
│   ├── neo-calendar-julian/        # ~2kb - Julian plugin
│   ├── neo-calendar-hebrew/        # ~4kb - Hebrew plugin
│   ├── neo-calendar-islamic/       # ~3kb - Islamic plugin
│   ├── neo-calendar-persian/       # ~3kb - Persian plugin
│   ├── neo-calendar-coptic/        # ~2kb - Coptic plugin
│   ├── neo-calendar-ethiopian/     # ~2kb - Ethiopian plugin
│   ├── neo-calendar-mayan/         # ~3kb - Mayan plugin
│   ├── neo-calendar-french-revolutionary/  # ~3kb
│   ├── neo-calendar-holocene/      # ~2kb - Holocene plugin
│   ├── neo-calendar-unix/          # ~2kb - Unix plugin
│   └── neo-calendar-before-present/  # ~2kb - Before Present plugin
│
├── src/
│   ├── tests/          # 33 test files, 1095 tests
│   └── scripts/        # Verification & diagnostic tools
│
└── docs/               # Architecture & API documentation
```

### Package Dependency Graph

```
neo-calendar-full
  ↓ (includes all 12 plugins)
neo-calendar (Standard)
  ↓ (includes 4 plugins)
neo-calendar-core
  ↑
neo-calendar-[plugin]
```

## Key Features

### ✅ Proven Correctness
- **Internal Consistency**: Zero drift in round-trip conversions (1095/1095 tests passing)
- **External Validation**: Verified against Dershowitz & Reingold authorities
- **Test Coverage**: 98.7% coverage across all calendar systems

### 🏛️ Architectural Strengths
- **Plugin-based**: Each calendar is an independent, testable package
- **JDN Hub**: Julian Day Number as the universal conversion point
- **Monorepo**: Tree-shakeable, optimized for bundle size
- **Type Safety**: Full TypeScript with branded types for safety

### 📦 Flexible Packaging
- **4 package variants** optimized for different use cases
- **Tree-shakeable**: Import only what you need
- **Zero config**: Standard and Full packages work out of the box
- **Extensible**: Add calendars via plugin packages

### 📅 Supported Calendars
1. Gregorian (with adoption rules)
2. Julian
3. Islamic (Civil algorithm)
4. Hebrew (with dehiyyot)
5. Coptic
6. Ethiopian
7. Persian/Jalali
8. French Revolutionary
9. Mayan Long Count
10. Holocene Era
11. Unix Timestamp
12. Before Present

## Usage Examples

### Standard Package (@iterumarchive/neo-calendar)

The Standard package includes the full API with 4 auto-registered calendars:

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Works immediately - no setup required
const date = NeoCalendar.calendar(1800, 'AD');
console.log(date.display); // "+001800-01-01 AD"

// 4 calendars auto-registered:
// - GREGORIAN (modern dates)
// - HOLOCENE (linear history)
// - JULIAN (pre-1582 dates)
// - UNIX (timestamp interop)

const holocene = date.to('HOLOCENE');
console.log(holocene.display); // "11800-01-01 HE"
```

### Adding More Calendars

Import and register additional calendar plugins as needed:

```typescript
import { NeoCalendar, Registry } from '@iterumarchive/neo-calendar';
import { HebrewPlugin } from '@iterumarchive/neo-calendar-hebrew';
import { IslamicPlugin } from '@iterumarchive/neo-calendar-islamic';

// Register additional calendars
Registry.register(new HebrewPlugin());
Registry.register(new IslamicPlugin());

// Now available for conversion
const date = NeoCalendar.calendar(2024, 'AD', 3, 21);
const hebrew = date.to('HEBREW');
console.log(hebrew.display); // "5784/7/11 AM"
```

### Full Package (@iterumarchive/neo-calendar-full)

All 12 calendars are auto-registered - zero configuration:

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

// All calendars work immediately
const date = NeoCalendar.calendar(2024, 'AD', 3, 21);

console.log(date.toStrings([
  'GREGORIAN', 'HEBREW', 'ISLAMIC', 'PERSIAN',
  'COPTIC', 'ETHIOPIAN', 'MAYAN', 'FRENCH_REVOLUTIONARY'
]));
// → [
//   "+002024-03-21 AD",
//   "5784/7/11 AM",
//   "1445/9/11 AH",
//   "1403/1/2 AP",
//   "1740/7/12 AM",
//   "2016/7/12 AM",
//   "13.0.11.3.1",
//   "232/7/1 RE"
// ]
```

### Advanced: Era-Driven Selection

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Auto-detects calendar from era suffix
const gregorian = NeoCalendar.calendar(2024, 'AD');   // → GREGORIAN
const holocene = NeoCalendar.calendar(12024, 'HE');   // → HOLOCENE
const julian = NeoCalendar.calendar(1500, 'OS');      // → JULIAN
const unix = NeoCalendar.calendar(1234567890, 'UNIX'); // → UNIX
```

### Method Chaining

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

const future = NeoCalendar.calendar(2026, 'AD', 1, 1)
  .add(3, 'months')    // April 1, 2026
  .add(15, 'days')     // April 16, 2026
  .add(2, 'years')     // April 16, 2028
  .to('HOLOCENE');     // Convert to Holocene

console.log(future.display); // "12028-04-16 HE"
```

### Cross-Calendar Arithmetic

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

const ad2000 = NeoCalendar.calendar(2000, 'AD');
const he12000 = NeoCalendar.calendar(12000, 'HE');

const diff = ad2000.diff(he12000);
console.log(diff.toDays()); // 0 (same moment!)
```

## Validation & Testing

### Test Results
- **1095/1095 tests passing (100%)**
- **33 test suites** covering all packages
- **98.7% code coverage**
- **Zero drift** in round-trip conversions

### Validation Against Authorities
- ✅ Dershowitz & Reingold: Calendrical Calculations
- ✅ Hebrew Calendar Authority (Rosh Hashanah dates)
- ✅ Islamic Civil Calendar tables
- ✅ Astronomical Julian Day Number standards

## Supported Calendars

| Calendar | Package | Era Labels | Notes |
|----------|---------|------------|-------|
| **Gregorian** | neo-calendar-gregorian | AD, BC, CE, BCE | Modern international standard |
| **Holocene** | neo-calendar-holocene | HE | Linear timeline, great for databases |
| **Julian** | neo-calendar-julian | OS (Old Style) | Pre-1582 European dates |
| **Unix** | neo-calendar-unix | UNIX | Unix timestamps |
| **Hebrew** | neo-calendar-hebrew | AM | Lunisolar with dehiyyot rules |
| **Islamic** | neo-calendar-islamic | AH | Lunar civil calendar |
| **Persian** | neo-calendar-persian | AP | Solar calendar (Jalali) |
| **Coptic** | neo-calendar-coptic | AM | Egyptian Christian calendar |
| **Ethiopian** | neo-calendar-ethiopian | AM | Similar to Coptic |
| **Mayan** | neo-calendar-mayan | (none) | Long Count notation |
| **French Revolutionary** | neo-calendar-french-revolutionary | RE | Revolutionary decimal calendar |
| **Before Present** | neo-calendar-before-present | BP | Archaeological/geological dating |

## Development

### Workspace Commands

```bash
# Install dependencies (hoists to root)
yarn install

# Build all packages
yarn build

# Run all tests (1126 tests)
yarn test

# Build specific package
yarn workspace @iterumarchive/neo-calendar-core build

# Run tests for specific area
yarn test src/tests/api/
yarn test src/tests/plugins/

# Verify zero-drift
npx tsx src/scripts/verify-zero-drift.ts
```

### Package Development

```bash
# Add dependency to specific package
yarn workspace @iterumarchive/neo-calendar add <package>

# List all workspace packages
yarn workspaces list

# Clean all build outputs
yarn workspaces foreach run clean
```

### Local Testing Before Publishing

Before publishing to npm, test packages locally in a separate project:

#### Option 1: Using yalc (Recommended) ⭐

**Install yalc** (one-time):
```bash
npm install -g yalc
```

**Publish packages locally**:

```
npm install -g yalc
```

```bash
# In iterum-calendar repo
yarn build

# Publish all packages to 
yarn yalc:publish

# Install local packages
yalc add @iterumarchive/neo-calendar-lite
yalc add @iterumarchive/neo-calendar
yalc add @iterumarchive/neo-calendar-full
npm install
```

**Test the packages**:
```typescript
// test.ts
import { calendar } from '@iterumarchive/neo-calendar-lite';
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Test Lite package - sorting use case
const events = [
  { name: 'Moon Landing', date: calendar(1969, 'AD', 7, 20) },
  { name: 'Today', date: calendar(2024, 'AD', 3, 22) },
];
events.sort((a, b) => a.date.valueOf() - b.date.valueOf());
console.log('Sorted:', events.map(e => e.name));

// Test Standard package - date arithmetic
const cal = new NeoCalendar();
const date = cal.date(2024, 3, 22, 'AD');
const future = date.add({ days: 100 });
console.log('100 days from now:', future.display());
```

**Update after changes**:
```bash
# In iterum-calendar repo (after code changes)
yarn build

# Push updates to all linked projects
yarn workspaces foreach -Apt exec yalc push

# Or update specific package
cd packages/neo-calendar-lite && yalc push && cd ../..

# Or update from test project
cd ~/test-neo-calendar
yalc update @iterumarchive/neo-calendar-lite
npm test
```

**Cleanup**:
```bash
# In test project
yalc remove --all

# In yalc store
yalc installations clean @iterumarchive/neo-calendar
```

#### Option 2: Using npm link (Quick alternative)

```bash
# In iterum-calendar repo
cd packages/neo-calendar && npm link
cd ../neo-calendar-lite && npm link

# In test project
npm link @iterumarchive/neo-calendar
npm link @iterumarchive/neo-calendar-lite
```

**Note**: yalc is more reliable for monorepos with peer dependencies.

#### Test Cases to Validate

Before publishing, verify:

**Lite Package** (`@iterumarchive/neo-calendar-lite`):
- [ ] Import and create dates: `calendar(2024, 'AD')`
- [ ] Convert between calendars: `date.to('HE')`
- [ ] Sort dates: `dates.sort((a, b) => a.valueOf() - b.valueOf())`
- [ ] Format dates: `date.format()`
- [ ] Bundle size < 8kb

**Standard Package** (`@iterumarchive/neo-calendar`):
- [ ] Works immediately (4 calendars pre-registered)
- [ ] Date arithmetic: `date.add({ days: 100 })`
- [ ] Formatting: `date.display()`
- [ ] Register additional calendars manually
- [ ] Bundle size ~30kb with 4 calendars

**Full Package** (`@iterumarchive/neo-calendar-full`):
- [ ] All 13 calendars available immediately
- [ ] No manual registration needed
- [ ] Bundle size ~50kb

**Cross-package**:
- [ ] TypeScript types resolve correctly
- [ ] No peer dependency warnings
- [ ] Tree-shaking works (check bundle analyzer)

## Documentation

### Package Documentation
- **[Core Package](./packages/neo-calendar-core/README.md)** - Engine, types, base plugin
- **[Standard Package](./packages/neo-calendar/README.md)** - Full API with 4 calendars
- **[Full Package](./packages/neo-calendar-full/README.md)** - All calendars included
- **[Lite Package](./packages/neo-calendar-lite/README.md)** - JDN helpers (coming soon)

## Known Limitations

1. **Lite Package**: 🚧 **Coming Soon** - Full implementation planned for v0.3.0

2. **Islamic Calendar**: Uses Civil (arithmetic) algorithm. Observational calendar may differ by 1-2 days (documented design choice)

3. **Time-of-day**: Currently supports dates only (no time-of-day, timezone, or DST handling). Planned for Phase 2

## License

MIT

## Acknowledgments

- Algorithms based on Dershowitz & Reingold: *Calendrical Calculations*
- Gregorian adoption data from historical sources
- Hebrew calendar dehiyyot rules from traditional authorities

