import { BadRequestException } from '@nestjs/common';
import { parsePagination, parsePositiveInteger } from '@/shared/utils/pagination.util';

describe('pagination parsing', () => {
  it('parses positive integer strings and applies defaults', () => {
    expect(parsePagination('2', '25')).toEqual({ page: 2, limit: 25 });
    expect(parsePagination(undefined, undefined)).toEqual({ page: 1, limit: 10 });
  });

  it.each(['0', '-1', '1.5', 'abc', 'Infinity'])(
    'rejects invalid page %s',
    (page) => expect(() => parsePagination(page, 10)).toThrow(BadRequestException),
  );

  it('rejects unbounded limits', () => {
    expect(() => parsePagination(1, 101)).toThrow(BadRequestException);
  });

  it('supports bounded non-pagination limits', () => {
    expect(parsePositiveInteger('50', 20, 'limit', 100)).toBe(50);
    expect(() => parsePositiveInteger('101', 20, 'limit', 100)).toThrow(BadRequestException);
  });
});
