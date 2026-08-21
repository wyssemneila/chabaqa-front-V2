import { CommunitiesController } from '@/domains/community/communities/communities.controller';
import { CourseEnrollmentController } from '@/domains/learning/course-enrollment/course-enrollment.controller';
import { WalletController } from '@/domains/commerce/wallet/wallet.controller';
import { WalletAdminController } from '@/domains/commerce/wallet/wallet-admin.controller';
import { SessionController } from '@/domains/commerce/session/session.controller';
import { UploadController } from '@/domains/shared/upload/upload.controller';
import { AiController } from '@/domains/shared/ai/ai.controller';
import { ProgressionController } from '@/domains/learning/progression/progression.controller';
import { LearningPathController } from '@/domains/learning/learning-path/learning-path.controller';
import { AnalyticsController } from '@/domains/analytics/analytics.controller';

function instantiate<T>(ControllerClass: new (...args: any[]) => T): T {
  return new ControllerClass(...Array.from({ length: ControllerClass.length }, () => ({})));
}

describe('Phase 2 controller smoke coverage', () => {
  it.each([
    ['communities', CommunitiesController],
    ['course enrollment', CourseEnrollmentController],
    ['wallet', WalletController],
    ['wallet admin', WalletAdminController],
    ['session', SessionController],
    ['upload', UploadController],
    ['ai', AiController],
    ['progression', ProgressionController],
    ['learning path', LearningPathController],
    ['analytics', AnalyticsController],
  ] as Array<[string, new (...args: any[]) => any]>)('constructs %s controller', (_name, ControllerClass) => {
    expect(instantiate(ControllerClass)).toBeInstanceOf(ControllerClass);
  });
});
