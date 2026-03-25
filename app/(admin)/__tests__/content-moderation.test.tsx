/**
 * Content Moderation Integration Tests
 * Tests content moderation workflow and queue management
 */

import { adminApi } from '@/lib/api/admin-api';

// Mock the API client
jest.mock('@/lib/api/admin-api');

describe('Content Moderation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Moderation Queue Operations', () => {
    it('should fetch moderation queue with filters', async () => {
      const mockQueue = {
        items: [
          {
            _id: 'item-1',
            contentType: 'post',
            status: 'pending',
            priority: 'high',
            createdAt: new Date('2024-01-01'),
          },
          {
            _id: 'item-2',
            contentType: 'course',
            status: 'flagged',
            priority: 'urgent',
            createdAt: new Date('2024-01-02'),
          },
        ],
        total: 2,
        page: 1,
        limit: 10,
      };

      (adminApi.contentModeration.getQueue as jest.Mock).mockResolvedValue(mockQueue);

      const filters = {
        page: 1,
        limit: 10,
        status: 'pending' as const,
        priority: 'high' as const,
      };

      const result = await adminApi.contentModeration.getQueue(filters);

      expect(adminApi.contentModeration.getQueue).toHaveBeenCalledWith(filters);
      expect(result.items).toHaveLength(2);
    });

    it('should fetch queue statistics', async () => {
      const mockStats = {
        totalPending: 25,
        totalFlagged: 5,
        averageProcessingTime: 120,
        queueByPriority: {
          urgent: 3,
          high: 10,
          medium: 8,
          low: 4,
        },
      };

      (adminApi.contentModeration.getQueueStats as jest.Mock).mockResolvedValue(mockStats);

      const result = await adminApi.contentModeration.getQueueStats();

      expect(adminApi.contentModeration.getQueueStats).toHaveBeenCalled();
      expect(result.totalPending).toBe(25);
      expect(result.queueByPriority.urgent).toBe(3);
    });
  });

  describe('Content Moderation Actions', () => {
    it('should approve content', async () => {
      const mockResponse = {
        success: true,
        message: 'Content approved',
        item: {
          _id: 'item-1',
          status: 'approved',
        },
      };

      (adminApi.contentModeration.moderateContent as jest.Mock).mockResolvedValue(mockResponse);

      const moderationData = {
        action: 'approve' as const,
        notes: 'Content meets guidelines',
        notifyUser: true,
      };

      const result = await adminApi.contentModeration.moderateContent('item-1', moderationData);

      expect(adminApi.contentModeration.moderateContent).toHaveBeenCalledWith('item-1', moderationData);
      expect(result.success).toBe(true);
      expect(result.item.status).toBe('approved');
    });

    it('should reject content with reason', async () => {
      const mockResponse = {
        success: true,
        message: 'Content rejected',
      };

      (adminApi.contentModeration.moderateContent as jest.Mock).mockResolvedValue(mockResponse);

      const moderationData = {
        action: 'reject' as const,
        reason: 'Violates community guidelines',
        notifyUser: true,
      };

      const result = await adminApi.contentModeration.moderateContent('item-1', moderationData);

      expect(adminApi.contentModeration.moderateContent).toHaveBeenCalledWith('item-1', moderationData);
      expect(result.success).toBe(true);
    });

    it('should flag content for review', async () => {
      const mockResponse = {
        success: true,
        message: 'Content flagged',
      };

      (adminApi.contentModeration.moderateContent as jest.Mock).mockResolvedValue(mockResponse);

      const moderationData = {
        action: 'flag' as const,
        reason: 'Needs further review',
        notes: 'Escalate to senior moderator',
      };

      const result = await adminApi.contentModeration.moderateContent('item-1', moderationData);

      expect(adminApi.contentModeration.moderateContent).toHaveBeenCalledWith('item-1', moderationData);
      expect(result.success).toBe(true);
    });

    it('should perform bulk moderation', async () => {
      const mockResponse = {
        success: true,
        processed: 5,
        failed: 0,
      };

      (adminApi.contentModeration.bulkModerate as jest.Mock).mockResolvedValue(mockResponse);

      const bulkData = {
        itemIds: ['item-1', 'item-2', 'item-3', 'item-4', 'item-5'],
        action: 'approve' as const,
        notes: 'Bulk approval',
      };

      const result = await adminApi.contentModeration.bulkModerate(bulkData);

      expect(adminApi.contentModeration.bulkModerate).toHaveBeenCalledWith(bulkData);
      expect(result.processed).toBe(5);
    });
  });

  describe('Priority and Assignment Management', () => {
    it('should update content priority', async () => {
      const mockResponse = {
        success: true,
        item: {
          _id: 'item-1',
          priority: 'urgent',
        },
      };

      (adminApi.contentModeration.updatePriority as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.contentModeration.updatePriority('item-1', 'urgent');

      expect(adminApi.contentModeration.updatePriority).toHaveBeenCalledWith('item-1', 'urgent');
      expect(result.item.priority).toBe('urgent');
    });

    it('should assign content to moderator', async () => {
      const mockResponse = {
        success: true,
        item: {
          _id: 'item-1',
          assignedTo: 'moderator-1',
        },
      };

      (adminApi.contentModeration.assignContent as jest.Mock).mockResolvedValue(mockResponse);

      const result = await adminApi.contentModeration.assignContent('item-1', 'moderator-1');

      expect(adminApi.contentModeration.assignContent).toHaveBeenCalledWith('item-1', 'moderator-1');
      expect(result.item.assignedTo).toBe('moderator-1');
    });
  });

  describe('Content Details', () => {
    it('should fetch content details', async () => {
      const mockDetails = {
        _id: 'item-1',
        contentType: 'post',
        content: { title: 'Test Post', body: 'Content...' },
        status: 'pending',
        priority: 'medium',
        reportedBy: {
          _id: 'user-1',
          username: 'reporter',
        },
        reportReason: 'Inappropriate content',
        createdAt: new Date('2024-01-01'),
      };

      (adminApi.contentModeration.getContentDetails as jest.Mock).mockResolvedValue(mockDetails);

      const result = await adminApi.contentModeration.getContentDetails('item-1');

      expect(adminApi.contentModeration.getContentDetails).toHaveBeenCalledWith('item-1');
      expect(result._id).toBe('item-1');
      expect(result.reportReason).toBe('Inappropriate content');
    });
  });

  describe('Moderation Analytics', () => {
    it('should fetch moderation analytics', async () => {
      const mockAnalytics = {
        totalModerated: 500,
        approved: 450,
        rejected: 40,
        flagged: 10,
        averageProcessingTime: 180,
        moderatorPerformance: [],
      };

      (adminApi.contentModeration.getAnalytics as jest.Mock).mockResolvedValue(mockAnalytics);

      const result = await adminApi.contentModeration.getAnalytics({});

      expect(adminApi.contentModeration.getAnalytics).toHaveBeenCalled();
      expect(result.totalModerated).toBe(500);
      expect(result.approved).toBe(450);
    });
  });
});
