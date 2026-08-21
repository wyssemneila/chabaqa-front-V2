import { HttpException } from '@nestjs/common';
import { Request, Response } from 'express';
import { SecurityMiddleware } from '@/shared/middleware/security.middleware';
import { SecurityService } from '@/shared/services/security.service';

describe('SecurityMiddleware', () => {
  let middleware: SecurityMiddleware;

  const securityService = {
    sanitizeInput: jest.fn((input: string) => input.replace(/[\$]+/g, '')),
    logSecurityEvent: jest.fn(),
    isValidIP: jest.fn(() => true),
    isTrustedProxy: jest.fn(() => true),
  } as unknown as SecurityService;

  const createRequest = (overrides: Partial<Request> = {}): Request => ({
    method: 'GET',
    url: '/api/users',
    query: {},
    body: {},
    params: {},
    headers: {},
    connection: { remoteAddress: '127.0.0.1' } as any,
    socket: { remoteAddress: '127.0.0.1' } as any,
    get: jest.fn((header: string) => {
      const headers = overrides.headers || {};
      return (headers as any)[header.toLowerCase()] || (headers as any)[header] || 'Mozilla/5.0 test';
    }),
    ...overrides,
  } as Request);

  const createResponse = (): Response => ({
    setHeader: jest.fn(),
    removeHeader: jest.fn(),
  } as unknown as Response);

  beforeEach(() => {
    jest.clearAllMocks();
    middleware = new SecurityMiddleware(securityService);
  });

  it('sanitizes string values before the request reaches controllers', () => {
    const req = createRequest({
      body: {
        name: 'normal$user',
      },
    });
    const next = jest.fn();

    middleware.use(req, createResponse(), next);

    expect(req.body.name).toBe('normaluser');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('blocks nested MongoDB operator keys', () => {
    const req = createRequest({
      body: {
        email: {
          $ne: 'victim@example.com',
        },
      },
    });

    expect(() => middleware.use(req, createResponse(), jest.fn())).toThrow(HttpException);
    expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
      'NOSQL_OPERATOR_INJECTION_BLOCKED',
      expect.objectContaining({ key: '$ne', path: 'body.email' }),
      'warn',
    );
  });

  it('blocks prototype-pollution keys', () => {
    const req = createRequest({
      body: {
        constructor: {
          prototype: { isAdmin: true },
        },
      },
    });

    expect(() => middleware.use(req, createResponse(), jest.fn())).toThrow(HttpException);
    expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
      'NOSQL_OPERATOR_INJECTION_BLOCKED',
      expect.objectContaining({ key: 'constructor', path: 'body' }),
      'warn',
    );
  });

  it('blocks duplicate scalar query parameters', () => {
    const req = createRequest({
      query: {
        role: ['user', 'admin'] as any,
      },
    });

    expect(() => middleware.use(req, createResponse(), jest.fn())).toThrow(HttpException);
    expect(securityService.logSecurityEvent).toHaveBeenCalledWith(
      'HTTP_PARAMETER_POLLUTION_BLOCKED',
      expect.objectContaining({ key: 'role' }),
      'warn',
    );
  });

  it('allows reviewed multi-value query parameters', () => {
    const req = createRequest({
      query: {
        tags: ['security', 'backend'] as any,
      },
    });
    const next = jest.fn();

    middleware.use(req, createResponse(), next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
