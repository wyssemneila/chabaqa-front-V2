import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ResourceController } from '@/domains/content/resource/resource.controller';
import { ResourceService } from '@/domains/content/resource/resource.service';
import { Resource, ResourceSchema } from '@/infrastructure/database/schemas/content/resource.schema';
import { AdminGuard } from '@/domains/auth/guards/admin.guard';
import { AuthModule } from '@/domains/auth/auth.module';
import { PolicyModule } from '@/shared/modules/policy.module';

/**
 * Module pour la gestion des ressources
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Resource.name, schema: ResourceSchema }
    ]),
    PassportModule,
    AuthModule,
    PolicyModule
  ],
  controllers: [ResourceController],
  providers: [
    ResourceService,
    AdminGuard,
    Reflector
  ],
  exports: [ResourceService]
})
export class ResourceModule {} 
