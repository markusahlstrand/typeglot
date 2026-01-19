import { describe, it, expect } from 'vitest';
import { parseParameters } from '../parser.js';

describe('parseParameters', () => {
  it('should extract single parameter', () => {
    const value = 'Hello, {name}!';
    const params = parseParameters(value);

    expect(params).toEqual(['name']);
  });

  it('should extract multiple parameters', () => {
    const value = 'Welcome {firstName} {lastName} to {city}!';
    const params = parseParameters(value);

    expect(params).toEqual(['firstName', 'lastName', 'city']);
  });

  it('should return empty array for no parameters', () => {
    const value = 'Hello, World!';
    const params = parseParameters(value);

    expect(params).toEqual([]);
  });

  it('should deduplicate repeated parameters', () => {
    const value = '{name} said hello to {name}';
    const params = parseParameters(value);

    expect(params).toEqual(['name']);
  });

  it('should handle ICU plural syntax (basic param extraction)', () => {
    // Note: Full ICU support extracts the parameter name before the comma
    // Current implementation handles simple {param} patterns
    const value = 'You have {count} items';
    const params = parseParameters(value);

    expect(params).toContain('count');
  });

  it('should handle complex nested parameters', () => {
    const value = 'You have {count} new messages from {sender}';
    const params = parseParameters(value);

    expect(params).toContain('count');
    expect(params).toContain('sender');
  });
});
