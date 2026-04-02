/**
 * @file NeoCalendar Full Package
 * @description Complete package with all 12 calendar systems auto-registered
 * Zero-configuration, batteries-included experience
 */

// Auto-register all 12 calendars
import { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
import { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
import { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
import { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
import { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
import { CopticPlugin } from "@iterumarchive/neo-calendar-coptic";
import { EthiopianPlugin } from "@iterumarchive/neo-calendar-ethiopian";
import { MayanPlugin } from "@iterumarchive/neo-calendar-mayan";
import { FrenchRevolutionaryPlugin } from "@iterumarchive/neo-calendar-french-revolutionary";
import { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
import { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
import { BeforePresentPlugin } from "@iterumarchive/neo-calendar-before-present";
import { Registry } from "@iterumarchive/neo-calendar";

// Register all calendars on import
Registry.register(new GregorianPlugin());
Registry.register(new JulianPlugin());
Registry.register(new HebrewPlugin());
Registry.register(new IslamicPlugin());
Registry.register(new PersianPlugin());
Registry.register(new CopticPlugin());
Registry.register(new EthiopianPlugin());
Registry.register(new MayanPlugin());
Registry.register(new FrenchRevolutionaryPlugin());
Registry.register(new HolocenePlugin());
Registry.register(new UnixPlugin());
Registry.register(new BeforePresentPlugin());

// Re-export everything from Standard package
export * from "@iterumarchive/neo-calendar";

// Re-export all 12 plugins for advanced users
export { GregorianPlugin } from "@iterumarchive/neo-calendar-gregorian";
export { JulianPlugin } from "@iterumarchive/neo-calendar-julian";
export { HebrewPlugin } from "@iterumarchive/neo-calendar-hebrew";
export { IslamicPlugin } from "@iterumarchive/neo-calendar-islamic";
export { PersianPlugin } from "@iterumarchive/neo-calendar-persian";
export { CopticPlugin } from "@iterumarchive/neo-calendar-coptic";
export { EthiopianPlugin } from "@iterumarchive/neo-calendar-ethiopian";
export { MayanPlugin } from "@iterumarchive/neo-calendar-mayan";
export { FrenchRevolutionaryPlugin } from "@iterumarchive/neo-calendar-french-revolutionary";
export { HolocenePlugin } from "@iterumarchive/neo-calendar-holocene";
export { UnixPlugin } from "@iterumarchive/neo-calendar-unix";
export { BeforePresentPlugin } from "@iterumarchive/neo-calendar-before-present";
