import { adminApi } from '@/lib/api/admin-api';
import { apiClient } from '@/lib/api-client';

jest.mock('@/lib/api-client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('adminApi normalization contracts', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes users to items + pagination + legacy aliases', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: {
        data: [{ _id: 'u1', name: 'User 1' }],
        total: 11,
        page: 2,
        limit: 5,
        totalPages: 3,
      },
    });

    const response = await adminApi.users.getUsers({ page: 2, limit: 5 });
    const payload = response.data;

    expect(payload.items).toHaveLength(1);
    expect(payload.data).toHaveLength(1);
    expect(payload.users).toHaveLength(1);
    expect(payload.total).toBe(11);
    expect(payload.page).toBe(2);
    expect(payload.limit).toBe(5);
    expect(payload.totalPages).toBe(3);
    expect(payload.pagination.total).toBe(11);
    expect(response.pagination?.total).toBe(11);
  });

  it('normalizes communities consistently from nested backend shape', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: {
        communities: [{ _id: 'c1', name: 'Community 1' }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    const response = await adminApi.communities.getCommunities({ page: 1, limit: 20 });
    const payload = response.data;

    expect(payload.items[0]._id).toBe('c1');
    expect(payload.communities[0]._id).toBe('c1');
    expect(payload.total).toBe(1);
    expect(payload.pagination.page).toBe(1);
  });

  it('normalizes moderation queue and exposes top-level pagination for existing screens', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: [{ _id: 'm1', status: 'pending' }],
      pagination: { page: 1, limit: 10, total: 33, totalPages: 4 },
    });

    const response = await adminApi.contentModeration.getQueue({ page: 1, limit: 10 });
    const payload = response.data;

    expect(payload.items).toHaveLength(1);
    expect(payload.data).toHaveLength(1);
    expect(payload.queue).toHaveLength(1);
    expect(payload.total).toBe(33);
    expect(response.pagination?.totalPages).toBe(4);
  });

  it('normalizes financial subscriptions from non-envelope backend payload', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      data: [
        {
          _id: 's1',
          creatorId: { _id: 'cr1', username: 'creator' },
          subscriberId: { _id: 'u1', email: 'user@test.com' },
          plan: 'pro',
          createdAt: '2026-03-09T00:00:00.000Z',
        },
      ],
      total: 7,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    const response = await adminApi.financial.getSubscriptions({ page: 1, limit: 20 });
    const payload = response.data;

    expect(payload.items).toHaveLength(1);
    expect(payload.subscriptions).toHaveLength(1);
    expect(payload.items[0].creator?._id).toBe('cr1');
    expect(payload.items[0].user?._id).toBe('u1');
    expect(payload.total).toBe(7);
    expect(payload.pagination.total).toBe(7);
  });

  it('uses backend events list without client-side faux pagination slicing', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      total: 3,
      data: [
        { _id: 'e1', type: 'suspicious_login', severity: 'high', description: 'A', resolved: false },
        { _id: 'e2', type: 'suspicious_login', severity: 'high', description: 'B', resolved: false },
        { _id: 'e3', type: 'suspicious_login', severity: 'high', description: 'C', resolved: false },
      ],
    });

    const response = await adminApi.security.getSecurityEvents({ page: 1, limit: 2 });
    const payload = response.data;

    expect(payload.items).toHaveLength(3);
    expect(payload.alerts).toHaveLength(3);
    expect(payload.total).toBe(3);
  });

  it('normalizes campaigns with consistent paginated contract', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: {
        campaigns: [
          {
            _id: 'cmp1',
            title: 'Spring',
            subject: 'Promo',
            metadata: { audienceTarget: 'all_users' },
            sentCount: 8,
            openCount: 3,
            clickCount: 1,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      },
    });

    const response = await adminApi.communication.getEmailCampaigns({ page: 1, limit: 20 });
    const payload = response.data;

    expect(payload.items).toHaveLength(1);
    expect(payload.campaigns).toHaveLength(1);
    expect(payload.items[0].name).toBe('Spring');
    expect(payload.items[0].analytics.sent).toBe(8);
    expect(payload.pagination.total).toBe(1);
  });

  it('normalizes admin notifications summary and feed contracts', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        success: true,
        data: {
          total: 6,
          items: [
            {
              category: 'pending_moderation',
              count: 4,
              label: 'Pending moderation',
              href: '/admin/content-moderation',
            },
          ],
          generatedAt: '2026-03-09T10:00:00.000Z',
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          total: 6,
          items: [
            {
              id: 'notif-1',
              category: 'security_alerts',
              severity: 'critical',
              title: 'Critical alert',
              message: 'Repeated failures',
              href: '/admin/security/events',
              createdAt: '2026-03-09T09:55:00.000Z',
              metadata: { alertType: 'multiple_failed_attempts' },
            },
          ],
          generatedAt: '2026-03-09T10:00:00.000Z',
        },
      });

    const summary = await adminApi.notifications.getSummary();
    const feed = await adminApi.notifications.getFeed(6);

    expect(summary.total).toBe(6);
    expect(summary.items[0]).toEqual(
      expect.objectContaining({
        category: 'pending_moderation',
        href: '/admin/content-moderation',
      }),
    );
    expect(feed.total).toBe(6);
    expect(feed.items[0]).toEqual(
      expect.objectContaining({
        id: 'notif-1',
        category: 'security_alerts',
        severity: 'critical',
      }),
    );
  });

  it('normalizes security config and reports contracts', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        success: true,
        data: {
          maxFailedLogins: 5,
          failedLoginTimeWindow: 15,
          enableGeographicMonitoring: true,
          alertRecipients: ['ops@chabaqa.com'],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          total: 4,
          sent: 2,
          pending: 1,
          failed: 1,
          byType: { security_alert: 3 },
          bySeverity: { high: 2 },
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          summary: { totalActions: 22 },
          alerts: [
            {
              id: 'sec-1',
              type: 'multiple_failed_attempts',
              severity: 'high',
              description: 'Repeated failures',
              resolved: false,
              timestamp: '2026-03-09T10:00:00.000Z',
            },
          ],
          recommendations: ['Rotate credentials'],
          riskScore: 42,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          auditLogRetention: true,
          accessControlImplemented: true,
          securityMonitoringActive: true,
          alertNotificationsConfigured: false,
          dataExportTracking: true,
          complianceScore: 80,
          recommendations: ['Enable alert recipients'],
        },
      });

    const config = await adminApi.security.getSecurityConfig();
    const stats = await adminApi.security.getNotificationStatistics();
    const auditReport = await adminApi.security.getAuditReport();
    const compliance = await adminApi.security.getComplianceReport();

    expect(config.data.enableGeographicMonitoring).toBe(true);
    expect(config.data.alertRecipients).toEqual(['ops@chabaqa.com']);
    expect(stats.data.total).toBe(4);
    expect(stats.data.byType.security_alert).toBe(3);
    expect(auditReport.data.riskScore).toBe(42);
    expect(auditReport.data.alerts[0]._id).toBe('sec-1');
    expect(compliance.data.complianceScore).toBe(80);
    expect(compliance.data.recommendations[0]).toBe('Enable alert recipients');
  });

  it('supports advanced audit search and custom export contracts', async () => {
    mockedApiClient.post
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            _id: 'log-1',
            action: 'audit_log_view',
            entityType: 'AuditLog',
            entityId: 'entity-1',
            adminUser: { _id: 'admin-1', name: 'Admin' },
            ipAddress: '127.0.0.1',
            userAgent: 'jest',
            createdAt: '2026-03-09T10:00:00.000Z',
            status: 'success',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          content: 'action,entityType\nview,AuditLog',
        },
      });

    const search = await adminApi.security.searchAuditLogs({ page: 1, limit: 20, searchTerm: 'audit' });
    const customExport = await adminApi.security.exportAuditLogsCustom({ format: 'csv' });

    expect(search.data.items).toHaveLength(1);
    expect(search.data.items[0]._id).toBe('log-1');
    expect(customExport.data.content).toContain('action,entityType');
  });

  it('normalizes communication notification config contracts', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: [
        {
          _id: 'cfg-1',
          name: 'campaign_updates',
          title: 'Campaign Updates',
          description: 'Send campaign status updates',
          channels: ['email', 'in_app'],
          enabled: true,
          isCritical: false,
        },
      ],
    });

    const response = await adminApi.communication.getNotificationConfigs();

    expect(response.data.configs).toHaveLength(1);
    expect(response.data.configs[0]).toEqual(
      expect.objectContaining({
        _id: 'cfg-1',
        name: 'campaign_updates',
        channels: ['email', 'in_app'],
      }),
    );
  });

  it('normalizes template advanced actions contracts', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        success: true,
        data: {
          _id: 'tpl-1',
          name: 'Welcome',
          subject: 'Hi {{name}}',
          content: 'Welcome to Chabaqa',
          variables: ['name'],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: [
          {
            version: 1,
            subject: 'Hi {{name}}',
            content: 'Welcome',
            variables: ['name'],
            createdAt: '2026-03-09T10:00:00.000Z',
          },
        ],
      });

    mockedApiClient.post
      .mockResolvedValueOnce({
        success: true,
        data: {
          subject: 'Hi Admin',
          content: 'Welcome Admin',
          variables: ['name'],
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          _id: 'tpl-2',
          name: 'Welcome Copy',
          subject: 'Hi {{name}}',
          content: 'Welcome to Chabaqa',
        },
      });

    const template = await adminApi.communication.getEmailTemplateById('tpl-1');
    const versions = await adminApi.communication.getTemplateVersionHistory('tpl-1');
    const preview = await adminApi.communication.previewTemplate('tpl-1', { name: 'Admin' });
    const duplicate = await adminApi.communication.duplicateTemplate('tpl-1', 'Welcome Copy');

    expect(template.data._id).toBe('tpl-1');
    expect(versions.data.versions[0].version).toBe(1);
    expect(preview.data.subject).toBe('Hi Admin');
    expect(duplicate.data._id).toBe('tpl-2');
  });

  it('normalizes export jobs and supports individual status refresh', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({
        success: true,
        data: {
          jobs: [
            {
              _id: 'job-1',
              type: 'users',
              format: 'csv',
              status: 'processing',
              progress: 30,
              createdAt: '2026-03-10T10:00:00.000Z',
            },
          ],
          total: 1,
        },
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          _id: 'job-1',
          type: 'users',
          format: 'csv',
          status: 'completed',
          progress: 100,
          fileSize: 1024,
          recordCount: 88,
          createdAt: '2026-03-10T10:00:00.000Z',
          completedAt: '2026-03-10T10:03:00.000Z',
        },
      });

    const jobs = await adminApi.exports.getJobs(50);
    const status = await adminApi.exports.getJobStatus('job-1');

    expect(jobs.data.total).toBe(1);
    expect(jobs.data.jobs[0]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        type: 'users',
        format: 'csv',
        status: 'processing',
        progress: 30,
      }),
    );
    expect(status.data).toEqual(
      expect.objectContaining({
        id: 'job-1',
        status: 'completed',
        progress: 100,
        fileSize: 1024,
        recordCount: 88,
      }),
    );
  });

  it('normalizes bulk operation activity and validation contracts', async () => {
    mockedApiClient.get.mockResolvedValueOnce({
      success: true,
      data: [
        {
          operationId: 'bulk-1',
          status: 'in_progress',
          totalItems: 20,
          processedItems: 8,
          successCount: 7,
          failureCount: 1,
          progressPercentage: 40,
          estimatedTimeRemaining: 50,
          startedAt: '2026-03-10T10:00:00.000Z',
          failures: [{ itemId: 'user-3', error: 'invalid status' }],
        },
      ],
    });
    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: {
        isValid: false,
        errors: [{ field: 'email', message: 'Invalid email format' }],
        warnings: [{ field: 'role', message: 'Deprecated role value' }],
        sanitizedData: { email: 'ops@chabaqa.com', role: 'admin' },
      },
    });

    const active = await adminApi.dataManagement.getActiveOperations();
    const validation = await adminApi.dataManagement.validate({
      data: { email: 'ops@chabaqa', role: 'super-admin' },
      constraints: { email: { type: 'email' } },
    });

    expect(active.data).toHaveLength(1);
    expect(active.data[0]).toEqual(
      expect.objectContaining({
        operationId: 'bulk-1',
        status: 'in_progress',
        totalItems: 20,
        processedItems: 8,
        progressPercentage: 40,
      }),
    );
    expect(active.data[0].failures[0]).toEqual(
      expect.objectContaining({
        itemId: 'user-3',
        error: 'invalid status',
      }),
    );
    expect(validation.data.isValid).toBe(false);
    expect(validation.data.errors[0].field).toBe('email');
    expect(validation.data.warnings[0].field).toBe('role');
    expect(validation.data.sanitizedData).toEqual(
      expect.objectContaining({ email: 'ops@chabaqa.com' }),
    );
  });

  it('exposes expanded /admin/analytics endpoint surface', async () => {
    mockedApiClient.get
      .mockResolvedValueOnce({ success: true, data: { overview: { users: 100 } } })
      .mockResolvedValueOnce({ success: true, data: { growthRate: 4.2 } })
      .mockResolvedValueOnce({ success: true, data: { engagementRate: 0.67 } })
      .mockResolvedValueOnce({ success: true, data: { totalRevenue: 12000 } })
      .mockResolvedValueOnce({ success: true, data: { healthScore: 91 } })
      .mockResolvedValueOnce({ success: true, data: { variance: -2.1 } });
    mockedApiClient.post.mockResolvedValueOnce({
      success: true,
      data: { reportId: 'rep-1', status: 'ready' },
    });

    const period = { startDate: '2026-03-01', endDate: '2026-03-10', granularity: 'day' as const };
    const dashboard = await adminApi.analytics.getAdminAnalyticsDashboard(period);
    const growth = await adminApi.analytics.getAdminUserGrowth(period);
    const engagement = await adminApi.analytics.getAdminEngagement(period);
    const revenue = await adminApi.analytics.getAdminRevenue(period);
    const health = await adminApi.analytics.getAdminHealth(period);
    const comparative = await adminApi.analytics.getAdminComparative(period);
    const report = await adminApi.analytics.generateAdminReport({
      type: 'executive',
      format: 'json',
      startDate: period.startDate,
      endDate: period.endDate,
    });

    expect(dashboard.data).toEqual(expect.objectContaining({ overview: { users: 100 } }));
    expect(growth.data).toEqual(expect.objectContaining({ growthRate: 4.2 }));
    expect(engagement.data).toEqual(expect.objectContaining({ engagementRate: 0.67 }));
    expect(revenue.data).toEqual(expect.objectContaining({ totalRevenue: 12000 }));
    expect(health.data).toEqual(expect.objectContaining({ healthScore: 91 }));
    expect(comparative.data).toEqual(expect.objectContaining({ variance: -2.1 }));
    expect(report.data).toEqual(expect.objectContaining({ reportId: 'rep-1', status: 'ready' }));
  });
});
