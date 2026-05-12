import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from '@/domains/auth/auth.service';
import { AuthController } from '@/domains/auth/auth.controller';
import { JwtStrategy } from '@/domains/auth/strategies/jwt.strategy';
import { GoogleStrategy } from '@/domains/auth/strategies/google.strategy';
import { JwtAuthGuard } from '@/domains/auth/jwt-auth.guard';
import { GoogleAuthGuard } from '@/domains/auth/guards/google-auth.guard';
import { OptionalJwtAuthGuard } from '@/domains/auth/guards/optional-jwt-auth.guard';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { VerificationCode, VerificationCodeSchema } from '@/infrastructure/database/schemas/auth/verification-code.schema';
import { Admin, AdminSchema } from '@/infrastructure/database/schemas/auth/admin.schema';
import { RevokedToken, RevokedTokenSchema } from '@/infrastructure/database/schemas/auth/revoked-token.schema';
import { EmailService, TokenBlacklistService } from '@/shared/services';
import { UserLoginActivityModule } from '@/domains/auth/user-login-activity/user-login-activity.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { getJwtSecret } from '@/shared/utils/security-config.util';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: Admin.name, schema: AdminSchema },
      { name: RevokedToken.name, schema: RevokedTokenSchema }
    ]),
    JwtModule.registerAsync({
      global: true,
      useFactory: () => ({
        secret: getJwtSecret(),
        signOptions: { expiresIn: '2h' },
      }),
    }),
    UserLoginActivityModule,
    UploadModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy, GoogleAuthGuard, EmailService, TokenBlacklistService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, TokenBlacklistService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule { } 
