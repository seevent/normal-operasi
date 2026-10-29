// src/lib/server/storageAdmin.functions.ts
// Server function (RPC dari browser ke server) untuk panel Penyimpanan di tab Data.
// Logika sebenarnya ada di storagePurge.server.ts agar bisa diuji; berkas ini hanya menyambungkan
// environment server (rahasia tidak pernah dikirim ke browser). Semua pemanggilan wajib akun login.

import { createServerFn } from '@tanstack/react-start';
import { getCloudinaryUsage, purgeDueTrash, requireLoggedIn } from './storagePurge.server.ts';
import type { CloudinaryUsageSummary, JobSummary } from './storagePurge.server.ts';

interface TokenInput {
  accessToken: string;
}

const serverDeps = () => ({
  env: process.env as Record<string, string | undefined>,
  fetch: globalThis.fetch,
  now: () => new Date(),
});

/** Pemakaian Cloudinary (kredit, penyimpanan, bandwidth, transformasi). */
export const fetchCloudinaryUsage = createServerFn({ method: 'POST' })
  .validator((data: TokenInput) => data)
  .handler(async ({ data }): Promise<CloudinaryUsageSummary> => {
    const deps = serverDeps();
    await requireLoggedIn(data.accessToken, deps);
    return getCloudinaryUsage(deps);
  });

/**
 * Jalankan pengosongan Sampah sekarang, hanya untuk job yang sudah 7 hari (sama seperti jadwal harian).
 * Cadangan bila jadwal harian terlewat.
 */
export const runDueTrashPurge = createServerFn({ method: 'POST' })
  .validator((data: TokenInput) => data)
  .handler(async ({ data }): Promise<JobSummary[]> => {
    const deps = serverDeps();
    await requireLoggedIn(data.accessToken, deps);
    return purgeDueTrash(deps);
  });
