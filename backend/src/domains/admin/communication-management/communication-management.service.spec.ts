import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CommunicationManagementService } from '@/domains/admin/communication-management/communication-management.service';
import { EmailCampaign } from '@/infrastructure/database/schemas/communication/email-campaign.schema';
import { User } from '@/infrastructure/database/schemas/auth/user.schema';
import { Community } from '@/infrastructure/database/schemas/community/community.schema';
import { Notification } from '@/infrastructure/database/schemas/communication/notification.schema';
import { NotificationConfig } from '@/domains/admin/schemas/notification-config.schema';
import { EmailTemplate } from '@/domains/admin/schemas/email-template.schema';
import { EmailService } from '@/shared/services/email.service';
import { NotificationService } from '@/domains/communication/notification/notification.service';
import { AuditLogService } from '@/domains/admin/common/services/audit-log.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('CommunicationManagementService - Email Template Management', () => {
  let service: CommunicationManagementService;
  let emailTemplateModel: any;
  let auditLogService: any;

  const mockEmailTemplate = {
    _id: new Types.ObjectId(),
    name: 'Welcome Email',
    description: 'Welcome email for new users',
    category: 'welcome',
    subject: 'Welcome to {{platformName}}, {{userName}}!',
    content: '<h1>Welcome {{userName}}!</h1><p>We are excited to have you on {{platformName}}.</p>',
    variables: ['userName', 'platformName'],
    isActive: true,
    tags: ['onboarding'],
    metadata: {},
    createdBy: new Types.ObjectId(),
    currentVersion: 1,
    versionHistory: [],
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: jest.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const mockSave = jest.fn().mockResolvedValue({
      ...mockEmailTemplate,
      _id: new Types.ObjectId(),
    });

    const mockEmailTemplateModel: any = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: mockSave,
    }));

    Object.assign(mockEmailTemplateModel, {
      findOne: jest.fn(),
      find: jest.fn().mockReturnThis(),
      findById: jest.fn().mockReturnThis(),
      findByIdAndDelete: jest.fn(),
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    });

    const mockAuditLogService = {
      logAction: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunicationManagementService,
        {
          provide: getModelToken(EmailCampaign.name),
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: getModelToken(Community.name),
          useValue: {},
        },
        {
          provide: getModelToken(Notification.name),
          useValue: {},
        },
        {
          provide: getModelToken(NotificationConfig.name),
          useValue: {},
        },
        {
          provide: getModelToken(EmailTemplate.name),
          useValue: mockEmailTemplateModel,
        },
        {
          provide: EmailService,
          useValue: {
            sendGenericEmail: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: NotificationService,
          useValue: {},
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<CommunicationManagementService>(CommunicationManagementService);
    emailTemplateModel = module.get(getModelToken(EmailTemplate.name));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  describe('createEmailTemplate', () => {
    it('should create a new email template', async () => {
      const dto = {
        name: 'Welcome Email',
        description: 'Welcome email for new users',
        category: 'welcome' as any,
        subject: 'Welcome to {{platformName}}, {{userName}}!',
        content: '<h1>Welcome {{userName}}!</h1>',
        variables: ['userName', 'platformName'],
        isActive: true,
        tags: ['onboarding'],
      };

      emailTemplateModel.findOne.mockResolvedValue(null);

      const result = await service.createEmailTemplate(
        dto,
        new Types.ObjectId().toString(),
        '127.0.0.1',
        'test-agent',
      );

      expect(emailTemplateModel.findOne).toHaveBeenCalledWith({ name: dto.name });
      expect(auditLogService.logAction).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('should throw error if template name already exists', async () => {
      const dto = {
        name: 'Welcome Email',
        description: 'Welcome email for new users',
        category: 'welcome' as any,
        subject: 'Welcome!',
        content: '<h1>Welcome!</h1>',
      };

      emailTemplateModel.findOne.mockResolvedValue(mockEmailTemplate);

      await expect(
        service.createEmailTemplate(dto, new Types.ObjectId().toString(), '127.0.0.1', 'test-agent'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getEmailTemplates', () => {
    it('should return filtered email templates', async () => {
      const templates = [mockEmailTemplate];
      emailTemplateModel.exec.mockResolvedValue(templates);

      const result = await service.getEmailTemplates({
        category: 'welcome' as any,
        isActive: true,
      });

      expect(emailTemplateModel.find).toHaveBeenCalled();
      expect(emailTemplateModel.populate).toHaveBeenCalled();
      expect(emailTemplateModel.sort).toHaveBeenCalled();
    });
  });

  describe('getEmailTemplateById', () => {
    it('should return template by id', async () => {
      emailTemplateModel.exec.mockResolvedValue(mockEmailTemplate);

      const result = await service.getEmailTemplateById(mockEmailTemplate._id.toString());

      expect(emailTemplateModel.findById).toHaveBeenCalledWith(mockEmailTemplate._id.toString());
      expect(result).toEqual(mockEmailTemplate);
    });

    it('should throw NotFoundException if template not found', async () => {
      emailTemplateModel.exec.mockResolvedValue(null);

      await expect(
        service.getEmailTemplateById('nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('previewTemplate', () => {
    it('should preview template with test data', async () => {
      emailTemplateModel.exec.mockResolvedValue(mockEmailTemplate);

      const testData = {
        userName: 'John Doe',
        platformName: 'Chabaqa',
      };

      const result = await service.previewTemplate(
        mockEmailTemplate._id.toString(),
        testData,
      );

      expect(result.subject).toContain('John Doe');
      expect(result.subject).toContain('Chabaqa');
      expect(result.content).toContain('John Doe');
      expect(result.variables).toEqual(mockEmailTemplate.variables);
    });
  });
});
