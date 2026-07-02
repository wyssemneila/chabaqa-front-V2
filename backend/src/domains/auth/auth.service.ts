import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument, AuthProvider } from '@/infrastructure/database/schemas/auth/user.schema';
import { LoginDto } from '@/domains/auth/dto/login.dto';
import { LoginResponseDto } from '@/domains/auth/dto/login-response.dto';
import { EmailService } from '@/shared/services';
import { VerificationCode, VerificationCodeDocument } from '@/infrastructure/database/schemas/auth/verification-code.schema';
import { UserLoginActivityService } from '@/domains/auth/user-login-activity/user-login-activity.service';
import { RegisterDto } from '@/domains/auth/dto/register.dto';
import { UploadService } from '@/domains/shared/upload/upload.service';
import { generateUniqueUsername } from '@/shared/utils/username.util';
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service';
import { Verify2FADto } from '@/domains/auth/dto/verify-2fa.dto';
import { assertUserPasswordStrength } from '@/shared/utils/user-password.validation';
import { getJwtRefreshSecret, getJwtSecret } from '@/shared/utils/security-config.util';

type RegistrationRole = 'user' | 'creator';

interface PendingRegistrationMetadata {
  name: string;
  email: string;
  passwordHash: string;
  numtel?: string;
  date_naissance?: string;
  role: RegistrationRole;
}

interface UserTokenPair {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
  accessExpiresInSeconds: number;
  refreshExpiresInSeconds: number;
}

export interface UserAuthPayload {
  accessToken?: string;
  refreshToken?: string;
  access_token?: string;
  refresh_token?: string;
  rememberMe?: boolean;
  expires_in?: number;
  user?: any;
  message?: string;
  requires2FA?: boolean;
  email?: string;
}

export interface UserRefreshPayload {
  accessToken: string;
  access_token: string;
  refreshToken: string;
  refresh_token: string;
  expires_in: number;
  rememberMe: boolean;
  user: any;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(VerificationCode.name)
    private verificationCodeModel: Model<VerificationCodeDocument>,
    private jwtService: JwtService,
    private emailService: EmailService,
    private userLoginActivityService: UserLoginActivityService,
    private uploadService: UploadService,
    private tokenBlacklistService: TokenBlacklistService,
  ) { }

  private normalizeEmail(email: string): string {
    return String(email || '').trim().toLowerCase();
  }

  private normalizeName(name: string): string {
    return String(name || '').trim() || 'User';
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getOtpExpiryMinutes(): number {
    const configured = Number(process.env.AUTH_OTP_EXPIRY_MINUTES || 10);
    return Number.isFinite(configured) && configured > 0 ? configured : 10;
  }

  private getOtpExpiryDate(): Date {
    return new Date(Date.now() + this.getOtpExpiryMinutes() * 60 * 1000);
  }

  private getLoginLockoutThreshold(): number {
    const configured = Number(process.env.USER_LOGIN_LOCKOUT_THRESHOLD || 5);
    return Number.isFinite(configured) && configured >= 3 ? configured : 5;
  }

  private getLoginLockoutMinutes(): number {
    const configured = Number(process.env.USER_LOGIN_LOCKOUT_MINUTES || 15);
    return Number.isFinite(configured) && configured >= 1 ? configured : 15;
  }

  private isUserLocked(user: UserDocument): boolean {
    return Boolean(user.lockoutUntil && user.lockoutUntil.getTime() > Date.now());
  }

  private async recordFailedLogin(user: UserDocument): Promise<void> {
    const threshold = this.getLoginLockoutThreshold();
    const failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    const update: Record<string, any> = { failedLoginAttempts };

    if (failedLoginAttempts >= threshold) {
      const lockoutUntil = new Date(Date.now() + this.getLoginLockoutMinutes() * 60 * 1000);
      update.lockoutUntil = lockoutUntil;

      this.emailService.sendGenericEmail({
        to: user.email,
        subject: 'Security alert: account temporarily locked',
        text: `Your Chabaqa account was temporarily locked after repeated failed sign-in attempts. You can try again after ${lockoutUntil.toISOString()}.`,
        html: `<p>Your Chabaqa account was temporarily locked after repeated failed sign-in attempts.</p><p>You can try again after <strong>${lockoutUntil.toISOString()}</strong>.</p>`,
      }).catch((error) => {
        this.logger.warn(`Failed to send account lockout email for ${user.email}: ${error?.message || error}`);
      });
    }

    await this.userModel.findByIdAndUpdate(user._id, { $set: update }).exec();
  }

  private async recordSuccessfulLogin(userId: Types.ObjectId): Promise<void> {
    await this.userModel.findByIdAndUpdate(userId, {
      $set: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    }).exec();
  }

  private buildUserDto(user: UserDocument): any {
    return {
      _id: user._id.toString(),
      name: user.name,
      username: (user as any).username,
      email: user.email,
      role: user.role,
      avatar: this.uploadService.ensureAbsoluteUrl(user.profile_picture || user.photo_profil || ''),
      createdAt: user.createdAt,
      authProvider: (user as any).authProvider || 'local',
      hasLocalPassword: (user as any).hasLocalPassword !== false,
    };
  }

  private buildAuthPayload(
    user: UserDocument,
    tokens: UserTokenPair,
    message?: string,
  ): UserAuthPayload {
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      rememberMe: tokens.rememberMe,
      expires_in: tokens.accessExpiresInSeconds,
      user: this.buildUserDto(user),
      ...(message ? { message } : {}),
    };
  }

  async loginWithGoogle(oauthUser: {
    provider: 'google';
    providerId: string;
    email?: string;
    name?: string;
    photo?: string;
  }): Promise<UserAuthPayload> {
    if (!oauthUser.email) {
      throw new BadRequestException('Adresse e-mail Google introuvable');
    }

    const normalizedEmail = this.normalizeEmail(oauthUser.email);
    let user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      const candidateName = this.normalizeName(String(oauthUser.name || 'Google User'));
      const passwordHash = await this.hashPassword(`google:${oauthUser.providerId}:${Date.now()}`);
      const username = await generateUniqueUsername(this.userModel, candidateName);
      user = await this.userModel.create({
        name: candidateName,
        username,
        email: normalizedEmail,
        role: 'user',
        password: passwordHash,
        authProvider: AuthProvider.GOOGLE,
        hasLocalPassword: false,
      });
    }

    const tokens = this.generateTokens(user, true);

    await this.userLoginActivityService.trackUserLoginForAllCommunities(user._id.toString());

    return this.buildAuthPayload(user, tokens, 'Connexion réussie avec Google');
  }

  async loginWithGoogleMobile(idToken: string): Promise<UserAuthPayload> {
    const googleAuthClientId = process.env.GOOGLE_AUTH_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
    const client = new OAuth2Client(googleAuthClientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: googleAuthClientId,
    });
    const payload = ticket.getPayload();
    if (!payload) {
      throw new UnauthorizedException('Invalid Google ID token');
    }
    const googleUser = {
      provider: 'google' as const,
      providerId: payload.sub,
      email: payload.email,
      name: payload.name,
      photo: payload.picture,
    };
    return this.loginWithGoogle(googleUser);
  }

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const normalizedEmail = this.normalizeEmail(email);
    const escapedEmail = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let user = await this.userModel.findOne({ email: normalizedEmail }).select('+password').exec();
    if (!user) {
      user = await this.userModel
        .findOne({ email: { $regex: `^${escapedEmail}$`, $options: 'i' } })
        .select('+password')
        .exec();
    }

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (this.isUserLocked(user)) {
      throw new UnauthorizedException('Compte temporairement verrouillé. Veuillez réessayer plus tard.');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await this.recordFailedLogin(user);
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    await this.recordSuccessfulLogin(user._id);

    return user as UserDocument;
  }

  private generateTokens(user: UserDocument, rememberMe = false): UserTokenPair {
    const currentTime = Date.now();
    const accessTokenId = `${user._id}-access-${currentTime}`;
    const refreshTokenId = `${user._id}-refresh-${currentTime}`;
    const accessExpiresIn = rememberMe ? '4h' : '2h';
    const refreshExpiresIn = rememberMe ? '30d' : '7d';
    const accessExpiresInSeconds = rememberMe ? 4 * 60 * 60 : 2 * 60 * 60;
    const refreshExpiresInSeconds = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
    const payload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      rememberMe,
    };

    const accessToken = this.jwtService.sign(
      {
        ...payload,
        jti: accessTokenId,
      },
      {
        expiresIn: accessExpiresIn,
        secret: getJwtSecret(),
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        ...payload,
        jti: refreshTokenId,
      },
      {
        expiresIn: refreshExpiresIn,
        secret: getJwtRefreshSecret(),
      },
    );

    return {
      accessToken,
      refreshToken,
      rememberMe,
      accessExpiresInSeconds,
      refreshExpiresInSeconds,
    };
  }

  public generateToken(user: UserDocument): string {
    return this.generateTokens(user, false).accessToken;
  }

  async revokeToken(token: string): Promise<void> {
    const parsed = token?.trim();
    if (!parsed) return;
    const payload: any = this.jwtService.verify(parsed, { secret: getJwtSecret() });
    if (!payload?.sub) return;
    await this.tokenBlacklistService.revokeTokenFromJWT(
      new Types.ObjectId(payload.sub),
      payload,
      'access',
    );
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const parsed = token?.trim();
    if (!parsed) return;
    const payload: any = this.jwtService.verify(parsed, { secret: getJwtRefreshSecret() });
    if (!payload?.sub) return;
    await this.tokenBlacklistService.revokeTokenFromJWT(
      new Types.ObjectId(payload.sub),
      payload,
      'refresh',
    );
  }

  async revokeAllTokensForUser(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) return;
    await this.tokenBlacklistService.revokeAllUserTokens(new Types.ObjectId(userId));
  }

  async revokeAllTokensFromAccessToken(token: string): Promise<void> {
    const parsed = token?.trim();
    if (!parsed) return;
    const payload: any = this.jwtService.verify(parsed, { secret: getJwtSecret() });
    const userId = payload?.sub ? String(payload.sub) : '';
    if (!userId) return;
    await this.revokeAllTokensForUser(userId);
  }

  async revokeAllTokensFromRefreshToken(token: string): Promise<void> {
    const parsed = token?.trim();
    if (!parsed) return;
    const payload: any = this.jwtService.verify(parsed, { secret: getJwtRefreshSecret() });
    const userId = payload?.sub ? String(payload.sub) : '';
    if (!userId) return;
    await this.revokeAllTokensForUser(userId);
  }

  private async verifyRefreshToken(refreshToken: string): Promise<any> {
    const payload = this.jwtService.verify(refreshToken, {
      secret: getJwtRefreshSecret(),
    });
    const tokenId = payload?.jti || `${payload?.sub}-${payload?.iat}`;
    const isRevoked = await this.tokenBlacklistService.isTokenRevoked(tokenId, String(payload?.sub || ''));
    if (isRevoked) {
      throw new UnauthorizedException('Token de rafraîchissement révoqué');
    }
    return payload;
  }

  private async shouldRequireUser2FA(user: UserDocument): Promise<boolean> {
    if (user.twoFactorEnabled) return true;
    if (user.role !== 'creator') return false;
    return Boolean(user.bankDetails?.rib);
  }

  private async sendUser2FACode(user: UserDocument, rememberMe: boolean): Promise<void> {
    const verificationCode = this.generateOtpCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await this.verificationCodeModel.deleteMany({ userId: user._id, type: '2fa_login' });
    await this.verificationCodeModel.create({
      userId: user._id,
      code: verificationCode,
      type: '2fa_login',
      expiresAt,
      isUsed: false,
      rememberMe,
    });
    await this.emailService.send2FACode(user.email, verificationCode, user.name);
  }

  private extractAccessJti(accessToken: string): string | null {
    try {
      const payload: any = this.jwtService.decode(accessToken);
      return payload?.jti ? String(payload.jti) : null;
    } catch {
      return null;
    }
  }

  private async recordAuthSession(
    userId: Types.ObjectId,
    accessToken: string,
    meta: { userAgent?: string; ip?: string },
    expiresInSeconds: number,
  ): Promise<void> {
    const jti = this.extractAccessJti(accessToken);
    if (!jti) return;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    await this.userModel.findByIdAndUpdate(userId, {
      $push: {
        authSessions: {
          $each: [{
            jti,
            userAgent: meta.userAgent?.slice(0, 512),
            ip: meta.ip?.slice(0, 64),
            createdAt: new Date(),
            expiresAt,
          }],
          $slice: -20,
        },
      },
    }).exec();
  }

  async login(
    loginDto: LoginDto,
    meta: { userAgent?: string; ip?: string } = {},
  ): Promise<UserAuthPayload> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    const rememberMe = !!loginDto.remember_me;

    if (await this.shouldRequireUser2FA(user)) {
      await this.sendUser2FACode(user, rememberMe);
      return {
        requires2FA: true,
        email: user.email,
        message: 'Verification code sent to your email.',
      };
    }

    const tokens = this.generateTokens(user, rememberMe);
    await this.recordAuthSession(user._id, tokens.accessToken, meta, tokens.accessExpiresInSeconds);
    await this.userLoginActivityService.trackUserLoginForAllCommunities(user._id.toString());
    return this.buildAuthPayload(user, tokens, 'Connexion réussie');
  }

  async resendUser2FACode(email: string): Promise<{ success: boolean; message: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail }).exec();
    if (!user) {
      throw new BadRequestException('Invalid email');
    }
    if (!(await this.shouldRequireUser2FA(user))) {
      throw new BadRequestException('Two-factor authentication is not required for this account');
    }
    const pending = await this.verificationCodeModel
      .findOne({ userId: user._id, type: '2fa_login', isUsed: false, expiresAt: { $gt: new Date() } })
      .sort({ createdAt: -1 })
      .lean();
    await this.sendUser2FACode(user, !!pending?.rememberMe);
    return { success: true, message: 'Verification code sent to your email.' };
  }

  async verifyUser2FA(dto: Verify2FADto, meta: { userAgent?: string; ip?: string } = {}): Promise<UserAuthPayload> {
    const email = this.normalizeEmail(dto.email);
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) throw new BadRequestException('Invalid email');

    const record = await this.verificationCodeModel.findOne({
      userId: user._id,
      code: String(dto.verificationCode || '').trim(),
      type: '2fa_login',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });
    if (!record) throw new BadRequestException('Invalid or expired verification code');

    record.isUsed = true;
    await record.save();

    if (!user.twoFactorEnabled && user.role === 'creator' && user.bankDetails?.rib) {
      user.twoFactorEnabled = true;
      await user.save();
    }

    const tokens = this.generateTokens(user, !!record.rememberMe);
    await this.recordAuthSession(user._id, tokens.accessToken, meta, tokens.accessExpiresInSeconds);
    await this.userLoginActivityService.trackUserLoginForAllCommunities(user._id.toString());
    return this.buildAuthPayload(user, tokens, 'Two-factor verification successful');
  }

  async setTwoFactorEnabled(userId: string, enabled: boolean, currentPassword?: string): Promise<{ twoFactorEnabled: boolean }> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new BadRequestException('User not found');

    if (!enabled && user.role === 'creator' && user.bankDetails?.rib) {
      throw new BadRequestException('Two-factor authentication is required for creators with payout details');
    }

    if (currentPassword && user.password) {
      const valid = await bcrypt.compare(currentPassword, user.password);
      if (!valid) throw new UnauthorizedException('Invalid password');
    }

    user.twoFactorEnabled = enabled;
    await user.save();
    return { twoFactorEnabled: user.twoFactorEnabled };
  }

  async listAuthSessions(userId: string) {
    const user = await this.userModel.findById(userId).select('authSessions').lean();
    const now = Date.now();
    return (user?.authSessions || [])
      .filter((s) => new Date(s.expiresAt).getTime() > now)
      .map((s) => ({
        jti: s.jti,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      }));
  }

  async revokeAuthSession(userId: string, jti: string): Promise<void> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new BadRequestException('User not found');
    await this.userModel.findByIdAndUpdate(userId, { $pull: { authSessions: { jti } } }).exec();
    const session = (user.authSessions || []).find((s) => s.jti === jti);
    await this.tokenBlacklistService.revokeToken(
      new Types.ObjectId(userId),
      jti,
      'access',
      session?.expiresAt || new Date(Date.now() + 2 * 60 * 60 * 1000),
    );
  }

  async refreshToken(refreshToken: string): Promise<UserRefreshPayload> {
    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      const user = await this.userModel.findById(payload.sub).exec();
      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const rememberMe = !!payload?.rememberMe;
      const accessExpiresInSeconds = rememberMe ? 4 * 60 * 60 : 2 * 60 * 60;
      await this.tokenBlacklistService.revokeTokenFromJWT(
        new Types.ObjectId(payload.sub),
        payload,
        'refresh',
      );
      const tokens = this.generateTokens(user, rememberMe);

      return {
        accessToken: tokens.accessToken,
        access_token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        refresh_token: tokens.refreshToken,
        expires_in: accessExpiresInSeconds,
        rememberMe,
        user: this.buildUserDto(user),
      };
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async logout(accessToken?: string, refreshToken?: string): Promise<{ message: string; revokedTokens: number }> {
    let revokedCount = 0;

    try {
      if (accessToken) {
        await this.revokeToken(accessToken);
        revokedCount += 1;
      }
    } catch {
      // Keep logout idempotent even if access token is invalid or expired.
    }

    try {
      if (refreshToken) {
        await this.revokeRefreshToken(refreshToken);
        revokedCount += 1;
      }
    } catch {
      // Keep logout idempotent even if refresh token is invalid or expired.
    }

    return {
      message: 'Déconnexion réussie.',
      revokedTokens: revokedCount,
    };
  }

  async getUserById(userId: string): Promise<UserDocument | null> {
    const user = await this.userModel.findById(userId).select('-password').exec();
    if (!user) return null;

    const userObject = user.toObject();

    const normalizedPhotoProfil = this.uploadService.ensureAbsoluteUrl(userObject.photo_profil || '');
    const normalizedProfilePicture = this.uploadService.ensureAbsoluteUrl(userObject.profile_picture || '');
    const normalizedAvatar = this.uploadService.ensureAbsoluteUrl(
      userObject.profile_picture || userObject.photo_profil || '',
    );

    return {
      ...userObject,
      photo_profil: normalizedPhotoProfil,
      profile_picture: normalizedProfilePicture,
      avatar: normalizedAvatar,
      firstName: userObject.name,
    } as any;
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  private async savePendingRegistration(
    registerDto: RegisterDto,
    role: RegistrationRole,
  ): Promise<{ email: string; code: string; name: string; expiresInMinutes: number }> {
    const normalizedEmail = this.normalizeEmail(registerDto.email);
    const normalizedName = this.normalizeName(registerDto.name);
    assertUserPasswordStrength(registerDto.password);

    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      throw new BadRequestException('Un utilisateur avec cet email existe déjà.');
    }

    const verificationCode = this.generateOtpCode();
    const expiresAt = this.getOtpExpiryDate();
    const passwordHash = await this.hashPassword(registerDto.password);

    const metadata: PendingRegistrationMetadata = {
      name: normalizedName,
      email: normalizedEmail,
      passwordHash,
      numtel: registerDto.numtel,
      date_naissance: registerDto.date_naissance,
      role,
    };

    await this.verificationCodeModel.deleteMany({
      email: normalizedEmail,
      type: 'email_verification',
      isUsed: false,
    });

    await this.verificationCodeModel.create({
      email: normalizedEmail,
      code: verificationCode,
      type: 'email_verification',
      expiresAt,
      isUsed: false,
      metadata,
    });

    return {
      email: normalizedEmail,
      code: verificationCode,
      name: normalizedName,
      expiresInMinutes: this.getOtpExpiryMinutes(),
    };
  }

  async requestRegistrationOtp(
    registerDto: RegisterDto,
    role: RegistrationRole = 'user',
  ): Promise<{ success: boolean; message: string; email: string; expiresInMinutes: number }> {
    const { email, code, name, expiresInMinutes } = await this.savePendingRegistration(registerDto, role);
    this.logger.log(`OTP d'inscription généré pour ${email} (${role})`);

    await this.emailService.sendRegistrationOtpEmail(email, code, name, expiresInMinutes);

    return {
      success: true,
      message: 'Un code de vérification a été envoyé à votre email.',
      email,
      expiresInMinutes,
    };
  }

  async resendRegistrationOtp(email: string): Promise<{ success: boolean; message: string; email: string; expiresInMinutes: number }> {
    const normalizedEmail = this.normalizeEmail(email);
    this.logger.log(`Demande de renvoi OTP d'inscription pour ${normalizedEmail}`);

    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      throw new BadRequestException('Ce compte est déjà vérifié. Veuillez vous connecter.');
    }

    const pendingRecord = await this.verificationCodeModel
      .findOne({
        email: normalizedEmail,
        type: 'email_verification',
        isUsed: false,
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!pendingRecord?.metadata) {
      throw new BadRequestException('Aucune demande d\'inscription en attente pour cet email.');
    }

    const metadata = pendingRecord.metadata as PendingRegistrationMetadata;
    const otpCode = this.generateOtpCode();
    const expiresAt = this.getOtpExpiryDate();
    const expiresInMinutes = this.getOtpExpiryMinutes();

    await this.verificationCodeModel.deleteMany({
      email: normalizedEmail,
      type: 'email_verification',
      isUsed: false,
    });

    await this.verificationCodeModel.create({
      email: normalizedEmail,
      code: otpCode,
      type: 'email_verification',
      expiresAt,
      isUsed: false,
      metadata,
    });

    await this.emailService.sendRegistrationOtpEmail(
      normalizedEmail,
      otpCode,
      this.normalizeName(metadata.name),
      expiresInMinutes,
    );
    this.logger.log(`OTP d'inscription renvoyé pour ${normalizedEmail}`);

    return {
      success: true,
      message: 'Un nouveau code de vérification a été envoyé.',
      email: normalizedEmail,
      expiresInMinutes,
    };
  }

  async verifyRegistrationOtp(
    email: string,
    verificationCode: string,
  ): Promise<{ success: boolean; message: string; user?: any; error?: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    const normalizedCode = String(verificationCode || '').trim();

    const verificationRecord = await this.verificationCodeModel.findOne({
      email: normalizedEmail,
      code: normalizedCode,
      type: 'email_verification',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord || !verificationRecord.metadata) {
      return { success: false, error: 'Code de vérification invalide ou expiré.', message: '' };
    }

    const metadata = verificationRecord.metadata as PendingRegistrationMetadata;

    if (!metadata.passwordHash || !metadata.name || !metadata.email) {
      return {
        success: false,
        error: 'Données d\'inscription invalides. Veuillez recommencer le processus.',
        message: '',
      };
    }

    const existingUser = await this.userModel.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      await this.verificationCodeModel.deleteMany({
        email: normalizedEmail,
        type: 'email_verification',
      });
      return {
        success: false,
        error: 'Un utilisateur avec cet email existe déjà. Veuillez vous connecter.',
        message: '',
      };
    }

    const username = await generateUniqueUsername(this.userModel, this.normalizeName(metadata.name));

    const newUser = await this.userModel.create({
      name: this.normalizeName(metadata.name),
      username,
      email: normalizedEmail,
      password: metadata.passwordHash,
      numtel: metadata.numtel,
      date_naissance: metadata.date_naissance,
      role: metadata.role === 'creator' ? 'creator' : 'user',
    });

    await this.verificationCodeModel.deleteMany({
      email: normalizedEmail,
      type: 'email_verification',
    });
    this.logger.log(`Email vérifié et compte créé pour ${normalizedEmail}`);

    return {
      success: true,
      message: 'Email vérifié avec succès. Votre compte a été créé.',
      user: {
        _id: newUser._id.toString(),
        name: newUser.name,
        username: (newUser as any).username,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    };
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message?: string; error?: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail });

    if (!user) {
      return { success: false, error: 'Aucun utilisateur trouvé avec cet email.' };
    }

    const resetCode = this.generateOtpCode();
    const expiresAt = this.getOtpExpiryDate();
    const expiresInMinutes = this.getOtpExpiryMinutes();

    await this.verificationCodeModel.deleteMany({
      $or: [{ userId: user._id }, { email: normalizedEmail }],
      type: 'password_reset',
      isUsed: false,
    });

    await this.verificationCodeModel.create({
      email: normalizedEmail,
      userId: user._id,
      code: resetCode,
      type: 'password_reset',
      expiresAt,
      isUsed: false,
    });

    await this.emailService.sendPasswordResetEmail(user.email, resetCode, user.name, expiresInMinutes);

    return { success: true, message: 'Code de réinitialisation envoyé par email.' };
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.userModel.findOne({ email: normalizedEmail });
    if (!user) {
      return { success: false, error: 'Aucun utilisateur trouvé avec cet email.' };
    }

    const verificationRecord = await this.verificationCodeModel.findOne({
      $or: [{ userId: user._id }, { email: normalizedEmail }],
      code: String(code || '').trim(),
      type: 'password_reset',
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      return { success: false, error: 'Code de réinitialisation invalide ou expiré.' };
    }

    assertUserPasswordStrength(newPassword);
    user.password = await this.hashPassword(newPassword);
    if (user.role) {
      user.role = user.role.toLowerCase() as any;
    }
    await user.save();

    await this.verificationCodeModel.deleteMany({
      $or: [{ userId: user._id }, { email: normalizedEmail }],
      type: 'password_reset',
    });

    return { success: true, message: 'Mot de passe réinitialisé avec succès.' };
  }

  async register(registerDto: RegisterDto): Promise<{ success: boolean; message: string; email?: string; expiresInMinutes?: number }> {
    return this.requestRegistrationOtp(registerDto, 'user');
  }

  async registerCreator(registerDto: RegisterDto): Promise<{ success: boolean; message: string; email?: string; expiresInMinutes?: number }> {
    return this.requestRegistrationOtp(registerDto, 'creator');
  }
}
