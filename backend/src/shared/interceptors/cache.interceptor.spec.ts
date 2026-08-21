import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of } from 'rxjs';
import { HttpCacheInterceptor } from './cache.interceptor';

const createContext = (url: string): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => ({
      method: 'GET',
      url,
      user: { _id: 'user-1' },
      headers: {},
    }),
    getResponse: () => ({ statusCode: 200 }),
  }),
  getHandler: jest.fn(),
  getClass: jest.fn(),
} as any);

describe('HttpCacheInterceptor dynamic course access endpoints', () => {
  const createInterceptor = () => {
    const cacheService = {
      get: jest.fn(),
      set: jest.fn(),
    };
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    return {
      cacheService,
      interceptor: new HttpCacheInterceptor(cacheService as any, reflector),
    };
  };

  it.each([
    '/api/cours/course-1/course-session',
    '/api/cours/course-1/course-session?currentChapterId=chapter-1',
    '/api/cours/course-1/unlocked-chapters',
    '/api/cours/course-1/chapters/chapter-2/access',
    '/api/cours/course-1/chapitres/chapter-2/access',
    '/api/cours/course-1/track/progress',
  ])('bypasses cache for %s', async (url) => {
    const { cacheService, interceptor } = createInterceptor();
    const next = { handle: jest.fn(() => of({ ok: true })) };

    const result$ = await interceptor.intercept(createContext(url), next as any);
    await expect(lastValueFrom(result$)).resolves.toEqual({ ok: true });

    expect(next.handle).toHaveBeenCalledTimes(1);
    expect(cacheService.get).not.toHaveBeenCalled();
    expect(cacheService.set).not.toHaveBeenCalled();
  });

  it('still caches stable course detail responses', async () => {
    const { cacheService, interceptor } = createInterceptor();
    cacheService.get.mockResolvedValue({ cached: true });
    const next = { handle: jest.fn(() => of({ ok: true })) };

    const result$ = await interceptor.intercept(createContext('/api/cours/course-1'), next as any);
    await expect(lastValueFrom(result$)).resolves.toEqual({ cached: true });

    expect(cacheService.get).toHaveBeenCalledTimes(1);
    expect(next.handle).not.toHaveBeenCalled();
  });
});
