import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import HelpPage from '@/app/(creator)/creator/help/page'

const replace = jest.fn()
const startHelpConversation = jest.fn().mockResolvedValue({ conversation: { id: 'conv-1' } })

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: replace, replace }),
}))

jest.mock('@/lib/api/dm.api', () => ({
  dmApi: { startHelpConversation: (...args: unknown[]) => startHelpConversation(...args) },
}))

jest.mock('sonner', () => ({
  toast: { error: jest.fn() },
}))

jest.mock('@/components/creator-dashboard/DashSidebar', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('@/components/creator-dashboard/DashTopbar', () => ({
  __esModule: true,
  default: () => null,
}))

describe('Creator HelpPage', () => {
  beforeEach(() => {
    startHelpConversation.mockClear()
    replace.mockClear()
  })

  it('renders static documentation banner', () => {
    render(<HelpPage />)
    expect(screen.getByText(/Static documentation/i)).toBeInTheDocument()
  })

  it('does not show fake video view counts', () => {
    render(<HelpPage />)
    expect(screen.queryByText(/4\.2k views/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/views/i)).not.toBeInTheDocument()
  })

  it('starts live chat via dm API', async () => {
    render(<HelpPage />)
    fireEvent.click(screen.getByRole('button', { name: /Live Chat/i }))
    await waitFor(() => {
      expect(startHelpConversation).toHaveBeenCalled()
      expect(replace).toHaveBeenCalledWith('/creator/messages')
    })
  })
})
