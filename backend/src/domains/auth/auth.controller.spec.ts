import { AuthController } from '@/domains/auth/auth.controller';
import { CookieUtil } from '@/shared/utils/cookie.util';

describe('AuthController token compatibility', () => {
  const authServiceMock = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  const buildResponse = () => ({
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sets both auth cookies on login when access and refresh tokens are returned', async () => {
    const controller = new AuthController(authServiceMock as any);
    const response = buildResponse();
    authServiceMock.login.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      rememberMe: false,
      user: { _id: 'user-1', role: 'user' },
    });

    const result = await controller.login(
      { email: 'user@example.com', password: 'secret' } as any,
      response as any,
    );

    expect(result.accessToken).toBe('access-token');
    expect(response.cookie).toHaveBeenCalledTimes(3);
    expect(response.cookie).toHaveBeenCalledWith(
      CookieUtil.COOKIE_NAMES.ACCESS_TOKEN,
      'access-token',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      CookieUtil.COOKIE_NAMES.REFRESH_TOKEN,
      'refresh-token',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      CookieUtil.CSRF_COOKIE_NAME,
      expect.any(String),
      expect.any(Object),
    );
  });

  it('refreshes using legacy cookies and returns wrapped compatibility fields', async () => {
    const controller = new AuthController(authServiceMock as any);
    const response = buildResponse();
    authServiceMock.refreshToken.mockResolvedValue({
      accessToken: 'new-access-token',
      access_token: 'new-access-token',
      expires_in: 7200,
      user: { _id: 'user-1', role: 'user' },
    });

    const result = await controller.refreshToken(
      {},
      { cookies: { refresh_token: 'legacy-refresh-token' } } as any,
      response as any,
    );

    expect(authServiceMock.refreshToken).toHaveBeenCalledWith('legacy-refresh-token');
    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(response.cookie).toHaveBeenCalledWith(
      CookieUtil.COOKIE_NAMES.ACCESS_TOKEN,
      'new-access-token',
      expect.any(Object),
    );
    expect(response.cookie).toHaveBeenCalledWith(
      CookieUtil.CSRF_COOKIE_NAME,
      expect.any(String),
      expect.any(Object),
    );
    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        access_token: 'new-access-token',
        accessToken: 'new-access-token',
      }),
    );
  });

  it('passes access and refresh tokens to logout and clears cookies', async () => {
    const controller = new AuthController(authServiceMock as any);
    const response = buildResponse();
    authServiceMock.logout.mockResolvedValue({ message: 'Déconnexion réussie.', revokedTokens: 2 });

    const result = await controller.logout(
      {
        headers: { authorization: 'Bearer access-token' },
        cookies: { refreshToken: 'refresh-token' },
      } as any,
      response as any,
    );

    expect(authServiceMock.logout).toHaveBeenCalledWith('access-token', 'refresh-token');
    expect(response.clearCookie).toHaveBeenCalled();
    expect(result).toEqual({
      success: true,
      message: 'Déconnexion réussie.',
    });
  });

  it('does not revoke tokens when signout is requested by Next prefetch', async () => {
    const controller = new AuthController(authServiceMock as any);
    const response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
      redirect: jest.fn(),
    };

    await controller.signout(
      {
        query: { _rsc: 'prefetch-id' },
        headers: {},
        cookies: { accessToken: 'access-token', refreshToken: 'refresh-token' },
      } as any,
      response as any,
    );

    expect(authServiceMock.logout).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(204);
    expect(response.send).toHaveBeenCalled();
    expect(response.redirect).not.toHaveBeenCalled();
  });
});
