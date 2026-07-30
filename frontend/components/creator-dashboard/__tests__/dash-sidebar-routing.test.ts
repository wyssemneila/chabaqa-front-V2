import { resolveActiveSidebarHref } from '../DashSidebar'

describe('creator sidebar route matching', () => {
  it('selects only communities on the communities route', () => {
    expect(resolveActiveSidebarHref('/en/creator/communities')).toBe('/creator/communities')
  })

  it('selects overview only for the creator dashboard', () => {
    expect(resolveActiveSidebarHref('/creator/dashboard')).toBe('/creator/dashboard')
    expect(resolveActiveSidebarHref('/creator/products')).not.toBe('/creator/dashboard')
  })
})
