import assert from 'node:assert/strict';
import test from 'node:test';
import { rowKey, deriveStatus, pruneStaleLocals, buildSavedMap } from '../src/lib/utils/preventiveStatus.ts';

const KEYS = { DAILY: '2026-10-20', WEEKLY: '2026-10-18', MONTHLY: '2026-10-01' };
const EQ = 'ESE011000074751';
const saved = (over = {}) => ({ periodKey: '2026-10-20', version: 100, secureUrl: 'https://res.cloudinary.com/x/1.jpg', uploadedAt: '2026-10-20T01:00:00Z', ...over });

test('rowKey menggabungkan periode dan nomor equipment', () => {
  assert.equal(rowKey('DAILY', EQ), `DAILY:${EQ}`);
});

test('tanpa data apa pun status idle', () => {
  assert.equal(deriveStatus(undefined, undefined, KEYS.DAILY), 'idle');
});

test('log periode berjalan -> saved; log periode lama diabaikan (inilah reset 07.00)', () => {
  assert.equal(deriveStatus(undefined, saved(), KEYS.DAILY), 'saved');
  assert.equal(deriveStatus(undefined, saved({ periodKey: '2026-10-19' }), KEYS.DAILY), 'idle');
});

test('prioritas: uploading > failed > saved > idle', () => {
  assert.equal(deriveStatus({ status: 'uploading', periodKey: KEYS.DAILY }, saved(), KEYS.DAILY), 'uploading');
  assert.equal(deriveStatus({ status: 'failed', periodKey: KEYS.DAILY, error: 'x' }, saved(), KEYS.DAILY), 'failed');
  assert.equal(deriveStatus({ status: 'failed', periodKey: KEYS.DAILY, error: 'x' }, undefined, KEYS.DAILY), 'failed');
});

test('entri lokal dari periode lama tidak dipakai', () => {
  assert.equal(deriveStatus({ status: 'failed', periodKey: '2026-10-19', error: 'x' }, undefined, KEYS.DAILY), 'idle');
  assert.equal(deriveStatus({ status: 'uploading', periodKey: '2026-10-19' }, saved(), KEYS.DAILY), 'saved');
});

test('pruneStaleLocals membuang entri yang periodenya sudah berganti, mempertahankan yang masih berlaku', () => {
  const locals = {
    [rowKey('DAILY', 'ESE000000000001')]: { status: 'failed', periodKey: '2026-10-19', error: 'a' },
    [rowKey('DAILY', 'ESE000000000002')]: { status: 'failed', periodKey: '2026-10-20', error: 'b' },
    [rowKey('WEEKLY', 'ESE000000000003')]: { status: 'uploading', periodKey: '2026-10-11' },
    [rowKey('MONTHLY', 'ESE000000000004')]: { status: 'failed', periodKey: '2026-10-01', error: 'c' },
  };
  const out = pruneStaleLocals(locals, KEYS);
  assert.deepEqual(Object.keys(out).sort(), [rowKey('DAILY', 'ESE000000000002'), rowKey('MONTHLY', 'ESE000000000004')].sort());
});

test('buildSavedMap hanya memuat log pada kunci periode berjalan dan memilih versi terbaru', () => {
  const rows = [
    { period: 'DAILY', equipment_number: EQ, period_key: '2026-10-20', secure_url: 'u1', cloudinary_version: 100, uploaded_at: 't1' },
    { period: 'DAILY', equipment_number: EQ, period_key: '2026-10-19', secure_url: 'old', cloudinary_version: 50, uploaded_at: 't0' },
    { period: 'WEEKLY', equipment_number: EQ, period_key: '2026-10-18', secure_url: 'w', cloudinary_version: 70, uploaded_at: 't2' },
    { period: 'WEEKLY', equipment_number: EQ, period_key: '2026-10-11', secure_url: 'wold', cloudinary_version: 10, uploaded_at: 't3' },
    { period: 'MONTHLY', equipment_number: EQ, period_key: '2026-10-01', secure_url: 'm1', cloudinary_version: 5, uploaded_at: 't4' },
    { period: 'MONTHLY', equipment_number: EQ, period_key: '2026-10-01', secure_url: 'm2', cloudinary_version: 9, uploaded_at: 't5' },
  ];
  const map = buildSavedMap(rows, KEYS);
  assert.deepEqual(Object.keys(map).sort(), [rowKey('DAILY', EQ), rowKey('MONTHLY', EQ), rowKey('WEEKLY', EQ)].sort());
  assert.equal(map[rowKey('DAILY', EQ)].secureUrl, 'u1');
  assert.equal(map[rowKey('DAILY', EQ)].version, 100);
  assert.equal(map[rowKey('MONTHLY', EQ)].secureUrl, 'm2');
});
