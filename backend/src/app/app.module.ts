// src/app.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ServeStaticModule } from '@nestjs/serve-static';
import { extname, basename } from 'path';
import { resolveUploadsRoot } from '@/domains/shared/upload/upload-paths';
import { attachMongoSlowQueryLogger } from '@/shared/database/mongo-slow-query';

import { AppController } from '@/app/app.controller';
import { AppService } from '@/app/app.service';
import { User, UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { VerificationCode, VerificationCodeSchema } from '@/infrastructure/database/schemas/auth/verification-code.schema';
import { RevokedToken, RevokedTokenSchema } from '@/infrastructure/database/schemas/auth/revoked-token.schema';
import { Payout, PayoutSchema } from '@/infrastructure/database/schemas/commerce/payout.schema';
import { UserService } from '@/domains/user/user.service';
import { UserController } from '@/domains/user/user.controller';
import { AuthModule } from '@/domains/auth/auth.module';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { ResourceModule } from '@/domains/content/resource/resource.module';
import { AdminModule } from '@/domains/admin/admin.module';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { MediaModule } from '@/domains/content/media/media.module';
import { ChallengeModule } from '@/domains/learning/challenge/challenge.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { StripePaymentService } from '@/shared/services/stripe-payment.service';
import { PromoService } from '@/shared/services/promo.service';
import { FeeService } from '@/shared/services/fee.service';
import { PaymentAccessRevocationService } from '@/shared/services/payment-access-revocation.service';
import { PromoCode, PromoCodeSchema } from '@/infrastructure/database/schemas/commerce/promo-code.schema';
import { Subscription, SubscriptionSchema } from '@/infrastructure/database/schemas/commerce/subscription.schema';
import { CommunityMemberSubscription, CommunityMemberSubscriptionSchema } from '@/infrastructure/database/schemas/commerce/community-member-subscription.schema';
import { CourseEnrollmentSchema, CourseProgressSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { StorageUsage, StorageUsageSchema } from '@/infrastructure/database/schemas/shared/storage-usage.schema';
import { TrackingController } from '@/shared/controllers/tracking.controller';
import { PaymentController } from '@/shared/controllers/payment.controller';
import { Plan, PlanSchema } from '@/infrastructure/database/schemas/commerce/plan.schema';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { CoursSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { ChallengeSchema } from '@/infrastructure/database/schemas/learning/challenge.schema';
import { EventSchema } from '@/infrastructure/database/schemas/commerce/event.schema';
import { ProductSchema } from '@/infrastructure/database/schemas/commerce/product.schema';
import { SessionSchema } from '@/infrastructure/database/schemas/commerce/session.schema';
import { AnalyticsModule } from '@/domains/analytics/analytics.module';
import { EmailModule } from '@/domains/communication/email/email.module';
import { FeedbackModule } from '@/domains/content/feedback/feedback.module';
import { EmailCampaignModule } from '@/domains/communication/email-campaign/email-campaign.module';
import { WhatsappModule } from '@/domains/communication/whatsapp/whatsapp.module';
import { GoogleCalendarModule } from '@/domains/communication/google-calendar/google-calendar.module';
import { SecurityModule } from '@/shared/modules/security.module';
import { MonitoringModule } from '@/shared/modules/monitoring.module';
import { CacheModule } from '@/shared/modules/cache.module';
import { Achievement, AchievementSchema } from '@/infrastructure/database/schemas/shared/achievement.schema';
import { UserAchievement, UserAchievementSchema } from '@/infrastructure/database/schemas/shared/user-achievement.schema';
import { AiModule } from '@/domains/shared/ai/ai.module';
import { Ga4Module } from '@/domains/analytics/ga4/ga4.module';
import { LearningDomainModule } from '@/domains/learning/learning-domain.module';
import { CommerceDomainModule } from '@/domains/commerce/commerce-domain.module';
import { CommunityDomainModule } from '@/domains/community/community-domain.module';
import { LearningPathModule } from '@/domains/learning/learning-path/learning-path.module';
import { CommunityInvitationModule } from '@/domains/community/invitation/community-invitation.module';
import { AffiliateModule } from '@/domains/community/affiliate/affiliate.module';
import { CommunityFinanceModule } from '@/domains/community/finance/community-finance.module';
import { CommunityModerationModule } from '@/domains/community/moderation/community-moderation.module';
import { CommunitySupportModule } from '@/domains/community/support/community-support.module';
import { CommunityDmBroadcastModule } from '@/domains/community/dm-broadcast/community-dm-broadcast.module';
import { CommunityAccessModule } from '@/domains/community/access/community-access.module';
import { VideoModule } from '@/domains/shared/video/video.module';
import { SearchModule } from '@/domains/search/search.module';
import { CreatorIntegrationsModule } from '@/domains/communication/integrations/creator-integrations.module';

// Import new admin schemas
import { AdminUser, AdminUserSchema } from '@/domains/admin/schemas/admin-user.schema';
import { AuditLog, AuditLogSchema } from '@/domains/admin/schemas/audit-log.schema';
import { ContentModerationQueue, ContentModerationQueueSchema } from '@/domains/admin/schemas/content-moderation-queue.schema';
import { ChallengeSubmission, ChallengeSubmissionSchema } from '@/infrastructure/database/schemas/learning/challenge-submission.schema';
import { ProcessedWebhookEvent, ProcessedWebhookEventSchema } from '@/infrastructure/database/schemas/commerce/processed-webhook-event.schema';
import { PaymentAuditLog, PaymentAuditLogSchema } from '@/infrastructure/database/schemas/commerce/payment-audit-log.schema';

@Module({
  imports: [
    // 1) charge .env globalement
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),

    // 2) Configuration pour servir les fichiers statiques
    // NOTE: Video files are served via X-Accel-Redirect through VideoModule.
    // ServeStaticModule only serves images, documents, and audio.
    ServeStaticModule.forRoot({
      rootPath: resolveUploadsRoot(),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        setHeaders: (res, filePath) => {
          const extension = extname(filePath).toLowerCase();
          const filename = basename(filePath).replace(/["\r\n]/g, '_');
          const inlineSafeExtensions = new Set([
            '.jpg',
            '.jpeg',
            '.png',
            '.gif',
            '.webp',
            '.mp3',
            '.wav',
            '.ogg',
            '.aac',
            '.flac',
            '.mp4',
            '.mov',
            '.webm',
          ]);

          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
          res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

          if (!inlineSafeExtensions.has(extension)) {
            res.setHeader('Content-Disposition', `attachment; filename="${filename || 'download'}"`);
          }
        },
      },
    }),

    // 3) connexion MongoDB + test immédiat
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,
        connectionFactory: (connection) => {
          // log OK / KO
          connection.on('connected', async () => {
            console.log('✅ MongoDB connected!');

            /* --- test vivant : lister les collections --- */
            try {
              const cols = await connection.db.listCollections().toArray();
              console.log(
                '📊 MongoDB is alive. Collections:',
                cols.map((c: any) => c.name),
              );
            } catch (err: any) {
              console.error('❌ Test query failed:', err);
            }
          });

          connection.on('error', (err: any) =>
            console.error('❌ MongoDB connection error:', err),
          );

          attachMongoSlowQueryLogger(connection);

          return connection;
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: VerificationCode.name, schema: VerificationCodeSchema },
      { name: RevokedToken.name, schema: RevokedTokenSchema },
      { name: Payout.name, schema: PayoutSchema },
      { name: Community.name, schema: CommunitySchema },
      { name: StorageUsage.name, schema: StorageUsageSchema },
      { name: Plan.name, schema: PlanSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'Cours', schema: CoursSchema },
      { name: 'Challenge', schema: ChallengeSchema },
      { name: 'Event', schema: EventSchema },
      { name: 'Product', schema: ProductSchema },
      { name: 'Session', schema: SessionSchema },
      { name: Achievement.name, schema: AchievementSchema },
      { name: UserAchievement.name, schema: UserAchievementSchema },
      { name: PromoCode.name, schema: PromoCodeSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: CommunityMemberSubscription.name, schema: CommunityMemberSubscriptionSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: 'CourseProgress', schema: CourseProgressSchema },
      // New admin schemas
      { name: AdminUser.name, schema: AdminUserSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: ContentModerationQueue.name, schema: ContentModerationQueueSchema },
      { name: ChallengeSubmission.name, schema: ChallengeSubmissionSchema },
      { name: ProcessedWebhookEvent.name, schema: ProcessedWebhookEventSchema },
      { name: PaymentAuditLog.name, schema: PaymentAuditLogSchema },
    ]),
    AuthModule,
    CommunityDomainModule,
    ResourceModule,
    EmailModule,
    CommerceDomainModule,
    AdminModule,
    LearningDomainModule,
    UploadModule,
    MediaModule,
    ChallengeModule,
    PolicyModule,
    AnalyticsModule,
    FeedbackModule,
    EmailCampaignModule,
    WhatsappModule,
    GoogleCalendarModule,
    SecurityModule,
    MonitoringModule,
    CacheModule,
    AiModule,
    LearningPathModule,
    Ga4Module,
    CommunityInvitationModule,
    AffiliateModule,
    CommunityFinanceModule,
    CommunityModerationModule,
    CommunitySupportModule,
    CommunityDmBroadcastModule,
    CommunityAccessModule,
    VideoModule,
    SearchModule,
    CreatorIntegrationsModule,
  ],
  controllers: [AppController, UserController, TrackingController, PaymentController],
  providers: [
    AppService,
    UserService,
    StripePaymentService,
    PromoService,
    FeeService,
    PaymentAccessRevocationService,
  ],
})
export class AppModule { }
