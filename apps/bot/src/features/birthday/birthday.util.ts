import { DateTime } from 'luxon';

export function isValidDate(day: number, month: number, year?: number | null): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;

  // Year validation if provided
  const currentYear = new Date().getFullYear();
  if (year !== undefined && year !== null) {
    if (year > currentYear || year < currentYear - 120) {
      return false;
    }
  }

  // Use a leap year to test 29th Feb if no year is provided
  const testYear = year ?? 2024; 
  
  const dt = DateTime.fromObject({ year: testYear, month, day });
  return dt.isValid && dt.month === month && dt.day === day;
}
