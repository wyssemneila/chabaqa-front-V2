import { render, waitFor } from '@testing-library/react'
import CustomizeRedirectPage from '@/app/(creator)/creator/customize/page'

const replace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}))

jest.mock('sonner', () => ({
  toast: { info: jest.fn() },
}))

const mockUseCreatorCommunity = jest.fn()

jest.mock('@/app/(creator)/creator/context/creator-community-context', () => ({
  useCreatorCommunity: () => mockUseCreatorCommunity(),
}))

describe('CustomizeRedirectPage', () => {
  beforeEach(() => {
    replace.mockClear()
    mockUseCreatorCommunity.mockReturnValue({
      selectedCommunity: { slug: 'design-hub', name: 'Design Hub' },
      isLoading: false,
    })
  })

  it('redirects to community-scoped customize when slug is present', async () => {
    render(<CustomizeRedirectPage />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/creator/community/design-hub/customize')
    })
  })

  it('redirects to communities list when no community is selected', async () => {
    mockUseCreatorCommunity.mockReturnValue({
      selectedCommunity: null,
      isLoading: false,
    })

    render(<CustomizeRedirectPage />)

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/creator/communities')
    })
  })
})
