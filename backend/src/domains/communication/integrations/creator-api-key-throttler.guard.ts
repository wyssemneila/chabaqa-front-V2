import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/** Separates public creator API quotas by credential instead of shared IP. */
@Injectable()
export class CreatorApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return `creator-api-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  }
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return !String(context.switchToHttp().getRequest().url || '').includes('/creator/integrations/public/v1');
  }
}
