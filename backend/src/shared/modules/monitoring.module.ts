import { Module, Global } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringService } from '@/shared/services/monitoring.service';
import { HealthController } from '@/shared/controllers/health.controller';
import { MetricsController } from '@/shared/controllers/metrics.controller';
import { WebhookRetryService } from '@/shared/services/webhook-retry.service';
import { InternalMetricsGuard } from '@/shared/guards/internal-metrics.guard';
import { CacheModule } from '@/infrastructure/cache/cache.module';
import { CreatorIntegrationsModule } from '@/domains/communication/integrations/creator-integrations.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProcessedWebhookEvent,
  ProcessedWebhookEventSchema,
} from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';

@Global()
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      gracefulShutdownTimeoutMs: 1000,
    }),
    CacheModule,
    CreatorIntegrationsModule,
    MongooseModule.forFeature([
      { name: ProcessedWebhookEvent.name, schema: ProcessedWebhookEventSchema },
    ]),
  ],
  controllers: [HealthController, MetricsController],
   providers: [MonitoringService, WebhookRetryService, InternalMetricsGuard],
  exports: [MonitoringService, WebhookRetryService],
})
export class MonitoringModule {}
