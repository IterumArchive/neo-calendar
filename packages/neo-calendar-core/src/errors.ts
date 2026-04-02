/**
 * @file Neo Calendar Error Classes
 * @description Custom error types for calendar conversion engine
 *
 * Error Hierarchy:
 * - CalendarError (base)
 *   - RegistryError (plugin management)
 *   - ValidationError (invalid dates)
 *   - ConversionError (conversion failures)
 *   - EraError (unknown era labels)
 *   - ArithmeticError (calendar arithmetic)
 */

import type { CalendarSystemId, EraLabel } from "./ontology.types.js";

// ============================================================================
// BASE ERROR
// ============================================================================

/**
 * Base error class for all calendar-related errors.
 *
 * Extends native Error with additional context.
 */
export class CalendarError extends Error {
  /**
   * Error code for programmatic handling
   */
  public readonly code: string;

  /**
   * Additional context data
   */
  public readonly context?: Record<string, unknown> | undefined;

  constructor(
    message: string,
    code: string = "CALENDAR_ERROR",
    context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "CalendarError";
    this.code = code;
    this.context = context;

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set prototype explicitly for instanceof checks
    Object.setPrototypeOf(this, CalendarError.prototype);
  }

  /**
   * Serialize error to JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      stack: this.stack,
    };
  }
}

// ============================================================================
// REGISTRY ERRORS
// ============================================================================

/**
 * Error thrown when calendar registry operations fail.
 */
export class RegistryError extends CalendarError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "REGISTRY_ERROR", context);
    this.name = "RegistryError";
    Object.setPrototypeOf(this, RegistryError.prototype);
  }

  /**
   * Calendar not found in registry
   */
  static notFound(calendarId: CalendarSystemId): RegistryError {
    return new RegistryError(
      `Calendar "${calendarId}" not found in registry`,
      { calendarId, available: [] }, // Will be populated by caller
    );
  }

  /**
   * Calendar already registered
   */
  static alreadyRegistered(calendarId: CalendarSystemId): RegistryError {
    return new RegistryError(`Calendar "${calendarId}" is already registered`, {
      calendarId,
    });
  }

  /**
   * Registry is empty
   */
  static empty(): RegistryError {
    return new RegistryError(
      "Calendar registry is empty. Register at least one calendar plugin.",
    );
  }
}

// ============================================================================
// VALIDATION ERRORS
// ============================================================================

/**
 * Error thrown when date validation fails.
 */
export class ValidationError extends CalendarError {
  /**
   * Validation errors
   */
  public readonly errors: string[];

  /**
   * Validation warnings (non-fatal)
   */
  public readonly warnings: string[];

  constructor(
    message: string,
    errors: string[],
    warnings: string[] = [],
    context?: Record<string, unknown>,
  ) {
    super(message, "VALIDATION_ERROR", { ...context, errors, warnings });
    this.name = "ValidationError";
    this.errors = errors;
    this.warnings = warnings;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }

  /**
   * Invalid date input
   */
  static invalidDate(
    calendar: CalendarSystemId,
    year?: number,
    month?: number,
    day?: number,
    errors: string[] = [],
  ): ValidationError {
    return new ValidationError(
      `Invalid date in ${calendar} calendar`,
      errors.length > 0 ? errors : ["Date validation failed"],
      [],
      { calendar, year, month, day },
    );
  }

  /**
   * Missing required field
   */
  static missingField(
    field: string,
    calendar: CalendarSystemId,
  ): ValidationError {
    return new ValidationError(
      `Missing required field: ${field}`,
      [`Field "${field}" is required for ${calendar} calendar`],
      [],
      { field, calendar },
    );
  }

  /**
   * Out of range value
   */
  static outOfRange(
    field: string,
    value: number,
    min: number,
    max: number,
  ): ValidationError {
    return new ValidationError(
      `${field} value ${value} is out of range`,
      [`${field} must be between ${min} and ${max}, got ${value}`],
      [],
      { field, value, min, max },
    );
  }

  /**
   * Invalid month for calendar
   */
  static invalidMonth(
    month: number,
    calendar: CalendarSystemId,
    maxMonths: number,
  ): ValidationError {
    return new ValidationError(
      `Invalid month ${month} for ${calendar} calendar`,
      [`Month must be between 1 and ${maxMonths}, got ${month}`],
      [],
      { month, calendar, maxMonths },
    );
  }

  /**
   * Invalid day for month
   */
  static invalidDay(
    day: number,
    month: number,
    year: number,
    maxDays: number,
  ): ValidationError {
    return new ValidationError(
      `Invalid day ${day} for month ${month}`,
      [`Month ${month} has ${maxDays} days in year ${year}, got day ${day}`],
      [],
      { day, month, year, maxDays },
    );
  }
}

// ============================================================================
// CONVERSION ERRORS
// ============================================================================

/**
 * Error thrown when calendar conversion fails.
 */
export class ConversionError extends CalendarError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "CONVERSION_ERROR", context);
    this.name = "ConversionError";
    Object.setPrototypeOf(this, ConversionError.prototype);
  }

  /**
   * Failed to convert date
   */
  static failed(
    fromCalendar: CalendarSystemId,
    toCalendar: CalendarSystemId,
    reason?: string,
  ): ConversionError {
    return new ConversionError(
      `Failed to convert from ${fromCalendar} to ${toCalendar}${reason ? `: ${reason}` : ""}`,
      { fromCalendar, toCalendar, reason },
    );
  }

  /**
   * JDN conversion failed
   */
  static jdnConversion(
    calendar: CalendarSystemId,
    direction: "toJDN" | "fromJDN",
    reason?: string,
  ): ConversionError {
    return new ConversionError(
      `Failed to ${direction === "toJDN" ? "convert to" : "convert from"} JDN in ${calendar} calendar${reason ? `: ${reason}` : ""}`,
      { calendar, direction, reason },
    );
  }

  /**
   * Ambiguous conversion
   */
  static ambiguous(
    calendar: CalendarSystemId,
    reason: string,
  ): ConversionError {
    return new ConversionError(
      `Ambiguous conversion in ${calendar} calendar: ${reason}`,
      { calendar, reason, isAmbiguous: true },
    );
  }
}

// ============================================================================
// ERA ERRORS
// ============================================================================

/**
 * Error thrown when era handling fails.
 */
export class EraError extends CalendarError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "ERA_ERROR", context);
    this.name = "EraError";
    Object.setPrototypeOf(this, EraError.prototype);
  }

  /**
   * Unknown era label
   */
  static unknownEra(
    era: string,
    calendar: CalendarSystemId,
    validEras: EraLabel[],
  ): EraError {
    return new EraError(`Unknown era "${era}" for ${calendar} calendar`, {
      era,
      calendar,
      validEras,
    });
  }

  /**
   * Era not applicable to calendar
   */
  static notApplicable(era: EraLabel, calendar: CalendarSystemId): EraError {
    return new EraError(
      `Era "${era}" is not applicable to ${calendar} calendar`,
      { era, calendar },
    );
  }

  /**
   * Invalid year for era
   */
  static invalidYear(
    year: number,
    era: EraLabel,
    calendar: CalendarSystemId,
  ): EraError {
    return new EraError(
      `Year ${year} is invalid for era "${era}" in ${calendar} calendar`,
      { year, era, calendar },
    );
  }
}

// ============================================================================
// ARITHMETIC ERRORS
// ============================================================================

/**
 * Error thrown when calendar arithmetic fails.
 */
export class ArithmeticError extends CalendarError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, "ARITHMETIC_ERROR", context);
    this.name = "ArithmeticError";
    Object.setPrototypeOf(this, ArithmeticError.prototype);
  }

  /**
   * Invalid duration
   */
  static invalidDuration(
    reason: string,
    context?: Record<string, unknown>,
  ): ArithmeticError {
    return new ArithmeticError(`Invalid duration: ${reason}`, context);
  }

  /**
   * Missing calendar context
   */
  static missingCalendarContext(operation: string): ArithmeticError {
    return new ArithmeticError(
      `Calendar context required for ${operation} with month/year units`,
      { operation },
    );
  }

  /**
   * Overflow error
   */
  static overflow(operation: string, value: number | bigint): ArithmeticError {
    return new ArithmeticError(`Arithmetic overflow in ${operation}`, {
      operation,
      value: value.toString(),
    });
  }

  /**
   * Invalid reference date
   */
  static invalidReferenceDate(reason: string): ArithmeticError {
    return new ArithmeticError(`Invalid reference date: ${reason}`, { reason });
  }
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if error is a CalendarError
 */
export function isCalendarError(error: unknown): error is CalendarError {
  return error instanceof CalendarError;
}

/**
 * Check if error is a RegistryError
 */
export function isRegistryError(error: unknown): error is RegistryError {
  return error instanceof RegistryError;
}

/**
 * Check if error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Check if error is a ConversionError
 */
export function isConversionError(error: unknown): error is ConversionError {
  return error instanceof ConversionError;
}

/**
 * Check if error is an EraError
 */
export function isEraError(error: unknown): error is EraError {
  return error instanceof EraError;
}

/**
 * Check if error is an ArithmeticError
 */
export function isArithmeticError(error: unknown): error is ArithmeticError {
  return error instanceof ArithmeticError;
}
