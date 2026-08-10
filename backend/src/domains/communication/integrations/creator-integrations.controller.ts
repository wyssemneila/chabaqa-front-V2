import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, Request, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Response } from 'express';
import { JwtAuthGuard } from '@/domains/auth/guards/jwt-auth.guard';
import { CreatorApiKeyThrottlerGuard } from './creator-api-key-throttler.guard';
import { CreatorIntegrationsService } from './creator-integrations.service';

@ApiTags('Creator integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('creator/integrations')
export class CreatorIntegrationsController {
  constructor(private readonly service: CreatorIntegrationsService) {}

  private id(req: any): string {
    return String(req.user?._id || req.user?.sub || req.user?.userId || '');
  }

  @Get()
  list(@Request() request: any) { return this.service.list(this.id(request)); }

  @Get(':provider/setup')
  setup(@Request() request: any, @Param('provider') provider: string) { return this.service.setup(this.id(request), provider); }

  @Post()
  connect(@Request() request: any, @Body() body: any) { return this.service.connect(this.id(request), body); }

  @Post(':provider/oauth/start')
  startOAuth(@Request() request: any, @Param('provider') provider: string, @Body() body: any) {
    return this.service.startOAuth(this.id(request), provider, body);
  }

  @Post(':provider/credentials')
  saveCredentials(@Request() request: any, @Param('provider') provider: string, @Body() body: any) {
    return this.service.saveCredentials(this.id(request), provider, body);
  }

  @Patch(':provider/configuration')
  updateConfiguration(@Request() request: any, @Param('provider') provider: string, @Body() body: any) {
    return this.service.updateConfiguration(this.id(request), provider, body);
  }

  @Post(':provider/test')
  testConnection(@Request() request: any, @Param('provider') provider: string) {
    return this.service.testConnection(this.id(request), provider);
  }

  @Post('contact-consent')
  setContactConsent(@Request() request: any, @Body() body: any) {
    return this.service.setContactConsent(this.id(request), body);
  }

  @Get('contact-consents')
  contactConsentOptions(@Request() request: any) {
    return this.service.listContactConsentOptions(this.id(request));
  }

  @Get('contact-consents/:communityId')
  contactConsentOptionsForCommunity(@Request() request: any, @Param('communityId') communityId: string) {
    return this.service.listContactConsentOptionsForCommunity(this.id(request), communityId);
  }

  @Delete(':id')
  disconnect(@Request() request: any, @Param('id') id: string) { return this.service.disconnect(this.id(request), id); }

  @Get('webhooks')
  webhooks(@Request() request: any) { return this.service.listWebhooks(this.id(request)); }

  @Post('webhooks')
  createWebhook(@Request() request: any, @Body() body: any) { return this.service.createWebhook(this.id(request), body); }

  @Delete('webhooks/:id')
  deleteWebhook(@Request() request: any, @Param('id') id: string) { return this.service.deleteWebhook(this.id(request), id); }

  @Post('webhooks/:id/test')
  testWebhook(@Request() request: any, @Param('id') id: string) { return this.service.testWebhook(this.id(request), id); }

  @Get('deliveries')
  deliveries(@Request() request: any) { return this.service.listDeliveries(this.id(request)); }

  @Get('provider-deliveries')
  providerDeliveries(@Request() request: any) { return this.service.listProviderDeliveries(this.id(request)); }

  @Post('deliveries/:id/replay')
  replay(@Request() request: any, @Param('id') id: string) { return this.service.replayDelivery(this.id(request), id); }

  @Get('api-keys')
  keys(@Request() request: any) { return this.service.listApiKeys(this.id(request)); }

  @Post('api-keys')
  createKey(@Request() request: any, @Body() body: any) { return this.service.createApiKey(this.id(request), body); }

  @Delete('api-keys/:id')
  revokeKey(@Request() request: any, @Param('id') id: string) { return this.service.revokeApiKey(this.id(request), id); }
}

/** OAuth callback is intentionally the only unauthenticated native connector
 * route. Its one-time, hashed state binds it to the initiating creator. */
@ApiTags('Creator integrations')
@Controller('creator/integrations/oauth')
export class CreatorIntegrationsOAuthController {
  constructor(private readonly service: CreatorIntegrationsService) {}

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('state') state: string,
    @Query('code') code: string | undefined,
    @Query('error') providerError: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    let success = false;
    try {
      await this.service.completeOAuth(provider, String(state || ''), code, providerError);
      success = true;
    } catch {
      success = false;
    }
    response.status(success ? 200 : 400);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    response.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
    response.send(this.service.oauthResultPage(provider, success));
  }
}

@ApiTags('Creator integrations public API')
@UseGuards(CreatorApiKeyThrottlerGuard)
@Throttle({ short: { limit: 10, ttl: 1000 }, medium: { limit: 60, ttl: 60000 }, long: { limit: 500, ttl: 3600000 } })
@Controller('creator/integrations/public/v1')
export class CreatorIntegrationsPublicController {
  constructor(private readonly service: CreatorIntegrationsService) {}

  @Get('contract')
  contract() { return this.service.apiContract(); }

  @Get('me')
  me(@Headers('x-chabaqa-api-key') key?: string) { return this.service.authenticateApiKey(String(key || '')); }

  @Get('communities')
  communities(@Headers('x-chabaqa-api-key') key?: string) { return this.service.publicCommunities(String(key || '')); }

  @Get('communities/:communityId')
  community(@Headers('x-chabaqa-api-key') key: string | undefined, @Param('communityId') communityId: string) {
    return this.service.publicCommunity(String(key || ''), communityId);
  }
}
