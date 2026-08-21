import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UploadService } from '@/domains/shared/upload/upload.service';

@Injectable()
export class AbsoluteUploadsUrlInterceptor implements NestInterceptor {
  constructor(private readonly uploadService: UploadService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.normalizeDeep(data, new WeakSet<object>())),
    );
  }

  private isPlainObject(value: any): boolean {
    if (value === null || typeof value !== 'object') return false;
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
  }

  private isImageLikeKey(key?: string): boolean {
    return Boolean(key && /(image|images|avatar|photo|picture|thumbnail|thumb|logo|cover|banner|background)/i.test(key));
  }

  private isBareImageFilename(value: string): boolean {
    return /^[^/?#]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(value);
  }

  private normalizeDeep(value: any, seen: WeakSet<object>, key?: string): any {
    if (value === null || value === undefined) return value;

    // Normalize Mongoose documents and other class instances to JSON if possible
    if (typeof value === 'object' && !Array.isArray(value) && !this.isPlainObject(value)) {
      if (typeof (value as any).toJSON === 'function') {
        try {
          const json = (value as any).toJSON();
          return this.normalizeDeep(json, seen, key);
        } catch {
          return value;
        }
      }
      // Do not attempt to traverse non-plain objects (Dates, Buffers, Maps, etc.)
      return value;
    }

    if (typeof value === 'object') {
      if (seen.has(value as object)) return value;
      seen.add(value as object);
    }

    if (Array.isArray(value)) {
      return value.map((v) => this.normalizeDeep(v, seen, key));
    }

    if (typeof value === 'object') {
      const out: any = {};
      for (const [k, v] of Object.entries(value)) {
        out[k] = this.normalizeDeep(v, seen, k);
      }
      return out;
    }

    if (typeof value === 'string') {
      // Only touch strings that look like upload paths/URLs
      if (value.includes('/uploads/') || value.startsWith('uploads/')) {
        return this.uploadService.ensureAbsoluteUrl(value);
      }
      if (value.startsWith('http') && value.includes('/uploads/')) {
        return this.uploadService.ensureAbsoluteUrl(value);
      }
      if (this.isImageLikeKey(key) && this.isBareImageFilename(value)) {
        return this.uploadService.ensureAbsoluteUrl(`uploads/image/${value}`);
      }
      return value;
    }

    return value;
  }
}
