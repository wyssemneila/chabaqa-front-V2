/**
 * Utility functions for consistent ID serialization across backend services
 * 
 * Problem: Some Mongoose schemas have a custom `id` field (string) separate from 
 * MongoDB's `_id` (ObjectId). Frontend uses the custom `id` for routing/matching.
 * 
 * Solution: Always prefer the custom `id` field when it exists.
 */

/**
 * Serialize entity ID - prefers custom id field over _id
 * 
 * @param entity - Mongoose document or plain object with id/_id
 * @returns The custom id field if it exists, otherwise _id as string
 * 
 * @example
 * const courseId = serializeId(course); // Returns course.id if exists, else course._id.toString()
 */
export function serializeId(entity: any): string {
  if (!entity) return '';
  return entity.id || entity._id?.toString() || '';
}

export function serializeMongoId(entity: any): string {
  if (!entity) return '';
  return entity._id?.toString?.() || '';
}

export function serializePublicId(entity: any): string {
  if (!entity) return '';
  return typeof entity.id === 'string' ? entity.id : '';
}

export function serializeTrackingIdentity(entity: any): {
  canonicalTrackingId: string;
  mongoId: string;
  publicId: string;
  slug?: string;
} {
  const mongoId = serializeMongoId(entity);
  const publicId = serializePublicId(entity);
  const slug = typeof entity?.slug === 'string' ? entity.slug : undefined;
  return {
    canonicalTrackingId: mongoId || publicId || slug || '',
    mongoId,
    publicId,
    ...(slug ? { slug } : {}),
  };
}

/**
 * Serialize entity with both id and mongoId for debugging/logging
 * 
 * @param entity - Mongoose document or plain object with id/_id
 * @returns Object with both id (custom field) and mongoId (_id)
 * 
 * @example
 * const ids = serializeEntityIds(course);
 * console.log(`Course ID: ${ids.id}, MongoDB _id: ${ids.mongoId}`);
 */
export function serializeEntityIds(entity: any): { id: string; mongoId: string } {
  if (!entity) return { id: '', mongoId: '' };
  
  return {
    id: entity.id || entity._id?.toString() || '',
    mongoId: entity._id?.toString() || '',
  };
}

/**
 * Check if entity has a custom id field
 * 
 * @param entity - Mongoose document or plain object
 * @returns true if entity has a custom id field (not just _id)
 */
export function hasCustomId(entity: any): boolean {
  return entity && typeof entity.id === 'string' && entity.id !== entity._id?.toString();
}
