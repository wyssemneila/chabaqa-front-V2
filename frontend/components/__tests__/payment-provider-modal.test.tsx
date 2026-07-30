import { fireEvent, render, screen } from '@testing-library/react'
import { PaymentProviderModal } from '../payment-provider-modal'

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt = '', ...props }: any) => <img alt={alt} {...props} />,
}))

describe('PaymentProviderModal', () => {
  it('renders official local Chabaqa and Stripe assets and starts payment', () => {
    const onSelect = jest.fn().mockResolvedValue(undefined)
    render(
      <PaymentProviderModal open onOpenChange={jest.fn()} onSelect={onSelect} />,
    )

    expect(screen.getByRole('img', { name: 'Chabaqa' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Stripe' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /credit or debit card/i }))
    expect(onSelect).toHaveBeenCalledWith('stripe')
  })

  it('shows errors and locks the action while redirecting', () => {
    render(
      <PaymentProviderModal
        open
        onOpenChange={jest.fn()}
        onSelect={jest.fn().mockResolvedValue(undefined)}
        isLoading
        error="Checkout is temporarily unavailable"
      />,
    )

    expect(screen.getByRole('button', { name: /credit or debit card/i })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Checkout is temporarily unavailable')
  })
})
