import { resolveSocketBaseUrl } from '../socket-url'

describe('resolveSocketBaseUrl', () => {
  it('does not send sockets to the frontend when API is same-origin', () => {
    expect(resolveSocketBaseUrl('/api')).toBe(window.location.origin)
    expect(resolveSocketBaseUrl('http://localhost:8083/api')).toBe(window.location.origin)
  })
})
