import {
  makeDashboardOverview,
  mapBooking,
  mapChallenge,
  mapCourse,
  mapEvent,
  mapProduct,
  mapSession,
  unwrapArray,
} from '../fetch-adapters'

describe('creator dashboard fetch adapters', () => {
  it('unwraps common API response envelopes', () => {
    expect(unwrapArray([{ id: 'a' }])).toHaveLength(1)
    expect(unwrapArray({ data: [{ id: 'a' }] })).toHaveLength(1)
    expect(unwrapArray({ data: { data: [{ id: 'a' }] } })).toHaveLength(1)
    expect(unwrapArray({ data: { courses: [{ id: 'a' }] } })).toHaveLength(1)
  })

  it('maps mixed backend content shapes into V2 cards', () => {
    expect(mapCourse({ _id: 'c1', titre: 'Motion Course', duree: 120, prix: 25, enrollmentCount: 7 })).toMatchObject({
      id: 'c1',
      title: 'Motion Course',
      duration: 2,
      priceType: 'paid',
      enrollmentsCount: 7,
    })

    expect(mapChallenge({ id: 'ch1', title: '7 Day Sprint', tasks: [{ id: 1 }], isActive: true })).toMatchObject({
      id: 'ch1',
      title: '7 Day Sprint',
      steps: [{ id: 1 }],
      isPublished: true,
    })

    expect(mapEvent({ id: 'e1', title: 'Live Workshop', type: 'Online', isPublished: true })).toMatchObject({
      id: 'e1',
      format: 'online',
      status: 'published',
    })

    expect(mapProduct({ id: 'p1', name: 'Template Pack', price: 49, variants: [{ price: 49 }] })).toMatchObject({
      id: 'p1',
      title: 'Template Pack',
      priceType: 'paid',
      hasTiers: true,
    })

    expect(mapSession({ id: 's1', title: 'Mentoring', price: 0, isActive: true, availableSlots: 4 })).toMatchObject({
      _id: 's1',
      priceType: 'free',
      isPublished: true,
      totalSlots: 4,
    })

    expect(mapBooking({ id: 'b1', userName: 'Louay', scheduledAt: '2026-06-07T10:00:00.000Z', status: 'cancelled' })).toMatchObject({
      _id: 'b1',
      studentName: 'Louay',
      status: 'rejected',
    })
  })

  it('builds overview KPI/content/community view models from fetched lists', () => {
    const overview = makeDashboardOverview({
      overview: { totalMembers: 12, engagementRate: 64 },
      communities: [{ name: 'Motion Masters', membersCount: 12, verified: true }],
      courses: [{ id: 'c1', title: 'Course One' }],
      challenges: [{ id: 'ch1', title: 'Challenge One' }],
      sessions: [{ id: 's1', title: 'Session One' }],
      products: [{ id: 'p1', title: 'Product One' }],
      balance: { availableBalance: 150 },
    })

    expect(overview.kpis.map((kpi) => kpi.value)).toEqual(['12', '1', '1', '1', '150.00', '64%'])
    expect(overview.communities[0]).toMatchObject({ name: 'Motion Masters', members: 12, verified: true })
    expect(overview.content.map((item) => item.type)).toEqual(['Course', 'Challenge', 'Session'])
    expect(overview.onboarding).toEqual([
      { id: 'community', label: 'Create a community', done: true },
      { id: 'course', label: 'Add your first course', done: true },
      { id: 'share', label: 'Share your invite link', done: true },
    ])
  })
})
