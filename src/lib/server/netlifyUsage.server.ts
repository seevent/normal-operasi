// src/lib/server/netlifyUsage.server.ts
// Kredit Netlify untuk panel Penyimpanan (tab Data). HANYA dijalankan di server: memegang personal access
// token Netlify (env NETLIFY_API_TOKEN, tanpa awalan VITE_ agar tidak ikut ke bundel browser).
//
// Netlify belum mendokumentasikan endpoint saldo kredit. Data dibaca dari GET /api/v1/accounts/{slug}:
//   type_name, plan_credits / capabilities.credits.included (jatah), capabilities.credits.used (terpakai),
//   current_billing_period_start, next_billing_period_start, usages_exceeded (deploy diblokir).
// Pengguna API melaporkan `used` bisa tertinggal dari halaman Usage & Billing, jadi panel menautkan ke sana.

export interface NetlifyDeps {
  env: Record<string, string | undefined>;
  fetch: typeof fetch;
}

export type NetlifyCredits =
  | { configured: false; tokenEnv: 'NETLIFY_API_TOKEN' }
  | {
      configured: true;
      teamSlug: string | null;
      plan: string | null;
      creditsIncluded: number | null;
      creditsUsed: number | null;
      creditsAvailable: number | null;
      periodStart: string | null;
      periodEnd: string | null;
      usageExceeded: boolean;
    };

interface NetlifyAccount {
  slug?: string;
  type_name?: string;
  plan_credits?: number;
  capabilities?: { credits?: { included?: number; used?: number } };
  current_billing_period_start?: string;
  next_billing_period_start?: string;
  usages_exceeded?: boolean;
}

const API = 'https://api.netlify.com/api/v1';
const REQUEST_TIMEOUT_MS = 15_000;

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const round2 = (n: number): number => Math.round(n * 100) / 100;

const get = async <T>(deps: NetlifyDeps, token: string, path: string): Promise<T> => {
  const res = await deps.fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'sses-t2-normal-operasi' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  // Hanya status HTTP yang disebut, tidak pernah token atau isi respons.
  if (!res.ok) throw new Error(`Kredit Netlify tidak dapat dibaca (HTTP ${res.status}).`);
  return (await res.json()) as T;
};

export const getNetlifyCredits = async (deps: NetlifyDeps): Promise<NetlifyCredits> => {
  const token = (deps.env.NETLIFY_API_TOKEN ?? deps.env.NETLIFY_AUTH_TOKEN)?.trim();
  if (!token) return { configured: false, tokenEnv: 'NETLIFY_API_TOKEN' };

  let slug = deps.env.NETLIFY_ACCOUNT_SLUG?.trim();
  if (!slug) {
    const accounts = await get<NetlifyAccount[]>(deps, token, '/accounts');
    slug = Array.isArray(accounts) ? str(accounts[0]?.slug) ?? undefined : undefined;
    if (!slug) throw new Error('Tim Netlify tidak ditemukan untuk token ini.');
  }
  const a = await get<NetlifyAccount>(deps, token, `/accounts/${encodeURIComponent(slug)}`);

  const included = num(a.plan_credits) ?? num(a.capabilities?.credits?.included);
  const used = num(a.capabilities?.credits?.used);
  return {
    configured: true,
    teamSlug: str(a.slug) ?? slug,
    plan: str(a.type_name),
    creditsIncluded: included,
    creditsUsed: used,
    creditsAvailable: included !== null && used !== null ? round2(Math.max(0, included - used)) : null,
    periodStart: str(a.current_billing_period_start),
    periodEnd: str(a.next_billing_period_start),
    usageExceeded: a.usages_exceeded === true,
  };
};
