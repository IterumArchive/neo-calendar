/**
 * @file Unit tests for error classes
 * @description Comprehensive unit tests for all error classes in errors.ts
 */

import { describe, it, expect } from "vitest";
import {
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
} from "@iterumarchive/neo-calendar-core";

// ============================================================================
// BASE CALENDAR ERROR
// ============================================================================

describe("CalendarError", () => {
  describe("constructor", () => {
    it("should create basic error with message", () => {
      const error = new CalendarError("Test error");
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(CalendarError);
      expect(error.message).toBe("Test error");
      expect(error.name).toBe("CalendarError");
      expect(error.code).toBe("CALENDAR_ERROR");
      expect(error.context).toBeUndefined();
    });

    it("should create error with custom code", () => {
      const error = new CalendarError("Test error", "CUSTOM_CODE");
      expect(error.code).toBe("CUSTOM_CODE");
    });

    it("should create error with context", () => {
      const context = { foo: "bar", baz: 123 };
      const error = new CalendarError("Test error", "TEST_CODE", context);
      expect(error.context).toEqual(context);
    });

    it("should maintain proper prototype chain", () => {
      const error = new CalendarError("Test");
      expect(Object.getPrototypeOf(error)).toBe(CalendarError.prototype);
    });

    it("should have stack trace", () => {
      const error = new CalendarError("Test");
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain("CalendarError");
    });
  });

  describe("toJSON", () => {
    it("should serialize error to JSON", () => {
      const error = new CalendarError("Test error", "TEST_CODE", {
        key: "value",
      });
      const json = error.toJSON();

      expect(json.name).toBe("CalendarError");
      expect(json.message).toBe("Test error");
      expect(json.code).toBe("TEST_CODE");
      expect(json.context).toEqual({ key: "value" });
      expect(json.stack).toBeDefined();
    });

    it("should serialize error without context", () => {
      const error = new CalendarError("Test error");
      const json = error.toJSON();

      expect(json.context).toBeUndefined();
    });
  });
});

// ============================================================================
// REGISTRY ERROR
// ============================================================================

describe("RegistryError", () => {
  describe("constructor", () => {
    it("should create registry error", () => {
      const error = new RegistryError("Registry issue");
      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(RegistryError);
      expect(error.name).toBe("RegistryError");
      expect(error.code).toBe("REGISTRY_ERROR");
      expect(error.message).toBe("Registry issue");
    });

    it("should maintain proper prototype chain", () => {
      const error = new RegistryError("Test");
      expect(Object.getPrototypeOf(error)).toBe(RegistryError.prototype);
    });
  });

  describe("notFound", () => {
    it("should create not found error", () => {
      const error = RegistryError.notFound("MAYAN");
      expect(error.message).toBe('Calendar "MAYAN" not found in registry');
      expect(error.context?.calendarId).toBe("MAYAN");
      expect(error.context?.available).toEqual([]);
    });
  });

  describe("alreadyRegistered", () => {
    it("should create already registered error", () => {
      const error = RegistryError.alreadyRegistered("GREGORIAN");
      expect(error.message).toBe('Calendar "GREGORIAN" is already registered');
      expect(error.context?.calendarId).toBe("GREGORIAN");
    });
  });

  describe("empty", () => {
    it("should create empty registry error", () => {
      const error = RegistryError.empty();
      expect(error.message).toBe(
        "Calendar registry is empty. Register at least one calendar plugin.",
      );
    });
  });
});

// ============================================================================
// VALIDATION ERROR
// ============================================================================

describe("ValidationError", () => {
  describe("constructor", () => {
    it("should create validation error with errors", () => {
      const errors = ["Error 1", "Error 2"];
      const error = new ValidationError("Validation failed", errors);

      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.name).toBe("ValidationError");
      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.message).toBe("Validation failed");
      expect(error.errors).toEqual(errors);
      expect(error.warnings).toEqual([]);
    });

    it("should create validation error with errors and warnings", () => {
      const errors = ["Error 1"];
      const warnings = ["Warning 1", "Warning 2"];
      const error = new ValidationError("Validation failed", errors, warnings);

      expect(error.errors).toEqual(errors);
      expect(error.warnings).toEqual(warnings);
      expect(error.context?.errors).toEqual(errors);
      expect(error.context?.warnings).toEqual(warnings);
    });

    it("should maintain proper prototype chain", () => {
      const error = new ValidationError("Test", []);
      expect(Object.getPrototypeOf(error)).toBe(ValidationError.prototype);
    });
  });

  describe("invalidDate", () => {
    it("should create invalid date error with all parameters", () => {
      const error = ValidationError.invalidDate("GREGORIAN", 2020, 2, 30);
      expect(error.message).toBe("Invalid date in GREGORIAN calendar");
      expect(error.errors).toEqual(["Date validation failed"]);
      expect(error.context?.calendar).toBe("GREGORIAN");
      expect(error.context?.year).toBe(2020);
      expect(error.context?.month).toBe(2);
      expect(error.context?.day).toBe(30);
    });

    it("should create invalid date error with custom errors", () => {
      const customErrors = ["Day too large", "Month invalid"];
      const error = ValidationError.invalidDate(
        "HEBREW",
        5784,
        13,
        35,
        customErrors,
      );
      expect(error.errors).toEqual(customErrors);
    });

    it("should create invalid date error with partial date", () => {
      const error = ValidationError.invalidDate("JULIAN", 100);
      expect(error.context?.year).toBe(100);
      expect(error.context?.month).toBeUndefined();
      expect(error.context?.day).toBeUndefined();
    });
  });

  describe("missingField", () => {
    it("should create missing field error", () => {
      const error = ValidationError.missingField("year", "ISLAMIC");
      expect(error.message).toBe("Missing required field: year");
      expect(error.errors).toEqual([
        'Field "year" is required for ISLAMIC calendar',
      ]);
      expect(error.context?.field).toBe("year");
      expect(error.context?.calendar).toBe("ISLAMIC");
    });
  });

  describe("outOfRange", () => {
    it("should create out of range error", () => {
      const error = ValidationError.outOfRange("month", 15, 1, 12);
      expect(error.message).toBe("month value 15 is out of range");
      expect(error.errors).toEqual(["month must be between 1 and 12, got 15"]);
      expect(error.context?.field).toBe("month");
      expect(error.context?.value).toBe(15);
      expect(error.context?.min).toBe(1);
      expect(error.context?.max).toBe(12);
    });
  });

  describe("invalidMonth", () => {
    it("should create invalid month error", () => {
      const error = ValidationError.invalidMonth(13, "GREGORIAN", 12);
      expect(error.message).toBe("Invalid month 13 for GREGORIAN calendar");
      expect(error.errors).toEqual(["Month must be between 1 and 12, got 13"]);
      expect(error.context?.month).toBe(13);
      expect(error.context?.calendar).toBe("GREGORIAN");
      expect(error.context?.maxMonths).toBe(12);
    });
  });

  describe("invalidDay", () => {
    it("should create invalid day error", () => {
      const error = ValidationError.invalidDay(30, 2, 2021, 28);
      expect(error.message).toBe("Invalid day 30 for month 2");
      expect(error.errors).toEqual([
        "Month 2 has 28 days in year 2021, got day 30",
      ]);
      expect(error.context?.day).toBe(30);
      expect(error.context?.month).toBe(2);
      expect(error.context?.year).toBe(2021);
      expect(error.context?.maxDays).toBe(28);
    });
  });
});

// ============================================================================
// CONVERSION ERROR
// ============================================================================

describe("ConversionError", () => {
  describe("constructor", () => {
    it("should create conversion error", () => {
      const error = new ConversionError("Conversion failed");
      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(ConversionError);
      expect(error.name).toBe("ConversionError");
      expect(error.code).toBe("CONVERSION_ERROR");
      expect(error.message).toBe("Conversion failed");
    });

    it("should maintain proper prototype chain", () => {
      const error = new ConversionError("Test");
      expect(Object.getPrototypeOf(error)).toBe(ConversionError.prototype);
    });
  });

  describe("failed", () => {
    it("should create conversion failure error without reason", () => {
      const error = ConversionError.failed("GREGORIAN", "JULIAN");
      expect(error.message).toBe("Failed to convert from GREGORIAN to JULIAN");
      expect(error.context?.fromCalendar).toBe("GREGORIAN");
      expect(error.context?.toCalendar).toBe("JULIAN");
      expect(error.context?.reason).toBeUndefined();
    });

    it("should create conversion failure error with reason", () => {
      const error = ConversionError.failed(
        "HEBREW",
        "ISLAMIC",
        "Ambiguous date",
      );
      expect(error.message).toBe(
        "Failed to convert from HEBREW to ISLAMIC: Ambiguous date",
      );
      expect(error.context?.reason).toBe("Ambiguous date");
    });
  });

  describe("jdnConversion", () => {
    it("should create JDN conversion error for toJDN", () => {
      const error = ConversionError.jdnConversion("MAYAN", "toJDN");
      expect(error.message).toBe("Failed to convert to JDN in MAYAN calendar");
      expect(error.context?.calendar).toBe("MAYAN");
      expect(error.context?.direction).toBe("toJDN");
    });

    it("should create JDN conversion error for fromJDN with reason", () => {
      const error = ConversionError.jdnConversion(
        "PERSIAN",
        "fromJDN",
        "Invalid JDN value",
      );
      expect(error.message).toBe(
        "Failed to convert from JDN in PERSIAN calendar: Invalid JDN value",
      );
      expect(error.context?.direction).toBe("fromJDN");
      expect(error.context?.reason).toBe("Invalid JDN value");
    });
  });

  describe("ambiguous", () => {
    it("should create ambiguous conversion error", () => {
      const error = ConversionError.ambiguous(
        "ISLAMIC",
        "Multiple valid dates possible",
      );
      expect(error.message).toBe(
        "Ambiguous conversion in ISLAMIC calendar: Multiple valid dates possible",
      );
      expect(error.context?.calendar).toBe("ISLAMIC");
      expect(error.context?.reason).toBe("Multiple valid dates possible");
      expect(error.context?.isAmbiguous).toBe(true);
    });
  });
});

// ============================================================================
// ERA ERROR
// ============================================================================

describe("EraError", () => {
  describe("constructor", () => {
    it("should create era error", () => {
      const error = new EraError("Era issue");
      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(EraError);
      expect(error.name).toBe("EraError");
      expect(error.code).toBe("ERA_ERROR");
      expect(error.message).toBe("Era issue");
    });

    it("should maintain proper prototype chain", () => {
      const error = new EraError("Test");
      expect(Object.getPrototypeOf(error)).toBe(EraError.prototype);
    });
  });

  describe("unknownEra", () => {
    it("should create unknown era error", () => {
      const error = EraError.unknownEra("XYZ", "GREGORIAN", ["BC", "AD"]);
      expect(error.message).toBe('Unknown era "XYZ" for GREGORIAN calendar');
      expect(error.context?.era).toBe("XYZ");
      expect(error.context?.calendar).toBe("GREGORIAN");
      expect(error.context?.validEras).toEqual(["BC", "AD"]);
    });
  });

  describe("notApplicable", () => {
    it("should create not applicable error", () => {
      const error = EraError.notApplicable("Meiji", "GREGORIAN");
      expect(error.message).toBe(
        'Era "Meiji" is not applicable to GREGORIAN calendar',
      );
      expect(error.context?.era).toBe("Meiji");
      expect(error.context?.calendar).toBe("GREGORIAN");
    });
  });

  describe("invalidYear", () => {
    it("should create invalid year for era error", () => {
      const error = EraError.invalidYear(-5, "AD", "GREGORIAN");
      expect(error.message).toBe(
        'Year -5 is invalid for era "AD" in GREGORIAN calendar',
      );
      expect(error.context?.year).toBe(-5);
      expect(error.context?.era).toBe("AD");
      expect(error.context?.calendar).toBe("GREGORIAN");
    });
  });
});

// ============================================================================
// ARITHMETIC ERROR
// ============================================================================

describe("ArithmeticError", () => {
  describe("constructor", () => {
    it("should create arithmetic error", () => {
      const error = new ArithmeticError("Calculation failed");
      expect(error).toBeInstanceOf(CalendarError);
      expect(error).toBeInstanceOf(ArithmeticError);
      expect(error.name).toBe("ArithmeticError");
      expect(error.code).toBe("ARITHMETIC_ERROR");
      expect(error.message).toBe("Calculation failed");
    });

    it("should maintain proper prototype chain", () => {
      const error = new ArithmeticError("Test");
      expect(Object.getPrototypeOf(error)).toBe(ArithmeticError.prototype);
    });
  });

  describe("invalidDuration", () => {
    it("should create invalid duration error without context", () => {
      const error = ArithmeticError.invalidDuration("Negative value");
      expect(error.message).toBe("Invalid duration: Negative value");
      expect(error.context).toBeUndefined();
    });

    it("should create invalid duration error with context", () => {
      const error = ArithmeticError.invalidDuration("Mixed units", {
        units: ["days", "months"],
      });
      expect(error.message).toBe("Invalid duration: Mixed units");
      expect(error.context?.units).toEqual(["days", "months"]);
    });
  });

  describe("missingCalendarContext", () => {
    it("should create missing calendar context error", () => {
      const error = ArithmeticError.missingCalendarContext("addMonths");
      expect(error.message).toBe(
        "Calendar context required for addMonths with month/year units",
      );
      expect(error.context?.operation).toBe("addMonths");
    });
  });

  describe("overflow", () => {
    it("should create overflow error with number", () => {
      const error = ArithmeticError.overflow("addition", 999999999999);
      expect(error.message).toBe("Arithmetic overflow in addition");
      expect(error.context?.operation).toBe("addition");
      expect(error.context?.value).toBe("999999999999");
    });

    it("should create overflow error with bigint", () => {
      const error = ArithmeticError.overflow(
        "multiplication",
        9999999999999999999n,
      );
      expect(error.message).toBe("Arithmetic overflow in multiplication");
      expect(error.context?.value).toBe("9999999999999999999");
    });
  });

  describe("invalidReferenceDate", () => {
    it("should create invalid reference date error", () => {
      const error = ArithmeticError.invalidReferenceDate("Date is null");
      expect(error.message).toBe("Invalid reference date: Date is null");
      expect(error.context?.reason).toBe("Date is null");
    });
  });
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

describe("Type Guards", () => {
  describe("isCalendarError", () => {
    it("should return true for CalendarError", () => {
      const error = new CalendarError("Test");
      expect(isCalendarError(error)).toBe(true);
    });

    it("should return true for subclass errors", () => {
      expect(isCalendarError(new RegistryError("Test"))).toBe(true);
      expect(isCalendarError(new ValidationError("Test", []))).toBe(true);
      expect(isCalendarError(new ConversionError("Test"))).toBe(true);
      expect(isCalendarError(new EraError("Test"))).toBe(true);
      expect(isCalendarError(new ArithmeticError("Test"))).toBe(true);
    });

    it("should return false for regular Error", () => {
      expect(isCalendarError(new Error("Test"))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isCalendarError("error")).toBe(false);
      expect(isCalendarError(null)).toBe(false);
      expect(isCalendarError(undefined)).toBe(false);
      expect(isCalendarError({})).toBe(false);
    });
  });

  describe("isRegistryError", () => {
    it("should return true for RegistryError", () => {
      expect(isRegistryError(new RegistryError("Test"))).toBe(true);
    });

    it("should return false for other CalendarErrors", () => {
      expect(isRegistryError(new CalendarError("Test"))).toBe(false);
      expect(isRegistryError(new ValidationError("Test", []))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isRegistryError("error")).toBe(false);
      expect(isRegistryError(null)).toBe(false);
    });
  });

  describe("isValidationError", () => {
    it("should return true for ValidationError", () => {
      expect(isValidationError(new ValidationError("Test", []))).toBe(true);
    });

    it("should return false for other CalendarErrors", () => {
      expect(isValidationError(new CalendarError("Test"))).toBe(false);
      expect(isValidationError(new RegistryError("Test"))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isValidationError({})).toBe(false);
    });
  });

  describe("isConversionError", () => {
    it("should return true for ConversionError", () => {
      expect(isConversionError(new ConversionError("Test"))).toBe(true);
    });

    it("should return false for other CalendarErrors", () => {
      expect(isConversionError(new CalendarError("Test"))).toBe(false);
      expect(isConversionError(new EraError("Test"))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isConversionError(null)).toBe(false);
    });
  });

  describe("isEraError", () => {
    it("should return true for EraError", () => {
      expect(isEraError(new EraError("Test"))).toBe(true);
    });

    it("should return false for other CalendarErrors", () => {
      expect(isEraError(new CalendarError("Test"))).toBe(false);
      expect(isEraError(new ArithmeticError("Test"))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isEraError(undefined)).toBe(false);
    });
  });

  describe("isArithmeticError", () => {
    it("should return true for ArithmeticError", () => {
      expect(isArithmeticError(new ArithmeticError("Test"))).toBe(true);
    });

    it("should return false for other CalendarErrors", () => {
      expect(isArithmeticError(new CalendarError("Test"))).toBe(false);
      expect(isArithmeticError(new ConversionError("Test"))).toBe(false);
    });

    it("should return false for non-errors", () => {
      expect(isArithmeticError("error")).toBe(false);
    });
  });
});

// ============================================================================
// ERROR INHERITANCE AND INSTANCEOF
// ============================================================================

describe("Error Inheritance", () => {
  it("should maintain proper inheritance chain for all errors", () => {
    const calendarError = new CalendarError("Test");
    const registryError = new RegistryError("Test");
    const validationError = new ValidationError("Test", []);
    const conversionError = new ConversionError("Test");
    const eraError = new EraError("Test");
    const arithmeticError = new ArithmeticError("Test");

    // All should be instances of Error
    expect(calendarError).toBeInstanceOf(Error);
    expect(registryError).toBeInstanceOf(Error);
    expect(validationError).toBeInstanceOf(Error);
    expect(conversionError).toBeInstanceOf(Error);
    expect(eraError).toBeInstanceOf(Error);
    expect(arithmeticError).toBeInstanceOf(Error);

    // All subclasses should be instances of CalendarError
    expect(registryError).toBeInstanceOf(CalendarError);
    expect(validationError).toBeInstanceOf(CalendarError);
    expect(conversionError).toBeInstanceOf(CalendarError);
    expect(eraError).toBeInstanceOf(CalendarError);
    expect(arithmeticError).toBeInstanceOf(CalendarError);

    // Specific instanceof checks should only match exact type
    expect(registryError).toBeInstanceOf(RegistryError);
    expect(registryError).not.toBeInstanceOf(ValidationError);
    expect(validationError).toBeInstanceOf(ValidationError);
    expect(validationError).not.toBeInstanceOf(ConversionError);
  });
});
