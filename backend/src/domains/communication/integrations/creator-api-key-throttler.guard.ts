import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { createHash } from 'crypto';

/** Separates public creator API quotas by credential instead of shared IP. */
@Injectable()
export class CreatorApiKeyThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const rawKey = String(req.headers?.['x-chabaqa-api-key'] || '');
    if (rawKey.startsWith('chq_')) return `creator-api-key:${createHash('sha256').update(rawKey).digest('hex')}`;
    return `creator-api-ip:${req.ip || req.socket?.remoteAddress || 'unknown'}`;
  }
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    return !String(context.switchToHttp().getRequest().url || '').includes('/creator/integrations/public/v1');
  }
}
