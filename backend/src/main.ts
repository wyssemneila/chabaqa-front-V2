import '@/tracing';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app/app.module';
import { BadRequestException, ValidationPipe, ValidationError } from '@nestjs/common';
import { HttpExceptionFilter } from '@/shared/filters/http-exception.filter';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AbsoluteUploadsUrlInterceptor } from '@/shared/interceptors/absolute-uploads-url.interceptor';
import { UploadService } from '@/domains/shared/upload/upload.service';
import { MonitoringService } from '@/shared/services/monitoring.service';
import os from 'os';
import { randomUUID, webcrypto } from 'node:crypto';
import { existsSync } from 'node:fs';
import { basename, extname, isAbsolute, relative, resolve } from 'node:path';
import {
  getAllowedCorsOrigins,
  isCorsOriginAllowed,
  isProductionEnvironment,
  isSwaggerEnabled,
} from '@/shared/utils/security-config.util';
import { validateStartupEnv } from '@/shared/utils/startup-env.validation';
import { initSentry } from '@/shared/observability/sentry';
import { csrfProtectionMiddleware } from '@/shared/middleware/csrf-protection.middleware';
import { SecurityMiddleware } from '@/shared/middleware/security.middleware';
import { resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';
import { S3StorageAdapter } from '@/domains/content/media/storage/s3-storage.adapter';
import { MediaService } from '@/domains/content/media/media.service';
import { writeStructuredLog } from '@/shared/utils/log-sanitizer.util';
import { RedisIoAdapter } from '@/infrastructure/realtime/redis-io.adapter';

// Compatibility for Node < 20 where globalThis.crypto may be undefined.
if (!globalThis.crypto) {
  (globalThis as any).crypto = webcrypto;
}

process.on('unhandledRejection', (reason) => {
  writeStructuredLog('error', 'unhandled_rejection', { reason });
});

process.on('uncaughtException', (error) => {
  writeStructuredLog('error', 'uncaught_exception', { message: error.message, stack: error.stack });
  process.exitCode = 1;
});

const getLocalNetworkIp = (): string => {
  const networkInterfaces = os.networkInterfaces();
  for (const interfaceName in networkInterfaces) {
    const networkInterface = networkInterfaces[interfaceName];
    if (!networkInterface) continue;
    for (const network of networkInterface) {
      if (network.family === 'IPv4' && !network.internal) {
        return network.address;
      }
    }
  }
  return 'localhost';
};

async function bootstrap() {
  validateStartupEnv();
  initSentry();

  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const redisIoAdapter = new RedisIoAdapter(app);
  if (await redisIoAdapter.connectToRedis()) {
    app.useWebSocketAdapter(redisIoAdapter);
  }
  const expressApp = app.getHttpAdapter().getInstance();
  const monitoringService = app.get(MonitoringService);
  const securityMiddleware = app.get(SecurityMiddleware);
  const s3StorageAdapter = app.get(S3StorageAdapter, { strict: false });
  const mediaService = app.get(MediaService);
  const storageReadPreference = (process.env.MEDIA_STORAGE_READ_PREFERENCE || process.env.MEDIA_STORAGE_DRIVER || 'disk').toLowerCase();
  expressApp.disable('x-powered-by');

  const trustProxy = process.env.TRUST_PROXY;
  if (trustProxy === 'true') {
    expressApp.set('trust proxy', 1);
  } else if (trustProxy && /^\d+$/.test(trustProxy)) {
    expressApp.set('trust proxy', Number(trustProxy));
  }

  // Temporary backward-compat aliases: /api/payments/* -> /api/payment/*
  // and /payments/* -> /payment/* after Nest's global prefix handling.
  // Keep this during migration to avoid breaking older frontend clients.
  app.use((req: any, res: any, next: any) => {
    const requestId = req.headers['x-request-id'] || randomUUID();
    req.requestId = String(requestId);
    res.setHeader('X-Request-Id', req.requestId);

    if (typeof req.url === 'string') {
      if (req.url === '/api/payments') {
        req.url = '/api/payment';
      } else if (req.url.startsWith('/api/payments/')) {
        req.url = req.url.replace('/api/payments/', '/api/payment/');
      } else if (req.url === '/payments') {
        req.url = '/payment';
      } else if (req.url.startsWith('/payments/')) {
        req.url = req.url.replace('/payments/', '/payment/');
      }
    }
    next();
  });

  app.use('/api/payment/stripe-link/webhook', express.raw({ type: 'application/json' }));

  app.use(express.static('public'));
  const streamUploadFromObjectStorage = async (storageKey: string, res: any): Promise<boolean> => {
    try {
      const object = await s3StorageAdapter.getObjectStream(storageKey);
      const extension = extname(storageKey).toLowerCase();
      const fallbackContentType =
        extension === '.jpg' || extension === '.jpeg' ? 'image/jpeg' :
        extension === '.png' ? 'image/png' :
        extension === '.gif' ? 'image/gif' :
        extension === '.webp' ? 'image/webp' :
        extension === '.svg' ? 'image/svg+xml' :
        extension === '.mp4' ? 'video/mp4' :
        extension === '.webm' ? 'video/webm' :
        extension === '.mov' ? 'video/quicktime' :
        extension === '.mp3' ? 'audio/mpeg' :
        extension === '.wav' ? 'audio/wav' :
        extension === '.pdf' ? 'application/pdf' :
        'application/octet-stream';
      res.setHeader('Content-Type', object.contentType || fallbackContentType);
      if (object.contentLength) res.setHeader('Content-Length', String(object.contentLength));
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
      object.stream.pipe(res);
      return true;
    } catch {
      return false;
    }
  };

  const setMediaResponseHeaders = (storageKey: string, res: any) => {
    const extension = extname(storageKey).toLowerCase();
    const filename = basename(storageKey).replace(/["\r\n]/g, '_');
    const inlineSafeExtensions = new Set([
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp3', '.wav', '.ogg', '.aac', '.flac', '.mp4', '.mov', '.webm',
    ]);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    if (!inlineSafeExtensions.has(extension)) {
      res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
    }
  };

  app.use('/uploads', async (req: any, res: any, next: any) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }

    let storageKey = '';
    try {
      storageKey = decodeURIComponent(String(req.path || '').replace(/^\/+/, ''));
    } catch {
      storageKey = String(req.path || '').replace(/^\/+/, '');
    }
    if (!storageKey || storageKey.includes('\0')) {
      next();
      return;
    }

    const uploadsRoot = resolve(resolveUploadsRoot());
    const filePath = resolve(uploadsRoot, storageKey);
    const relativePath = relative(uploadsRoot, filePath);
    if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
      next();
      return;
    }

    let access: 'public' | 'private' | 'blocked' | undefined;
    try {
      access = await mediaService.getStorageAccess(storageKey);
    } catch {
      res.status(503).end();
      return;
    }
    if (access === 'private' || access === 'blocked') {
      res.status(404).end();
      return;
    }

    setMediaResponseHeaders(storageKey, res);

    if (
      access === 'public' &&
      storageReadPreference === 's3' &&
      await streamUploadFromObjectStorage(storageKey, res)
    ) {
      return;
    }

    if (existsSync(filePath)) {
      res.sendFile(filePath, (error: Error | null) => {
        if (error && !res.headersSent) next(error);
      });
      return;
    }

    if (access === 'public' && await streamUploadFromObjectStorage(storageKey, res)) {
      return;
    }

    if (storageKey.startsWith('image/')) {
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.redirect(302, '/placeholder.svg');
      return;
    }

    next();
  });


  const jsonBodyLimit = process.env.JSON_BODY_LIMIT || '2mb';
  const urlEncodedBodyLimit = process.env.URLENCODED_BODY_LIMIT || '2mb';
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ limit: urlEncodedBodyLimit, extended: true }));


  app.use(cookieParser());
  app.use((req, res, next) => securityMiddleware.use(req, res, next));
  app.use(csrfProtectionMiddleware);


  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    exceptionFactory: (errors) => {
      const flattenValidationErrors = (
        validationErrors: ValidationError[],
        parentPath = '',
      ): Array<{ field: string; messages: string[] }> => {
        const flattened: Array<{ field: string; messages: string[] }> = [];

        for (const error of validationErrors) {
          const currentPath = parentPath
            ? `${parentPath}.${error.property}`
            : error.property;

          if (error.constraints && Object.keys(error.constraints).length > 0) {
            flattened.push({
              field: currentPath,
              messages: Object.values(error.constraints),
            });
          }

          if (error.children && error.children.length > 0) {
            flattened.push(...flattenValidationErrors(error.children, currentPath));
          }
        }

        return flattened;
      };

      const formattedErrors = flattenValidationErrors(errors);
      writeStructuredLog('warn', 'validation_failed', { details: formattedErrors });
      return new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        details: formattedErrors,
      });
    },
  }));


  app.useGlobalFilters(new HttpExceptionFilter());

  // Normalize any /uploads URLs in all API responses to HTTPS production domain
  app.useGlobalInterceptors(new AbsoluteUploadsUrlInterceptor(app.get(UploadService)));


  app.setGlobalPrefix('api');


  const isProduction = isProductionEnvironment();
  const allowedOrigins = getAllowedCorsOrigins();

  if (isProduction && allowedOrigins.length === 0) {
    throw new Error(
      '[SECURITY] No allowed CORS origins configured. Set FRONTEND_URL and/or CORS_ALLOWED_ORIGINS.',
    );
  }

  app.use((req: any, res: any, next: any) => {
    // Swagger UI needs scripts/styles. Keep strict headers for API routes.
    if (!(req.path || '').startsWith('/api/docs')) {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'none'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
      );
    }
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    if (isProduction) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    next();
  });

  if (!isProduction) {
    writeStructuredLog('info', 'cors_mode', { mode: isProduction ? 'production' : 'development' });
  }

  app.enableCors({
    origin: (origin, callback) => {
      if (isCorsOriginAllowed(origin, allowedOrigins)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'X-CSRF-Token',
      'X-API-Key',
      'X-Chabaqa-Api-Key',
      'Cache-Control',
      'Pragma'
    ],
    exposedHeaders: ['Authorization', 'X-CSRF-Token', 'Content-Length', 'X-Request-Id'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400, // 24 hours
  });

  if (!isProduction) {
    writeStructuredLog('info', 'cors_enabled', { allowedOrigins });
  }

  // Always record request/error counters for Prometheus metrics.
  app.use((req, res, next) => {
    const url = req.originalUrl || req.url;
    const startedAt = process.hrtime.bigint();

    res.on('finish', () => {
      if (url.startsWith('/api/health')) {
        return;
      }

      monitoringService.incrementRequestCount();
      monitoringService.recordRequestDuration(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
      if (res.statusCode >= 500) {
        monitoringService.incrementErrorCount();
      }
    });

    next();
  });

  // Access log middleware (production-friendly). This feeds Dozzle with request/response stats.
  const enableAccessLog = process.env.HTTP_ACCESS_LOG !== 'false';
  if (enableAccessLog) {
    app.use((req, res, next) => {
      const startedAt = process.hrtime.bigint();
      const startedIso = new Date().toISOString();
      const url = req.originalUrl || req.url;

      res.on('finish', () => {
        if (url.startsWith('/api/health')) {
          return;
        }

        const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const status = res.statusCode;
        const contentLength = res.getHeader('content-length') || '-';
        const ip = req.ip || req.socket?.remoteAddress || '-';

        writeStructuredLog(status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', 'http_access', {
          requestId: (req as any).requestId,
          startedAt: startedIso,
          method: req.method,
          url,
          status,
          elapsedMs: Number(elapsedMs.toFixed(1)),
          size: contentLength,
          ip,
          userId: (req as any).user?._id || (req as any).user?.sub,
        });
      });

      next();
    });
  }


  // Start the application
  const port = process.env.PORT || 3000;
  const localIP = getLocalNetworkIp();

  const swaggerEnabled = !isProduction && isSwaggerEnabled();
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Shabaka API')
      .setDescription(`
      # Welcome to Shabaka API! 🚀
      
      A comprehensive community-based learning platform API that enables users to create, join, and manage educational communities, courses, challenges, and events.
      
      ## 🎯 Key Features
      - **Community Management**: Create and manage educational communities
      - **Course Creation**: Build comprehensive courses with sections and chapters
      - **Sequential Progression**: Control learning flow with sequential content unlocking
      - **Challenge System**: Create and participate in community challenges
      - **Event Management**: Organize and manage educational events
      - **File Upload**: Support for various file types (images, videos, documents)
      - **User Management**: Complete user profile and authentication system
      - **Admin Panel**: Administrative operations and system management
      
      ## 🔐 Authentication
      Most endpoints require authentication using JWT tokens. 
      
      **Get started:**
      1. Use \`/auth/login\` to authenticate and get your access token
      2. Include the token in the Authorization header: \`Bearer <your-token>\`
      3. For 2FA-enabled accounts, complete verification with \`/auth/verify-2fa\`
      
      ## 📚 API Structure
      - **Authentication**: User login, registration, password reset, 2FA
      - **Users**: Profile management, user operations
      - **Communities**: Community creation, joining, management
      - **Courses**: Course creation, enrollment, progress tracking
      - **Challenges**: Challenge participation and management
      - **Events**: Event creation and management
      - **Upload**: File upload and management
      - **Admin**: Administrative operations
      
      ## 🌟 Sequential Progression Feature
      The API includes a powerful sequential progression system that allows course creators to:
      - Enable sequential content unlocking
      - Control access to chapters based on completion
      - Set custom unlock messages
      - Manually unlock content for specific users
      
      ## 📖 Response Format
      All API responses follow a consistent format:
      \`\`\`json
      {
        "success": true,
        "message": "Operation completed successfully",
        "data": { ... }
      }
      \`\`\`
      
      ## 🚨 Error Handling
      Errors are returned with appropriate HTTP status codes and detailed messages:
      - **400**: Bad Request - Validation errors
      - **401**: Unauthorized - Authentication required
      - **403**: Forbidden - Insufficient permissions
      - **404**: Not Found - Resource not found
      - **409**: Conflict - Resource already exists
      - **500**: Internal Server Error - Server-side error
    `)
    .setVersion('2.0.0')
    .setContact('Shabaka Team', 'https://shabaka.com', 'support@shabaka.com')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer(`http://${localIP}:${port}`, 'Development Server')
    .addServer('https://api.shabaka.com', 'Production Server')
    .addServer('https://staging-api.shabaka.com', 'Staging Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token obtained from /auth/login',
        in: 'header',
      },
      'JWT-auth'
    )
    .addTag('Authentication', 'User authentication, registration, password reset, and 2FA verification')
    .addTag('Users', 'User profile management, account operations, and user data')
    .addTag('Community Management', 'Community creation, joining, management, and member operations')
    .addTag('Cours', 'Course creation, management, and content organization for creators')
    .addTag('Course Enrollment (User)', 'Course enrollment, progress tracking, and learning management for users')
    .addTag('Challenges', 'Community challenges, task management, and participation tracking')
    .addTag('Events', 'Event creation, management, ticketing, and attendee management')
    .addTag('Posts', 'Community posts, comments, and social interaction features')
    .addTag('Products', 'Product management, pricing, and e-commerce features within communities')
    .addTag('Upload', 'File upload, management, and media handling for various content types')
    .addTag('Admin', 'Administrative operations, system management, and admin-only features')
    .addTag('Resources', 'Resource management, organization, and content library features')
    .addTag('Sessions', 'User session management, booking, and one-on-one interactions')
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      deepScanRoutes: true,
      ignoreGlobalPrefix: false,
    });

    // Custom Swagger UI configuration
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        tryItOutEnabled: true,
        filter: true,
        showRequestHeaders: true,
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
        displayRequestDuration: true,
        deepLinking: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        validatorUrl: null,
        supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch']
      },
      customSiteTitle: 'Shabaka API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
      .swagger-ui .topbar { display: none; }
      .swagger-ui .info .title { 
        color: #2c3e50; 
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
      }
      .swagger-ui .info .description { 
        font-size: 1.1rem;
        line-height: 1.6;
        color: #555;
      }
      .swagger-ui .info .contact { 
        margin-top: 1rem;
      }
      .swagger-ui .scheme-container { 
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin: 1rem 0;
      }
      .swagger-ui .btn.authorize { 
        background-color: #007bff;
        border-color: #007bff;
      }
      .swagger-ui .btn.authorize:hover { 
        background-color: #0056b3;
        border-color: #0056b3;
      }
      .swagger-ui .opblock.opblock-post { 
        border-color: #28a745;
      }
      .swagger-ui .opblock.opblock-get { 
        border-color: #007bff;
      }
      .swagger-ui .opblock.opblock-put { 
        border-color: #ffc107;
      }
      .swagger-ui .opblock.opblock-delete { 
        border-color: #dc3545;
      }
      .swagger-ui .opblock.opblock-patch { 
        border-color: #6f42c1;
      }
      .swagger-ui .opblock .opblock-summary-description { 
        font-style: italic;
        color: #666;
      }
      .swagger-ui .response-col_status { 
        font-weight: bold;
      }
      .swagger-ui .response-col_description__inner p { 
        margin: 0.5rem 0;
      }
      .swagger-ui .model-example { 
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 0.5rem;
        margin: 0.5rem 0;
      }
      .swagger-ui .highlight-code { 
        background-color: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 4px;
        padding: 1rem;
        margin: 1rem 0;
        overflow-x: auto;
      }
      .swagger-ui .parameter__name { 
        font-weight: 600;
        color: #2c3e50;
      }
      .swagger-ui .parameter__type { 
        color: #6c757d;
        font-size: 0.9rem;
      }
      .swagger-ui .parameter__deprecated { 
        background-color: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        padding: 0.5rem;
        margin: 0.5rem 0;
      }
      .swagger-ui .model-title { 
        color: #2c3e50;
        font-weight: 600;
      }
      .swagger-ui .model .property { 
        border-bottom: 1px solid #e9ecef;
        padding: 0.5rem 0;
      }
      .swagger-ui .model .property:last-child { 
        border-bottom: none;
      }
      .swagger-ui .model .property.primitive { 
        color: #6c757d;
      }
      .swagger-ui .model .property.required { 
        color: #dc3545;
        font-weight: 600;
      }
      .swagger-ui .model .property.required::after { 
        content: ' *';
        color: #dc3545;
      }
      .swagger-ui .opblock-tag { 
        border-bottom: 2px solid #007bff;
        margin-bottom: 1rem;
      }
      .swagger-ui .opblock-tag small { 
        color: #6c757d;
        font-style: italic;
      }
      .swagger-ui .opblock-tag.no-desc small { 
        display: none;
      }
      .swagger-ui .opblock-tag small:after { 
        content: '';
      }
      .swagger-ui .opblock-tag small:before { 
        content: '';
      }
      .swagger-ui .opblock-tag small { 
        display: block;
        margin-top: 0.5rem;
        font-size: 0.9rem;
        line-height: 1.4;
      }
    `,
      customJs: [
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js',
        'https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js'
      ],
      customJsStr: [
        'console.log("Shabaka API Documentation loaded successfully!");',
        '',
        '// Wait for Swagger UI to be ready',
        'setTimeout(() => {',
        '  // Add copy button for code examples',
        '  const codeBlocks = document.querySelectorAll(".highlight-code pre");',
        '  codeBlocks.forEach(block => {',
        '    const button = document.createElement("button");',
        '    button.textContent = "Copy";',
        '    button.className = "copy-button";',
        '    button.style.cssText = "position: absolute; top: 10px; right: 10px; background: #007bff; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;";',
        '    block.style.position = "relative";',
        '    block.appendChild(button);',
        '    ',
        '    button.addEventListener("click", () => {',
        '      navigator.clipboard.writeText(block.textContent);',
        '      button.textContent = "Copied!";',
        '      setTimeout(() => { button.textContent = "Copy"; }, 2000);',
        '    });',
        '  });',
        '}, 1000);'
      ].join('\n')
    });
  } else {
    writeStructuredLog('info', 'swagger_disabled', { reason: 'disabled_by_environment' });
  }

  const host = process.env.HOST || (isProduction ? '127.0.0.1' : '0.0.0.0');
  await app.listen(port, host);

  const baseUrl = `http://${localIP}:${port}`;

  if (isProduction) {
    writeStructuredLog('info', 'server_started', {
      port,
      host,
      baseUrl,
      environment: 'production',
      swaggerEnabled,
    });
  } else {
    writeStructuredLog('info', 'server_started', {
      port,
      host,
      localIP,
      baseUrl,
      environment: 'development',
      endpoints: {
        localhostDocs: `http://localhost:${port}/api/docs`,
        localhostRegister: `http://localhost:${port}/api/auth/register`,
        lanDocs: `http://${localIP}:${port}/api/docs`,
        lanRegister: `http://${localIP}:${port}/api/auth/register`,
        androidDocs: `http://10.0.2.2:${port}/api/docs`,
        androidRegister: `http://10.0.2.2:${port}/api/auth/register`,
      },
      mobileEnvExamples: [
        `EXPO_PUBLIC_API_URL=http://${localIP}:${port}`,
        `EXPO_PUBLIC_API_URL=http://10.0.2.2:${port}`,
        `EXPO_PUBLIC_API_URL=http://localhost:${port}`,
      ],
      corsEnabled: true,
      requestLoggingEnabled: enableAccessLog,
      mongoConnected: true,
      swaggerEnabled,
    });
  }
}
bootstrap();
