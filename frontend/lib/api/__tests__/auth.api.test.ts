import { authApi, AuthApiError } from '@/lib/api/auth.api';
import { apiClient } from '@/lib/api/client';

jest.mock('@/lib/api/client', () => ({
  apiClient: {
    post: jest.fn(),
  },
}));

describe('authApi rate limit handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('maps login 429 responses to a user-friendly error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      statusCode: 429,
      message: 'Too many attempts. Please wait a moment before trying again.',
      data: {},
    });

    await expect(
      authApi.login({ email: 'user@example.com', password: 'secret' }),
    ).rejects.toEqual(
      new AuthApiError(429, 'Too many attempts. Please wait a moment before trying again.', {}),
    );
  });

  it('maps forgot-password 429 responses to a user-friendly error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      statusCode: 429,
      message: 'Too many attempts. Please wait a moment before trying again.',
      data: {},
    });

    await expect(
      authApi.forgotPassword({ email: 'user@example.com' }),
    ).rejects.toEqual(
      new AuthApiError(429, 'Too many attempts. Please wait a moment before trying again.', {}),
    );
  });

  it('maps resend-otp 429 responses to a user-friendly error', async () => {
    (apiClient.post as jest.Mock).mockRejectedValue({
      statusCode: 429,
      message: 'Too many attempts. Please wait a moment before trying again.',
      data: {},
    });

    await expect(
      authApi.resendRegisterOtp('user@example.com'),
    ).rejects.toEqual(
      new AuthApiError(429, 'Too many attempts. Please wait a moment before trying again.', {}),
    );
  });

  it('normalizes wrapped refresh token responses', async () => {
    (apiClient.post as jest.Mock).mockResolvedValue({
      success: true,
      data: {
        accessToken: 'fresh-access-token',
        expires_in: 7200,
      },
    });

    await expect(authApi.refreshToken('refresh-token')).resolves.toEqual({
      access_token: 'fresh-access-token',
      accessToken: 'fresh-access-token',
      expires_in: 7200,
      user: undefined,
    });
  });
});
