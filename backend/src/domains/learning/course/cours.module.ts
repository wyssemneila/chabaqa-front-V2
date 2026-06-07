import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { CoursController } from '@/domains/learning/course/cours.controller';
import { CoursService } from '@/domains/learning/course/cours.service';
import { CoursContentService } from '@/domains/learning/course/services/cours-content.service';
import { CoursEnrollmentService } from '@/domains/learning/course/services/cours-enrollment.service';
import { CoursProgressionService } from '@/domains/learning/course/services/cours-progression.service';
import { CoursTrackingService } from '@/domains/learning/course/services/cours-tracking.service';
import { CoursNotesService } from '@/domains/learning/course/services/cours-notes.service';
import { CoursRewardsService } from '@/domains/learning/course/services/cours-rewards.service';
import { CoursSchema, CourseEnrollmentSchema, CourseProgressSchema } from '@/infrastructure/database/schemas/learning/course.schema';
import { UserCourseNote, UserCourseNoteSchema } from '@/infrastructure/database/schemas/learning/user-course-note.schema';
import { CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import { UserSchema } from '@/infrastructure/database/schemas/auth/user.schema';
import { OrderSchema } from '@/infrastructure/database/schemas/commerce/order.schema';
import { ContentProgressSchema } from '@/infrastructure/database/schemas/learning/content-tracking.schema';
import { UploadModule } from '@/domains/shared/upload/upload.module';
import { TrackingModule } from '@/shared/modules/tracking.module';
import { PolicyModule } from '@/shared/modules/policy.module';
import { FeeModule } from '@/shared/modules/fee.module';
import { PromoModule } from '@/shared/modules/promo.module';
import { ChapterAccessModule } from '@/shared/modules/chapter-access.module';
import { AchievementModule } from '@/domains/shared/achievement/achievement.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Cours', schema: CoursSchema },
      { name: 'CourseEnrollment', schema: CourseEnrollmentSchema },
      { name: 'CourseProgress', schema: CourseProgressSchema },
      { name: UserCourseNote.name, schema: UserCourseNoteSchema },
      { name: 'Community', schema: CommunitySchema },
      { name: 'User', schema: UserSchema },
      { name: 'Order', schema: OrderSchema },
      { name: 'ContentProgress', schema: ContentProgressSchema }
    ]),
    MulterModule.register({
      storage: diskStorage({
        destination: (req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase();
          let folder = 'uploads';
          if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) {
            folder = 'uploads/image';
          } else if (['.mp4', '.mov', '.webm'].includes(extension)) {
            folder = 'uploads/video';
          } else if (['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt', '.ppt', '.pptx', '.xls', '.xlsx', '.csv'].includes(extension)) {
            folder = 'uploads/document';
          } else if (['.mp3', '.wav', '.ogg', '.aac', '.flac'].includes(extension)) {
            folder = 'uploads/audio';
          }
          cb(null, folder);
        },
        filename: (req, file, cb) => {
          const extension = extname(file.originalname);
          const uuid = uuidv4();
          const timestamp = Date.now();
          const uniqueName = `${timestamp}-${uuid}${extension}`;
          cb(null, uniqueName);
        }
      }),
      limits: {
        fileSize: 500 * 1024 * 1024, // 500MB max
      },
    }),
    UploadModule,
    TrackingModule,
    PolicyModule,
    FeeModule,
    PromoModule,
    ChapterAccessModule,
    AchievementModule
  ],
  controllers: [CoursController],
  providers: [
    CoursService,
    CoursContentService,
    CoursEnrollmentService,
    CoursProgressionService,
    CoursTrackingService,
    CoursNotesService,
    CoursRewardsService,
  ],
  exports: [
    CoursService,
    CoursContentService,
    CoursEnrollmentService,
    CoursProgressionService,
    CoursTrackingService,
    CoursNotesService,
    CoursRewardsService,
  ]
})
export class CoursModule {} 
