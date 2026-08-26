// src/lib/services/pdfService.ts

export interface PdfOptions {
  margin?: number | number[];
  filename?: string;
  image?: { type?: 'jpeg' | 'png'; quality?: number };
  html2canvas?: any;
  jsPDF?: { unit?: string; format?: string | number[]; orientation?: 'portrait' | 'landscape' };
  pagebreak?: any;
}

/**
 * Remove all html2pdf DOM artifacts that block user interaction.
 *
 * html2pdf.js creates TWO elements on document.body:
 *   .html2pdf__overlay  — position:fixed covering the ENTIRE viewport (z-index 1000, opacity 0)
 *   .html2pdf__container — the cloned content inside the overlay
 *
 * The overlay intercepts ALL pointer events even though it's invisible.
 * The library removes it inside toCanvas(), but if anything goes wrong
 * (or timing is off) the overlay stays forever, freezing the UI.
 */
function purgeHtml2PdfArtifacts() {
  document.querySelectorAll('.html2pdf__overlay, .html2pdf__container').forEach(el => el.remove());
}

/**
 * Generate a PDF Blob from an HTMLElement.
 * Guarantees the invisible full-screen overlay left by html2pdf.js
 * is always removed so the app never freezes.
 */
export const generatePdfBlob = async (element: HTMLElement, opt: PdfOptions): Promise<Blob> => {
  const html2pdf = (await import('html2pdf.js')).default;

  // Snapshot body styles before html2pdf mutates them
  const savedOverflow = document.body.style.overflow;
  const savedPosition = document.body.style.position;

  let pdfBlob: Blob;
  try {
    pdfBlob = await html2pdf().set(opt).from(element).output('blob');
  } finally {
    // Immediate cleanup
    purgeHtml2PdfArtifacts();

    // Restore body styles
    document.body.style.overflow = savedOverflow;
    document.body.style.position = savedPosition;
    document.body.style.pointerEvents = '';
  }

  // Schedule additional cleanup passes in case the overlay is created asynchronously
  setTimeout(purgeHtml2PdfArtifacts, 0);
  setTimeout(purgeHtml2PdfArtifacts, 200);
  setTimeout(purgeHtml2PdfArtifacts, 1000);

  return pdfBlob;
};

