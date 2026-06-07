import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { AffiliateService } from '@/domains/community/affiliate/affiliate.service';
import { AffiliateProgram } from '@/domains/community/affiliate/schemas/affiliate-program.schema';
import { AffiliatePartner } from '@/domains/community/affiliate/schemas/affiliate-partner.schema';
import { AffiliateLink } from '@/domains/community/affiliate/schemas/affiliate-link.schema';
import { AffiliateClick } from '@/domains/community/affiliate/schemas/affiliate-click.schema';
import { AffiliateConversion } from '@/domains/community/affiliate/schemas/affiliate-conversion.schema';

describe('AffiliateService marketing intelligence', () => {
  let service: AffiliateService;

  const mockProgramModel: any = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };
  const mockPartnerModel: any = {
    findOneAndUpdate: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
  };
  const mockLinkModel: any = {
    exists: jest.fn(),
    create: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockClickModel: any = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
  };
  const mockConversionModel: any = {
    aggregate: jest.fn(),
    countDocuments: jest.fn(),
    find: jest.fn(),
  };
  const mockUserModel: any = {
    findById: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AffiliateService,
        { provide: getModelToken(AffiliateProgram.name), useValue: mockProgramModel },
        { provide: getModelToken(AffiliatePartner.name), useValue: mockPartnerModel },
        { provide: getModelToken(AffiliateLink.name), useValue: mockLinkModel },
        { provide: getModelToken(AffiliateClick.name), useValue: mockClickModel },
        { provide: getModelToken(AffiliateConversion.name), useValue: mockConversionModel },
        { provide: getModelToken('User'), useValue: mockUserModel },
      ],
    }).compile();

    service = module.get<AffiliateService>(AffiliateService);
  });

  it('previews commission math without requiring a saved program', async () => {
    const result = await service.previewAffiliateCommission(new Types.ObjectId().toString(), {
      amountDT: 120,
      creatorNetDT: 90,
      commissionPercent: 20,
    });

    expect(result).toMatchObject({
      amountDT: 120,
      creatorNetDT: 90,
      commissionPercent: 20,
      commissionDT: 18,
      creatorKeepsDT: 72,
      currency: 'TND',
    });
  });

  it('returns empty marketing intelligence with merge fields and templates when no programs exist', async () => {
    const creatorId = new Types.ObjectId().toString();
    mockProgramModel.find.mockReturnValue({
      lean: jest.fn().mockResolvedValue([]),
    });
    mockUserModel.findById.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue({ _id: creatorId, name: 'Creator One', email: 'creator@test.dev' }),
      }),
    });

    const result = await service.getCreatorMarketingData(creatorId, { days: '7' });

    expect(result.summary).toMatchObject({
      clicks: 0,
      conversions: 0,
      totalRevenueDT: 0,
      totalCommissionDT: 0,
      programCount: 0,
    });
    expect(result.mergeFields.length).toBeGreaterThan(0);
    expect(result.templates.length).toBeGreaterThan(0);
    expect(result.insights.some((insight: any) => insight.type === 'program_setup')).toBe(true);
  });
});
