import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminHeader } from '../admin-header';
import { adminApi } from '@/lib/api/admin-api';

jest.mock('next/navigation', () => ({
  usePathname: () => '/en/admin/dashboard',
}));

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) =>
    ({
      notifications: 'Notifications',
      toggleNavigation: 'Toggle navigation',
      openAdminMenu: 'Open admin menu',
      profile: 'Profile',
      settings: 'Settings',
      logout: 'Logout',
    }[key] || key),
}));

jest.mock('@/lib/i18n/client', () => ({
  localizeHref: (_pathname: string, href: string) => href,
}));

jest.mock('../../providers/admin-layout-provider', () => ({
  useAdminLayout: () => ({
    toggleSidebar: jest.fn(),
  }),
}));

jest.mock('../../providers/admin-auth-provider', () => ({
  useAdminAuth: () => ({
    admin: {
      name: 'Admin User',
      email: 'admin@chabaqa.com',
      role: 'super_admin',
    },
    logout: jest.fn(),
  }),
}));

jest.mock('@/components/language-switcher', () => ({
  LanguageSwitcher: () => <div>LanguageSwitcher</div>,
}));

jest.mock('@/lib/api/admin-api', () => ({
  adminApi: {
    notifications: {
      getSummary: jest.fn(),
      getFeed: jest.fn(),
    },
  },
}));

const mockedAdminApi = adminApi as jest.Mocked<typeof adminApi>;
const mockedGetSummary = adminApi.notifications.getSummary as jest.MockedFunction<typeof adminApi.notifications.getSummary>;
const mockedGetFeed = adminApi.notifications.getFeed as jest.MockedFunction<typeof adminApi.notifications.getFeed>;

describe('AdminHeader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads and displays the live admin notification count', async () => {
    mockedGetSummary.mockResolvedValue({
      total: 5,
      items: [],
      generatedAt: '2026-03-09T10:00:00.000Z',
    });
    mockedGetFeed.mockResolvedValue({
      total: 5,
      generatedAt: '2026-03-09T10:00:00.000Z',
      items: [
        {
          id: 'n1',
          category: 'security_alerts',
          severity: 'critical',
          title: 'Critical alert',
          message: 'Repeated failures',
          href: '/admin/security/events',
          createdAt: '2026-03-09T09:55:00.000Z',
        },
      ],
    });

    render(<AdminHeader title="Dashboard" />);

    await waitFor(() => {
      expect(screen.getByLabelText('5 unread notifications')).toBeInTheDocument();
    });
  });

  it('fails safely and hides the badge when notifications cannot be loaded', async () => {
    mockedGetSummary.mockRejectedValue(new Error('network'));
    mockedGetFeed.mockRejectedValue(new Error('network'));

    render(<AdminHeader title="Dashboard" />);

    await waitFor(() => {
      expect(mockedAdminApi.notifications.getSummary).toHaveBeenCalled();
    });

    expect(screen.queryByLabelText(/unread notifications/i)).not.toBeInTheDocument();
  });
});
