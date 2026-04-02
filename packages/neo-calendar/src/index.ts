/**
 * @file NeoCalendar Standard Package
 * @description Full API with 4 auto-registered calendars (Gregorian, Holocene, Julian, Unix)
 * Zero-configuration experience for most users
 */

// Auto-register the 4 standard calendars
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
import { Registry } from "./api/registry.js";

// Register calendars on import
// Note: This registers to the API layer's registry
Registry.register(new GregorianPlugin());
Registry.register(new HolocenePlugin());
Registry.register(new JulianPlugin());
Registry.register(new UnixPlugin());

// Export all API classes and functions
export { NeoCalendar } from "./api/NeoCalendar.js";
export { NeoDate } from "./api/NeoDate.js";
export { NeoDuration } from "./api/NeoDuration.js";
export { NeoSeries } from "./api/NeoSeries.js";
export { NeoSpan } from "./api/NeoSpan.js";

// Export formatting utilities
export { formatDate } from "./api/formatting.js";

// Export Registry for manual plugin registration
export { Registry } from "./api/registry.js";

// Export API types
export type * from "./api/api.types.js";

// Re-export core errors for convenience (types already in api.types)
export {
  CalendarError,
  RegistryError,
  ValidationError,
  ConversionError,
  EraError,
  ArithmeticError,
} from "@iterumarchive/neo-calendar-core";

// Re-export the 4 bundled plugins for advanced users
export { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
export { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
export { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
export { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
