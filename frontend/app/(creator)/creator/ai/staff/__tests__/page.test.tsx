import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AiStaffPage from '@/app/(creator)/creator/ai/staff/page'

jest.mock('@/app/(creator)/creator/context/creator-community-context', () => ({
  useCreatorCommunity: () => ({
    selectedCommunityId: 'community-1',
    selectedCommunity: { name: 'Test Community' },
    isLoading: false,
  }),
}))

jest.mock('@/hooks/creator-dashboard/use-ai-agents', () => ({
  useAiAgents: () => ({
    agents: [],
    knowledgeStatus: null,
    loading: false,
    error: '',
    refresh: jest.fn(),
    createAgent: jest.fn(),
    updateAgent: jest.fn(),
    removeAgent: jest.fn(),
    reindexKnowledge: jest.fn(),
  }),
}))

jest.mock('@/components/creator-dashboard/DashSidebar', () => ({
  __esModule: true,
  default: () => <div data-testid="dash-sidebar" />,
}))

jest.mock('@/components/creator-dashboard/DashTopbar', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

describe('AiStaffPage', () => {
  it('shows an empty state when no agents are returned', async () => {
    render(<AiStaffPage />)
    await waitFor(() => {
      expect(screen.getByText(/No staff members yet/i)).toBeInTheDocument()
    })
  })
})
