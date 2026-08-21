import { toCreatorDashboardViewModel } from '@/lib/view-models/creator-dashboard-view-model'

describe('creator dashboard view model customize links', () => {
  it('falls back to communities list when slug is missing', () => {
    const model = toCreatorDashboardViewModel({
      community: { name: 'Untitled' },
      posts: [],
      courses: [],
      sessions: [],
      products: [],
      challenges: [],
      events: [],
    })

    expect(model.setup.items[0]?.actionUrl).toBe('/creator/communities')
    expect(model.setup.items[1]?.actionUrl).toBe('/creator/communities')
  })

  it('uses community-scoped customize route when slug exists', () => {
    const model = toCreatorDashboardViewModel({
      community: { name: 'Design Hub', slug: 'design-hub' },
      posts: [],
      courses: [],
      sessions: [],
      products: [],
      challenges: [],
      events: [],
    })

    expect(model.setup.items[0]?.actionUrl).toBe('/creator/community/design-hub/customize')
  })
})
