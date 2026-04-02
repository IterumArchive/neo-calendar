# @iterumarchive/neo-calendar

> Full-featured calendar conversion library with 4 essential calendars auto-registered

[![npm version](https://img.shields.io/npm/v/@iterumarchive/neo-calendar)]()
[![Bundle Size](https://img.shields.io/badge/size-~30kb-blue)]()
[![Tests](https://img.shields.io/badge/tests-1095%2F1095-brightgreen)]()
[![Status](https://img.shields.io/badge/status-beta-yellow)]()

⚠️ **Beta Software** - APIs may change before v1.0. Pin versions in production (`"@iterumarchive/neo-calendar": "0.x.x"`).

## Overview

The **Standard package** provides the complete NeoCalendar API with 4 essential calendars auto-registered and ready to use. This is the **recommended package for most users**.

### What's Auto-Registered

1. **GREGORIAN** - Modern international standard (ISO 8601)
2. **HOLOCENE** - Linear timeline (adds 10,000 years, great for databases)
3. **JULIAN** - Pre-1582 historical dates (Old Style)
4. **UNIX** - Unix timestamp interoperability

Need more calendars? Add them manually (see [Adding More Calendars](#adding-more-calendars)) or use [`@iterumarchive/neo-calendar-full`](../neo-calendar-full/README.md).

## Installation

```bash
npm install @iterumarchive/neo-calendar
```

## Quick Start

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Works immediately - no setup required
const date = NeoCalendar.calendar(2024, 'AD', 3, 21);
console.log(date.display); // "+002024-03-21 AD"

// Convert to Holocene
const holocene = date.to('HOLOCENE');
console.log(holocene.display); // "12024-03-21 HE"

// 🆕 Era-based conversion (returns formatted strings)
const heDate = date.to('HE');
console.log(heDate); // "12024 HE"

const dates = date.to(['HE', 'AD', 'OS']);
console.log(dates); // ["12024 HE", "2024 AD", "2024 OS"]

// Multi-calendar output
console.log(date.toStrings(['GREGORIAN', 'HOLOCENE', 'JULIAN']));
// → ["+002024-03-21 AD", "12024-03-21 HE", "002024-03-08 OS"]
```

## Adding More Calendars

Import and register additional calendar plugins as needed:

```typescript
import { NeoCalendar, Registry } from '@iterumarchive/neo-calendar';
import { HebrewPlugin } from '@iterumarchive/neo-calendar-hebrew';
import { IslamicPlugin } from '@iterumarchive/neo-calendar-islamic';
import { PersianPlugin } from '@iterumarchive/neo-calendar-persian';

// Register additional calendars
Registry.register(new HebrewPlugin());
Registry.register(new IslamicPlugin());
Registry.register(new PersianPlugin());

// Now available for conversion
const date = NeoCalendar.calendar(2024, 'AD', 3, 21);

const hebrew = date.to('HEBREW');
console.log(hebrew.display); // "5784/7/11 AM"

const islamic = date.to('ISLAMIC');
console.log(islamic.display); // "1445/9/11 AH"

const persian = date.to('PERSIAN');
console.log(persian.display); // "1403/1/2 AP"
```

## Era-Driven Calendar Selection

The `calendar()` method automatically selects the right calendar based on era suffix:

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

// Auto-detects GREGORIAN from 'AD'
const gregorian = NeoCalendar.calendar(2024, 'AD');

// Auto-detects HOLOCENE from 'HE'
const holocene = NeoCalendar.calendar(12024, 'HE');

// Auto-detects JULIAN from 'OS' (Old Style)
const julian = NeoCalendar.calendar(1500, 'OS');

// Auto-detects UNIX from 'UNIX'
const unix = NeoCalendar.calendar(1234567890, 'UNIX');
```

## Method Chaining

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

const result = NeoCalendar.calendar(2024, 'AD', 1, 1)
  .add(3, 'months')    // April 1, 2024
  .add(15, 'days')     // April 16, 2024
  .add(2, 'years')     // April 16, 2026
  .to('HOLOCENE');     // Convert to Holocene

console.log(result.display); // "12026-04-16 HE"
```

## Cross-Calendar Arithmetic

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar';

const date1 = NeoCalendar.calendar(2000, 'AD');
const date2 = NeoCalendar.calendar(12000, 'HE');

const diff = date1.diff(date2);
console.log(diff.toDays()); // 0 (same moment!)
```

## API Reference

### Factory Methods

```typescript
// Era-driven selection (recommended)
NeoCalendar.calendar(year: number, era: EraLabel, month?: number, day?: number)

// Explicit calendar selection
NeoCalendar.at(year: number, month: number, day: number, calendarId: CalendarSystemId)

// From Julian Day Number
NeoCalendar.fromJDN(jdn: bigint, calendarId: CalendarSystemId)
```

### NeoDate Methods

```typescript
// Conversion
date.to(calendarId: CalendarSystemId): NeoDate

// Multi-calendar display
date.toStrings(calendars: CalendarSystemId[]): string[]

// Arithmetic
date.add(value: number, unit: 'days' | 'months' | 'years'): NeoDate
date.subtract(value: number, unit: 'days' | 'months' | 'years'): NeoDate
date.diff(other: NeoDate): NeoDuration

// Properties
date.display: string
date.jdn: bigint
date.year: number
date.month: number
date.day: number
date.calendarId: CalendarSystemId
```

### Registry Methods

```typescript
import { Registry } from '@iterumarchive/neo-calendar';

// Register a calendar plugin
Registry.register(plugin: ICalendarPlugin): void

// Clear all registrations (for testing)
Registry.clear(): void

// Get all registered calendars
Registry.getAll(): ICalendarPlugin[]
```

## Available Calendar Plugins

| Package | Calendar | Era Labels | Install |
|---------|----------|------------|---------|
| ✅ **Included** | Gregorian | AD, BC, CE, BCE | (auto-registered) |
| ✅ **Included** | Holocene | HE | (auto-registered) |
| ✅ **Included** | Julian | OS | (auto-registered) |
| ✅ **Included** | Unix | UNIX | (auto-registered) |
| `neo-calendar-hebrew` | Hebrew | AM | `npm i @iterumarchive/neo-calendar-hebrew` |
| `neo-calendar-islamic` | Islamic | AH | `npm i @iterumarchive/neo-calendar-islamic` |
| `neo-calendar-persian` | Persian | AP | `npm i @iterumarchive/neo-calendar-persian` |
| `neo-calendar-coptic` | Coptic | AM | `npm i @iterumarchive/neo-calendar-coptic` |
| `neo-calendar-ethiopian` | Ethiopian | AM | `npm i @iterumarchive/neo-calendar-ethiopian` |
| `neo-calendar-mayan` | Mayan | (none) | `npm i @iterumarchive/neo-calendar-mayan` |
| `neo-calendar-french-revolutionary` | French Rev. | RE | `npm i @iterumarchive/neo-calendar-french-revolutionary` |
| `neo-calendar-before-present` | Before Present | BP | `npm i @iterumarchive/neo-calendar-before-present` |

## Bundle Size

- **Standard package**: ~30kb (includes API + 4 calendars)
- **With additional plugins**: +2-4kb per calendar
- **Tree-shakeable**: Only imports you use are bundled

## When to Use This Package

✅ **Use Standard** if:
- You need Gregorian, Julian, or Unix conversions
- You want the full API (NeoDate, arithmetic, formatting)
- You're okay adding other calendars manually if needed

🔄 **Consider Full instead** if:
- You need multiple non-Western calendars (Hebrew, Islamic, Persian, etc.)
- You want zero configuration (all calendars included)
- Bundle size is not a primary concern

📦 **Consider Lite instead** if:
- You only need JDN conversions for database queries
- You don't need the NeoDate API or arithmetic
- You want the smallest bundle size (~8kb) [Coming soon]

## Documentation

- [Migration Guide](../../README.md#migration-guide)
- [Core Package](../neo-calendar-core/README.md)
- [Full Package](../neo-calendar-full/README.md)

## License

MIT
