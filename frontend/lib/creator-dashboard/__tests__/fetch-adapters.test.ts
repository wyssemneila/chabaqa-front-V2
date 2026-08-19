import {
  makeDashboardOverview,
  mapBooking,
  mapChallenge,
  mapCourse,
  mapEvent,
  mapProduct,
  mapSession,
  unwrapArray,
  unwrapRequiredArray,
} from '../fetch-adapters'

describe('creator dashboard fetch adapters', () => {
  it('unwraps common API response envelopes', () => {
    expect(unwrapArray([{ id: 'a' }])).toHaveLength(1)
    expect(unwrapArray({ data: [{ id: 'a' }] })).toHaveLength(1)
    expect(unwrapArray({ data: { data: [{ id: 'a' }] } })).toHaveLength(1)
    expect(unwrapArray({ data: { courses: [{ id: 'a' }] } })).toHaveLength(1)
    expect(unwrapArray({ data: { cours: [{ id: 'a' }] } })).toHaveLength(1)
    expect(unwrapArray({ results: [{ id: 'a' }] })).toHaveLength(1)
    expect(unwrapArray({ data: { docs: [{ id: 'a' }] } })).toHaveLength(1)
    expect(unwrapArray({ data: { data: { items: [{ id: 'a' }] } } })).toHaveLength(1)
  })

  it('rejects malformed list envelopes instead of treating them as empty', () => {
    expect(unwrapRequiredArray({ data: { courses: [] } })).toEqual([])
    expect(() => unwrapRequiredArray({ data: { message: 'ok' } })).toThrow('invalid list response')
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
    expect(mapEvent({ id: 'e2', title: 'Published Event', status: 'published', ticketTypes: [{ price: '15' }] })).toMatchObject({
      id: 'e2',
      status: 'published',
      tickets: [{ id: 'ticket-0', pricing: 'paid', price: 15 }],
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
      isActive: true,
      totalSlots: 4,
    })
    expect(mapSession({ id: 's2', title: 'Coaching', status: 'live' })).toMatchObject({
      _id: 's2',
      isActive: true,
    })

    expect(mapBooking({ id: 'b1', userName: 'Louay', scheduledAt: '2026-06-07T10:00:00.000Z', status: 'cancelled' })).toMatchObject({
      _id: 'b1',
      studentName: 'Louay',
      status: 'rejected',
    })
  })

  it('prefers real uploaded images over generated placeholders', () => {
    expect(mapCourse({
      id: 'c1',
      title: 'Course',
      thumbnail: 'https://placehold.co/400x300?text=Course',
      thumbnailUrl: '/uploads/image/course-real.webp',
    })).toMatchObject({
      thumbnail: '/uploads/image/course-real.webp',
    })

    expect(mapChallenge({
      id: 'ch1',
      title: 'Challenge',
      thumbnail: '/placeholder.svg',
      images: [{ url: 'uploads/image/challenge-real.png' }],
    })).toMatchObject({
      banner: '/uploads/image/challenge-real.png',
    })

    expect(mapEvent({
      id: 'e1',
      title: 'Event',
      photo: { url: 'event-real.jpg' },
    })).toMatchObject({
      coverPreview: expect.stringMatching(/\/uploads\/image\/event-real\.jpg$/),
    })

    expect(mapProduct({
      id: 'p1',
      title: 'Product',
      media: [{ fileUrl: 'https://api.chabaqa.io/uploads/image/product-real.png' }],
    })).toMatchObject({
      thumbnail: '/uploads/image/product-real.png',
    })
  })

  it('keeps generated fallback ids stable across id fields', () => {
    const mapped = mapCourse({ title: 'No backend id' })
    expect(mapped._id).toBe(mapped.id)
  })

  it('uses the Mongo course id for creator dashboard management routes', () => {
    expect(mapCourse({ id: 'public-course-id', mongoId: 'mongo-course-id', titre: 'Course' })).toMatchObject({
      _id: 'mongo-course-id',
      id: 'mongo-course-id',
      mongoId: 'mongo-course-id',
      publicId: 'public-course-id',
    })
  })

  it('uses the Mongo challenge id for creator dashboard management routes', () => {
    expect(mapChallenge({ id: 'public-challenge-id', mongoId: 'mongo-challenge-id', title: 'Challenge' })).toMatchObject({
      id: 'mongo-challenge-id',
      mongoId: 'mongo-challenge-id',
      publicId: 'public-challenge-id',
    })
  })

  it('uses the Mongo session id for creator dashboard management routes', () => {
    expect(mapSession({ id: 'public-session-id', mongoId: 'mongo-session-id', title: 'Session' })).toMatchObject({
      _id: 'mongo-session-id',
      id: 'mongo-session-id',
      mongoId: 'mongo-session-id',
      publicId: 'public-session-id',
    })
  })

  it('uses the Mongo event id for creator dashboard management routes', () => {
    expect(mapEvent({ id: 'public-event-id', mongoId: 'mongo-event-id', title: 'Event' })).toMatchObject({
      id: 'mongo-event-id',
      mongoId: 'mongo-event-id',
      publicId: 'public-event-id',
    })
  })

  it('builds overview KPI/content/community view models from fetched lists', () => {
    const overview = makeDashboardOverview({
      overview: { totalMembers: 12, engagementRate: 64 },
      communities: [{ name: 'Motion Masters', slug: 'motion-masters', membersCount: 12, verified: true }],
      courses: [{ id: 'c1', title: 'Course One' }],
      challenges: [{ id: 'ch1', title: 'Challenge One' }],
      sessions: [{ id: 's1', title: 'Session One' }],
      products: [{ id: 'p1', title: 'Product One' }],
      balance: { availableBalance: 150 },
    })

    expect(overview.kpis.map((kpi) => kpi.value)).toEqual(['12', '1', '1', '1', '150.00', '64%'])
    expect(overview.communities[0]).toMatchObject({
      name: 'Motion Masters',
      slug: 'motion-masters',
      members: 12,
      verified: true,
    })
    expect(overview.content.map((item) => item.type)).toEqual(['Course', 'Challenge', 'Session'])
    expect(overview.onboarding).toEqual([
      { id: 'community', label: 'Create a community', done: true },
      { id: 'course', label: 'Add your first course', done: true },
      { id: 'share', label: 'Share your invite link', done: true },
    ])
  })
})
