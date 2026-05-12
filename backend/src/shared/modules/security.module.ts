import { Module, Global } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { SecurityService } from '@/shared/services/security.service';
import { IPReputationService } from '@/shared/services/ip-reputation.service';
import { BotDetectionService } from '@/shared/services/bot-detection.service';
import { FileValidationService } from '@/shared/services/file-validation.service';
import { RateLimitGuard } from '@/shared/guards/rate-limit.guard';
import { IPReputationGuard } from '@/shared/guards/ip-reputation.guard';
import { BotDetectionGuard } from '@/shared/guards/bot-detection.guard';
import { PublicThrottlerGuard } from '@/shared/guards/public-throttler.guard';
import { SecurityMiddleware } from '@/shared/middleware/security.middleware';
import { WAFMiddleware } from '@/shared/middleware/waf.middleware';
import { CaptchaController } from '@/shared/controllers/captcha.controller';
import { CacheModule } from '@/shared/modules/cache.module';

@Global()
@Module({
  imports: [
    CacheModule,
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000,
        limit: 100, // 100 requests per minute
      },
      {
        name: 'long',
        ttl: 3600000,
        limit: 1000, // 1000 requests per hour
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 20, // 20 requests per minute for auth endpoints
      },
    ]),
  ],
  controllers: [CaptchaController],
  providers: [
    SecurityService, 
    IPReputationService, 
    BotDetectionService,
    FileValidationService,
    RateLimitGuard, 
    PublicThrottlerGuard,
    IPReputationGuard, 
    BotDetectionGuard,
    SecurityMiddleware,
    WAFMiddleware
  ],
  exports: [
    SecurityService, 
    IPReputationService, 
    BotDetectionService,
    FileValidationService,
    RateLimitGuard, 
    PublicThrottlerGuard,
    IPReputationGuard, 
    BotDetectionGuard,
    SecurityMiddleware,
    WAFMiddleware
  ],
})
export class SecurityModule {}
