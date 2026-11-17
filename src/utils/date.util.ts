import { BadRequestError } from "../shared/error/globalError.js";

/**
 * Parses a date value from either:
 * - Unix timestamp in milliseconds (e.g. 1763337600000 or "1763337600000")
 * - Unix timestamp in seconds (e.g. 1763337600 or "1763337600")
 * - ISO 8601 date string (e.g. "2026-11-20T10:00:00.000Z" or "2026-11-20")
 */
export function parseDateInput(
  value: unknown,
  fieldName: string = "date",
): Date {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      throw new BadRequestError(`Invalid ${fieldName} value`);
    }
    return value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new BadRequestError(`Invalid ${fieldName} value`);
    }
    const ms = Math.abs(value) < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestError(`Invalid ${fieldName} value`);
    }
    return date;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      throw new BadRequestError(`${fieldName} is required`);
    }

    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      const numeric = Number(trimmed);
      if (!Number.isFinite(numeric)) {
        throw new BadRequestError(`Invalid ${fieldName} value`);
      }
      const ms = Math.abs(numeric) < 1e12 ? numeric * 1000 : numeric;
      const date = new Date(ms);
      if (Number.isNaN(date.getTime())) {
        throw new BadRequestError(`Invalid ${fieldName} value`);
      }
      return date;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestError(`Invalid ${fieldName} value`);
    }
    return parsed;
  }

  throw new BadRequestError(`Invalid ${fieldName} value`);
}

export interface UtcDayBounds {
  dayStart: Date;
  nextDayStart: Date;
  isoDate: string;
}

/**
 * Returns the inclusive UTC start of day and exclusive UTC start of the next day.
 */
export function getUtcDayBounds(date: Date): UtcDayBounds {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  const dayStart = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  const nextDayStart = new Date(Date.UTC(year, month, day + 1, 0, 0, 0, 0));

  return {
    dayStart,
    nextDayStart,
    isoDate: dayStart.toISOString().slice(0, 10),
  };
}
