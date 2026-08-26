// src/lib/services/shareService.ts

export const triggerFileDownload = (file: File) => {
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const fallbackShare = async (message: string, files: File[], setIsCopied: (v: boolean) => void) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else {
      const textArea = document.createElement('textarea');
      textArea.value = message;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);

    if (files.length > 0) {
      // Unduh otomatis berkas (PDF / Foto) agar pengguna di PC / Web dapat langsung melampirkannya
      files.forEach((f) => triggerFileDownload(f));

      const isPdf = files.some((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (isPdf) {
        alert(
          'Dokumen PDF Berita Acara telah berhasil diunduh ke perangkat Anda dan format teks laporan telah disalin ke clipboard.\n\nSilakan "Paste" format teks di chat WhatsApp dan lampirkan dokumen PDF yang baru saja terunduh.'
        );
      } else {
        alert(
          'Foto dokumentasi telah diunduh dan format teks laporan telah disalin ke clipboard.\n\nSilakan "Paste" format teks di WhatsApp dan lampirkan foto Anda.'
        );
      }
    }
  } catch (err) {
    console.error('Gagal menyalin teks', err);
  }
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

export const shareToWhatsApp = async (
  message: string,
  filesArray: File[] | File | null,
  setIsCopied: (v: boolean) => void
) => {
  let finalFiles: File[] = [];
  if (filesArray) {
    if (Array.isArray(filesArray)) finalFiles = filesArray;
    else finalFiles = [filesArray];
  }

  // Coba salin teks ke clipboard terlebih dahulu sebagai backup
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    }
  } catch (e) {
    // Ignore clipboard error
  }

  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({
        files: finalFiles,
        title: 'Berita Acara Serah Terima Barang',
        text: message
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    } else if (finalFiles.length === 0 && navigator.share) {
      await navigator.share({
        title: 'Laporan SSES T2',
        text: message
      });
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      return;
    }
  } catch (err: any) {
    console.error('Share dibatalkan atau gagal', err);
    if (err.name === 'AbortError') return;
  }

  await fallbackShare(message, finalFiles, setIsCopied);
};

