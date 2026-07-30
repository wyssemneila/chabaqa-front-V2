import { act, renderHook } from '@testing-library/react'
import { isSafeStripeCheckoutUrl, usePaymentProviderModal } from '../use-payment-provider-modal'

describe('usePaymentProviderModal', () => {
  beforeEach(() => {
    Object.defineProperty(global.crypto, 'randomUUID', { configurable: true, value: jest.fn(() => 'attempt-key') })
  })

  it('prevents duplicate submissions and reuses the attempt key', async () => {
    let resolve!: (value: unknown) => void
    const initStripe = jest.fn(() => new Promise((done) => { resolve = done }))
    const navigate = jest.fn()
    const { result } = renderHook(() => usePaymentProviderModal({ initStripe, navigate }))

    act(() => result.current.open())
    let first!: Promise<void>
    act(() => {
      first = result.current.handleSelect('stripe')
      void result.current.handleSelect('stripe')
    })
    expect(initStripe).toHaveBeenCalledTimes(1)
    expect(initStripe).toHaveBeenCalledWith('attempt-key')

    await act(async () => {
      resolve({ checkoutUrl: 'https://checkout.stripe.com/c/pay/test' })
      await first
    })
    expect(navigate).toHaveBeenCalledWith('https://checkout.stripe.com/c/pay/test')
  })

  it('keeps checkout open and exposes failures', async () => {
    const { result } = renderHook(() => usePaymentProviderModal({ initStripe: async () => { throw new Error('Unavailable') } }))
    act(() => result.current.open())
    await act(() => result.current.handleSelect('stripe'))
    expect(result.current.isOpen).toBe(true)
    expect(result.current.error).toBe('Unavailable')
    expect(result.current.isLoading).toBe(false)
  })
})

describe('isSafeStripeCheckoutUrl', () => {
  it('accepts Stripe HTTPS and rejects lookalikes or insecure URLs', () => {
    expect(isSafeStripeCheckoutUrl('https://checkout.stripe.com/c/pay/test')).toBe(true)
    expect(isSafeStripeCheckoutUrl('https://checkout.stripe.com.evil.test/pay')).toBe(false)
    expect(isSafeStripeCheckoutUrl('http://checkout.stripe.com/pay')).toBe(false)
  })
})
