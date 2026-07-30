import { resolveSocketBaseUrl } from '../socket-url'

describe('resolveSocketBaseUrl', () => {
  it('does not send sockets to the frontend when API is same-origin', () => {
    expect(resolveSocketBaseUrl('/api')).toBe('http://localhost:3000')
    expect(resolveSocketBaseUrl('http://localhost:8083/api')).toBe('http://localhost:8083')
  })
})
