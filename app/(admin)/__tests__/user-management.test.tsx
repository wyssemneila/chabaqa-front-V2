/**
 * User Management Integration Tests
 * Tests user CRUD operations and management features
 */

import { adminApi } from '@/lib/api/admin-api';

// Mock the API client
jest.mock('@/lib/api/admin-api');

describe('User Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User List Operations', () => {
    it('should fetch users with filters', async () => {
      const mockUsers = {
        users: [
          {
            _id: 'user-1',
            username: 'testuser1',
            email: 'test1@example.com',
            status: 'active',
            role: 'member',
            createdAt: new Date('2024-01-01'),
          },
          {
            _id: 'user-2',
            username: 'testuser2',
            email: 'test2@example.com',
            status: 'suspended',
            role: 'creator',
            createdAt: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      (adminApi.users.getUsers as jest.Mock).mockResolvedValue(mockUsers);

      const filters = {
        page: 1,
        limit: 10,
        status: 'active' as const,
        search: 'test',
      };

      const result = await adminApi.users.getUsers(filters);

      expect(adminApi.users.getUsers).toHaveBeenCalledWith(filters);
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should fetch user details', async () => {
      const mockUserDetails = {
        user: {
          _id: 'user-1',
          username: 'testuser',
          email: 'test@example.com',
          status: 'active',
          role: 'member',
        },
        activityHistory: [],
        subscriptions: [],
        communities: [],
        statistics: {
          totalSpent: 100,
          totalCommunities: 2,
          totalCourses: 5,
          accountAge: 365,
        },
      };

      (adminApi.users.getUserDetails as jest.Mock).mockResolvedValue(mockUserDetails);

      const result = await adminApi.users.getUserDetails('user-1');

      expect(adminApi.users.getUserDetails).toHaveBeenCalledWith('user-1');
      expect(result.user._id).toBe('user-1');
      expect(result.statistics.totalCommunities).toBe(2);
    });
  });

  describe('User Actions', () => {
    it('should suspend a user', async () => {
      const mockResponse = {
        success: true,
        message: 'User suspended successfully',
      };

      (adminApi.users.suspendUser as jest.Mock).mockResolvedValue(mockResponse);

      const suspendData = {
        reason: 'Policy violation',
        notifyUser: true,
      };

      const result = await adminApi.users.suspendUser('user-1', suspendData);

      expect(adminApi.users.suspendUser).toHaveBeenCalledWith('user-1', suspendData);
      expect(result.success).toBe(true);
    });

    it('should activate a suspended user', async () => {
      const mockResponse = {
        success: true,
        message: 'User activated successfully',
      };

      (adminApi.users.activateUser as jest.Mock).mockResolvedValue(mockResponse);

      const activateData = {
        reason: 'Appeal approved',
        notifyUser: true,
      };

      const result = await adminApi.users.activateUser('user-1', activateData);

      expect(adminApi.users.activateUser).toHaveBeenCalledWith('user-1', activateData);
      expect(result.success).toBe(true);
    });

    it('should reset user password', async () => {
      const mockResponse = {
        success: true,
        message: 'Password reset email sent',
      };

      (adminApi.users.resetPassword as jest.Mock).mockResolvedValue(mockResponse);

      const resetData = {
        sendEmail: true,
      };

      const result = await adminApi.users.resetPassword('user-1', resetData);

      expect(adminApi.users.resetPassword).toHaveBeenCalledWith('user-1', resetData);
      expect(result.success).toBe(true);
    });

    it('should update user notes', async () => {
      const mockResponse = {
        success: true,
        notes: 'Updated notes',
      };

      (adminApi.users.updateNotes as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.users.updateNotes('user-1', 'Updated notes');

      expect(adminApi.users.updateNotes).toHaveBeenCalledWith('user-1', 'Updated notes');
      expect(result.success).toBe(true);
    });
  });

  describe('User Analytics', () => {
    it('should fetch user analytics', async () => {
      const mockAnalytics = {
        totalUsers: 1000,
        activeUsers: 750,
        newUsers: 50,
        suspendedUsers: 10,
        growth: 5.2,
      };

      (adminApi.users.getAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await adminApi.users.getAnalytics('month');

      expect(adminApi.users.getAnalytics).toHaveBeenCalledWith('month');
      expect(result.totalUsers).toBe(1000);
      expect(result.growth).toBe(5.2);
    });
  });
});
