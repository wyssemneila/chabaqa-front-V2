import 'dotenv/config';
import mongoose, { Types } from 'mongoose';

type Counters = {
  processed: number;
  updated: number;
  skipped: number;
  missingCourse: number;
  missingEnrollmentCreated: number;
  fullCourseOrdersProcessed: number;
  fullCourseEntitlementsSynced: number;
};

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.DATABASE_URL || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MongoDB connection string (MONGODB_URI / DATABASE_URL / MONGO_URI)');
  }

  await mongoose.connect(mongoUri);
  const db = mongoose.connection.db;
  if (!db) throw new Error('Mongo database is not available');

  const orders = db.collection('orders');
  const courses = db.collection('cours');
  const enrollments = db.collection('courseenrollments');

  const counters: Counters = {
    processed: 0,
    updated: 0,
    skipped: 0,
    missingCourse: 0,
    missingEnrollmentCreated: 0,
    fullCourseOrdersProcessed: 0,
    fullCourseEntitlementsSynced: 0,
  };

  const cursor = orders.find({
    status: 'paid',
    contentType: { $in: ['chapter'] },
    contentId: { $type: 'string', $ne: '' },
  });

   
  while (true) {
    const order = await cursor.next();
    if (!order) break;
    counters.processed += 1;

    const chapterId = String(order.contentId || '');
    if (!chapterId) {
      counters.skipped += 1;
      continue;
    }

    let courseId: string = String(order?.metadata?.courseId || '');
    if (!courseId) {
      const course = await courses
        .findOne({ 'sections.chapitres.id': chapterId }, { projection: { _id: 1, id: 1 } });
      if (!course) {
        counters.missingCourse += 1;
        continue;
      }
      courseId = String((course as any).id || (course as any)._id);
    }

    const courseDoc = Types.ObjectId.isValid(courseId)
      ? await courses.findOne({ _id: new Types.ObjectId(courseId) }, { projection: { _id: 1 } })
      : await courses.findOne({ id: courseId }, { projection: { _id: 1 } });
    if (!courseDoc?._id) {
      counters.missingCourse += 1;
      continue;
    }

    const buyerIdRaw = String(order.buyerId || '');
    if (!Types.ObjectId.isValid(buyerIdRaw)) {
      counters.skipped += 1;
      continue;
    }
    const buyerId = new Types.ObjectId(buyerIdRaw);

    const existing = await enrollments.findOne({
      userId: buyerId,
      courseId: courseDoc._id,
      isActive: true,
    });

    if (!existing) {
      await enrollments.insertOne({
        id: new Types.ObjectId().toString(),
        userId: buyerId,
        courseId: courseDoc._id,
        progression: [],
        purchasedChapterIds: [chapterId],
        enrolledAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      counters.updated += 1;
      counters.missingEnrollmentCreated += 1;
      continue;
    }

    const hasChapter = Array.isArray(existing.purchasedChapterIds)
      ? existing.purchasedChapterIds.includes(chapterId)
      : false;
    if (hasChapter) {
      counters.skipped += 1;
      continue;
    }

    await enrollments.updateOne(
      { _id: existing._id },
      {
        $addToSet: { purchasedChapterIds: chapterId },
        $set: { updatedAt: new Date() },
      },
    );
    counters.updated += 1;
  }

  const courseOrderCursor = orders.find({
    status: 'paid',
    contentType: { $in: ['course'] },
    contentId: { $type: 'string', $ne: '' },
  });

  while (true) {
    const order = await courseOrderCursor.next();
    if (!order) break;
    counters.processed += 1;
    counters.fullCourseOrdersProcessed += 1;

    const courseId = String(order.contentId || '');
    const courseDoc = Types.ObjectId.isValid(courseId)
      ? await courses.findOne({ _id: new Types.ObjectId(courseId) })
      : await courses.findOne({ id: courseId });
    if (!courseDoc?._id) {
      counters.missingCourse += 1;
      continue;
    }

    const buyerIdRaw = String(order.buyerId || '');
    if (!Types.ObjectId.isValid(buyerIdRaw)) {
      counters.skipped += 1;
      continue;
    }
    const buyerId = new Types.ObjectId(buyerIdRaw);

    const paidChapterIds = (Array.isArray((courseDoc as any).sections)
      ? (courseDoc as any).sections
      : []
    ).flatMap((section: any) =>
      (Array.isArray(section?.chapitres) ? section.chapitres : [])
        .filter((chapter: any) => Boolean(chapter?.isPaidChapter) && !chapter?.isPreview)
        .map((chapter: any) => String(chapter?.id || ''))
        .filter(Boolean),
    );

    if (paidChapterIds.length === 0) {
      counters.skipped += 1;
      continue;
    }

    const existing = await enrollments.findOne({
      userId: buyerId,
      courseId: courseDoc._id,
      isActive: true,
    });

    if (!existing) {
      await enrollments.insertOne({
        id: new Types.ObjectId().toString(),
        userId: buyerId,
        courseId: courseDoc._id,
        progression: [],
        purchasedChapterIds: paidChapterIds,
        enrolledAt: new Date(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      counters.updated += 1;
      counters.missingEnrollmentCreated += 1;
      counters.fullCourseEntitlementsSynced += paidChapterIds.length;
      continue;
    }

    const existingPurchased = new Set(
      (Array.isArray(existing.purchasedChapterIds)
        ? existing.purchasedChapterIds
        : []
      ).map((id: any) => String(id)),
    );
    const missingChapterIds = paidChapterIds.filter(
      (chapterId: string) => !existingPurchased.has(chapterId),
    );
    if (missingChapterIds.length === 0) {
      counters.skipped += 1;
      continue;
    }

    await enrollments.updateOne(
      { _id: existing._id },
      {
        $addToSet: { purchasedChapterIds: { $each: missingChapterIds } },
        $set: { updatedAt: new Date() },
      },
    );
    counters.updated += 1;
    counters.fullCourseEntitlementsSynced += missingChapterIds.length;
  }

  console.log('Chapter entitlement backfill report:', counters);
  await mongoose.disconnect();
}

void run().catch(async (error) => {
  console.error('Chapter entitlement backfill failed:', error);
  await mongoose.disconnect();
  process.exit(1);
});
