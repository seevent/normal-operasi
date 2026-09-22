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
  } catch (err) {
    console.error('Gagal menyalin teks', err);
  }

  // Buka WhatsApp terlebih dahulu secara langsung agar tidak terblokir oleh popup blocker browser
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');

  if (files.length > 0) {
    // Unduh otomatis berkas (PDF / Foto) agar pengguna di PC / Web dapat langsung melampirkannya
    files.forEach((f) => triggerFileDownload(f));
  }
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

  // Salin teks ke clipboard secara asinkron tanpa menahan (await) agar hak user gesture pada browser tidak kedaluwarsa
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(message).catch(() => {});
  }

  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({
        files: finalFiles,
        title: 'Laporan SSES T2',
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

