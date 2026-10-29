import assert from 'node:assert/strict';
import test from 'node:test';
import { archiveMediaName, buildReportCsv } from '../src/lib/utils/reportArchive.ts';

const row = {
  id: '3f2a9c1e-0000-4000-8000-000000000001',
  tanggal: '2026-10-24',
  shift: 'P',
  jenis: 'Storing',
  uraian: 'Monitor mati, "restart", OK\nlanjut',
  foto_urls: ['https://res.cloudinary.com/x/image/upload/v1/a.jpg', 'https://res.cloudinary.com/x/video/upload/v1/b.MOV'],
};

test('buildReportCsv: header, BOM, kutip untuk koma/kutip/baris baru', () => {
  const csv = buildReportCsv([row]);
  assert.ok(csv.startsWith('﻿id,tanggal,shift,jenis,'));
  assert.match(csv, /"Monitor mati, ""restart"", OK\nlanjut"/);
  assert.match(csv, /a\.jpg https:\/\/res\.cloudinary\.com\/x\/video\/upload\/v1\/b\.MOV/);
});

test('archiveMediaName: tanggal_jenis_id_urutan.ext', () => {
  assert.equal(archiveMediaName(row, 0, row.foto_urls[0]), 'media/2026-10-24_Storing_3f2a9c1e_1.jpg');
  assert.equal(archiveMediaName(row, 1, row.foto_urls[1]), 'media/2026-10-24_Storing_3f2a9c1e_2.mov');
  assert.equal(archiveMediaName({ ...row, jenis: null }, 0, 'https://x/tanpa-ekstensi'), 'media/2026-10-24_x_3f2a9c1e_1.bin');
});
