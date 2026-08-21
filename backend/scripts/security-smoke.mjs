import { readFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

const API_BASE = process.env.SECURITY_SMOKE_API_BASE || 'http://127.0.0.1:3100/api';
const FRONTEND_BASE = process.env.SECURITY_SMOKE_FRONTEND_BASE || 'http://127.0.0.1:8082';
const ADMIN_EMAIL = process.env.SECURITY_SMOKE_ADMIN_EMAIL || 'security.smoke.admin@chabaqa.local';
const ADMIN_PASSWORD = process.env.SECURITY_SMOKE_ADMIN_PASSWORD || `Sm0ke!${randomBytes(8).toString('hex')}#`;
const USER_EMAIL = process.env.SECURITY_SMOKE_USER_EMAIL || 'ahmed.benali@email.tn';
const USER_PASSWORD = process.env.SECURITY_SMOKE_USER_PASSWORD || 'Password123!';
const OTHER_USER_EMAIL = process.env.SECURITY_SMOKE_OTHER_USER_EMAIL || 'fatma.mseddi@email.tn';
const OTHER_USER_PASSWORD = process.env.SECURITY_SMOKE_OTHER_USER_PASSWORD || 'Password123!';

const results = [];

class CookieJar {
  constructor() {
    this.cookies = new Map();
  }

  apply(response) {
    const values = typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : splitSetCookieHeader(response.headers.get('set-cookie'));

    for (const value of values) {
      const first = value.split(';')[0];
      const index = first.indexOf('=');
      if (index > 0) {
        this.cookies.set(first.slice(0, index), first.slice(index + 1));
      }
    }
  }

  header() {
    return [...this.cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  get(name) {
    return this.cookies.get(name);
  }
}

function splitSetCookieHeader(header) {
  if (!header) return [];
  return header.split(/,(?=\s*[^;,]+=)/g).map((value) => value.trim()).filter(Boolean);
}

function parseDotEnv(path) {
  try {
    const content = readFileSync(path, 'utf8');
    const env = {};
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
      const index = trimmed.indexOf('=');
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      value = value.replace(/^['"]|['"]$/g, '');
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function getMongoUri() {
  const env = parseDotEnv('.env');
  return process.env.MONGO_URI || process.env.MONGODB_URI || env.MONGO_URI || env.MONGODB_URI || 'mongodb://127.0.0.1:27017/chabaqa_local';
}

async function request(path, options = {}) {
  const jar = options.jar;
  const headers = new Headers(options.headers || {});
  if (jar?.header()) {
    headers.set('cookie', jar.header());
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    redirect: options.redirect || 'manual',
  });
  jar?.apply(response);

  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { response, status: response.status, body, text };
}

function expectCheck(name, condition, detail = '') {
  results.push({ name, ok: Boolean(condition), detail });
  if (!condition) {
    throw new Error(`${name}${detail ? `: ${detail}` : ''}`);
  }
}

function responseData(body) {
  return body?.data || body;
}

function jarCsrfToken(jar) {
  return jar.get('csrfToken');
}

async function ensureSmokeAdmin(db) {
  const admins = db.collection('admins');
  const now = new Date();
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await admins.updateOne(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: 'Security Smoke Admin',
        email: ADMIN_EMAIL,
        password: passwordHash,
        role: 'admin',
        failedLoginAttempts: 0,
        lockoutUntil: null,
        passwordChangedAt: now,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return admins.findOne({ email: ADMIN_EMAIL });
}

async function getLatestAdmin2faCode(db, adminId) {
  const code = await db.collection('verificationcodes').findOne(
    {
      adminId,
      type: '2fa',
      expiresAt: { $gt: new Date() },
    },
    { sort: { createdAt: -1, _id: -1 } },
  );
  return code?.code;
}

async function issueCsrf(jar) {
  const csrf = await request('/auth/csrf', { method: 'GET', jar });
  const data = responseData(csrf.body);
  const token = data?.csrfToken || data?.data?.csrfToken || jar.get('csrfToken');
  expectCheck('CSRF token can be issued', csrf.status === 200 && token, `status=${csrf.status}`);
  return token;
}

async function loginUser(email, password) {
  const jar = new CookieJar();
  const login = await request('/auth/login', {
    method: 'POST',
    jar,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = responseData(login.body);
  expectCheck(`User login works for ${email}`, login.status === 200 && data?.accessToken, `status=${login.status}`);
  return { jar, accessToken: data.accessToken, user: data.user };
}

async function uploadFile(jar, csrfToken, path, field, fileName, type, content) {
  const form = new FormData();
  form.append(field, new Blob([content], { type }), fileName);
  return request(path, {
    method: 'POST',
    jar,
    headers: {
      origin: FRONTEND_BASE,
      'x-csrf-token': csrfToken,
    },
    body: form,
  });
}

async function main() {
  const mongo = new MongoClient(getMongoUri());
  await mongo.connect();
  const db = mongo.db();

  try {
    const health = await request('/health/ping');
    expectCheck('Backend health endpoint responds', health.status === 200 && health.body?.success === true, `status=${health.status}`);

    const docs = await request('/docs');
    expectCheck('Swagger docs are disabled for this smoke runtime', [404, 401, 403].includes(docs.status), `status=${docs.status}`);

    const frontend = await fetch(`${FRONTEND_BASE}/`, { redirect: 'manual' });
    expectCheck('Frontend route responds', [200, 307, 308].includes(frontend.status), `status=${frontend.status}`);

    const nosql = await request('/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: { $ne: null }, password: 'anything' }),
    });
    expectCheck('NoSQL operator payload is blocked', nosql.status === 400, `status=${nosql.status}`);

    const hpp = await request('/health/ping?role=user&role=admin');
    expectCheck('Duplicate scalar query parameter is blocked', hpp.status === 400, `status=${hpp.status}`);

    const userSession = await loginUser(USER_EMAIL, USER_PASSWORD);
    const csrfToken = await issueCsrf(userSession.jar);

    const profile = await request('/auth/me', { method: 'GET', jar: userSession.jar });
    expectCheck('Cookie-authenticated user profile works', profile.status === 200 && profile.body?.success === true, `status=${profile.status}`);

    const missingCsrfLogout = await request('/auth/logout', {
      method: 'POST',
      jar: userSession.jar,
      headers: { origin: FRONTEND_BASE },
    });
    expectCheck('Cookie-auth unsafe request without CSRF is rejected', missingCsrfLogout.status === 403, `status=${missingCsrfLogout.status}`);

    const refresh = await request('/auth/refresh', {
      method: 'POST',
      jar: userSession.jar,
      headers: {
        origin: FRONTEND_BASE,
        'content-type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({}),
    });
    const refreshData = responseData(refresh.body);
    expectCheck('Cookie refresh works with CSRF', refresh.status === 200 && refreshData?.accessToken, `status=${refresh.status}`);
    const activeCsrfToken = jarCsrfToken(userSession.jar) || await issueCsrf(userSession.jar);

    const cleanUpload = await uploadFile(
      userSession.jar,
      activeCsrfToken,
      '/upload/single?visibility=private&type=image',
      'file',
      'smoke.png',
      'image/png',
      Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63600000020001e221bc330000000049454e44ae426082', 'hex'),
    );
    const cleanUploadData = responseData(cleanUpload.body);
    expectCheck('Private image upload succeeds', cleanUpload.status === 201 && cleanUploadData?.assetId, `status=${cleanUpload.status}`);

    const privateAssetId = cleanUploadData.assetId;
    const unauthPrivate = await request(`/media/private/${privateAssetId}/file`);
    expectCheck('Private media blocks unauthenticated access', [400, 401, 403].includes(unauthPrivate.status), `status=${unauthPrivate.status}`);

    const otherSession = await loginUser(OTHER_USER_EMAIL, OTHER_USER_PASSWORD);
    const otherPrivate = await request(`/media/private/${privateAssetId}/file`, { jar: otherSession.jar });
    expectCheck('Private media blocks another user', [400, 401, 403, 404].includes(otherPrivate.status), `status=${otherPrivate.status}`);

    const eicar = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';
    const malwareUpload = await uploadFile(
      userSession.jar,
      activeCsrfToken,
      '/upload/document',
      'document',
      'eicar.txt',
      'text/plain',
      eicar,
    );
    expectCheck('EICAR document upload is rejected', malwareUpload.status >= 400, `status=${malwareUpload.status}`);

    const admin = await ensureSmokeAdmin(db);
    const adminJar = new CookieJar();
    const adminLogin = await request('/admin/login', {
      method: 'POST',
      jar: adminJar,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD, remember_me: false }),
    });
    const adminLoginData = responseData(adminLogin.body);
    expectCheck('Admin login requires 2FA', adminLogin.status === 200 && adminLoginData?.requires2FA === true, `status=${adminLogin.status}`);

    const verificationCode = await getLatestAdmin2faCode(db, admin._id);
    expectCheck('Admin 2FA code is persisted for verification', Boolean(verificationCode));

    const verifyAdmin = await request('/admin/verify-2fa', {
      method: 'POST',
      jar: adminJar,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: ADMIN_EMAIL, verificationCode }),
    });
    const verifyAdminData = responseData(verifyAdmin.body);
    expectCheck('Admin 2FA verification succeeds', verifyAdmin.status === 200 && verifyAdminData?.access_token, `status=${verifyAdmin.status}`);

    const adminCsrf = await issueCsrf(adminJar);
    const adminMe = await request('/admin/me', { method: 'GET', jar: adminJar });
    expectCheck('Admin session endpoint works', adminMe.status === 200 && (adminMe.body?.success === true || adminMe.body?.data?.success === true), `status=${adminMe.status}`);

    const alertId = new ObjectId();
    await db.collection('security_alerts').insertOne({
      _id: alertId,
      type: 'data_export_abuse',
      severity: 'high',
      adminUserId: admin._id,
      title: 'Smoke Test Security Alert',
      description: 'Generated by backend/scripts/security-smoke.mjs',
      metadata: { smoke: true },
      timestamp: new Date(),
      resolved: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const alerts = await request('/admin/security/alerts?resolved=false', { method: 'GET', jar: adminJar });
    const alertsData = Array.isArray(alerts.body?.data?.data)
      ? alerts.body.data.data
      : Array.isArray(alerts.body?.data)
        ? alerts.body.data
        : [];
    expectCheck('Admin can list persisted security alerts', alerts.status === 200 && alertsData.some((alert) => alert.id === alertId.toString()), `status=${alerts.status}`);

    const resolveAlert = await request(`/admin/security/alerts/${alertId.toString()}/resolve`, {
      method: 'PUT',
      jar: adminJar,
      headers: {
        origin: FRONTEND_BASE,
        'content-type': 'application/json',
        'x-csrf-token': adminCsrf,
      },
      body: JSON.stringify({ notes: 'Resolved by automated security smoke test' }),
    });
    expectCheck('Admin can resolve security alert with authenticated actor', resolveAlert.status === 200, `status=${resolveAlert.status}`);

    const resolved = await db.collection('security_alerts').findOne({ _id: alertId });
    expectCheck('Resolved alert records authenticated resolver id', resolved?.resolved === true && String(resolved.resolvedBy) === String(admin._id));

    const logout = await request('/auth/logout', {
      method: 'POST',
      jar: userSession.jar,
      headers: {
        origin: FRONTEND_BASE,
        'x-csrf-token': activeCsrfToken,
      },
    });
    expectCheck('User logout works with CSRF', logout.status === 200, `status=${logout.status}`);
  } finally {
    await mongo.close();
  }

  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ` (${result.detail})` : ''}`);
  }
  console.log(`\nSecurity smoke completed: ${results.filter((result) => result.ok).length}/${results.length} checks passed.`);
}

main().catch((error) => {
  for (const result of results) {
    console.log(`${result.ok ? 'PASS' : 'FAIL'} ${result.name}${result.detail ? ` (${result.detail})` : ''}`);
  }
  console.error(`\nSecurity smoke failed: ${error.message}`);
  process.exit(1);
});
