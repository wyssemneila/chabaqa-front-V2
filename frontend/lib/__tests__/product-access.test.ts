import { hasProductAccess } from '../product-access'

describe('hasProductAccess', () => {
  it('allows free, purchased, and creator access without checkout', () => {
    expect(hasProductAccess(0, null)).toBe(true)
    expect(hasProductAccess(10, { id: 'purchase' })).toBe(true)
    expect(hasProductAccess(10, null, true)).toBe(true)
    expect(hasProductAccess(10, null)).toBe(false)
  })
})
