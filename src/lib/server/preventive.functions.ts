// src/lib/server/preventive.functions.ts
// Server function (RPC dari browser ke server) untuk unggah foto Preventive.
// Logika sebenarnya ada di preventiveUpload.server.ts agar bisa diuji; berkas ini hanya menyambungkan
// environment server (rahasia tidak pernah dikirim ke browser).

import { createServerFn } from '@tanstack/react-start';
import { confirmUpload, createUploadTicket } from './preventiveUpload.server.ts';
import { listPreventiveQrCodes } from './preventiveQr.server.ts';
import { createQrUploadTicket } from './preventiveQrUpload.server.ts';
import type { QrUploadTicket } from './preventiveQrUpload.server.ts';
import type { ConfirmResult, UploadTicket } from '../data/preventiveTypes.ts';

interface TicketInput {
  period: string;
  equipmentNumber: string;
}

interface ConfirmInput extends TicketInput {
  version: number;
}

const serverDeps = () => ({
  env: process.env as Record<string, string | undefined>,
  fetch: globalThis.fetch,
  now: () => new Date(),
});

/** Langkah 1: minta tanda tangan unggah untuk satu peralatan pada periode berjalan. */
export const getPreventiveUploadTicket = createServerFn({ method: 'POST' })
  .validator((data: TicketInput) => data)
  .handler(async ({ data }): Promise<UploadTicket> => createUploadTicket(data, serverDeps()));

/** Langkah 2: setelah browser selesai mengunggah ke Cloudinary, verifikasi dan catat log. */
export const confirmPreventiveUpload = createServerFn({ method: 'POST' })
  .validator((data: ConfirmInput) => data)
  .handler(async ({ data }): Promise<ConfirmResult> => confirmUpload(data, serverDeps()));

/** Peta nomor equipment → URL gambar QR code peralatan di Cloudinary (folder PRIMA/QR CODE). */
export const getPreventiveQrCodes = createServerFn({ method: 'POST' })
  .handler(async (): Promise<Record<string, string>> => listPreventiveQrCodes(serverDeps()));

/** Tanda tangan unggah gambar QR code satu peralatan (tab Data > Peralatan Preventive). Wajib login. */
export const getPreventiveQrUploadTicket = createServerFn({ method: 'POST' })
  .validator((data: { accessToken: string; equipmentNumber: string }) => data)
  .handler(async ({ data }): Promise<QrUploadTicket> => createQrUploadTicket(data, serverDeps()));
