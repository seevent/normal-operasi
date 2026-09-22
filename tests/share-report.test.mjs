import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (relativePath) =>
  readFileSync(new URL(`../${relativePath}`, import.meta.url), 'utf8');

test('TabShiftReport: Share WA button generates PDF and shares with WhatsApp', () => {
  const content = readProjectFile('src/components/features/TabShiftReport.tsx');

  // Must call handleShareWa on Share WA button
  assert.match(content, /onClick=\{handleShareWa\}/);
  assert.match(content, /setSharingWa\(true\)/);
  assert.match(content, /generateShiftWaSummary\(\)/);
  assert.match(content, /generatePdfBlob\(element, opt\)/);
  assert.match(content, /new File\(\[pdfBlob\], filename, \{ type: 'application\/pdf' \}\)/);
  assert.match(content, /await shareToWhatsApp\(waMessage, pdfFile,/);
});

test('shareService: fallbackShare opens WhatsApp immediately without blocking alert', () => {
  const content = readProjectFile('src/lib/services/shareService.ts');

  // window.open must precede any file download
  const windowOpenPos = content.indexOf('window.open(`https://wa.me/?text=${encodedMessage}`, \'_blank\');');
  const triggerDownloadPos = content.indexOf('triggerFileDownload(f)');

  assert.ok(windowOpenPos > -1, 'window.open must exist');
  if (triggerDownloadPos > -1) {
    assert.ok(windowOpenPos < triggerDownloadPos, 'window.open must occur before file download triggers');
  }

  // Must not contain hardcoded Berita Acara alert in generic share service
  assert.doesNotMatch(content, /Dokumen PDF Berita Acara telah berhasil diunduh/);
});
