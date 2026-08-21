import { formatMoney, normalizeCurrencyCode } from '../format'

describe('money formatting', () => {
  it('normalizes legacy DT to ISO TND', () => {
    expect(normalizeCurrencyCode('DT')).toBe('TND')
    expect(normalizeCurrencyCode('tnd')).toBe('TND')
  })

  it('never formats a TND catalog price as dollars', () => {
    const value = formatMoney(97, 'TND', 'en')
    expect(value).toContain('TND')
    expect(value).not.toContain('$')
  })
})
