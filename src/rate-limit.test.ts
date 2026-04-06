import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from './rate-limit.js';

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter(3);
    expect(limiter('ip1')).toBe(true);
    expect(limiter('ip1')).toBe(true);
    expect(limiter('ip1')).toBe(true);
  });

  it('blocks requests over the limit', () => {
    const limiter = createRateLimiter(2);
    expect(limiter('ip1')).toBe(true);
    expect(limiter('ip1')).toBe(true);
    expect(limiter('ip1')).toBe(false);
  });

  it('tracks keys independently', () => {
    const limiter = createRateLimiter(1);
    expect(limiter('a')).toBe(true);
    expect(limiter('b')).toBe(true);
    expect(limiter('a')).toBe(false);
    expect(limiter('b')).toBe(false);
  });

  it('resets after window expires', () => {
    vi.useFakeTimers();
    const limiter = createRateLimiter(1, 1000);
    expect(limiter('ip')).toBe(true);
    expect(limiter('ip')).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(limiter('ip')).toBe(true);

    vi.useRealTimers();
  });
});
