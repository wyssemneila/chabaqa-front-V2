import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Get, Req, Res, UnauthorizedException, Param, Delete } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService, UserAuthPayload, UserRefreshPayload } from '@/domains/auth/auth.service';
import { LoginDto } from '@/domains/auth/dto/login.dto';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { RegisterDto } from '@/domains/auth/dto/register.dto';
import { ResetPasswordDto } from '@/domains/auth/dto/reset-password.dto';
import { VerifyEmailOtpDto } from '@/domains/auth/dto/verify-email-otp.dto';
import { ResendEmailOtpDto } from '@/domains/auth/dto/resend-email-otp.dto';
import { GoogleAuthGuard } from '@/domains/auth/guards/google-auth.guard';
import { CookieUtil } from '@/shared/utils/cookie.util';
import { PublicThrottlerGuard } from '@/shared/guards/public-throttler.guard';
import { RefreshTokenDto } from '@/domains/auth/dto/refresh-token.dto';
import { Verify2FADto } from '@/domains/auth/dto/verify-2fa.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  private getFrontendBaseUrl(): string {
    const baseUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8080';
    return baseUrl.replace(/\/+$/, '');
  }

  private normalizeRedirectPath(rawPath?: string): string | null {
    if (!rawPath) return null;

    let path = rawPath;
    try {
      path = decodeURIComponent(rawPath);
    } catch {
      path = rawPath;
    }

    if (!path.startsWith('/') || path.startsWith('//')) {
      return null;
    }

    return path;
  }

  private defaultRedirectForRole(role?: string): string {
    const normalizedRole = role?.toLowerCase();
    if (normalizedRole === 'creator') return '/creator/dashboard';
    if (normalizedRole === 'admin') return '/admin';
    return '/explore';
  }

  private isPrefetchRequest(req: any): boolean {
    const query = req?.query || {};
    const headers = req?.headers || {};
    return Boolean(
      query._rsc ||
      headers.purpose === 'prefetch' ||
      headers['sec-purpose'] === 'prefetch' ||
      headers['next-router-prefetch'] ||
      headers['next-url'],
    );
  }

  @Post('login')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Login',
    description: 'Authenticate user credentials and return access token.',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful.',
    schema: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        user: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserAuthPayload> {
    const result = await this.authService.login(loginDto, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
    });
    if (result?.requires2FA) {
      return result;
    }
    if (result?.accessToken && result?.refreshToken) {
      CookieUtil.setTokenCookies(res as any, result.accessToken, result.refreshToken, !!result.rememberMe);
    }
    return result;
  }

  @Post('verify-2fa')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } } as any)
  @HttpCode(HttpStatus.OK)
  async verify2FA(
    @Body() dto: Verify2FADto,
    @Req() req: any,
    @Res({ passthrough: true }) res: Response,
  ): Promise<UserAuthPayload> {
    const result = await this.authService.verifyUser2FA(dto, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.headers['x-forwarded-for'],
    });
    if (result?.accessToken && result?.refreshToken) {
      CookieUtil.setTokenCookies(res as any, result.accessToken, result.refreshToken, !!result.rememberMe);
    }
    return result;
  }

  @Post('resend-2fa')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 5 } } as any)
  @HttpCode(HttpStatus.OK)
  async resend2FA(@Body() body: { email: string }) {
    return this.authService.resendUser2FACode(body.email);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async enable2FA(@Req() req: any, @Body() body: { currentPassword?: string }) {
    return this.authService.setTwoFactorEnabled(req.user.userId || req.user.sub, true, body.currentPassword);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async disable2FA(@Req() req: any, @Body() body: { currentPassword?: string }) {
    return this.authService.setTwoFactorEnabled(req.user.userId || req.user.sub, false, body.currentPassword);
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async listSessions(@Req() req: any) {
    return this.authService.listAuthSessions(req.user.userId || req.user.sub);
  }

  @Post('sessions/:jti/revoke')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(@Req() req: any, @Param('jti') jti: string) {
    await this.authService.revokeAuthSession(req.user.userId || req.user.sub, jti);
    return { message: 'Session revoked' };
  }

  @Post('refresh')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 20 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh user access token',
    description: 'Refresh a user access token using a refresh token from the request body or cookies.',
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  async refreshToken(
    @Body() body: { refreshToken?: string; refresh_token?: string } = {},
    @Req() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    success: true;
    data: UserRefreshPayload;
    access_token: string;
    accessToken: string;
    refresh_token: string;
    refreshToken: string;
    expires_in: number;
    rememberMe: boolean;
    user: any;
  }> {
    const refreshToken = (
      body?.refreshToken
      || body?.refresh_token
      || req.cookies?.refreshToken
      || req.cookies?.refresh_token
      || ''
    ).trim();

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token manquant');
    }

    const result = await this.authService.refreshToken(refreshToken);
    if (result?.accessToken && result?.refreshToken) {
      CookieUtil.setTokenCookies(res as any, result.accessToken, result.refreshToken, !!result.rememberMe);
    }

    return {
      success: true,
      data: result,
      access_token: result.access_token,
      accessToken: result.accessToken,
      refresh_token: result.refresh_token,
      refreshToken: result.refreshToken,
      expires_in: result.expires_in,
      rememberMe: result.rememberMe,
      user: result.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({
    summary: 'Get Current User Profile',
    description: 'Get current authenticated user profile information.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Req() req) {
    try {
      // The user object is attached to the request by the JwtAuthGuard
      if (!req.user || !req.user._id) {
        throw new UnauthorizedException('Token non valide ou expiré');
      }

      const user = await this.authService.getUserById(req.user._id);

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      return {
        success: true,
        data: user,
        message: 'Token valide',
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erreur lors de la récupération du profil');
    }
  }

  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Issue CSRF Token',
    description: 'Sets a browser-readable CSRF cookie for cookie-authenticated unsafe requests.',
  })
  async issueCsrf(@Res({ passthrough: true }) res: Response) {
    const csrfToken = CookieUtil.setCsrfTokenCookie(res as any);
    return {
      success: true,
      data: { csrfToken },
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User Logout',
    description: 'Logout user (client should remove token).',
  })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() req, @Res({ passthrough: true }) res: Response) {
    const accessToken = (
      req.headers?.authorization?.replace('Bearer ', '')
      || req.cookies?.accessToken
      || req.cookies?.access_token
      || ''
    ).trim();
    const refreshToken = (
      req.cookies?.refreshToken
      || req.cookies?.refresh_token
      || ''
    ).trim();

    await this.authService.logout(accessToken, refreshToken);

    CookieUtil.clearTokenCookies(res as any);

    return {
      success: true,
      message: 'Déconnexion réussie.',
    };
  }

  @Post('revoke-all-tokens')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke All Tokens',
    description: 'Revoke all user tokens (Placeholder for stateless JWT).',
  })
  @ApiResponse({ status: 200, description: 'Tokens revoked successfully' })
  async revokeAllTokens(@Req() req, @Res({ passthrough: true }) res: Response) {
    const accessToken = (
      req.headers?.authorization?.replace('Bearer ', '')
      || req.cookies?.accessToken
      || req.cookies?.access_token
      || ''
    ).trim();
    const refreshToken = (
      req.cookies?.refreshToken
      || req.cookies?.refresh_token
      || ''
    ).trim();

    try {
      if (accessToken) {
        await this.authService.revokeAllTokensFromAccessToken(accessToken);
      } else if (refreshToken) {
        await this.authService.revokeAllTokensFromRefreshToken(refreshToken);
      }
    } catch {
      // Keep endpoint idempotent.
    }
    CookieUtil.clearTokenCookies(res as any);

    return {
      success: true,
      message: 'Tous les tokens ont été révoqués.',
    };
  }

  @Get('signout')
  @ApiOperation({
    summary: 'Sign Out (browser redirect)',
    description:
      'Revokes auth tokens, clears all auth cookies, and redirects the browser to the signin page. Intended for window.location.href navigation from the frontend.',
  })
  @ApiResponse({ status: 302, description: 'Redirected to signin page after clearing cookies' })
  async signout(@Req() req, @Res() res: Response) {
    if (this.isPrefetchRequest(req)) {
      return res.status(HttpStatus.NO_CONTENT).send();
    }

    const accessToken = (
      req.headers?.authorization?.replace('Bearer ', '')
      || req.cookies?.accessToken
      || req.cookies?.access_token
      || ''
    ).trim();
    const refreshToken = (
      req.cookies?.refreshToken
      || req.cookies?.refresh_token
      || ''
    ).trim();

    // Revoke tokens — idempotent, errors swallowed intentionally
    await this.authService.logout(accessToken, refreshToken);

    // Clear all auth cookies
    CookieUtil.clearTokenCookies(res as any);

    // Redirect browser to the frontend signin page (locale-aware)
    const frontendBaseUrl = this.getFrontendBaseUrl();
    const localeCookie: string = (req.cookies?.NEXT_LOCALE || '').toLowerCase();
    const locale = (localeCookie === 'ar' || localeCookie === 'en') ? localeCookie : 'en';
    return res.redirect(`${frontendBaseUrl}/${locale}/signin`);
  }

  @Post('forgot-password')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 3 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Forgot Password', description: 'Send password reset code to user email.' })
  @ApiBody({ schema: { type: 'object', properties: { email: { type: 'string' } } } })
  async forgotPassword(@Body('email') email: string) {
    return this.authService.forgotPassword(email);
  }

  @Post('reset-password')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 3 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset Password', description: 'Reset password using code sent to email.' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.email, body.verificationCode, body.newPassword);
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Start Google OAuth 2.0 login' })
  async googleAuth() {
    // Redirects to Google for authentication
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiOperation({ summary: 'Google OAuth 2.0 callback' })
  async googleAuthCallback(@Req() req, @Res() res: Response) {
    try {
      const result = await (this.authService as any).loginWithGoogle(req.user);
      CookieUtil.setTokenCookies(res as any, result.accessToken, result.refreshToken, !!result.rememberMe);
      const frontendBaseUrl = this.getFrontendBaseUrl();

      const stateParam = Array.isArray(req.query?.state) ? req.query.state[0] : req.query?.state;
      const requestedRedirect = this.normalizeRedirectPath(stateParam);
      const redirectPath = requestedRedirect && requestedRedirect !== '/signin'
        ? requestedRedirect
        : this.defaultRedirectForRole(result?.user?.role);

      const userPayload = Buffer.from(JSON.stringify(result.user || {}), 'utf8').toString('base64url');
      const hashParams = new URLSearchParams({
        access_token: result.access_token,
        user: userPayload,
        redirect: redirectPath,
      });

      return res.redirect(`${frontendBaseUrl}/signin#${hashParams.toString()}`);
    } catch (error) {
      const frontendBaseUrl = this.getFrontendBaseUrl();
      return res.redirect(`${frontendBaseUrl}/signin?message=${encodeURIComponent('Google sign-in failed. Please try again.')}`);
    }
  }

  @Post('google/mobile')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mobile Google Sign-In' })
  @ApiBody({ schema: { type: 'object', properties: { idToken: { type: 'string' } } } })
  async googleMobileAuth(@Body() body: { idToken: string }) {
    return this.authService.loginWithGoogleMobile(body.idToken);
  }

  @Post('register')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 3 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Registration (Send OTP)' })
  @ApiBody({ type: RegisterDto })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('register-creator')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 3 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Creator Registration (Send OTP)' })
  @ApiBody({ type: RegisterDto })
  async registerCreator(@Body() registerDto: RegisterDto) {
    return this.authService.registerCreator(registerDto);
  }

  @Post('register/verify-otp')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 5 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify Registration OTP and Create Account' })
  @ApiBody({ type: VerifyEmailOtpDto })
  async verifyRegistrationOtp(@Body() body: VerifyEmailOtpDto) {
    return this.authService.verifyRegistrationOtp(body.email, body.verificationCode);
  }

  @Post('register/resend-otp')
  @UseGuards(PublicThrottlerGuard)
  @Throttle({ default: { ttl: 900000, limit: 3 } } as any)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend Registration OTP' })
  @ApiBody({ type: ResendEmailOtpDto })
  async resendRegistrationOtp(@Body() body: ResendEmailOtpDto) {
    return this.authService.resendRegistrationOtp(body.email);
  }
}
