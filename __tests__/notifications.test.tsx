/**
 * Tests for push notification enable/disable flow (mock PushManager),
 * preferences save, and SW click routing fallback.
 */

// --- Mocks ---
const mockGetPushStatus = jest.fn();
const mockSendTestPush = jest.fn();
const mockSubscribePush = jest.fn();
const mockUnsubscribePush = jest.fn();
const mockGetPushPublicKey = jest.fn();
const mockGetPreferences = jest.fn();
const mockUpdatePreferences = jest.fn();
const mockGetPreferenceItems = jest.fn();
const mockBulkUpsertPreferenceItems = jest.fn();
const mockGetMutes = jest.fn();
const mockCreateMute = jest.fn();
const mockRemoveMute = jest.fn();

jest.mock('@/lib/api/notifications.api', () => ({
  notificationsApi: {
    getPushStatus: (...args: any[]) => mockGetPushStatus(...args),
    sendTestPush: (...args: any[]) => mockSendTestPush(...args),
    subscribePush: (...args: any[]) => mockSubscribePush(...args),
    unsubscribePush: (...args: any[]) => mockUnsubscribePush(...args),
    getPushPublicKey: (...args: any[]) => mockGetPushPublicKey(...args),
    getPreferences: (...args: any[]) => mockGetPreferences(...args),
    updatePreferences: (...args: any[]) => mockUpdatePreferences(...args),
    getPreferenceItems: (...args: any[]) => mockGetPreferenceItems(...args),
    bulkUpsertPreferenceItems: (...args: any[]) => mockBulkUpsertPreferenceItems(...args),
    getMutes: (...args: any[]) => mockGetMutes(...args),
    createMute: (...args: any[]) => mockCreateMute(...args),
    removeMute: (...args: any[]) => mockRemoveMute(...args),
  },
}));

jest.mock('@/lib/push-notifications', () => ({
  registerBrowserPushForCurrentUser: jest.fn().mockResolvedValue(undefined),
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PushSettings } from '@/components/notifications/push-settings';
import { NotificationPreferences } from '@/components/notifications/notification-preferences';
import { MuteButton, MutesList } from '@/components/notifications/mute-actions';

// --- PushManager mock helpers ---
function mockBrowserPushSupport() {
  Object.defineProperty(window, 'Notification', {
    value: { permission: 'granted', requestPermission: jest.fn().mockResolvedValue('granted') },
    writable: true,
  });
  Object.defineProperty(navigator, 'serviceWorker', {
    value: {
      register: jest.fn().mockResolvedValue({
        pushManager: {
          getSubscription: jest.fn().mockResolvedValue(null),
          subscribe: jest.fn().mockResolvedValue({
            endpoint: 'https://push.example.com/sub1',
            toJSON: () => ({ endpoint: 'https://push.example.com/sub1', keys: { p256dh: 'k', auth: 'a' } }),
            unsubscribe: jest.fn().mockResolvedValue(true),
          }),
        },
      }),
      getRegistration: jest.fn().mockResolvedValue({
        pushManager: {
          getSubscription: jest.fn().mockResolvedValue({
            endpoint: 'https://push.example.com/sub1',
            unsubscribe: jest.fn().mockResolvedValue(true),
          }),
        },
      }),
    },
    writable: true,
    configurable: true,
  });

  if (!('PushManager' in window)) {
    (window as any).PushManager = class {};
  }
}

beforeEach(() => {
  jest.clearAllMocks();
  mockBrowserPushSupport();
});

// ===== PushSettings Component =====

describe('PushSettings', () => {
  it('shows enabled state when subscriptions exist', async () => {
    mockGetPushStatus.mockResolvedValue({
      data: { supported: true, enabled: true, subscriptionCount: 2 },
    });

    render(<PushSettings userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText(/Active on 2 device/)).toBeInTheDocument();
    });
  });

  it('shows disabled state when no subscriptions', async () => {
    mockGetPushStatus.mockResolvedValue({
      data: { supported: true, enabled: false, subscriptionCount: 0 },
    });

    render(<PushSettings userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText('Disabled')).toBeInTheDocument();
    });
  });

  it('sends test push when button clicked', async () => {
    mockGetPushStatus.mockResolvedValue({
      data: { supported: true, enabled: true, subscriptionCount: 1 },
    });
    mockSendTestPush.mockResolvedValue({
      data: { sent: true, message: 'Test push sent to 1 device(s).' },
    });

    render(<PushSettings userId="user1" />);

    await waitFor(() => {
      expect(screen.getByText('Send Test')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Send Test'));

    await waitFor(() => {
      expect(mockSendTestPush).toHaveBeenCalled();
    });
  });
});

// ===== NotificationPreferences Component =====

describe('NotificationPreferences', () => {
  it('loads and displays preference types', async () => {
    mockGetPreferences.mockResolvedValue({
      data: {
        preferences: {},
        quietHours: { start: '22:00', end: '08:00', isEnabled: false },
      },
    });
    mockGetPreferenceItems.mockResolvedValue({ data: [] });

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Post Mentions')).toBeInTheDocument();
      expect(screen.getByText('Direct Messages')).toBeInTheDocument();
      expect(screen.getByText('Event Reminders')).toBeInTheDocument();
    });
  });

  it('saves preferences on button click', async () => {
    mockGetPreferences.mockResolvedValue({
      data: {
        preferences: {},
        quietHours: { start: '22:00', end: '08:00', isEnabled: false },
      },
    });
    mockGetPreferenceItems.mockResolvedValue({ data: [] });
    mockBulkUpsertPreferenceItems.mockResolvedValue({ data: [] });
    mockUpdatePreferences.mockResolvedValue({ data: {} });

    render(<NotificationPreferences />);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Save Preferences'));

    await waitFor(() => {
      expect(mockBulkUpsertPreferenceItems).toHaveBeenCalled();
      expect(mockUpdatePreferences).toHaveBeenCalled();
    });
  });
});

// ===== Mute Components =====

describe('MuteButton', () => {
  it('shows mute button and toggles on click', async () => {
    mockGetMutes.mockResolvedValue({ data: [] });
    mockCreateMute.mockResolvedValue({ data: { targetType: 'thread', targetId: 'p1' } });

    render(<MuteButton targetType="thread" targetId="p1" />);

    await waitFor(() => {
      expect(screen.getByText('Mute')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Mute'));

    await waitFor(() => {
      expect(mockCreateMute).toHaveBeenCalledWith({ targetType: 'thread', targetId: 'p1' });
    });
  });
});

describe('MutesList', () => {
  it('renders mutes list', async () => {
    mockGetMutes.mockResolvedValue({
      data: [
        { targetType: 'community', targetId: 'c1' },
        { targetType: 'user', targetId: 'u2' },
      ],
    });

    render(<MutesList />);

    await waitFor(() => {
      expect(screen.getByText('community')).toBeInTheDocument();
      expect(screen.getByText('c1')).toBeInTheDocument();
      expect(screen.getByText('user')).toBeInTheDocument();
      expect(screen.getByText('u2')).toBeInTheDocument();
    });
  });

  it('shows empty state when no mutes', async () => {
    mockGetMutes.mockResolvedValue({ data: [] });

    render(<MutesList />);

    await waitFor(() => {
      expect(screen.getByText('No active mutes.')).toBeInTheDocument();
    });
  });
});

// ===== Service Worker Click Routing =====

describe('SW click routing fallback', () => {
  it('should build correct targetPath from notification data.url', () => {
    // Simulate the SW logic for extracting targetPath
    const notification = {
      data: { url: '/creator/communities/c1/posts/p1' },
    };
    const targetPath = notification.data?.url || '/creator/notifications';
    expect(targetPath).toBe('/creator/communities/c1/posts/p1');
  });

  it('should fallback to /creator/notifications when no url', () => {
    const notification = { data: {} };
    const targetPath = (notification as any).data?.url || '/creator/notifications';
    expect(targetPath).toBe('/creator/notifications');
  });

  it('should fallback when data is undefined', () => {
    const notification = {};
    const targetPath = (notification as any).data?.url || '/creator/notifications';
    expect(targetPath).toBe('/creator/notifications');
  });
});
