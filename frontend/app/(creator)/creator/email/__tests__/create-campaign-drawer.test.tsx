import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import EmailPage from '@/app/(creator)/creator/email/page'

jest.mock('@/hooks/use-dash-prefs', () => ({
  useDashPrefs: () => ({ lang: 'en' }),
}))

jest.mock('@/app/(creator)/creator/context/creator-community-context', () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId: 'community-1',
    selectedCommunity: { name: 'Test Community', slug: 'test-community' },
    isLoading: false,
  }),
}))

jest.mock('@/lib/api/email-campaigns.api', () => ({
  emailCampaignsApi: {
    getCommunityCampaigns: jest.fn().mockResolvedValue({ campaigns: [] }),
    getWelcomeTemplate: jest.fn().mockResolvedValue(null),
    getInactivityAutomations: jest.fn().mockResolvedValue([]),
    createCampaign: jest.fn().mockResolvedValue({
      _id: 'camp-1',
      title: 'Weekly Digest',
      subject: 'Hello',
      content: 'Body',
      status: 'draft',
      totalRecipients: 42,
      metadata: { audienceType: 'all' },
      createdAt: '2026-07-02T00:00:00.000Z',
    }),
    sendCampaign: jest.fn(),
    deleteCampaign: jest.fn(),
    createInactivityAutomation: jest.fn(),
    createWelcomeTemplate: jest.fn(),
    toggleWelcomeTemplate: jest.fn(),
    toggleInactivityAutomation: jest.fn(),
    deleteWelcomeTemplate: jest.fn(),
    previewAudience: jest.fn(),
  },
}))

jest.mock('@/app/(creator)/creator/marketing/components/email-template-cards', () => ({
  EmailTemplateCards: () => <div data-testid="email-template-cards" />,
}))

jest.mock('@/app/(creator)/creator/marketing/contacts/components/import-contacts-dialog', () => ({
  ImportContactsDialog: () => null,
}))

jest.mock('@/components/creator-dashboard/DashSidebar', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/creator-dashboard/DashTopbar', () => ({
  __esModule: true,
  default: () => null,
}))

describe('EmailPage CreateCampaignDrawer', () => {
  it('shows honest all-members audience copy without fake segment labels', async () => {
    render(<EmailPage />)

    await waitFor(() => {
      expect(screen.queryByText(/VIP Members/i)).not.toBeInTheDocument()
    })

    const newCampaignButtons = await screen.findAllByRole('button', { name: /new campaign/i })
    fireEvent.click(newCampaignButtons[0])

    expect(await screen.findByText('All community members')).toBeInTheDocument()
    expect(screen.getByText(/backend resolves recipients/i)).toBeInTheDocument()
    expect(screen.queryByText(/custom audience/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/VIP Members/i)).not.toBeInTheDocument()
  })
})
