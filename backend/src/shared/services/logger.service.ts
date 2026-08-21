import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { sanitizeLogValue, writeStructuredLog } from '@/shared/utils/log-sanitizer.util';

/**
 * Production-optimized Logger Service
 * - Minimal logs in production
 * - Detailed logs in development
 * - All errors are always logged
 */
@Injectable()
export class Logger implements NestLoggerService {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
    }

    /**
     * Log regular messages (only in development)
     */
    log(message: string, context?: string) {
        if (this.isDevelopment) {
            writeStructuredLog('info', 'app_log', { context, message });
        }
    }

    /**
     * Log errors (always logged in all environments)
     */
    error(message: string, trace?: string, context?: string) {
        writeStructuredLog('error', 'app_error', { context, message, trace: sanitizeLogValue(trace) });
    }

    /**
     * Log warnings (always logged in all environments)
     */
    warn(message: string, context?: string) {
        writeStructuredLog('warn', 'app_warn', { context, message });
    }

    /**
     * Debug logs (only in development)
     */
    debug(message: string, context?: string) {
        if (this.isDevelopment) {
            writeStructuredLog('debug', 'app_debug', { context, message });
        }
    }

    /**
     * Verbose logs (only in development)
     */
    verbose(message: string, context?: string) {
        if (this.isDevelopment) {
            writeStructuredLog('info', 'app_verbose', { context, message });
        }
    }

    /**
     * Log HTTP requests (simplified in production)
     */
    http(method: string, url: string, statusCode?: number, origin?: string) {
        if (this.isDevelopment) {
            writeStructuredLog('info', 'http_request', { method, url, statusCode, origin });
        }
    }

    /**
     * Log critical startup information (always logged)
     */
    critical(message: string) {
        writeStructuredLog('info', 'startup', { message });
    }
}
