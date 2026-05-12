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
    const products = db.collection('products');

    const community = await communities.findOne({ slug: 'motion-school' });
    if (!community) {
      throw new Error('Motion School community not found');
    }

    const title = 'دليل عملي لريقينق الشخصيات في After Effects';
    const slug = 'motion-school-rigging-guide-after-effects';

    const existing = await products.findOne({
      $or: [{ slug }, { title, communityId: String(community._id) }],
    });

    if (existing) {
      console.log(JSON.stringify({ inserted: false, reason: 'already_exists', id: existing.id, title: existing.title }, null, 2));
      return;
    }

    const product = {
      _id: new ObjectId(),
      id: new ObjectId().toString(),
      title,
      slug,
      description:
        'منتج رقمي موجه للمبتدئين وصناع المحتوى في Motion School يساعدك على فهم ريقينق الشخصيات داخل After Effects بشكل عملي ومنظم. ستتعلم كيف تجهز الشخصية، ترتب الطبقات، تبني هيكل الريق، تضبط نقاط الارتكاز، وتطبق أفضل الممارسات حتى تحصل على حركة نظيفة وسهلة التعديل في المشاريع الحقيقية.',
      price: 47,
      currency: 'TND',
      communityId: String(community._id),
      creatorId: new ObjectId(String(community.createur)),
      isPublished: true,
      inventory: 0,
      sales: 0,
      category: 'Motion Design',
      type: 'digital',
      images: [],
      variants: [],
      files: [],
      licenseTerms:
        'هذا المنتج مخصص للاستعمال الشخصي والتعليمي فقط. يمكنك استخدامه لتطوير مهاراتك وبناء مشاريعك الخاصة، لكن لا يجوز إعادة بيع المحتوى أو توزيعه أو مشاركته بشكل مجاني أو مدفوع بدون إذن صريح من صاحب المنتج.',
      features: [
        'شرح مرتب لأساسيات ريقينق الشخصيات داخل After Effects',
        'خطة واضحة لتجهيز الشخصية قبل البدء في الريق',
        'ملاحظات عملية لتفادي الأخطاء الشائعة أثناء العمل',
        'خطوات تساعدك على بناء ريج قابل للتعديل والتطوير',
        'محتوى مناسب للمبتدئين ومن يريد تنظيم شغله بشكل احترافي',
      ],
      pricing: {
        price: 47,
        currency: 'TND',
        priceType: 'one-time',
        features: [
          'وصول دائم إلى وصف المنتج ومحتواه النصي',
          'محتوى منظم حول أساسيات الريقينق للشخصيات',
          'مرجع سريع يمكن تطويره لاحقا بملفات وموارد إضافية',
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

    await products.insertOne(product);

    console.log(
      JSON.stringify(
        {
          inserted: true,
          id: product.id,
          title: product.title,
          slug: product.slug,
          communityId: product.communityId,
          creatorId: product.creatorId,
          type: product.type,
          isPublished: product.isPublished,
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
