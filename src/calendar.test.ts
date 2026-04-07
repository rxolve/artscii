import { describe, it, expect } from 'vitest';
import { renderCalendar } from './calendar.js';

describe('renderCalendar', () => {
  it('renders a basic month', () => {
    const result = renderCalendar(2025, 1);
    expect(result).toContain('January 2025');
    expect(result).toContain('Su Mo Tu We Th Fr Sa');
    expect(result).toContain('31');
  });

  it('renders February correctly', () => {
    const result = renderCalendar(2025, 2);
    expect(result).toContain('February 2025');
    expect(result).toContain('28');
    expect(result).not.toContain('29');
  });

  it('handles leap year February', () => {
    const result = renderCalendar(2024, 2);
    expect(result).toContain('29');
  });

  it('highlights single-digit dates with asterisk', () => {
    const result = renderCalendar(2025, 1, { highlight: [5] });
    expect(result).toContain('*5');
  });

  it('annotates double-digit highlights', () => {
    const result = renderCalendar(2025, 1, { highlight: [15] });
    expect(result).toContain('* 15');
  });

  it('supports Monday as first day of week', () => {
    const result = renderCalendar(2025, 1, { firstDayOfWeek: 1 });
    expect(result).toContain('Mo Tu We Th Fr Sa Su');
  });

  it('renders December correctly', () => {
    const result = renderCalendar(2025, 12);
    expect(result).toContain('December 2025');
    expect(result).toContain('31');
  });

  it('has correct number of weeks for April 2025', () => {
    const result = renderCalendar(2025, 4);
    const lines = result.split('\n');
    // title + header + 5 weeks = 7 lines
    expect(lines.length).toBeGreaterThanOrEqual(7);
  });

  it('handles multiple highlights', () => {
    const result = renderCalendar(2025, 3, { highlight: [1, 15, 25] });
    expect(result).toContain('*1');
    expect(result).toContain('* 15');
    expect(result).toContain('* 25');
  });
});
