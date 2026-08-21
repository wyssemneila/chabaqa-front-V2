import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AdminService } from '@/domains/admin/admin.service';
import { Admin } from '@/infrastructure/database/schemas/auth/admin.schema';
import { AdminUser, AdminRole, AdminPermission } from '@/domains/admin/schemas/admin-user.schema';
import { EmailService } from '@/shared/services/email.service';
import { TokenBlacklistService } from '@/shared/services/token-blacklist.service';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

describe('AdminService', () => {
  let service: AdminService;
  let mockAdminModel: any;
  let mockAdminUserModel: any;
  let mockVerificationCodeModel: any;
  let mockConnection: any;

  beforeEach(async () => {
    // Mock models
    mockAdminModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({}) }),
      countDocuments: jest.fn(),
      create: jest.fn(),
    };

    mockAdminUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn(),
      countDocuments: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockVerificationCodeModel = {
      findOne: jest.fn(),
      deleteMany: jest.fn(),
      deleteOne: jest.fn(),
      create: jest.fn(),
    };

    mockConnection = {
      db: {
        listCollections: jest.fn().mockReturnValue({
          toArray: jest.fn().mockResolvedValue([]),
        }),
        collection: jest.fn().mockReturnValue({
          deleteMany: jest.fn(),
        }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getModelToken(Admin.name),
          useValue: mockAdminModel,
        },
        {
          provide: getModelToken(AdminUser.name),
          useValue: mockAdminUserModel,
        },
        {
          provide: getModelToken('VerificationCode'),
          useValue: mockVerificationCodeModel,
        },
        {
          provide: 'DatabaseConnection',
          useValue: mockConnection,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock-token'),
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('mock-config'),
          },
        },
        {
          provide: EmailService,
          useValue: {
            send2FACode: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
        {
          provide: TokenBlacklistService,
          useValue: {
            isTokenRevoked: jest.fn().mockResolvedValue(false),
            revokeTokenFromJWT: jest.fn(),
            revokeAllUserTokens: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('isAdminUser', () => {
    it('should return true for valid admin user', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        roles: [AdminRole.SUPER_ADMIN],
        isActive: true,
      });

      const result = await service.isAdminUser(userId);
      expect(result).toBe(true);
      expect(mockAdminUserModel.findOne).toHaveBeenCalledWith({
        userId: new Types.ObjectId(userId),
        isActive: true,
      });
    });

    it('should return false for non-admin user', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue(null);

      const result = await service.isAdminUser(userId);
      expect(result).toBe(false);
    });

    it('should return false on error', async () => {
      const userId = 'invalid-id';
      mockAdminUserModel.findOne.mockRejectedValue(new Error('Invalid ObjectId'));

      const result = await service.isAdminUser(userId);
      expect(result).toBe(false);
    });
  });

  describe('getAdminUser', () => {
    it('should return admin user info for valid user', async () => {
      const userId = new Types.ObjectId().toString();
      const mockAdminUser = {
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        roles: [AdminRole.USER_MANAGER],
        permissions: [AdminPermission.VIEW_USERS],
        isActive: true,
        lastLoginAt: new Date(),
        lastActivityAt: new Date(),
      };

      mockAdminUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockAdminUser),
        }),
      });

      const result = await service.getAdminUser(userId);
      expect(result).toBeDefined();
      expect(result?._id).toEqual(mockAdminUser._id);
      expect(result?.roles).toEqual(mockAdminUser.roles);
      expect(result?.permissions).toEqual(mockAdminUser.permissions);
    });

    it('should return null for non-existent user', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await service.getAdminUser(userId);
      expect(result).toBeNull();
    });
  });

  describe('hasAdminRole', () => {
    it('should return true for user with required role', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        roles: [AdminRole.CONTENT_MODERATOR],
        isActive: true,
      });

      const result = await service.hasAdminRole(userId, AdminRole.CONTENT_MODERATOR);
      expect(result).toBe(true);
    });

    it('should return false for user without required role', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue(null);

      const result = await service.hasAdminRole(userId, AdminRole.SUPER_ADMIN);
      expect(result).toBe(false);
    });
  });

  describe('hasAdminPermission', () => {
    it('should return true for user with required permission', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue({
        _id: new Types.ObjectId(),
        userId: new Types.ObjectId(userId),
        permissions: [AdminPermission.VIEW_USERS],
        isActive: true,
      });

      const result = await service.hasAdminPermission(userId, AdminPermission.VIEW_USERS);
      expect(result).toBe(true);
    });

    it('should return false for user without required permission', async () => {
      const userId = new Types.ObjectId().toString();
      mockAdminUserModel.findOne.mockResolvedValue(null);

      const result = await service.hasAdminPermission(userId, AdminPermission.MANAGE_ADMIN_USERS);
      expect(result).toBe(false);
    });
  });

  describe('updateLastActivity', () => {
    it('should update last activity timestamp', async () => {
      const adminUserId = new Types.ObjectId().toString();
      mockAdminUserModel.findByIdAndUpdate.mockResolvedValue({});

      await service.updateLastActivity(adminUserId);
      expect(mockAdminUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        adminUserId,
        { lastActivityAt: expect.any(Date) }
      );
    });

    it('should not throw error on failure', async () => {
      const adminUserId = new Types.ObjectId().toString();
      mockAdminUserModel.findByIdAndUpdate.mockRejectedValue(new Error('Database error'));

      await expect(service.updateLastActivity(adminUserId)).resolves.not.toThrow();
    });
  });

  describe('admin security controls', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      delete process.env.ADMIN_ALLOW_PASSWORD_ONLY_LOGIN;
      delete process.env.ADMIN_LOGIN_LOCKOUT_THRESHOLD;
    });

    it('rejects weak admin passwords during admin creation', async () => {
      mockAdminModel.findOne.mockResolvedValue(null);

      await expect(service.createAdmin({
        name: 'Root',
        email: 'root@example.com',
        password: 'adminpassword123',
        role: 'admin' as any,
      })).rejects.toThrow('Admin password must be at least 12 characters');
    });

    it('locks admin accounts after repeated failed passwords', async () => {
      process.env.ADMIN_LOGIN_LOCKOUT_THRESHOLD = '3';
      const adminId = new Types.ObjectId();
      const hashedPassword = await bcrypt.hash('Correct#Password1', 12);
      const admin = {
        _id: adminId,
        email: 'root@example.com',
        password: hashedPassword,
        failedLoginAttempts: 2,
        lockoutUntil: null,
      };
      mockAdminModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(admin),
      });
      await expect(service.validateAdmin('root@example.com', 'wrong')).rejects.toThrow('Email ou mot de passe incorrect');

      expect(mockAdminModel.findByIdAndUpdate).toHaveBeenCalledWith(
        adminId,
        {
          $set: expect.objectContaining({
            failedLoginAttempts: 3,
            lockoutUntil: expect.any(Date),
          }),
        },
      );
    });

    it('requires admin 2FA unless explicitly disabled', async () => {
      const adminId = new Types.ObjectId();
      jest.spyOn(service, 'validateAdmin').mockResolvedValue({
        _id: adminId,
        email: 'root@example.com',
        name: 'Root',
        role: 'admin',
      } as any);
      mockVerificationCodeModel.deleteMany.mockResolvedValue({});
      mockVerificationCodeModel.create.mockResolvedValue({});

      const result = await service.loginAdmin({
        email: 'root@example.com',
        password: 'Correct#Password1',
        remember_me: false,
      });

      expect(result.requires2FA).toBe(true);
      expect(mockVerificationCodeModel.create).toHaveBeenCalledWith(expect.objectContaining({
        adminId,
        type: '2fa',
        rememberMe: false,
      }));
    });

    it('rotates refresh tokens on admin refresh', async () => {
      const adminId = new Types.ObjectId();
      const jwtService = (service as any).jwtService as JwtService;
      const tokenBlacklistService = (service as any).tokenBlacklistService as TokenBlacklistService;
      const admin = {
        _id: adminId,
        email: 'root@example.com',
        name: 'Root',
        role: 'admin',
        createdAt: new Date(),
      };
      mockAdminModel.findById.mockResolvedValue(admin);
      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: adminId,
        email: admin.email,
        role: admin.role,
        jti: 'old-refresh-token',
        iat: 1,
        exp: Math.floor(Date.now() / 1000) + 3600,
        rememberMe: false,
      });
      (jwtService.sign as jest.Mock)
        .mockReturnValueOnce('new-access-token')
        .mockReturnValueOnce('new-refresh-token');

      const result = await service.refreshToken('old-refresh-token');

      expect(tokenBlacklistService.revokeTokenFromJWT).toHaveBeenCalledWith(
        adminId,
        expect.objectContaining({ jti: 'old-refresh-token' }),
        'refresh',
      );
      expect(result).toMatchObject({
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 1800,
      });
    });
  });
});
