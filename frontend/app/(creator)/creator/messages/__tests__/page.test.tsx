import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import MessagesPage from '@/app/(creator)/creator/messages/page'

jest.mock('@/hooks/use-dash-prefs', () => ({
  useDashPrefs: () => ({ lang: 'en' }),
}))

jest.mock('@/app/(creator)/creator/context/creator-community-context', () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId: 'community-1',
    selectedCommunity: { name: 'Test Community' },
    isLoading: false,
  }),
}))

jest.mock('@/app/providers/auth-provider', () => ({
  useAuthContext: () => ({ user: { id: 'user-1', _id: 'user-1' } }),
}))

const listBroadcasts = jest.fn().mockResolvedValue({
  broadcasts: [{ _id: 'b1', id: 'b1', body: 'Hello everyone', status: 'sent', recipientCount: 10, sentCount: 10, failedCount: 0 }],
})
const listAutomations = jest.fn().mockResolvedValue({ automations: [] })

jest.mock('@/lib/api/dm-broadcasts.api', () => ({
  dmBroadcastsApi: {
    listBroadcasts: (...args: unknown[]) => listBroadcasts(...args),
    listAutomations: (...args: unknown[]) => listAutomations(...args),
    createBroadcast: jest.fn(),
    sendBroadcast: jest.fn(),
    createAutomation: jest.fn(),
    toggleAutomation: jest.fn(),
    deleteAutomation: jest.fn(),
  },
}))

jest.mock('@/lib/api/dm.api', () => ({
  dmApi: {
    listInbox: jest.fn().mockResolvedValue({ conversations: [] }),
    listMessages: jest.fn(),
    sendMessage: jest.fn(),
    markRead: jest.fn(),
  },
}))

jest.mock('@/components/creator-dashboard/DashSidebar', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/creator-dashboard/DashTopbar', () => ({
  __esModule: true,
  default: () => null,
}))

describe('MessagesPage broadcasts', () => {
  it('loads broadcasts from API when broadcasts tab is opened', async () => {
    render(<MessagesPage />)
    fireEvent.click(screen.getByRole('button', { name: /Broadcasts/i }))
    await waitFor(() => {
      expect(listBroadcasts).toHaveBeenCalledWith('community-1')
      expect(screen.getByText(/Hello everyone/i)).toBeInTheDocument()
      expect(screen.getByText(/10\/10 delivered/i)).toBeInTheDocument()
    })
  })
})
