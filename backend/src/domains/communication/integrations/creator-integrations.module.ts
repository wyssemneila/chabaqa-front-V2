import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CreatorIntegrationsController, CreatorIntegrationsOAuthController, CreatorIntegrationsPublicController } from './creator-integrations.controller';
import { CreatorIntegrationsService } from './creator-integrations.service';
import { CreatorApiKeyThrottlerGuard } from './creator-api-key-throttler.guard';
import { CreatorApiKey, CreatorApiKeySchema, CreatorIntegration, CreatorIntegrationContactConsent, CreatorIntegrationContactConsentSchema, CreatorIntegrationDelivery, CreatorIntegrationDeliverySchema, CreatorIntegrationOAuthState, CreatorIntegrationOAuthStateSchema, CreatorIntegrationSchema, CreatorWebhook, CreatorWebhookDelivery, CreatorWebhookDeliverySchema, CreatorWebhookSchema } from '@/infrastructure/database/schemas/communication/creator-integration.schema';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { PolicyModule } from '@/shared/modules/policy.module';

@Global()
@Module({
  imports: [PolicyModule, MongooseModule.forFeature([
    { name: CreatorIntegration.name, schema: CreatorIntegrationSchema },
    { name: CreatorIntegrationOAuthState.name, schema: CreatorIntegrationOAuthStateSchema },
    { name: CreatorIntegrationContactConsent.name, schema: CreatorIntegrationContactConsentSchema },
    { name: CreatorIntegrationDelivery.name, schema: CreatorIntegrationDeliverySchema },
    { name: CreatorWebhook.name, schema: CreatorWebhookSchema },
    { name: CreatorWebhookDelivery.name, schema: CreatorWebhookDeliverySchema },
    { name: CreatorApiKey.name, schema: CreatorApiKeySchema },
    { name: Community.name, schema: CommunitySchema },
    { name: User.name, schema: UserSchema },
  ])],
  controllers: [CreatorIntegrationsController, CreatorIntegrationsOAuthController, CreatorIntegrationsPublicController],
  providers: [CreatorIntegrationsService, CreatorApiKeyThrottlerGuard],
  exports: [CreatorIntegrationsService],
})
export class CreatorIntegrationsModule {}
