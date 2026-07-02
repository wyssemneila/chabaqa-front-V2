/**
 * Slim test-only fixtures migrated from lib/mock-data.ts.
 * Use in Jest tests only — not in production UI.
 */

export const fixtureUsers = [
  {
    id: 'user-1',
    email: 'creator@example.com',
    name: 'Test Creator',
    role: 'creator' as const,
  },
  {
    id: 'user-2',
    email: 'member@example.com',
    name: 'Test Member',
    role: 'member' as const,
  },
]

export const fixtureCommunities = [
  {
    id: 'community-1',
    slug: 'test-community',
    name: 'Test Community',
    creatorId: 'user-1',
    members: 12,
  },
]

export const fixtureCourse = {
  id: 'course-1',
  title: 'Intro Course',
  communityId: 'community-1',
  slug: 'intro-course',
}
