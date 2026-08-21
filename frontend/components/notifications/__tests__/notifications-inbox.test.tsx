import React from 'react'
import { render, screen } from '@testing-library/react'
import { NotificationsInbox } from '@/components/notifications/notifications-inbox'

jest.mock('@/lib/api/notifications.api', () => ({
  notificationsApi: {
    getAll: jest.fn().mockResolvedValue({
      items: [
        {
          _id: 'n1',
          title: 'Payment received',
          message: 'You received a new payment.',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }),
    markAllAsRead: jest.fn(),
    markAsRead: jest.fn(),
    delete: jest.fn(),
  },
}))

describe('NotificationsInbox', () => {
  it('renders notifications from the API', async () => {
    render(<NotificationsInbox />)
    expect(await screen.findByText('Payment received')).toBeInTheDocument()
    expect(screen.getByText(/1 unread/i)).toBeInTheDocument()
  })
})
