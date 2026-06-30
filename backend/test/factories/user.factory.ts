import { Types } from 'mongoose';

export function buildUser(overrides: Record<string, any> = {}) {
  const id = overrides._id || new Types.ObjectId();

  return {
    _id: id,
    name: 'Test User',
    username: `test-${String(id).slice(-6)}`,
    email: `user-${String(id).slice(-6)}@example.com`,
    role: 'user',
    createdAt: new Date(),
    failedLoginAttempts: 0,
    lockoutUntil: null,
    ...overrides,
  };
}
