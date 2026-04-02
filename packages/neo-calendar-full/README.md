# @iterumarchive/neo-calendar-full

> Complete calendar conversion library with all 12 calendars auto-registered - zero configuration required

[![npm version](https://img.shields.io/npm/v/@iterumarchive/neo-calendar-full)]()
[![Bundle Size](https://img.shields.io/badge/size-~50kb-blue)]()
[![Tests](https://img.shields.io/badge/tests-1095%2F1095-brightgreen)]()
[![Status](https://img.shields.io/badge/status-beta-yellow)]()

⚠️ **Beta Software** - Large bundle (~50kb). APIs may evolve before v1.0. Pin versions in production.

## Overview

The **Full package** includes the complete NeoCalendar API with **all 12 calendar systems** auto-registered and ready to use. Perfect for applications that need comprehensive calendar support without manual configuration.

### All 12 Calendars Included

✅ **Gregorian** - Modern international standard (ISO 8601)  
✅ **Holocene** - Linear timeline (adds 10,000 years)  
✅ **Julian** - Pre-1582 historical dates (Old Style)  
✅ **Unix** - Unix timestamp interoperability  
✅ **Hebrew** - Lunisolar calendar with dehiyyot rules  
✅ **Islamic** - Lunar civil calendar  
✅ **Persian/Jalali** - Solar calendar  
✅ **Coptic** - Egyptian Christian calendar  
✅ **Ethiopian** - Similar to Coptic  
✅ **Mayan Long Count** - Mesoamerican calendar  
✅ **French Revolutionary** - Revolutionary decimal calendar  
✅ **Before Present** - Archaeological/geological dating  

## Installation

```bash
npm install @iterumarchive/neo-calendar-full
```

## Quick Start

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

// All calendars work immediately - no setup required
const date = NeoCalendar.calendar(2024, 'AD', 3, 21);

// Convert to any calendar
const hebrew = date.to('HEBREW');
console.log(hebrew.display); // "5784/7/11 AM"

const islamic = date.to('ISLAMIC');
console.log(islamic.display); // "1445/9/11 AH"

const persian = date.to('PERSIAN');
console.log(persian.display); // "1403/1/2 AP"

// Multi-calendar display
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

## Zero Configuration

Unlike the Standard package, you don't need to manually register calendars:

```typescript
// Full package - Just import and use
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

const date = NeoCalendar.calendar(2024, 'AD', 3, 21);
const hebrew = date.to('HEBREW'); // ✅ Works immediately

// Compare with Standard package - Requires manual registration
import { NeoCalendar, Registry } from '@iterumarchive/neo-calendar';
import { HebrewPlugin } from '@iterumarchive/neo-calendar-hebrew';

Registry.register(new HebrewPlugin()); // ❌ Extra step required
const date2 = NeoCalendar.calendar(2024, 'AD', 3, 21);
const hebrew2 = date2.to('HEBREW'); // ✅ Now works
```

## Era-Driven Calendar Selection

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

// Auto-selects the right calendar based on era suffix
const gregorian = NeoCalendar.calendar(2024, 'AD');     // GREGORIAN
const holocene = NeoCalendar.calendar(12024, 'HE');     // HOLOCENE
const julian = NeoCalendar.calendar(1500, 'OS');        // JULIAN
const hebrew = NeoCalendar.calendar(5784, 'AM');        // HEBREW
const islamic = NeoCalendar.calendar(1445, 'AH');       // ISLAMIC
const persian = NeoCalendar.calendar(1403, 'AP');       // PERSIAN
const unix = NeoCalendar.calendar(1234567890, 'UNIX');  // UNIX
```

## Method Chaining

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

const result = NeoCalendar.calendar(5784, 'AM', 1, 1)  // Hebrew New Year
  .to('GREGORIAN')     // Convert to Gregorian
  .add(6, 'months')    // Add 6 months
  .to('ISLAMIC')       // Convert to Islamic
  .add(1, 'years');    // Add 1 Islamic year

console.log(result.display);
```

## Cross-Calendar Comparisons

```typescript
import { NeoCalendar } from '@iterumarchive/neo-calendar-full';

// Compare different calendar systems for the same moment
const gregorian = NeoCalendar.calendar(2024, 'AD', 3, 21);
const hebrew = NeoCalendar.calendar(5784, 'AM', 7, 11);
const islamic = NeoCalendar.calendar(1445, 'AH', 9, 11);

const diff1 = gregorian.diff(hebrew);
console.log(diff1.toDays()); // 0 (same day!)

const diff2 = gregorian.diff(islamic);
console.log(diff2.toDays()); // 0 (same day!)
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

## Included Calendars

| Calendar | Era Labels | Notes |
|----------|------------|-------|
| **Gregorian** | AD, BC, CE, BCE | Modern international standard |
| **Holocene** | HE | Linear timeline, great for databases |
| **Julian** | OS (Old Style) | Pre-1582 European dates |
| **Unix** | UNIX | Unix timestamps |
| **Hebrew** | AM | Lunisolar with dehiyyot rules |
| **Islamic** | AH | Lunar civil calendar |
| **Persian** | AP | Solar calendar (Jalali) |
| **Coptic** | AM | Egyptian Christian calendar |
| **Ethiopian** | AM | Similar to Coptic |
| **Mayan** | (none) | Long Count notation |
| **French Revolutionary** | RE | Revolutionary decimal calendar |
| **Before Present** | BP | Archaeological/geological dating |

## Bundle Size

- **Full package**: ~50kb minified
- **Gzipped**: ~18kb
- **All 12 calendars included**

## When to Use This Package

✅ **Use Full** if:
- You need multiple non-Western calendars (Hebrew, Islamic, Persian, etc.)
- You want zero configuration (all calendars included)
- You're building a research tool, historical database, or calendar comparison app
- Bundle size is not a primary concern

🔄 **Consider Standard instead** if:
- You only need Gregorian, Julian, or Unix conversions
- You want a smaller bundle (~30kb instead of ~50kb)
- You're okay adding other calendars manually if needed

📦 **Consider Lite instead** if:
- You only need JDN conversions for database queries
- You don't need the NeoDate API or arithmetic
- You want the smallest bundle size (~8kb) [Coming soon]

## Use Cases

### Historical Research
```typescript
// Compare historical dates across multiple calendar systems
const coronation = NeoCalendar.calendar(1066, 'OS', 12, 25);
console.log(coronation.toStrings([
  'JULIAN', 'GREGORIAN', 'HOLOCENE'
]));
```

### Multi-Cultural Applications
```typescript
// Display important dates in multiple calendars
const today = NeoCalendar.calendar(2024, 'AD', 3, 21);
console.log(today.toStrings([
  'GREGORIAN', 'HEBREW', 'ISLAMIC', 'PERSIAN'
]));
```

### Calendar Comparison Tools
```typescript
// Build calendar comparison dashboards
const date = NeoCalendar.calendar(2024, 'AD', 1, 1);
const allCalendars = [
  'GREGORIAN', 'JULIAN', 'HEBREW', 'ISLAMIC', 'PERSIAN',
  'COPTIC', 'ETHIOPIAN', 'HOLOCENE', 'UNIX', 'MAYAN',
  'FRENCH_REVOLUTIONARY', 'BEFORE_PRESENT'
];
console.log(date.toStrings(allCalendars));
```

## Documentation

- [Standard Package (smaller alternative)](../neo-calendar/README.md)
- [Core Package](../neo-calendar-core/README.md)

## License

MIT
