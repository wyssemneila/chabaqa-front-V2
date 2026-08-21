import type { Connection } from 'mongoose';
import { writeStructuredLog } from '@/shared/utils/log-sanitizer.util';

/** Log Mongo queries slower than MONGO_SLOW_QUERY_MS (default 100ms). Set 0 to disable. */
export function attachMongoSlowQueryLogger(connection: Connection): void {
  const thresholdMs = Number(process.env.MONGO_SLOW_QUERY_MS ?? 100);
  if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) return;

  connection.plugin(function slowQueryPlugin(schema) {
    schema.pre(/^find|^count|^aggregate|^update|^delete|^save|^insert/, function (this: any, next) {
      this._slowQueryStart = Date.now();
      next();
    });

    schema.post(/^find|^count|^aggregate|^update|^delete|^save|^insert/, function (this: any) {
      const started = this._slowQueryStart;
      if (!started) return;
      const durationMs = Date.now() - started;
      if (durationMs >= thresholdMs) {
        writeStructuredLog('warn', 'mongo_slow_query', {
          collection: this.model?.collection?.name,
          op: this.op,
          durationMs,
        });
      }
    });
  });
}
