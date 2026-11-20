import assert from 'node:assert/strict';
import test from 'node:test';
import { cloudinaryThumbUrl } from '../src/lib/utils/cloudinaryThumb.ts';

const BASE = 'https://res.cloudinary.com/wha6e7fj/image/upload/v1793156064/PRIMA/Daily/Alat%20A.jpg';

test('URL Cloudinary image: transformasi thumbnail disisipkan setelah /image/upload/', () => {
  assert.equal(
    cloudinaryThumbUrl(BASE, 112),
    'https://res.cloudinary.com/wha6e7fj/image/upload/c_fill,w_112,h_112,q_auto,f_auto/v1793156064/PRIMA/Daily/Alat%20A.jpg',
  );
});

test('ukuran dibulatkan ke bilangan bulat positif', () => {
  assert.match(cloudinaryThumbUrl(BASE, 111.6), /c_fill,w_112,h_112,/);
});

test('URL selain Cloudinary image dikembalikan apa adanya', () => {
  for (const url of [
    'https://abc.supabase.co/storage/v1/object/public/dokumentasi/a.jpg',
    'https://res.cloudinary.com/x/video/upload/v1/a.mp4',
    'https://drive.google.com/file/d/123/view',
    'bukan url',
    '',
  ]) {
    assert.equal(cloudinaryThumbUrl(url, 112), url);
  }
});

test('ukuran tidak valid: URL asli dikembalikan', () => {
  assert.equal(cloudinaryThumbUrl(BASE, 0), BASE);
  assert.equal(cloudinaryThumbUrl(BASE, Number.NaN), BASE);
});
