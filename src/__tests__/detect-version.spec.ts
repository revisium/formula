import { describe, it, expect } from '@jest/globals';
import { detectVersion } from '../detect-version';

describe('detectVersion', () => {
  describe('v1.0 expressions', () => {
    it('should detect simple field reference as v1.0', () => {
      const result = detectVersion('baseDamage * attackSpeed');
      expect(result.minVersion).toBe('1.0');
      expect(result.features).toEqual([]);
    });

    it('should detect math operations as v1.0', () => {
      const result = detectVersion('price * 1.2 + tax');
      expect(result.minVersion).toBe('1.0');
    });

    it('should detect function calls as v1.0', () => {
      const result = detectVersion('round(value, 2)');
      expect(result.minVersion).toBe('1.0');
    });

    it('should detect conditional as v1.0', () => {
      const result = detectVersion('if(x > 0, x, 0)');
      expect(result.minVersion).toBe('1.0');
    });
  });

  describe('v1.1 features', () => {
    it('should detect nested path', () => {
      const result = detectVersion('stats.damage * multiplier');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('nested_path');
    });

    it('should detect array index', () => {
      const result = detectVersion('items[0].price');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_index');
    });

    it('should detect negative array index', () => {
      const result = detectVersion('items[-1].name');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_index');
    });

    it('should detect array wildcard', () => {
      const result = detectVersion('sum(items[*].price)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_wildcard');
    });

    it('should detect relative path', () => {
      const result = detectVersion('../quantity * price');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('relative_path');
    });

    it('should detect root path', () => {
      const result = detectVersion('price * /taxRate');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('root_path');
    });

    it('should detect context tokens @prev', () => {
      const result = detectVersion('if(#first, value, @prev.runningTotal + value)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('context_token');
    });

    it('should detect array functions', () => {
      const result = detectVersion('sum(prices)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_function');
    });
  });

  describe('dependency extraction', () => {
    it('should extract simple dependencies', () => {
      const result = detectVersion('baseDamage * attackSpeed');
      expect(result.dependencies).toContain('baseDamage');
      expect(result.dependencies).toContain('attackSpeed');
    });

    it('should extract nested path dependencies', () => {
      const result = detectVersion('stats.damage');
      expect(result.dependencies).toContain('stats.damage');
    });

    it('should not include keywords as dependencies', () => {
      const result = detectVersion('if(true, value, 0)');
      expect(result.dependencies).not.toContain('if');
      expect(result.dependencies).not.toContain('true');
      expect(result.dependencies).toContain('value');
    });

    it('should not include function names as dependencies', () => {
      const result = detectVersion('round(price, 2)');
      expect(result.dependencies).not.toContain('round');
      expect(result.dependencies).toContain('price');
    });

    it('should extract root path dependencies', () => {
      const result = detectVersion('price * /taxRate');
      expect(result.dependencies).toContain('/taxRate');
      expect(result.dependencies).toContain('price');
    });

    it('should extract relative path dependencies', () => {
      const result = detectVersion('../quantity * price');
      expect(result.dependencies).toContain('../quantity');
      expect(result.dependencies).toContain('price');
    });

    it('should not detect division as root path', () => {
      const result = detectVersion('a / b');
      expect(result.features).not.toContain('root_path');
      expect(result.minVersion).toBe('1.0');
    });
  });

  describe('multiple features', () => {
    it('should detect multiple v1.1 features', () => {
      const result = detectVersion('sum(items[*].qty * items[*].price)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('array_wildcard');
      expect(result.features).toContain('array_function');
      // Note: items[*].qty is detected as array access, not nested_path
      // nested_path requires object.property pattern without array notation
    });

    it('should detect nested_path with array features', () => {
      const result = detectVersion('sum(order.items[*].price)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('nested_path');
      expect(result.features).toContain('array_wildcard');
      expect(result.features).toContain('array_function');
    });

    it('should detect complex Excel-style formula', () => {
      const result = detectVersion('if(#first, value, @prev.runningTotal + value)');
      expect(result.minVersion).toBe('1.1');
      expect(result.features).toContain('context_token');
    });
  });
});
