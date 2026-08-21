import { BadRequestException } from '@nestjs/common';

export const MAX_PAGE_SIZE = 100;

export function parsePositiveInteger(
  value: unknown,
  fallback: number,
  field: string,
  maximum?: number,
): number {
  if (value === undefined || value === null || value === '') return fallback;

  const normalized = typeof value === 'string' ? value.trim() : value;
  const parsed = typeof normalized === 'number' ? normalized : Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 1 || (maximum !== undefined && parsed > maximum)) {
    const range = maximum ? ` between 1 and ${maximum}` : ' greater than or equal to 1';
    throw new BadRequestException(`${field} must be an integer${range}`);
  }

  return parsed;
}

export function parsePagination(page: unknown, limit: unknown, defaultLimit = 10) {
  return {
    page: parsePositiveInteger(page, 1, 'page'),
    limit: parsePositiveInteger(limit, defaultLimit, 'limit', MAX_PAGE_SIZE),
  };
}
