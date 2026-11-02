import { describe, it, expect } from '@jest/globals';
import { BoundedMemo } from '../ohm/core/bounded-memo';

function memoOfLengths(capacity: number) {
  const computed: string[] = [];
  const memo = new BoundedMemo<string, number>(capacity, (key) => {
    computed.push(key);
    return key.length;
  });
  return { memo, computed };
}

describe('BoundedMemo', () => {
  it('computes a value once per key', () => {
    const { memo, computed } = memoOfLengths(2);

    expect(memo.get('abc')).toBe(3);
    expect(memo.get('abc')).toBe(3);
    expect(computed).toEqual(['abc']);
  });

  it('evicts the first computed key when a key beyond the capacity is computed', () => {
    const { memo, computed } = memoOfLengths(2);

    memo.get('a');
    memo.get('bb');
    memo.get('ccc');
    memo.get('bb');
    memo.get('a');

    expect(computed).toEqual(['a', 'bb', 'ccc', 'a']);
  });

  it('does not extend the life of a key that is read (first in, first out)', () => {
    const { memo, computed } = memoOfLengths(2);

    memo.get('a');
    memo.get('bb');
    memo.get('a');
    memo.get('ccc');
    memo.get('a');

    expect(computed).toEqual(['a', 'bb', 'ccc', 'a']);
  });
});
