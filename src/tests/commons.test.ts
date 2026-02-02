import { describe, it, expect } from 'vitest';
import { isEmpty } from '../helpers/commons';

describe('isEmpty', () => {
  it('should return true for null or undefined', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('should return true for empty string', () => {
    expect(isEmpty('')).toBe(true);
  });

  it('should return true for empty object', () => {
    expect(isEmpty({})).toBe(true);
  });

  it('should return false for non-empty string', () => {
    expect(isEmpty('hello')).toBe(false);
  });

  it('should return false for non-empty object', () => {
    expect(isEmpty({ a: 1 })).toBe(false);
  });
});
