import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

@Injectable()
export class InternalMetricsGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const expected = String(process.env.METRICS_TOKEN || '').trim();
    const provided = String(req.headers?.authorization || '').replace(/^Bearer\s+/i, '').trim();
    const ip = String(req.ip || req.socket?.remoteAddress || '').replace(/^::ffff:/, '');
    if (expected) {
      const left = Buffer.from(provided);
      const right = Buffer.from(expected);
      if (left.length === right.length && timingSafeEqual(left, right)) return true;
    }
    if (['127.0.0.1', '::1'].includes(ip)) return true;
    throw new ForbiddenException('Metrics access is restricted');
  }
}
