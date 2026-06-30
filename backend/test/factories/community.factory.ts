import { Types } from 'mongoose';

export function buildCommunity(overrides: Record<string, any> = {}) {
  const id = overrides._id || new Types.ObjectId();

  return {
    _id: id,
    name: 'Test Community',
    slug: `test-community-${String(id).slice(-6)}`,
    description: 'A test community',
    createur: overrides.createur || new Types.ObjectId(),
    members: [],
    isActive: true,
    isPrivate: false,
    createdAt: new Date(),
    ...overrides,
  };
}
