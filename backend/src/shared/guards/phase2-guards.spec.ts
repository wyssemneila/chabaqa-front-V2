import { ForbiddenException, HttpException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminGuard } from '@/domains/auth/guards/admin.guard';
import { GoogleAuthGuard } from '@/domains/auth/guards/google-auth.guard';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '@/domains/auth/guards/optional-jwt-auth.guard';
import { AdminAuthGuard } from '@/domains/admin/common/guards/admin-auth.guard';
import { AdminRateLimitGuard } from '@/domains/admin/common/guards/admin-rate-limit.guard';
import { AdminRolesGuard } from '@/domains/admin/common/guards/admin-roles.guard';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';
import { PlanFeatureGuard } from '@/shared/guards/plan-feature.guard';
import { PublicThrottlerGuard } from '@/shared/guards/public-throttler.guard';
import { AdminRole } from '@/domains/admin/schemas/admin-user.schema';

const makeContext = (request: any = {}, handler: any = function handler() {}, controller: any = class Controller {}) => ({
  switchToHttp: () => ({ getRequest: () => request }),
  getHandler: () => handler,
  getClass: () => controller,
}) as any;

describe('Phase 2 guard coverage', () => {
  it('JwtAuthGuard returns the HTTP request', () => {
    const request = { headers: {} };
    expect(new JwtAuthGuard().getRequest(makeContext(request))).toBe(request);
  });

  it('OptionalJwtAuthGuard returns null instead of throwing for anonymous users', () => {
    const guard = new OptionalJwtAuthGuard();
    expect(guard.handleRequest(new Error('no token'), null)).toBeNull();
    expect(guard.handleRequest(null, { id: 'user-1' })).toEqual({ id: 'user-1' });
  });

  it('GoogleAuthGuard only accepts safe relative redirects in OAuth state', () => {
    const guard = new GoogleAuthGuard();
    expect(guard.getAuthenticateOptions(makeContext({ query: { redirect: '/creator/dashboard' } }))).toEqual({ state: '/creator/dashboard' });
    expect(guard.getAuthenticateOptions(makeContext({ query: { redirect: 'https://evil.test' } }))).toEqual({});
    expect(guard.getAuthenticateOptions(makeContext({ query: { redirect: '//evil.test' } }))).toEqual({});
  });

  it('AdminGuard allows active admin context and rejects anonymous requests', () => {
    const guard = new AdminGuard({} as Reflector);
    expect(guard.canActivate(makeContext({ adminUser: { isActive: true } }))).toBe(true);
    expect(() => guard.canActivate(makeContext({}))).toThrow(UnauthorizedException);
    expect(() => guard.canActivate(makeContext({ user: { role: 'user' } }))).toThrow(ForbiddenException);
  });

  it('AdminRolesGuard allows routes without required metadata', async () => {
    const reflector = { get: jest.fn().mockReturnValue([]) } as any;
    const guard = new AdminRolesGuard(reflector, {} as any);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
  });

  it('AdminRolesGuard allows super admins', async () => {
    const reflector = {
      get: jest.fn((key: string) => key === 'admin-roles' ? [AdminRole.USER_MANAGER] : []),
    } as any;
    const guard = new AdminRolesGuard(reflector, {} as any);
    await expect(guard.canActivate(makeContext({
      user: { id: 'admin-1' },
      adminUser: { _id: 'admin-1', roles: [AdminRole.SUPER_ADMIN], permissions: [] },
    }))).resolves.toBe(true);
  });

  it('PlanFeatureGuard bypasses checks when enforcement is disabled', async () => {
    const previous = process.env.PLAN_ENFORCEMENT_MODE;
    process.env.PLAN_ENFORCEMENT_MODE = 'false';
    const guard = new PlanFeatureGuard({} as any, {} as any);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
    process.env.PLAN_ENFORCEMENT_MODE = previous;
  });

  it('PlanFeatureGuard rejects enforced feature checks without a creator identity', async () => {
    const previous = process.env.PLAN_ENFORCEMENT_MODE;
    process.env.PLAN_ENFORCEMENT_MODE = 'true';
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['courses']) } as any;
    const guard = new PlanFeatureGuard(reflector, {} as any);
    await expect(guard.canActivate(makeContext({ user: {} }))).rejects.toThrow(ForbiddenException);
    process.env.PLAN_ENFORCEMENT_MODE = previous;
  });

  it('CommunityPermissionGuard allows routes without required permissions', async () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as any;
    const guard = new CommunityPermissionGuard(reflector, {} as any, {} as any);
    await expect(guard.canActivate(makeContext())).resolves.toBe(true);
  });

  it('PublicThrottlerGuard emits a sanitized rate limit error', async () => {
    class TestGuard extends PublicThrottlerGuard {
      public run(context: any) { return this.throwThrottlingException(context); }
    }

    await expect(new TestGuard({} as any, {} as any, {} as any).run(makeContext({ method: 'POST', url: '/auth/login' })))
      .rejects.toThrow(HttpException);
  });

  it('AdminRateLimitGuard tracks admin users before IP addresses', async () => {
    class TestGuard extends AdminRateLimitGuard {
      public tracker(req: any) { return this.getTracker(req); }
      public skip(context: any) { return this.shouldSkip(context); }
    }

    const guard = new TestGuard({} as any, {} as any, {} as any);
    await expect(guard.tracker({ user: { id: 'admin-1' }, ip: '127.0.0.1' })).resolves.toBe('admin-user-admin-1');
    await expect(guard.skip(makeContext({ url: '/api/health' }))).resolves.toBe(true);
    await expect(guard.skip(makeContext({ url: '/api/admin/users' }))).resolves.toBe(false);
  });

  it('AdminAuthGuard normalizes authenticated user identifiers in handleRequest', () => {
    const guard = new AdminAuthGuard({} as any);
    expect(guard.handleRequest(null, { id: 'admin-1' }, null, makeContext())).toEqual({ id: 'admin-1' });
    expect(() => guard.handleRequest(null, null, null, makeContext())).toThrow(UnauthorizedException);
  });
});
