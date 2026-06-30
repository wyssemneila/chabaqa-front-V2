import { Module, Global } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { MonitoringService } from '@/shared/services/monitoring.service';
import { HealthController } from '@/shared/controllers/health.controller';
import { MetricsController } from '@/shared/controllers/metrics.controller';
import { WebhookRetryService } from '@/shared/services/webhook-retry.service';

@Global()
@Module({
  imports: [
    TerminusModule.forRoot({
      errorLogStyle: 'pretty',
      gracefulShutdownTimeoutMs: 1000,
    }),
  ],
  controllers: [HealthController, MetricsController],
  providers: [MonitoringService, WebhookRetryService],
  exports: [MonitoringService, WebhookRetryService],
})
export class MonitoringModule {}
