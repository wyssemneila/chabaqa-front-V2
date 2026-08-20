jest.mock('next/headers', () => ({
  cookies: jest.fn().mockResolvedValue({
    delete: jest.fn(),
    set: jest.fn(),
  }),
}));

import { loginAction } from '@/app/(auth)/signin/actions';

describe('loginAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a friendly message for 429 responses', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: {
        get: jest.fn().mockReturnValue(null),
      },
      clone: () => ({
        json: jest.fn().mockResolvedValue({
          message: 'Too many attempts. Please wait a moment before trying again.',
        }),
      }),
    }) as any;

    await expect(
      loginAction({ email: 'user@example.com', password: 'secret' }),
    ).resolves.toEqual({
      success: false,
      error: 'Too many attempts. Please wait a moment before trying again.',
    });
  });
});
