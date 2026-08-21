import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class InternalServiceTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const configuredToken = String(process.env.INTERNAL_SERVICE_TOKEN || '').trim();
    const providedToken = this.extractToken(req);

    if (!configuredToken || !providedToken || !this.safeEqual(configuredToken, providedToken)) {
      throw new UnauthorizedException('Internal service token required');
    }

    return true;
  }

  private extractToken(req: any): string {
    const headerToken =
      req.headers?.['x-internal-service-token'] ||
      req.headers?.['x-service-token'] ||
      '';
    if (Array.isArray(headerToken)) return String(headerToken[0] || '').trim();
    if (headerToken) return String(headerToken).trim();

    const authorization = String(req.headers?.authorization || '').trim();
    return authorization.toLowerCase().startsWith('bearer ')
      ? authorization.slice(7).trim()
      : '';
  }

  private safeEqual(expected: string, actual: string): boolean {
    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(actual);
    return (
      expectedBuffer.length === actualBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, actualBuffer)
    );
  }
}
