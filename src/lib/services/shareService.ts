// src/lib/services/shareService.ts

export const fallbackShare = async (message: string, hasUnsharedPhotos: boolean, setIsCopied: (v: boolean) => void) => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(message);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = message; 
      document.body.appendChild(textArea); 
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
    setIsCopied(true); 
    setTimeout(() => setIsCopied(false), 2500);
    if (hasUnsharedPhotos) {
      alert("Perangkat ini tidak mendukung pengiriman foto secara otomatis. Teks laporan telah dicopy. Silakan 'Paste' di WhatsApp dan lampirkan foto Anda secara manual.");
    }
  } catch (err) { 
    console.error("Gagal menyalin teks", err); 
  }
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
};

export const shareToWhatsApp = async (message: string, filesArray: File[] | File | null, setIsCopied: (v: boolean) => void) => {
  let finalFiles: File[] = [];
  if (filesArray) {
    if (Array.isArray(filesArray)) finalFiles = filesArray;
    else finalFiles = [filesArray];
  }
  try {
    if (finalFiles.length > 0 && navigator.canShare && navigator.canShare({ files: finalFiles })) {
      await navigator.share({ files: finalFiles, title: 'Laporan SSES T2', text: message });
      setIsCopied(true); 
      setTimeout(() => setIsCopied(false), 2500);
      return;
    } else if (finalFiles.length === 0 && navigator.share) {
      await navigator.share({ title: 'Laporan SSES T2', text: message });
      setIsCopied(true); 
      setTimeout(() => setIsCopied(false), 2500);
      return;
    }
  } catch (err: any) {
    console.error("Share dibatalkan atau gagal", err);
    if (err.name === 'AbortError') return;
  }
  
  fallbackShare(message, finalFiles.length > 0, setIsCopied);
};
