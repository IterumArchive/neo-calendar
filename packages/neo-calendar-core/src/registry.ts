/**
 * @file Calendar Registry Implementation
 * @description Plugin registry for calendar systems
 *
 * Manages calendar plugin lifecycle and provides discovery capabilities.
 * Implements ICalendarRegistry interface.
 */

import type { CalendarSystemId, AstronomicalBasis } from "./ontology.types.js";

import type { ICalendarPlugin, ICalendarRegistry } from "./interfaces.js";
import { RegistryError } from "./errors.js";

// ============================================================================
// CALENDAR REGISTRYy
// ============================================================================

/**
 * Calendar plugin registry.
 *
 * Singleton pattern: Use CalendarRegistry.getInstance() or create new instances.
 *
 * @example
 * ```ts
 * const registry = new CalendarRegistry();
 * registry.register(new GregorianPlugin());
 * registry.register(new HebrewPlugin());
 *
 * const gregorian = registry.get("GREGORIAN");
 * const lunar = registry.getByBasis("lunar");
 * ```
 */
export class CalendarRegistry implements ICalendarRegistry {
  /**
   * Internal plugin storage
   */
  private readonly plugins: Map<CalendarSystemId, ICalendarPlugin>;

  /**
   * Registration order (for ordered retrieval)
   */
  private readonly registrationOrder: CalendarSystemId[];

  /**
   * Singleton instance
   */
  private static instance?: CalendarRegistry;

  /**
   * Create a new registry
   */
  constructor() {
    this.plugins = new Map();
    this.registrationOrder = [];
  }

  /**
   * Get singleton registry instance
   *
   * @returns Global registry instance
   */
  static getInstance(): CalendarRegistry {
    if (!CalendarRegistry.instance) {
      CalendarRegistry.instance = new CalendarRegistry();
    }
    return CalendarRegistry.instance;
  }

  // ============================================================================
  // CORE OPERATIONS
  // ============================================================================

  /**
   * Register a calendar plugin
   *
   * If a plugin with the same ID is already registered, it will be replaced.
   */
  register(plugin: ICalendarPlugin): void {
    const isNew = !this.plugins.has(plugin.id);

    this.plugins.set(plugin.id, plugin);

    // Only add to registration order if it's a new plugin
    if (isNew) {
      this.registrationOrder.push(plugin.id);
    }
  }

  /**
   * Get calendar plugin by ID
   *
   * @throws RegistryError if calendar not found
   */
  get(id: CalendarSystemId): ICalendarPlugin {
    const plugin = this.plugins.get(id);

    if (!plugin) {
      const error = RegistryError.notFound(id);
      // Populate available calendars in context
      if (error.context) {
        error.context.available = this.list();
      }
      throw error;
    }

    return plugin;
  }

  /**
   * Check if calendar is registered
   */
  has(id: CalendarSystemId): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get all registered calendar IDs
   *
   * Returns IDs in registration order.
   */
  list(): CalendarSystemId[] {
    return [...this.registrationOrder];
  }

  /**
   * Get all registered plugins
   *
   * Returns plugins in registration order.
   */
  all(): ICalendarPlugin[] {
    return this.registrationOrder.map(id => this.plugins.get(id)!);
  }

  /**
   * Unregister a calendar plugin
   */
  unregister(id: CalendarSystemId): void {
    this.plugins.delete(id);

    // Remove from registration order
    const index = this.registrationOrder.indexOf(id);
    if (index !== -1) {
      this.registrationOrder.splice(index, 1);
    }
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
    this.registrationOrder.length = 0;
  }

  // ============================================================================
  // DISCOVERY / FILTERING
  // ============================================================================

  /**
   * Get all calendars with specific astronomical basis
   *
   * @example
   * ```ts
   * const lunarCalendars = registry.getByBasis("lunar");
   * // Returns: [IslamicPlugin, ...]
   * ```
   */
  getByBasis(basis: AstronomicalBasis): ICalendarPlugin[] {
    return this.all().filter(
      plugin => plugin.metadata.astronomicalBasis === basis,
    );
  }

  /**
   * Get all calendars used in a specific region
   *
   * Matches against geographicRegions in calendar metadata.
   *
   * @example
   * ```ts
   * const middleEast = registry.getByRegion("Middle East");
   * // Returns: [IslamicPlugin, PersianPlugin, HebrewPlugin, ...]
   * ```
   */
  getByRegion(region: string): ICalendarPlugin[] {
    return this.all().filter(plugin => {
      const regions = plugin.metadata.geographicRegions;
      return (
        regions &&
        regions.some((r: string) =>
          r.toLowerCase().includes(region.toLowerCase()),
        )
      );
    });
  }

  /**
   * Get all calendars used for a specific purpose
   *
   * Matches against usedFor in calendar metadata.
   *
   * @example
   * ```ts
   * const religious = registry.getByUsage("religious");
   * // Returns: [HebrewPlugin, IslamicPlugin, CopticPlugin, ...]
   * ```
   */
  getByUsage(
    usage: "civil" | "religious" | "scientific" | "historical",
  ): ICalendarPlugin[] {
    return this.all().filter(plugin => {
      const uses = plugin.metadata.usedFor;
      return uses && uses.includes(usage);
    });
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get calendar count
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * Check if registry is empty
   */
  get isEmpty(): boolean {
    return this.plugins.size === 0;
  }

  /**
   * Get calendars grouped by astronomical basis
   *
   * @returns Map of basis → plugins
   */
  groupByBasis(): Map<AstronomicalBasis, ICalendarPlugin[]> {
    const groups = new Map<AstronomicalBasis, ICalendarPlugin[]>();

    for (const plugin of this.all()) {
      const basis = plugin.metadata.astronomicalBasis;
      const existing = groups.get(basis) || [];
      existing.push(plugin);
      groups.set(basis, existing);
    }

    return groups;
  }

  /**
   * Search calendars by name or alias
   *
   * Case-insensitive search across name and aliases.
   *
   * @example
   * ```ts
   * registry.search("greg");
   * // Returns: [GregorianPlugin]
   *
   * registry.search("hijri");
   * // Returns: [IslamicPlugin]
   * ```
   */
  search(query: string): ICalendarPlugin[] {
    const lowerQuery = query.toLowerCase();

    return this.all().filter(plugin => {
      const name = plugin.metadata.name.toLowerCase();
      const aliases = plugin.metadata.aliases.map((a: string) =>
        a.toLowerCase(),
      );

      return (
        name.includes(lowerQuery) ||
        aliases.some((alias: string) => alias.includes(lowerQuery))
      );
    });
  }

  /**
   * Export registry state for debugging
   */
  toJSON(): {
    count: number;
    calendars: Array<{
      id: CalendarSystemId;
      name: string;
      basis: AstronomicalBasis;
    }>;
  } {
    return {
      count: this.size,
      calendars: this.all().map(plugin => ({
        id: plugin.id,
        name: plugin.metadata.name,
        basis: plugin.metadata.astronomicalBasis,
      })),
    };
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

/**
 * Global registry instance
 */
export const globalRegistry = CalendarRegistry.getInstance();

/**
 * Register a plugin in the global registry
 */
export function registerGlobal(plugin: ICalendarPlugin): void {
  globalRegistry.register(plugin);
}

/**
 * Get a plugin from the global registry
 */
export function getGlobal(id: CalendarSystemId): ICalendarPlugin {
  return globalRegistry.get(id);
}

/**
 * Check if a plugin is registered globally
 */
export function hasGlobal(id: CalendarSystemId): boolean {
  return globalRegistry.has(id);
}
