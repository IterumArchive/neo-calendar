/**
 * @file Calendar Registry with Era Support
 * @description API-layer registry that wraps core registry and adds era-based lookup
 *
 * Architecture:
 * - Core layer: Basic registry (register, get, has, list)
 * - API layer: Adds era indexing for ergonomic calendar(year, era) method
 * - Both layers share the SAME plugin storage via delegation
 */

import { globalRegistry } from "@iterumarchive/neo-calendar-core";
import type {
  CalendarSystemId,
  ICalendarPlugin,
} from "@iterumarchive/neo-calendar-core";

/**
 * Era-enabled calendar registry
 * Wraps the core registry and adds era-based lookup for the ergonomic API
 */
class EraEnabledRegistry {
  /** Era-to-calendar mapping for quick lookup */
  private eraMap: Map<string, CalendarSystemId[]> = new Map();

  /**
   * Register a calendar plugin
   * Delegates to core registry and indexes eras
   */
  register(plugin: ICalendarPlugin): void {
    // Delegate to core registry for actual storage
    globalRegistry.register(plugin);

    // Index eras for quick lookup
    this.indexEras(plugin);
  }

  /**
   * Unregister a calendar plugin
   */
  unregister(id: CalendarSystemId): void {
    const plugin = globalRegistry.get(id);
    if (plugin) {
      // Clean up era index
      this.cleanupEras(plugin);
    }

    // Delegate to core registry
    globalRegistry.unregister(id);
  }

  /**
   * Get a registered calendar plugin
   * Delegates to core registry
   */
  get(id: CalendarSystemId): ICalendarPlugin {
    return globalRegistry.get(id);
  }

  /**
   * Check if a calendar is registered
   * Delegates to core registry
   */
  has(id: CalendarSystemId): boolean {
    return globalRegistry.has(id);
  }

  /**
   * List all registered calendar IDs
   * Delegates to core registry
   */
  list(): CalendarSystemId[] {
    return globalRegistry.list();
  }

  /**
   * Get metadata for all registered calendars
   * Delegates to core registry
   */
  listAll(): Array<{
    id: CalendarSystemId;
    name: string;
    aliases: string[];
  }> {
    return globalRegistry.all().map(plugin => ({
      id: plugin.id,
      name: plugin.metadata.name,
      aliases: plugin.metadata.aliases,
    }));
  }

  /**
   * Find calendars that support a specific era marker
   * Example: findByEra('HE') -> [HOLOCENE]
   */
  findByEra(era: string): CalendarSystemId[] {
    const normalizedEra = era.toUpperCase();
    return this.eraMap.get(normalizedEra) || [];
  }

  /**
   * Get all registered era markers
   * Returns a list of all era abbreviations from all registered calendars
   */
  getAllEras(): string[] {
    return Array.from(this.eraMap.keys());
  }

  /**
   * Clear all registered calendars (useful for testing)
   * Clears both core registry and era index
   */
  clear(): void {
    globalRegistry.clear();
    this.eraMap.clear();
  }

  /**
   * Index all eras from a plugin for quick lookup
   */
  private indexEras(plugin: ICalendarPlugin): void {
    // Get eras from plugin's eras property
    const eras = plugin.eras;
    if (!eras || !Array.isArray(eras) || eras.length === 0) {
      return;
    }

    // Index each era label
    for (const era of eras) {
      const normalizedEra = era.toUpperCase();
      const existing = this.eraMap.get(normalizedEra) || [];
      if (!existing.includes(plugin.id)) {
        existing.push(plugin.id);
        this.eraMap.set(normalizedEra, existing);
      }
    }
  }

  /**
   * Remove a plugin's eras from the index
   */
  private cleanupEras(plugin: ICalendarPlugin): void {
    // Get eras from plugin's eras property
    const eras = plugin.eras;
    if (!eras || !Array.isArray(eras) || eras.length === 0) {
      return;
    }

    // Remove each era label from the index
    for (const era of eras) {
      const normalizedEra = era.toUpperCase();
      const existing = this.eraMap.get(normalizedEra);
      if (existing) {
        const filtered = existing.filter(id => id !== plugin.id);
        if (filtered.length === 0) {
          this.eraMap.delete(normalizedEra);
        } else {
          this.eraMap.set(normalizedEra, filtered);
        }
      }
    }
  }
}

/**
 * Export the singleton instance
 * This is the ONE registry used by the API layer
 * It wraps the core registry and adds era indexing
 */
export const Registry = new EraEnabledRegistry();

// Re-export types
export type { ICalendarRegistry } from "@iterumarchive/neo-calendar-core";
