# @iterumarchive/neo-calendar-lite

> Minimal calendar conversion helpers for database queries and backend microservices

[![npm version](https://img.shields.io/npm/v/@iterumarchive/neo-calendar-lite)]()
[![Bundle Size](https://img.shields.io/badge/size-~6kb-blue)]()
[![Status](https://img.shields.io/badge/status-coming%20soon-orange)]()

## 🚧 Coming Soon - v0.3.0

**This package is currently under development and not yet published to npm.** While the core implementation exists and is functional, it requires additional testing and documentation before release.

**Expected Release:** v0.3.0 (Q2 2026)

**Current Status:**
- ✅ Core implementation complete
- ✅ Basic functionality working
- 🚧 Comprehensive testing in progress
- 🚧 SQL helper validation pending
- 🚧 Documentation finalization needed

**Want to try it?** You can use the implementation from this repository directly, but be aware it's not production-ready.

---

## ⚠️ Beta Software Notice (When Released)

**This package is currently in beta.** While the underlying calendar calculations are thoroughly tested (1100+ tests), you should be aware:

- 🐛 **Bugs may exist** - Please report issues on GitHub
- 📖 **Documentation may have inconsistencies** - We're actively improving it
- 💥 **Breaking changes may occur** - Pin to specific versions in production
- 🧪 **API may evolve** - Feedback welcome before v1.0 stabilization

**Recommendation**: Test thoroughly in your use case before deploying to production. Pin to exact versions (`"@iterumarchive/neo-calendar-lite": "0.x.x"`) to avoid unexpected breaking changes.

## Overview

> **Note:** This documentation describes the planned functionality. The package will be released in v0.3.0.

The **Lite package** will be a **minimal wrapper** around the same core calendar plugins used by the Standard package. It provides just the essentials: date creation, calendar conversion, and sorting by JDN.

### Architecture

- **Same core/plugins** as Standard package (reliable, well-tested)
- **Stripped-down API** - only the essentials for sorting and conversion
- **No comparison methods** - use standard JavaScript: `a.valueOf() < b.valueOf()`
- **No arithmetic** - just dates and conversions
- **No formatting options** - simple ISO-style output

### Key Features

- ✅ **Dynamic Calendar Registration** - Load only what you need
- ✅ **Create dates**: `calendar(year, era, month, day)`
- ✅ **Convert calendars**: `date.to(targetEra)`
- ✅ **Sort by JDN**: `dates.sort((a, b) => a.valueOf() - b.valueOf())`
- ✅ **Format dates**: `date.format()` → "2024-03-22 AD"
- ✅ **SQL helpers**: Generate WHERE clauses for any registered calendar

### Use Cases

- Sorting historical events from different calendar systems
- Database queries with dynamic calendar support  
- Backend microservices needing basic calendar conversion
- Applications where bundle size matters

### Bundle Size

- **~6kb unminified** (80% smaller than Standard package)
- **Pre-registers**: Unix, Gregorian, and Holocene
- **Extend**: Register additional calendars as needed

## Quick Start (Preview)

> **Coming in v0.3.0** - This is a preview of the planned API.

```typescript
import { calendar } from '@iterumarchive/neo-calendar-lite';

// Create dates (year, era, month, day)
const ancient = calendar(300, 'AD', 3, 15);
const modern = calendar(2024, 'AD', 3, 22);

// Display dates
console.log(ancient.format()); // "0300-03-15 AD"

// Convert between calendars
const ancientInHE = ancient.to('HE');
console.log(ancientInHE.format()); // "10300-03-15 HE"

// Sort dates (core use case!)
const events = [
  { name: 'Moon Landing', date: calendar(1969, 'AD', 7, 20) },
  { name: 'Roman Era', date: calendar(300, 'AD', 1, 1) },
  { name: 'Today', date: calendar(2024, 'AD', 3, 22) },
];

// Sort by JDN - works across all calendar systems
events.sort((a, b) => a.date.valueOf() - b.date.valueOf());
// → [ Roman Era, Moon Landing, Today ]

// Compare dates using valueOf()
if (ancient.valueOf() < modern.valueOf()) {
  console.log('Ancient date came first');
}

// Check if same point in time
const same = calendar(2024, 'AD').valueOf() === calendar(12024, 'HE').valueOf();
console.log(same); // true
```

## API Reference

### Calendar Namespace Objects

Each calendar system exports a namespace object with these methods:

#### `gregorian`, `holocene`, `julian`

```typescript
import { gregorian } from '@iterumarchive/neo-calendar-lite';

// Convert date to JDN
gregorian.toJDN(year: number, month: number, day: number): BrandedJDN

// Convert JDN to date
gregorian.fromJDN(jdn: JDN): { year: number; month: number; day: number }

// Get JDN range for a full year
gregorian.yearRange(year: number): { startJDN: BrandedJDN; endJDN: BrandedJDN }

// Get JDN range for a date range
gregorian.range(
  startDate: [number, number, number], 
  endDate: [number, number, number]
): { startJDN: BrandedJDN; endJDN: BrandedJDN }
```

**Same API for**:
- `holocene` - Holocene Era calendar (year + 10000)
- `julian` - Julian calendar (pre-Gregorian reform)

#### `unix`

```typescript
import { unix } from '@iterumarchive/neo-calendar-lite';

// Convert Unix timestamp (seconds since epoch) to JDN
unix.toJDN(timestamp: number): BrandedJDN

// Convert JDN to Unix timestamp
unix.fromJDN(jdn: JDN): number
```

### Cross-Calendar Conversion

```typescript
import { convert } from '@iterumarchive/neo-calendar-lite';

convert(
  date: { year: number; month?: number; day?: number },
  from: "gregorian" | "holocene" | "julian",
  to: "gregorian" | "holocene" | "julian"
): { year: number; month: number; day: number }
```

**Parameters**:
- `date` - Date object (month and day default to 1 if omitted)
- `from` - Source calendar system
- `to` - Target calendar system

**Returns**: Date in target calendar system

### SQL Query Builders

```typescript
import { SQLHelpers } from '@iterumarchive/neo-calendar-lite';

// Generate WHERE clause for JDN range
SQLHelpers.jdnRange(
  jdnColumn: string,
  startJDN: JDN,
  endJDN: JDN
): string

// Generate SQL expression to extract Gregorian year from JDN column
SQLHelpers.jdnToGregorianYear(jdnColumn: string): string

// Generate WHERE clause for a Gregorian year range
SQLHelpers.gregorianYearRange(jdnColumn: string, year: number): string

// Generate WHERE clause for a Holocene year range
SQLHelpers.holoceneYearRange(jdnColumn: string, year: number): string

// Generate WHERE clause for a Julian year range
SQLHelpers.julianYearRange(jdnColumn: string, year: number): string
```

**All SQL helpers return**: String containing SQL expression or WHERE clause

### Type Exports

```typescript
import type { JDN, BrandedJDN } from '@iterumarchive/neo-calendar-lite';

// JDN is bigint (the actual number)
type JDN = bigint;

// BrandedJDN is the branded version returned by toJDN methods
type BrandedJDN = Brand<bigint, "JDN">;
```

## Usage Examples

### Calendar Conversion Helpers

```typescript
import { gregorian, holocene, julian, unix } from '@iterumarchive/neo-calendar-lite';

// Gregorian ↔ JDN
const jdn = gregorian.toJDN(2024, 3, 21);  // → 2460391n
const date = gregorian.fromJDN(2460391n);  // → { year: 2024, month: 3, day: 21 }

// Get year range as JDN
const range = gregorian.yearRange(2024);
// → { startJDN: 2460311n, endJDN: 2460676n }

// Get date range as JDN
const dateRange = gregorian.range([2024, 3, 1], [2024, 3, 31]);
// → { startJDN: 2460371n, endJDN: 2460401n }

// Holocene Era (year + 10000 from Gregorian)
const heJdn = holocene.toJDN(12024, 3, 21);  // → 2460391n
const heDate = holocene.fromJDN(2460391n);   // → { year: 12024, month: 3, day: 21 }

// Julian calendar
const julJdn = julian.toJDN(2024, 3, 9);  // → 2460391n (same JDN, different date)
const julDate = julian.fromJDN(2460391n); // → { year: 2024, month: 3, day: 9 }

// Unix timestamps
const unixJdn = unix.toJDN(1711065600);     // seconds since epoch
const timestamp = unix.fromJDN(2460391n);   // → Unix timestamp
```

### Cross-Calendar Conversion

```typescript
import { convert } from '@iterumarchive/neo-calendar-lite';

// Convert between calendars
const julianDate = convert({ year: 2024, month: 3, day: 21 }, 'gregorian', 'julian');
// → { year: 2024, month: 3, day: 9 }

const holoceneDate = convert({ year: 2024, month: 3, day: 21 }, 'gregorian', 'holocene');
// → { year: 12024, month: 3, day: 21 }

// Same calendar conversion
const same = convert({ year: 2024, month: 3, day: 21 }, 'gregorian', 'gregorian');
// → { year: 2024, month: 3, day: 21 }

// Omit month/day (defaults to 1, 1)
const converted = convert({ year: 2024 }, 'gregorian', 'holocene');
// → { year: 12024, month: 1, day: 1 }
```
```

### SQL Query Builders

```typescript
import { SQLHelpers } from '@iterumarchive/neo-calendar-lite';

// Generate WHERE clause for JDN range
const sql1 = SQLHelpers.jdnRange('event_jdn', 2460311n, 2460676n);
// → "event_jdn >= 2460311 AND event_jdn <= 2460676"

// Generate WHERE clause for Gregorian year
const sql2 = SQLHelpers.gregorianYearRange('event_jdn', 2024);
// → "event_jdn >= 2460311 AND event_jdn <= 2460676"

// Generate WHERE clause for Holocene year
const sql3 = SQLHelpers.holoceneYearRange('event_jdn', 12024);
// → "event_jdn >= 2460311 AND event_jdn <= 2460676" (same as Gregorian 2024)

// Generate WHERE clause for Julian year
const sql4 = SQLHelpers.julianYearRange('event_jdn', 2024);
// → "event_jdn >= 2460324 AND event_jdn <= 2460690" (13 days offset)

// Extract Gregorian year from JDN in SQL
const sql5 = SQLHelpers.jdnToGregorianYear('event_jdn');
// → "FLOOR((event_jdn - 1721120) / 365.25)"
```

## Use Cases

### Database Queries

```typescript
import { gregorian, SQLHelpers } from '@iterumarchive/neo-calendar-lite';

// Store dates as JDN in your database
const eventJDN = gregorian.toJDN(2024, 12, 25);
// INSERT INTO events (name, date_jdn) VALUES ('Christmas', 2460676)

// Query by year
const whereClause = SQLHelpers.gregorianYearRange('date_jdn', 2024);
// SELECT * FROM events WHERE date_jdn >= 2460311 AND date_jdn <= 2460676

// Query by specific date range
const march = gregorian.range([2024, 3, 1], [2024, 3, 31]);
const sql = SQLHelpers.jdnRange('date_jdn', march.startJDN, march.endJDN);
// SELECT * FROM events WHERE date_jdn >= 2460371 AND date_jdn <= 2460401
```

### Microservices

```typescript
import { gregorian, holocene } from '@iterumarchive/neo-calendar-lite';

// Lightweight date conversion in APIs
app.get('/events/:date', (req, res) => {
  const [y, m, d] = req.params.date.split('-').map(Number);
  const jdn = gregorian.toJDN(y, m, d);
  const holoceneDate = holocene.fromJDN(jdn);
  res.json({ gregorian: { y, m, d }, holocene: holoceneDate, jdn });
});
```

### Cross-Calendar Workflows

```typescript
import { gregorian, julian, convert } from '@iterumarchive/neo-calendar-lite';

// Store dates in Gregorian, display in Julian
const gregorianDate = { year: 2024, month: 3, day: 21 };
const jdn = gregorian.toJDN(gregorianDate.year, gregorianDate.month, gregorianDate.day);

// Convert to Julian for historical research
const julianDate = julian.fromJDN(jdn);
console.log(julianDate); // { year: 2024, month: 3, day: 9 }

// Or use convert helper
const converted = convert(gregorianDate, 'gregorian', 'julian');
console.log(converted); // { year: 2024, month: 3, day: 9 }
```
```

### Comparison: Lite vs Standard

| Feature | Lite | Standard |
|---------|------|----------|
| **Bundle Size** | ~6kb | ~30kb |
| **Calendars** | 4 (Gregorian, Holocene, Julian, Unix) | 4 (same) |
| **JDN Conversions** | ✅ | ✅ |
| **SQL Helpers** | ✅ | ❌ |
| **NeoDate API** | ❌ | ✅ |
| **Arithmetic** | ❌ | ✅ |
| **Formatting** | ❌ | ✅ |
| **Method Chaining** | ❌ | ✅ |
| **Use Case** | DB queries, microservices | General apps |

## Installation

```bash
npm install @iterumarchive/neo-calendar-lite
```

## When to Use Lite vs Standard

**Choose Lite** when:
- Building microservices or serverless functions
- Bundle size is critical (<10kb requirement)
- Only need calendar conversions (no arithmetic/formatting)
- Working with databases storing JDN
- Need SQL query generation for calendar ranges
- Want direct, functional API without OOP overhead

**Choose Standard** when:
- Need date arithmetic (add/subtract/diff)
- Need formatting and parsing
- Want the fluent NeoDate API
- Building user-facing applications
- Need method chaining and ergonomic API

**Choose Full** when:
- Need all 12 calendar systems
- Want zero configuration
- Bundle size is not a concern (~50kb)

## TypeScript Support

Full TypeScript support with type definitions included:

```typescript
import type { JDN, BrandedJDN } from '@iterumarchive/neo-calendar-lite';
import { gregorian } from '@iterumarchive/neo-calendar-lite';

// Type-safe conversions
const jdn: BrandedJDN = gregorian.toJDN(2024, 3, 21);
const date: { year: number; month: number; day: number } = gregorian.fromJDN(jdn);
```

## Testing

Comprehensive test suite with 49 tests covering:
- All calendar conversion functions
- SQL helper generation
- Cross-calendar conversions
- Edge cases (epoch, ancient dates, leap years)
- Round-trip accuracy

Run tests:
```bash
npm test lite-package.test.ts
```

## Contributing

Interested in helping improve the Lite package? See [CONTRIBUTING.md](../../CONTRIBUTING.md).

## License

ISC
