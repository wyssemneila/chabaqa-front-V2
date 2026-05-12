#!/usr/bin/env node

const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../.env.local-db'), override: true, quiet: true });

function resolveDbName(uri) {
  if (process.env.DB_NAME) return process.env.DB_NAME;

  try {
    const url = new URL(uri);
    const pathName = (url.pathname || '').replace(/^\/+/, '');
    if (!pathName) return 'chabaqa_local';
    return pathName.split('/')[0];
  } catch {
    return 'chabaqa_local';
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function buildInstructionText(lines) {
  return lines.join('\n');
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI env var');
  }

  const client = new MongoClient(mongoUri, { ignoreUndefined: true });

  try {
    await client.connect();
    const db = client.db(resolveDbName(mongoUri));
    const communities = db.collection('communities');
    const challenges = db.collection('challenges');

    const community = await communities.findOne({ slug: 'motion-school' });
    if (!community) {
      throw new Error('Motion School community not found');
    }

    const title = 'تعلم ريقينق الشخصيات في 7 أيام';
    const challengeId = slugify(`motion-school-${title}`);

    const existing = await challenges.findOne({
      $or: [{ id: challengeId }, { title, communityId: String(community._id) }],
    });

    if (existing) {
      console.log(JSON.stringify({ inserted: false, reason: 'already_exists', id: existing.id, title: existing.title }, null, 2));
      return;
    }

    const startDate = new Date();
    startDate.setUTCHours(9, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 6);
    endDate.setUTCHours(20, 0, 0, 0);

    const tasks = [
      {
        day: 1,
        title: 'اليوم الأول - لقاء تعريفي',
        points: 100,
        description: 'سنبدأ التحدي بلقاء أونلاين نتعرف فيه على بعض ونشرح خطة الأيام السبعة وش راح نتعلم',
        deliverable: 'الحضور في اللقاء الأونلاين والتفاعل مع المجموعة',
        instructions: buildInstructionText([
          'احضر اللقاء الأونلاين في الموعد المحدد',
          'تعرف على باقي المشتركين في التحدي',
          'استمع لشرح خطة الأيام السبعة كاملة',
          'اكتب أي أسئلة عندك واطرحها في اللقاء',
        ]),
      },
      {
        day: 2,
        title: 'اليوم الثاني - مقدمة الريقينق',
        points: 100,
        description: 'سنشاهد في هذا اليوم فيديو المقدمة الخاص بكورس ريقينق الشخصيات ونفهم أساسيات الموضوع',
        deliverable: 'مشاهدة فيديو المقدمة وكتابة ملخص بسيط لما فهمته',
        instructions: buildInstructionText([
          'شاهد فيديو المقدمة كاملا',
          'ركز على المصطلحات الأساسية اللي ذكرها المدرب',
          'اكتب ملخص بسيط بكلامك لما فهمته من الفيديو',
          'شارك ملخصك مع المجموعة',
        ]),
      },
      {
        day: 3,
        title: 'اليوم الثالث - انيميشن دورة المشي',
        points: 100,
        description: 'سنتعلم اليوم كيف نعمل انيميشن لدورة المشي من خلال الفيديو الخاص بهذا الدرس',
        deliverable: 'تطبيق انيميشن دورة المشي وإرسال الملف أو مقطع للنتيجة',
        instructions: buildInstructionText([
          'شاهد فيديو انيميشن دورة المشي كاملا',
          'طبق الخطوات على شخصيتك بنفس الطريقة',
          'تأكد من سلاسة الحركة وتكرارها بشكل صحيح',
          'ارسل مقطع أو ملف للنتيجة اللي وصلت لها',
        ]),
      },
      {
        day: 4,
        title: 'اليوم الرابع - انيميشن الشخصيات',
        points: 100,
        description: 'سنكمل اليوم مع فيديو انيميشن الشخصيات ونتعلم كيف نحرك الشخصية بشكل احترافي',
        deliverable: 'تطبيق انيميشن الشخصية وإرسال نتيجة عملك',
        instructions: buildInstructionText([
          'شاهد فيديو انيميشن الشخصيات كاملا',
          'طبق الحركات على شخصيتك',
          'قارن نتيجتك مع ما في الفيديو',
          'ارسل نتيجة عملك للمجموعة',
        ]),
      },
      {
        day: 5,
        title: 'اليوم الخامس - ريج جسم الشخصيات',
        points: 100,
        description: 'سنتعلم اليوم كيف نعمل ريج كامل لجسم الشخصية من خلال الفيديو المخصص لهذا الدرس',
        deliverable: 'تطبيق الريج على شخصية وإرسال الملف أو مقطع للنتيجة',
        instructions: buildInstructionText([
          'شاهد فيديو ريج جسم الشخصيات كاملا',
          'طبق خطوات الريج على شخصيتك بالتفصيل',
          'تأكد من صحة كل النقاط والمفاصل',
          'ارسل الملف أو مقطع يبين نتيجة عملك',
        ]),
      },
      {
        day: 6,
        title: 'اليوم السادس - لقاء تصحيح الأعمال',
        points: 100,
        description: 'سنجتمع أونلاين لمراجعة أعمالكم وتصحيح الأخطاء وتوجيهكم لكل واحد فين غلط وكيف يصلح',
        deliverable: 'الحضور في اللقاء وتقديم عملك للمراجعة',
        instructions: buildInstructionText([
          'احضر اللقاء الأونلاين في الموعد المحدد',
          'جهز عملك من الأيام السابقة لعرضه',
          'استمع لتصحيح أخطائك وأخطاء زملائك',
          'دون الملاحظات اللي قيلت لك لتطبقها لاحقا',
        ]),
      },
      {
        day: 7,
        title: 'اليوم السابع - مشروع كامل لايف',
        points: 100,
        description: 'في آخر يوم سنجتمع أونلاين وسيشتغل المدرب على مشروع كامل أمامكم خطوة بخطوة وأنتم تشاهدون وتتعلمون',
        deliverable: 'الحضور في الجلسة الختامية ومتابعة المشروع الكامل',
        instructions: buildInstructionText([
          'احضر اللقاء الأونلاين الختامي في الموعد المحدد',
          'شاهد المدرب وهو يشتغل على مشروع ريقينق كامل',
          'دون كل الخطوات والتقنيات اللي تشوفها',
          'في نهاية الجلسة اطرح أي سؤال عندك',
        ]),
      },
    ].map((task) => ({
      id: new ObjectId().toString(),
      day: task.day,
      title: task.title,
      description: task.description,
      deliverable: task.deliverable,
      points: task.points,
      isCompleted: false,
      isActive: true,
      instructions: task.instructions,
      resources: [],
      createdAt: new Date(),
    }));

    const challenge = {
      _id: new ObjectId(),
      id: challengeId,
      title,
      description: 'تحدي مدته 7 أيام ستتعلم فيه كيف تعمل ريقينق احترافي للشخصيات في برنامج After Effects. سنبدأ بلقاء تعريفي، ثم ندخل في المحتوى خطوة بخطوة، وفي النهاية سنصحح أعمالكم ونشتغل على مشروع كامل مع بعض.',
      communityId: String(community._id),
      creatorId: new ObjectId(String(community.createur)),
      startDate,
      endDate,
      isActive: true,
      participants: [],
      posts: [],
      category: 'Motion Design',
      difficulty: 'beginner',
      duration: '7 days',
      notes: 'تم إدخال البيانات النصية فقط كما طُلب، مع الإبقاء على حقول الصور غير معبأة.',
      resources: [],
      tasks,
      sequentialProgression: true,
      unlockMessage: 'أكمل اليوم السابق أولاً حتى يُفتح لك اليوم التالي.',
      pricing: {
        price: 0,
        priceType: 'free',
        isRecurring: false,
        participationFee: 0,
        currency: 'TND',
        depositRequired: false,
        isPremium: false,
        premiumFeatures: {
          personalMentoring: false,
          exclusiveResources: false,
          priorityFeedback: false,
          certificate: false,
          liveSessions: true,
          communityAccess: true,
        },
        features: [
          'لقاء افتتاحي مباشر',
          'متابعة يومية للمهام',
          'جلسة تصحيح أعمال',
          'مشروع كامل لايف في اليوم الأخير',
        ],
        paymentOptions: {
          allowInstallments: false,
        },
        trialFeatures: [],
      },
      averageRating: 0,
      ratingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await challenges.insertOne(challenge);

    console.log(
      JSON.stringify(
        {
          inserted: true,
          id: challenge.id,
          title: challenge.title,
          communityId: challenge.communityId,
          tasks: challenge.tasks.length,
        },
        null,
        2,
      ),
    );
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
