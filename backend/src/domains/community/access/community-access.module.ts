import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Community, CommunitySchema } from '@/infrastructure/database/schemas/community/community.schema';
import {
  CommunityStaff,
  CommunityStaffSchema,
} from '@/infrastructure/database/schemas/community/community-staff.schema';
import { CommunityAccessService } from '@/domains/community/access/community-access.service';
import { CommunityStaffController } from '@/domains/community/access/community-staff.controller';
import { CommunityMeAccessController } from '@/domains/community/access/community-me-access.controller';
import { CommunityPermissionGuard } from '@/domains/community/access/community-permission.guard';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Community.name, schema: CommunitySchema },
      { name: CommunityStaff.name, schema: CommunityStaffSchema },
    ]),
  ],
  controllers: [CommunityStaffController, CommunityMeAccessController],
  providers: [CommunityAccessService, CommunityPermissionGuard],
  exports: [CommunityAccessService, CommunityPermissionGuard],
})
export class CommunityAccessModule {}
