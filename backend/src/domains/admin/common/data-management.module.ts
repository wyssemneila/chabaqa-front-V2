import { Module } from '@nestjs/common';
import { DataManagementService } from '@/domains/admin/common/services/data-management.service';
import { BulkOperationService } from '@/domains/admin/common/services/bulk-operation.service';
import { ValidationService } from '@/domains/admin/common/services/validation.service';
import { DataManagementController } from '@/domains/admin/common/controllers/data-management.controller';

/**
 * Module for data management services
 * Provides filtering, sorting, bulk operations, and validation
 */
@Module({
  controllers: [DataManagementController],
  providers: [DataManagementService, BulkOperationService, ValidationService],
  exports: [DataManagementService, BulkOperationService, ValidationService],
})
export class DataManagementModule {}
