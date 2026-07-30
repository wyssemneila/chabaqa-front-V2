import { render, screen } from '@testing-library/react'
import CreatorClientLayout from '../creator-client-layout'

jest.mock('@/components/ui/toaster', () => ({ Toaster: () => null }))

describe('CreatorClientLayout', () => {
  it('provides the creator theme boundary', () => {
    render(<CreatorClientLayout><div>Creator content</div></CreatorClientLayout>)
    expect(screen.getByText('Creator content').parentElement).toHaveClass('creator-theme')
  })
})
