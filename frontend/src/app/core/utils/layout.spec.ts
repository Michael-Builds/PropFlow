import { isOddLastItem, oddLastGridClass } from './layout';

describe('layout', () => {
  it('detects the leftover card in an odd-length list', () => {
    expect(isOddLastItem(2, 3)).toBe(true);
    expect(isOddLastItem(1, 3)).toBe(false);
    expect(isOddLastItem(1, 2)).toBe(false);
    expect(isOddLastItem(0, 1)).toBe(true);
  });

  it('returns full-width span classes for the odd last card', () => {
    expect(oddLastGridClass(0, 3)).toBe('');
    expect(oddLastGridClass(1, 3)).toBe('');
    expect(oddLastGridClass(2, 3)).toBe('col-span-2 lg:col-span-1');
    expect(oddLastGridClass(2, 3, 'md')).toBe('col-span-2 md:col-span-1');
    expect(oddLastGridClass(1, 2)).toBe('');
    expect(oddLastGridClass(0, 1)).toBe('col-span-2 lg:col-span-1');
  });
});
