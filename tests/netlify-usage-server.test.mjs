import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getNetlifyCredits } from '../src/lib/server/netlifyUsage.server.ts';

const TOKEN = 'nfp_token-uji-jangan-bocor';
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const deps = (fetch, env = { NETLIFY_API_TOKEN: TOKEN }) => ({ env, fetch, now: () => new Date('2026-11-09T01:30:00Z') });

// Bentuk respons GET /api/v1/accounts/{id} menurut laporan pengguna API Netlify (belum ada dokumentasi resmi).
const ACCOUNT = {
  id: '6a11d20a08f9703055958423',
  slug: 'seevent-777',
  type_name: 'Free',
  plan_credits: 300,
  capabilities: { credits: { included: 300, used: 74.6 } },
  current_billing_period_start: '2026-10-24T00:00:00Z',
  next_billing_period_start: '2026-11-24T00:00:00Z',
  usages_exceeded: false,
};

test('tanpa token: belum diatur, tanpa memanggil API', async () => {
  let called = false;
  const r = await getNetlifyCredits(deps(async () => { called = true; return json({}); }, {}));
  assert.deepEqual(r, { configured: false, tokenEnv: 'NETLIFY_API_TOKEN' });
  assert.equal(called, false);
});

test('akun pertama dipakai bila slug tidak diatur; kredit tersedia = jatah - terpakai', async () => {
  const calls = [];
  const f = async (url, init) => {
    calls.push({ url: String(url), auth: init.headers.Authorization });
    if (String(url).endsWith('/api/v1/accounts')) return json([ACCOUNT]);
    return json(ACCOUNT);
  };
  const r = await getNetlifyCredits(deps(f));
  assert.deepEqual(calls.map((c) => c.url), ['https://api.netlify.com/api/v1/accounts', 'https://api.netlify.com/api/v1/accounts/seevent-777']);
  assert.ok(calls.every((c) => c.auth === `Bearer ${TOKEN}`));
  assert.equal(r.configured, true);
  assert.equal(r.plan, 'Free');
  assert.equal(r.creditsIncluded, 300);
  assert.equal(r.creditsUsed, 74.6);
  assert.equal(r.creditsAvailable, 225.4);
  assert.equal(r.periodStart, '2026-10-24T00:00:00Z');
  assert.equal(r.periodEnd, '2026-11-24T00:00:00Z');
  assert.equal(r.usageExceeded, false);
  assert.equal(r.teamSlug, 'seevent-777');
});

test('slug dari env dipakai langsung; jatah dari capabilities bila plan_credits kosong; habis tidak minus', async () => {
  const urls = [];
  const f = async (url) => {
    urls.push(String(url));
    return json({ slug: 'tim-x', type_name: 'Personal', capabilities: { credits: { included: 1000, used: 1200 } }, usages_exceeded: true });
  };
  const r = await getNetlifyCredits(deps(f, { NETLIFY_API_TOKEN: TOKEN, NETLIFY_ACCOUNT_SLUG: 'tim-x' }));
  assert.deepEqual(urls, ['https://api.netlify.com/api/v1/accounts/tim-x']);
  assert.equal(r.creditsIncluded, 1000);
  assert.equal(r.creditsAvailable, 0);
  assert.equal(r.usageExceeded, true);
});

test('angka kredit tidak ada: null, bukan 0', async () => {
  const r = await getNetlifyCredits(deps(async () => json({ slug: 'a', type_name: 'Free' }), { NETLIFY_API_TOKEN: TOKEN, NETLIFY_ACCOUNT_SLUG: 'a' }));
  assert.equal(r.creditsIncluded, null);
  assert.equal(r.creditsUsed, null);
  assert.equal(r.creditsAvailable, null);
});

test('galat API: pesan menyebut status HTTP, tidak pernah token', async () => {
  await assert.rejects(
    getNetlifyCredits(deps(async () => json({ message: 'Unauthorized' }, 401), { NETLIFY_API_TOKEN: TOKEN, NETLIFY_ACCOUNT_SLUG: 'a' })),
    (err) => /HTTP 401/.test(err.message) && !err.message.includes(TOKEN),
  );
});

test('panel Penyimpanan menampilkan kartu Netlify lewat server function yang wajib login', () => {
  const fn = readFileSync(new URL('../src/lib/server/storageAdmin.functions.ts', import.meta.url), 'utf8');
  assert.match(fn, /export const fetchNetlifyCredits = createServerFn/);
  assert.match(fn, /requireLoggedIn\(data\.accessToken, deps\);\s*return getNetlifyCredits\(deps\)/);
  const panel = readFileSync(new URL('../src/components/features/storage-manager/StorageManagerPanel.tsx', import.meta.url), 'utf8');
  assert.match(panel, /fetchNetlifyCredits\(\)/);
  assert.match(panel, /Kredit tersedia/);
  assert.doesNotMatch(panel, /NETLIFY_API_TOKEN['"]?\s*[:=]/);
});

test('used = 0 dari API dianggap tidak diketahui (bug Netlify open-api #640), bukan 300 tersedia', async () => {
  const r = await getNetlifyCredits(deps(async () => json({ ...ACCOUNT, capabilities: { credits: { included: 300, used: 0 } } }), { NETLIFY_API_TOKEN: TOKEN, NETLIFY_ACCOUNT_SLUG: 'seevent-777' }));
  assert.equal(r.creditsIncluded, 300);
  assert.equal(r.creditsUsed, null);
  assert.equal(r.creditsAvailable, null);
});

test('panel: bila kredit terpakai tidak diketahui, tidak menampilkan angka tersedia dan menautkan ke Usage & Billing', () => {
  const panel = readFileSync(new URL('../src/components/features/storage-manager/StorageManagerPanel.tsx', import.meta.url), 'utf8');
  assert.match(panel, /creditsAvailable != null \?/);
  assert.match(panel, /Lihat sisa kredit di Netlify/);
});
