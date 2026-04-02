/**
 * @file Neo Calendar Core - Index
 * @description Entry point for core calendar infrastructure
 *
 * Exports:
 * - Types and interfaces
 * - Error classes
 * - Base plugin class
 * - Registry implementation
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type * from "./ontology.types.js";
export type * from "./interfaces.js";

// ============================================================================
// ENUM EXPORTS (used as values)
// ============================================================================

export { AdjustmentPriority } from "./ontology.types.js";

// ============================================================================
// ERROR EXPORTS
// ============================================================================

export {
  CalendarError,
  RegistryError,
  ValidationError,
  ConversionError,
  EraError,
  ArithmeticError,
  isCalendarError,
  isRegistryError,
  isValidationError,
  isConversionError,
  isEraError,
  isArithmeticError,
} from "./errors.js";

// ============================================================================
// BASE PLUGIN EXPORT
// ============================================================================

export { BaseCalendarPlugin } from "./base-plugin.js";

// ============================================================================
// REGISTRY EXPORTS
// ============================================================================

export {
  CalendarRegistry,
  globalRegistry,
  registerGlobal,
  getGlobal,
  hasGlobal,
} from "./registry.js";

// ============================================================================
// ADJUSTMENT ENGINE EXPORTS
// ============================================================================

export { AdjustmentEngine, AdjustmentPatterns } from "./adjustment-engine.js";

// ============================================================================
// ADVANCED FEATURES EXPORTS
// ============================================================================

export {
  AdvancedFeatures,
  MockObservationalDataSource,
} from "./advanced-features.js";
