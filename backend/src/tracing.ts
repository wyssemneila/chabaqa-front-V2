import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { writeStructuredLog } from '@/shared/utils/log-sanitizer.util';

const enabled = process.env.OTEL_ENABLED === 'true' || Boolean(process.env.OTEL_EXPORTER_OTLP_ENDPOINT);

let sdk: NodeSDK | undefined;

if (enabled) {
  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME || 'chabaqa-backend',
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  writeStructuredLog('info', 'otel_started', {
    serviceName: process.env.OTEL_SERVICE_NAME || 'chabaqa-backend',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
  });
}

process.on('SIGTERM', () => {
  sdk?.shutdown()
    .then(() => writeStructuredLog('info', 'otel_shutdown'))
    .catch((error) => writeStructuredLog('error', 'otel_shutdown_failed', { error }));
});
