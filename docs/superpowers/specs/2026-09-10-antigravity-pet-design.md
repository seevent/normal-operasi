# Spesifikasi Desain: Chibi Iron Man Antigravity Pet

## 1. Ringkasan Fitur
Antigravity Pet adalah widget maskot interaktif berupa Chibi Iron Man berkepala besar (bobblehead) yang melayang dengan efek zero-gravity di layar aplikasi SSES T2. Pet ini berfungsi sebagai teman kerja visual yang menyenangkan, dapat dipindahkan (draggable), memberikan tips operasional dan kutipan penyemangat melalui balon dialog interaktif, serta dapat diminimize agar tidak mengganggu pekerjaan utama.

## 2. Karakter & Desain Visual
- **Tipe Karakter:** Chibi Iron Man dengan rasio kepala besar (bobblehead) ~1.6 : 1 terhadap tubuh.
- **Palet Warna:**
  - Armor Utama: Merah Marun Metalik (`#dc2626` / `#991b1b`)
  - Faceplate & Aksen: Gold / Emas Metalik (`#fbbf24` / `#f59e0b`)
  - Eyes & Arc Reactor: Electric Cyan Glow (`#38bdf8`, `#e0f2fe`)
  - Thruster Flame: Gradient Cyan-White dengan flicker lembut saat melayang
- **Komponen Visual (Vector SVG):**
  - Kepala Chibi bersudut halus dengan helm khas Iron Man
  - Celah mata bercahaya
  - Tubuh mini ber-armor dengan Arc Reactor bercahaya di dada
  - Sepatu thruster mini dengan partikel energi semburan melayang

## 3. Fisika Zero-G & Interaksi Gerak
- **Idle Zero-G Hover:**
  - Animasi CSS keyframe melayang naik-turun halus (rentang 8px) dan kemiringan (tilt ±2.5°) yang menciptakan kesan melayang tanpa bobot.
- **Draggable:**
  - Mendukung drag pointer native (mouse & touch).
  - Posisi tersimpan sementara di local state komponen.
  - Viewport boundary clamping: posisi selalu dibatasi agar pet tidak hilang di luar batas layar perangkat.
- **Minimize / Sleep Mode:**
  - Tombol mini untuk menyembunyikan pet ke pojok (docked) atau memanggilnya kembali kapan saja.

## 4. Balon Dialog & Tips Interaktif
- **Pemicu Dialog:**
  - Mengklik/men-tap pet akan memunculkan balon ucapan (*speech bubble*).
  - Mengklik kembali atau menunggu timeout 4 detik akan menutup balon.
- **Daftar Pesan & Tips:**
  - *Quotes Fun:*
    - "I am Iron Man. Versi sachet tapi bertenaga nuklir!"
    - "J.A.R.V.I.S, setelan santai diaktifkan."
    - "Aku cinta kalian 3000%!"
    - "Arc reactor full charge, siap mendampingi dinas!"
  - *Tips & Motivasi Kerja:*
    - "Jangan lupa double check form sebelum submit ya!"
    - "Alat aman, operasional lancar jaya!"
    - "Kerja keras boleh, jangan lupa hidrasi air putih."
    - "SSES T2 siap tempur hari ini!"

## 5. Arsitektur Komponen & Penempatan
- **File Komponen:** `src/components/features/AntigravityPet.tsx`
- **Integrasi:** Dipasang di `src/components/App.tsx` (atau level root layout) dengan posisi `fixed bottom-6 right-6 z-50` sehingga konsisten mengambang di atas semua tab tanpa mengganggu input form.
- **Prinsip Ponytail & YAGNI:**
  - Nol dependensi library eksternal baru.
  - Menggunakan CSS keyframes native Tailwind / custom CSS.
  - Komponen tunggal mandiri yang modular dan mudah dihapus/dinonaktifkan jika diperlukan.
