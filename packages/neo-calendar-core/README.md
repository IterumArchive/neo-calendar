# @iterumarchive/neo-calendar-core

> Core engine for NeoCalendar - types, interfaces, and base plugin system

[![npm version](https://img.shields.io/npm/v/@iterumarchive/neo-calendar-core)]()
[![Bundle Size](https://img.shields.io/badge/size-~5kb-blue)]()
[![Status](https://img.shields.io/badge/status-beta-yellow)]()

⚠️ **Beta Software** - Internal APIs may change before v1.0. Intended for package development.

## Overview

The Core package provides the foundational types, interfaces, and base plugin system that all NeoCalendar packages build upon. **Most users do not need to install this package directly** - it's included as a dependency of the Standard and Full packages.

## When to Use This Package

Install `@iterumarchive/neo-calendar-core` if you are:

- **Building a custom calendar plugin**
- **Creating a framework** that extends NeoCalendar
- **Need only the type definitions** without the API layer

For general calendar conversions, use [`@iterumarchive/neo-calendar`](../neo-calendar/README.md) (Standard) or [`@iterumarchive/neo-calendar-full`](../neo-calendar-full/README.md) (Full) instead.

## Installation

```bash
npm install @iterumarchive/neo-calendar-core
```

## What's Included

### Type System
- `JDN` - Julian Day Number (bigint)
- `BrandedJDN` - Type-safe JDN wrapper
- `DateRecord` - Calendar date representation
- `CalendarSystemId` - Calendar identifier enum
- `EraLabel` - Era suffix types (AD, BC, HE, etc.)

### Interfaces
- `ICalendarPlugin` - Plugin contract for calendar implementations
- `ICalendarRegistry` - Registry interface
- `IAdjustmentEngine` - Administrative adjustment system

### Base Classes
- `BaseCalendarPlugin` - Abstract base class for plugins
- `AdjustmentEngine` - Handles historical discontinuities
- `AdvancedFeatures` - Observational data and metadata

### Error Classes
- `CalendarError` - Base error class
- `RegistryError` - Registry-related errors
- `ValidationError` - Date validation errors
- `ConversionError` - Conversion failures
- `EraError` - Era-related errors
- `ArithmeticError` - Arithmetic operation errors

## Usage Example: Building a Custom Plugin

```typescript
import { 
  BaseCalendarPlugin, 
  CalendarSystemId, 
  DateRecord, 
  JDN,
  EraLabel
} from '@iterumarchive/neo-calendar-core';

export class MyCustomPlugin extends BaseCalendarPlugin {
  readonly id = 'MY_CUSTOM' as CalendarSystemId;
  readonly name = 'My Custom Calendar';
  readonly eraLabels: EraLabel[] = ['MC'];

  dateToJDN(date: DateRecord): JDN {
    // Your conversion logic here
    return 0n;
  }

  jdnToDate(jdn: JDN): DateRecord {
    // Your conversion logic here
    return {
      year: 0,
      month: 1,
      day: 1,
      calendarId: this.id
    };
  }

  isValid(date: DateRecord): boolean {
    // Your validation logic here
    return true;
  }

  getDaysInMonth(year: number, month: number): number {
    // Your month length logic here
    return 30;
  }

  getDaysInYear(year: number): number {
    // Your year length logic here
    return 365;
  }
}
```

## API Reference

### Core Types

```typescript
// Julian Day Number (bigint)
type JDN = bigint;

// Date representation
interface DateRecord {
  year: number;
  month: number;
  day: number;
  calendarId: CalendarSystemId;
  era?: EraLabel;
}

// Calendar system identifiers
enum CalendarSystemId {
  GREGORIAN = 'GREGORIAN',
  JULIAN = 'JULIAN',
  HEBREW = 'HEBREW',
  ISLAMIC = 'ISLAMIC',
  // ... etc
}
```

### Plugin Interface

```typescript
interface ICalendarPlugin {
  readonly id: CalendarSystemId;
  readonly name: string;
  readonly eraLabels: EraLabel[];
  
  dateToJDN(date: DateRecord): JDN;
  jdnToDate(jdn: JDN): DateRecord;
  isValid(date: DateRecord): boolean;
  getDaysInMonth(year: number, month: number): number;
  getDaysInYear(year: number): number;
}
```

## Bundle Size

- **Minified**: ~5kb
- **Gzipped**: ~2kb
- **0 runtime dependencies**

## Documentation

- [Standard Package](../neo-calendar/README.md)
- [Full Package](../neo-calendar-full/README.md)

## License

MIT
