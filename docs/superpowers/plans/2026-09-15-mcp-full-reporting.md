# MCP Full Reporting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose secure MCP tools that create Initial Report, Perbaikan, Storing, Kegiatan, and Kalibrasi reports, upload their media, render a PDF, and return a WhatsApp-ready delivery result.

**Architecture:** Add a single stateless Streamable HTTP MCP endpoint implemented as a Netlify Function. The endpoint validates a Supabase user token and role, validates tool input with Zod, persists a normalized report request plus the current report-specific payload, asynchronously uploads artifacts and renders PDFs, and delegates WhatsApp delivery only to an approved provider adapter. Existing browser report tabs remain unchanged during the first release.

**Tech Stack:** TypeScript, `@modelcontextprotocol/sdk@1.30.0`, Zod, `@netlify/functions`, Supabase PostgreSQL/Auth/Storage, `pdf-lib`, Node test runner, Netlify Background Functions.

## Global Constraints

- One MCP endpoint: `POST` and `GET /mcp`; do not create one MCP server per report type.
- Never expose a Supabase service-role key, WhatsApp token, or Drive credential to Vite/browser code; function-only secrets must not start with `VITE_`.
- Authenticate every MCP request with a Supabase JWT, then authorize by server-side role; no tool may accept `user_id`, role, or tenant id as input.
- The initial release must reject cross-origin browser calls except the configured MCP client origins, restrict all media to 10 MB/image and 30 MB/report, and never dereference arbitrary URLs supplied by a tool caller.
- A report write is idempotent on `(actor_user_id, idempotency_key)`, and every state-changing operation writes an immutable audit event.
- WhatsApp delivery is opt-in and provider-backed. A missing provider configuration must return a ready-to-copy WhatsApp message and PDF link, never claim that a message was sent.
- Continue rendering the established WhatsApp text via the pure functions in `src/lib/utils/waGenerator.ts`; do not duplicate report wording in the MCP layer.
- Keep `laporan_operasional` as the Shift Report’s normalized projection. Preserve each full source payload in the new MCP report tables.

---

## Proposed File Structure

```text
netlify/
  functions/
    mcp.ts                              # Streamable HTTP transport and MCP registration
    report-worker-background.ts         # PDF/media/WhatsApp asynchronous processor
    _shared/
      mcp-auth.ts                       # Bearer verification, role lookup, origin check
      http.ts                           # JSON and MCP-safe error responses
      supabase-admin.ts                 # Server-only Supabase client factory
      reports/
        contracts.ts                    # Zod schemas and normalized report types
        formatter.ts                    # Calls existing WA generators from normalized input
        repository.ts                   # RPC/database reads and idempotent writes
        media.ts                        # Base64 decoding, digesting, private Storage upload
        pdf.ts                          # PDF generated from report message and artifacts
        whatsapp.ts                     # Disabled-by-default provider adapter
        workflow.ts                     # create → process → deliver state transitions
supabase/
  migrations/
    <timestamp>_mcp_reporting.sql       # Tables, indexes, RLS, RPCs, grants
tests/
  mcp-auth.test.mjs
  mcp-report-contracts.test.mjs
  mcp-report-workflow.test.mjs
  mcp-tools.test.mjs
  mcp-worker.test.mjs
```

No frontend component is modified in this plan. A later change may make the React tabs call the same domain workflow, after the MCP contract has proven stable.

### Task 1: Define MCP report contracts and add test tooling

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `netlify/functions/_shared/reports/contracts.ts`
- Create: `tests/mcp-report-contracts.test.mjs`

**Interfaces:**
- Produces `ReportType`, `CreateReportInputSchema`, `MediaInputSchema`, and `CreateReportInput`.
- `CreateReportInput` contains `reportType`, `idempotencyKey`, `payload`, `media`, and `delivery`.
- `payload` is a discriminated union keyed by `reportType`.

- [ ] **Step 1: Add the first failing contract test**

```js
import assert from 'node:assert/strict';
import test from 'node:test';
import { CreateReportInputSchema } from '../netlify/functions/_shared/reports/contracts.ts';

test('accepts a complete kegiatan MCP request', () => {
  const result = CreateReportInputSchema.safeParse({
    reportType: 'kegiatan',
    idempotencyKey: '7fda7599-4e87-477a-ba45-437a66f3af8a',
    payload: {
      tanggal: '2026-09-15', waktuMulai: '08:15', waktuSelesai: '09:00',
      lokasi: 'PSCP', kegiatan: 'Pengecekan perangkat.', teknisi: ['Budi']
    },
    media: [], delivery: { mode: 'prepare' }
  });
  assert.equal(result.success, true);
});
```

- [ ] **Step 2: Run the test to verify it fails because the module is absent**

Run: `node --test tests/mcp-report-contracts.test.mjs`

Expected: failure with `ERR_MODULE_NOT_FOUND` for `contracts.ts`.

- [ ] **Step 3: Install only runtime dependencies required by the function and add test script**

```json
{
  "scripts": {
    "test": "node --test tests/*.test.mjs"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.30.0",
    "@netlify/functions": "6.0.0",
    "pdf-lib": "1.17.1",
    "zod": "4.6.5"
  }
}
```

Run: `npm install @modelcontextprotocol/sdk@1.30.0 @netlify/functions pdf-lib zod`

- [ ] **Step 4: Implement the contract module**

```ts
import { z } from 'zod';

export const ReportTypeSchema = z.enum(['initial_report', 'perbaikan', 'storing', 'kegiatan', 'kalibrasi']);
export const MediaInputSchema = z.object({
  filename: z.string().regex(/^[a-zA-Z0-9._-]{1,120}$/),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  base64: z.string().min(4).max(14_000_000),
});
const base = z.object({ tanggal: z.string().date(), waktuMulai: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/), teknisi: z.array(z.string().min(1)).max(10) });
export const CreateReportInputSchema = z.discriminatedUnion('reportType', [
  z.object({ reportType: z.literal('kegiatan'), idempotencyKey: z.string().uuid(), payload: base.extend({ waktuSelesai: z.string().regex(/^([01]\\d|2[0-3]):[0-5]\\d$/).optional(), lokasi: z.string().min(1), kegiatan: z.string().min(1) }), media: z.array(MediaInputSchema).max(12), delivery: z.object({ mode: z.enum(['prepare', 'send']) }) }),
  /* Add the four typed payload variants in the same module: initial_report, perbaikan, storing, kalibrasi. */
]);
export type CreateReportInput = z.infer<typeof CreateReportInputSchema>;
```

For the remaining variants, model the fields already collected by `TabInitialReport.tsx`, `TabPerbaikan.tsx`, `TabStoring.tsx`, and `TabKalibrasi.tsx`: equipment, locations, timings, status, report-specific notes, and calibration entries. Require `peralatan`, at least one location, and the report-specific narrative; use `.strict()` on every payload variant.

- [ ] **Step 5: Add failing tests for each report type and rejection paths**

```js
test('rejects initial report without equipment', () => {
  const result = CreateReportInputSchema.safeParse({ reportType: 'initial_report', idempotencyKey: crypto.randomUUID(), payload: {}, media: [], delivery: { mode: 'prepare' } });
  assert.equal(result.success, false);
});

test('rejects non-image media and an oversized media list', () => {
  const parsed = MediaInputSchema.safeParse({ filename: 'report.pdf', mimeType: 'application/pdf', base64: 'YWJj' });
  assert.equal(parsed.success, false);
});
```

- [ ] **Step 6: Run contract tests to verify they pass**

Run: `node --test tests/mcp-report-contracts.test.mjs`

Expected: all contract tests pass.

- [ ] **Step 7: Commit the isolated contract change**

```bash
git add package.json package-lock.json netlify/functions/_shared/reports/contracts.ts tests/mcp-report-contracts.test.mjs
git commit -m "feat: define MCP report contracts"
```

### Task 2: Add secure persistence, role lookup, and audit schema

**Files:**
- Create: `supabase/migrations/<timestamp>_mcp_reporting.sql`
- Create: `netlify/functions/_shared/supabase-admin.ts`
- Create: `netlify/functions/_shared/reports/repository.ts`
- Create: `tests/mcp-report-workflow.test.mjs`

**Interfaces:**
- Consumes `CreateReportInput` from Task 1 and a verified actor id from Task 3.
- Produces `createOrFindReport(actorId, input)` and `appendAuditEvent(...)`.
- Persists an immutable full payload and an operational-log projection.

- [ ] **Step 1: Write a failing repository contract test**

```js
test('reusing an idempotency key returns the original report id', async () => {
  const repo = createInMemoryReportRepository();
  const first = await repo.createOrFindReport('user-1', kegiatanInput);
  const second = await repo.createOrFindReport('user-1', kegiatanInput);
  assert.equal(first.reportId, second.reportId);
  assert.equal(second.created, false);
});
```

- [ ] **Step 2: Run it and verify RED**

Run: `node --test tests/mcp-report-workflow.test.mjs`

Expected: failure because `createInMemoryReportRepository` does not exist.

- [ ] **Step 3: Create the migration with explicit RLS and RPC boundaries**

```sql
create table public.mcp_report_requests (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id),
  idempotency_key uuid not null,
  report_type text not null check (report_type in ('initial_report','perbaikan','storing','kegiatan','kalibrasi')),
  status text not null check (status in ('queued','processing','ready','sent','failed')),
  payload jsonb not null,
  whatsapp_message text not null,
  operational_log_id uuid references public.laporan_operasional(id),
  pdf_path text,
  delivery_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (actor_user_id, idempotency_key)
);
create table public.mcp_report_artifacts (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.mcp_report_requests(id) on delete cascade,
  storage_path text not null unique,
  sha256 text not null,
  mime_type text not null,
  byte_size integer not null check (byte_size > 0 and byte_size <= 10485760),
  created_at timestamptz not null default now()
);
create table public.mcp_audit_events (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id),
  report_id uuid references public.mcp_report_requests(id),
  action text not null,
  request_id text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.mcp_report_requests enable row level security;
alter table public.mcp_report_artifacts enable row level security;
alter table public.mcp_audit_events enable row level security;
```

Add policies that let an authenticated user select only rows where `actor_user_id = (select auth.uid())`; do not grant direct insert/update/delete to client roles. Add a server-invoker RPC that creates the report, inserts its normalized `laporan_operasional` projection, and writes the `report_created` event in one transaction. Grant execute only to the server role used by the function. Add a `user_roles` table keyed by `user_id` with only `teknisi`, `supervisor`, and `admin`; authorization must read this table, not `user_metadata`.

- [ ] **Step 4: Implement an injectable repository and its in-memory test double**

```ts
export interface ReportRepository {
  createOrFindReport(actorId: string, input: CreateReportInput): Promise<{ reportId: string; created: boolean }>;
  markReady(reportId: string, patch: { pdfPath: string; deliveryResult: Record<string, unknown> }): Promise<void>;
  appendAuditEvent(event: { actorId: string; reportId?: string; action: string; requestId: string; metadata?: Record<string, unknown> }): Promise<void>;
}
```

Implement production calls through a server-only Supabase client and `rpc('create_mcp_report', ...)`; tests use an in-memory map. The projected `laporan_operasional.jenis` values are `Initial Report`, `Perbaikan`, `Storing`, `Kegiatan`, and `Kalibrasi`; use `CORRECTIVE` for initial/perbaikan, `STORING` for storing, `KEGIATAN` for kegiatan, and `PREVENTIVE` for kalibrasi.

- [ ] **Step 5: Run repository tests to verify GREEN**

Run: `node --test tests/mcp-report-workflow.test.mjs`

Expected: all tests pass, including duplicate requests and audit append behavior.

- [ ] **Step 6: Apply migration only to a non-production linked Supabase project and verify policies**

Run: `supabase migration new mcp_reporting` followed by the repository’s standard non-production migration command.

Expected: tables, RPC, constraints, and RLS policies are present; an `authenticated` browser role cannot directly insert an MCP report request.

- [ ] **Step 7: Commit**

```bash
git add supabase netlify/functions/_shared/supabase-admin.ts netlify/functions/_shared/reports/repository.ts tests/mcp-report-workflow.test.mjs
git commit -m "feat: persist audited MCP report requests"
```

### Task 3: Authenticate and authorize the MCP gateway

**Files:**
- Create: `netlify/functions/_shared/mcp-auth.ts`
- Create: `netlify/functions/_shared/http.ts`
- Create: `tests/mcp-auth.test.mjs`

**Interfaces:**
- Produces `authenticateMcpRequest(request): Promise<{ actorId: string; role: 'teknisi' | 'supervisor' | 'admin' }>`.
- Rejects all missing, malformed, expired, wrong-audience, or unauthorized tokens before tool dispatch.

- [ ] **Step 1: Write a failing authentication test**

```js
test('rejects a tool request without a bearer token', async () => {
  await assert.rejects(
    () => authenticateMcpRequest(new Request('https://mcp.example/mcp')),
    { status: 401 }
  );
});

test('denies a teknisi from requesting send delivery', () => {
  assert.equal(canUseDelivery('teknisi', 'send'), false);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/mcp-auth.test.mjs`

Expected: module-not-found failure for `mcp-auth.ts`.

- [ ] **Step 3: Implement token validation and explicit permissions**

```ts
const permissions = {
  teknisi: new Set(['prepare']),
  supervisor: new Set(['prepare', 'send']),
  admin: new Set(['prepare', 'send']),
} as const;

export const canUseDelivery = (role: keyof typeof permissions, mode: 'prepare' | 'send') => permissions[role].has(mode);
```

Verify a bearer token with `supabase.auth.getUser(token)`, then query the server-side `user_roles` table using the verified user id. Require `MCP_ALLOWED_ORIGINS` for any request that includes `Origin`; return 403 for an unlisted origin. Use `MCP_SUPABASE_URL` and `MCP_SUPABASE_SERVICE_ROLE_KEY` only from Netlify Function secrets. Return a 401 JSON-RPC-compatible error without leaking token parse details.

- [ ] **Step 4: Run authentication tests to verify GREEN**

Run: `node --test tests/mcp-auth.test.mjs`

Expected: missing token → 401, unknown user → 403, teknisi send → denied, supervisor send → allowed.

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/_shared/mcp-auth.ts netlify/functions/_shared/http.ts tests/mcp-auth.test.mjs
git commit -m "feat: authorize MCP report access"
```

### Task 4: Produce the report message and normalized operational projection

**Files:**
- Create: `netlify/functions/_shared/reports/formatter.ts`
- Modify: `src/lib/utils/waGenerator.ts` only to export missing pure input types; preserve output wording
- Test: `tests/mcp-report-contracts.test.mjs`

**Interfaces:**
- Produces `formatReport(input): { whatsappMessage: string; operationalLog: OperationalLog }`.
- Uses `generateWA_InitialReport`, `generateWA_Perbaikan`, `generateWA_Storing`, `generateWA_Kegiatan`, and `generateWA_Kalibrasi`.

- [ ] **Step 1: Add a failing parity test for each report type**

```js
test('formats MCP kegiatan with the existing WhatsApp template', () => {
  const result = formatReport(kegiatanInput);
  assert.match(result.whatsappMessage, /^\*KEGIATAN SSES T2\*/);
  assert.equal(result.operationalLog.jenis, 'Kegiatan');
  assert.equal(result.operationalLog.kategori_maintenance, 'KEGIATAN');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/mcp-report-contracts.test.mjs`

Expected: failure because `formatReport` is absent.

- [ ] **Step 3: Implement a narrow formatter adapter**

```ts
export function formatReport(input: CreateReportInput) {
  switch (input.reportType) {
    case 'kegiatan':
      return { whatsappMessage: generateWA_Kegiatan(input.payload), operationalLog: toOperationalLog(input, 'Kegiatan', 'KEGIATAN') };
    case 'initial_report':
      return { whatsappMessage: generateWA_InitialReport(input.payload), operationalLog: toOperationalLog(input, 'Initial Report', 'CORRECTIVE') };
    // Implement perbaikan, storing, and kalibrasi with their existing generators.
  }
}
```

Map media only after Task 5 returns private paths; initially the `foto_urls` projection is empty. Do not create a second Indonesian report template in the function.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `node --test tests/mcp-report-contracts.test.mjs`

Expected: five report types generate non-placeholder WhatsApp messages and correct normalized `jenis`/category values.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/waGenerator.ts netlify/functions/_shared/reports/formatter.ts tests/mcp-report-contracts.test.mjs
git commit -m "feat: format MCP operational reports"
```

### Task 5: Upload and attach report media securely

**Files:**
- Create: `netlify/functions/_shared/reports/media.ts`
- Create: `tests/mcp-worker.test.mjs`
- Modify: `supabase/migrations/<timestamp>_mcp_reporting.sql`

**Interfaces:**
- Produces `storeReportMedia(reportId, media): Promise<StoredArtifact[]>`.
- Stores under `mcp-reports/<reportId>/media/<sha256>.<extension>` in a private `mcp-reports` bucket.

- [ ] **Step 1: Write failing media tests**

```js
test('stores a JPEG below the per-file limit with a digest-derived path', async () => {
  const [artifact] = await storeReportMedia('report-1', [{ filename: 'foto.jpg', mimeType: 'image/jpeg', base64: 'aGVsbG8=' }], fakeStorage);
  assert.match(artifact.storagePath, /^mcp-reports\/report-1\/media\/[a-f0-9]{64}\.jpg$/);
});

test('rejects a declared PNG whose bytes are not PNG', async () => {
  await assert.rejects(() => storeReportMedia('report-1', [{ filename: 'a.png', mimeType: 'image/png', base64: 'aGVsbG8=' }], fakeStorage));
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/mcp-worker.test.mjs`

Expected: failure because `storeReportMedia` is absent.

- [ ] **Step 3: Create the private Storage bucket and implement validation**

```ts
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_REPORT_BYTES = 30 * 1024 * 1024;

export async function storeReportMedia(reportId: string, media: MediaInput[], storage: StoragePort) {
  const buffers = media.map(decodeAndVerifyImage);
  if (buffers.reduce((sum, item) => sum + item.bytes.length, 0) > MAX_REPORT_BYTES) throw new Error('MEDIA_REPORT_TOO_LARGE');
  return Promise.all(buffers.map((item) => storage.upload(`mcp-reports/${reportId}/media/${item.sha256}.${item.extension}`, item.bytes, item.mimeType)));
}
```

The migration must create the private bucket and prohibit public object reads. Only the function’s service role uploads. The client receives a short-lived signed URL only when it reads its own report result; do not write a public Drive URL to `foto_urls`.

- [ ] **Step 4: Run media tests to verify GREEN**

Run: `node --test tests/mcp-worker.test.mjs`

Expected: valid JPEG/PNG/WebP data is accepted; MIME mismatch, more than 12 files, individual oversize, and aggregate oversize are rejected.

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/_shared/reports/media.ts supabase/migrations tests/mcp-worker.test.mjs
git commit -m "feat: attach private MCP report media"
```

### Task 6: Render a PDF asynchronously and implement a truthful WhatsApp adapter

**Files:**
- Create: `netlify/functions/_shared/reports/pdf.ts`
- Create: `netlify/functions/_shared/reports/whatsapp.ts`
- Create: `netlify/functions/_shared/reports/workflow.ts`
- Create: `netlify/functions/report-worker-background.ts`
- Test: `tests/mcp-worker.test.mjs`

**Interfaces:**
- Produces `processReport(reportId): Promise<ReportProcessingResult>`.
- `ReportProcessingResult.delivery.status` is exactly `prepared`, `sent`, or `failed`.

- [ ] **Step 1: Add failing worker tests**

```js
test('creates a PDF and returns prepared delivery when no WhatsApp provider is configured', async () => {
  const result = await processReport('report-1', fakeDependencies({ whatsapp: undefined }));
  assert.equal(result.delivery.status, 'prepared');
  assert.match(result.pdfPath, /^mcp-reports\/report-1\/report\.pdf$/);
});

test('does not call WhatsApp when delivery mode is prepare', async () => {
  const whatsapp = { send: async () => { throw new Error('must not send'); } };
  const result = await processReport('report-1', fakeDependencies({ whatsapp, deliveryMode: 'prepare' }));
  assert.equal(result.delivery.status, 'prepared');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/mcp-worker.test.mjs`

Expected: failure because the worker modules do not exist.

- [ ] **Step 3: Implement PDF and delivery ports**

```ts
export interface WhatsAppPort {
  send(input: { message: string; mediaUrls: string[]; idempotencyKey: string }): Promise<{ providerMessageId: string }>;
}

export async function deliverReport(mode: 'prepare' | 'send', port: WhatsAppPort | undefined, input: Parameters<WhatsAppPort['send']>[0]) {
  if (mode === 'prepare' || !port) return { status: 'prepared' as const };
  const sent = await port.send(input);
  return { status: 'sent' as const, providerMessageId: sent.providerMessageId };
}
```

Generate a compact A4 PDF using `pdf-lib` from the established WhatsApp text, report metadata, and page references to attached artifacts. Store it privately at `mcp-reports/<reportId>/report.pdf`. Implement the WhatsApp adapter only for a preselected approved provider; its endpoint and token come from `WHATSAPP_PROVIDER_URL` and `WHATSAPP_PROVIDER_TOKEN`. Do not use `wa.me`, browser Web Share, or an unconfigured Google Apps Script endpoint as evidence of delivery.

- [ ] **Step 4: Implement the background function**

```ts
export default async (req: Request) => {
  const { reportId } = await req.json();
  await processReport(reportId, createProductionDependencies());
  return new Response(null, { status: 202 });
};

export const config = { path: '/internal/report-worker', background: true };
```

Have the synchronous MCP workflow persist `queued`, enqueue this function, and immediately return the report id plus `status: 'queued'`. The worker writes `ready`, `sent`, or `failed` and appends matching audit entries. Never make a client wait for PDF rendering inside the MCP request.

- [ ] **Step 5: Run worker tests to verify GREEN**

Run: `node --test tests/mcp-worker.test.mjs`

Expected: PDF path is persisted, no-provider delivery is `prepared`, `prepare` never sends, and provider failure becomes `failed` with sanitized error text.

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/_shared/reports netlify/functions/report-worker-background.ts tests/mcp-worker.test.mjs
git commit -m "feat: process MCP report artifacts and delivery"
```

### Task 7: Publish the MCP endpoint and five report tools

**Files:**
- Create: `netlify/functions/mcp.ts`
- Create: `tests/mcp-tools.test.mjs`
- Modify: `netlify.toml`

**Interfaces:**
- Exposes `create_initial_report`, `create_perbaikan_report`, `create_storing_report`, `create_kegiatan_report`, `create_kalibrasi_report`, and `get_report_status`.
- Each create tool returns `{ reportId, status, whatsappMessage, signedPdfUrl?: string }`.

- [ ] **Step 1: Write a failing tools-list test**

```js
test('registers exactly the five requested create-report tools and a status tool', async () => {
  const names = await listToolNames(createMcpServer(fakeDependencies()));
  assert.deepEqual(names.sort(), [
    'create_initial_report', 'create_kalibrasi_report', 'create_kegiatan_report',
    'create_perbaikan_report', 'create_storing_report', 'get_report_status'
  ]);
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/mcp-tools.test.mjs`

Expected: failure because `mcp.ts` is absent.

- [ ] **Step 3: Implement the Streamable HTTP function**

```ts
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Config, Context } from '@netlify/functions';

export default async (req: Request, context: Context) => {
  const actor = await authenticateMcpRequest(req);
  const server = createMcpServer(createProductionDependencies(actor, context.requestId));
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  await server.connect(transport);
  return transport.handleRequest(req);
};

export const config: Config = { path: '/mcp', method: ['GET', 'POST'] };
```

Register each tool with the report-type-specific Zod schema from Task 1. The handler must reject `delivery.mode: 'send'` unless `canUseDelivery(actor.role, 'send')`; it calls `createOrFindReport`, queues processing only when the row is newly created, and returns the stored result on duplicate calls. `get_report_status` must authorize ownership or supervisor/admin access and create signed URLs only at read time.

- [ ] **Step 4: Configure deployment safeguards**

```toml
[functions]
  directory = "netlify/functions"

[[headers]]
  for = "/mcp"
  [headers.values]
    Cache-Control = "no-store"
```

Set the following in the Netlify UI with Functions scope and production-only values: `MCP_SUPABASE_URL`, `MCP_SUPABASE_SERVICE_ROLE_KEY`, `MCP_ALLOWED_ORIGINS`, `WHATSAPP_PROVIDER_URL`, and `WHATSAPP_PROVIDER_TOKEN`. Mark secrets as secret. Remove `SECRETS_SCAN_ENABLED = "false"` from `netlify.toml` before deploying any server secret.

- [ ] **Step 5: Run endpoint tests to verify GREEN**

Run: `node --test tests/mcp-tools.test.mjs`

Expected: exact tool names, invalid input produces a structured tool error, duplicate idempotency keys do not enqueue another worker, and a teknisi cannot send WhatsApp.

- [ ] **Step 6: Commit**

```bash
git add netlify/functions/mcp.ts netlify.toml tests/mcp-tools.test.mjs
git commit -m "feat: expose MCP report tools"
```

### Task 8: Integrate against staging and document operator setup

**Files:**
- Modify: `README.md`
- Modify: `architecture.md`
- Create: `docs/mcp-operations.md`

**Interfaces:**
- Documents endpoint, tool contracts, authorization matrix, required secrets, and states: `queued`, `processing`, `ready`, `sent`, `failed`.

- [ ] **Step 1: Add a failing smoke test script that expects a valid MCP initialization response**

```js
test('staging MCP endpoint requires authorization and rejects unauthenticated requests', async () => {
  const response = await fetch(process.env.MCP_STAGING_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }) });
  assert.equal(response.status, 401);
});
```

- [ ] **Step 2: Run it against staging before configuration**

Run: `MCP_STAGING_URL=https://<staging-site>/mcp node --test tests/mcp-tools.test.mjs`

Expected: failure until the staging endpoint is deployed.

- [ ] **Step 3: Deploy a non-production environment and configure non-production secrets**

Use separate Supabase project/storage bucket and WhatsApp sandbox credentials. Do not point a deploy preview at production service-role credentials or the production delivery number.

- [ ] **Step 4: Verify the end-to-end sequence**

Run: `npm test && npm run build`

Then run authenticated MCP calls for all five report types with `delivery.mode: 'prepare'`; poll `get_report_status` until `ready`. Verify each produces: an auditable request row, one normalized operational-log projection, private media artifact rows, a private PDF, and a WhatsApp message matching the existing template. Run one supervisor-only staging send with sandbox credentials and verify `sent` contains the provider message id.

- [ ] **Step 5: Document setup and rollback**

Document token lifecycle, role assignment, media quotas, message send policy, failed-job handling, secret rotation, and rollback by disabling the `/mcp` function route while preserving audit rows. Include the explicit note that WhatsApp `send` is an external action and requires operator approval in the client UX.

- [ ] **Step 6: Commit**

```bash
git add README.md architecture.md docs/mcp-operations.md tests/mcp-tools.test.mjs
git commit -m "docs: document MCP reporting operations"
```

## Plan Self-Review

- Coverage: all five requested report types are represented by one typed create tool, one shared persistence workflow, private media handling, PDF generation, and a delivery adapter.
- Security: the plan explicitly prevents direct service-role exposure, browser-configured Drive destinations, public media, arbitrary URL fetches, unscoped table writes, and unapproved delivery.
- Operational behavior: long PDF/media tasks run in a background function; requests report their real delivery state rather than assuming WhatsApp success.
- Deliberate exclusions: this plan does not automate WhatsApp Web, does not alter existing React report forms, and does not migrate legacy Drive assets.
