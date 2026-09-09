# Chibi Iron Man Antigravity Pet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menghadirkan widget maskot interaktif Chibi Iron Man berkepala besar (Antigravity Pet) yang melayang dengan efek zero-gravity di aplikasi SSES T2, bisa di-drag, menampilkan balon ucapan tips/semangat, dan bisa diminimize.

**Architecture:** Komponen React modular `AntigravityPet.tsx` menggunakan pure SVG vector grafis Chibi Iron Man dengan animasi CSS native untuk zero-g floating dan thruster flame, pointer events native untuk dragging dengan safe boundary clamping, serta state lokal untuk dialog tips dan status minimize/expanded.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Lucide React icons.

## Global Constraints

- Sesuai prinsip **Ponytail**: YAGNI, nol dependensi library eksternal baru, menggunakan native platform & CSS.
- Komponen terisolasi di `src/components/features/AntigravityPet.tsx` dan terintegrasi di `src/components/App.tsx`.
- Desain visual Chibi Iron Man: kepala bobblehead besar, helm merah-emas, celah mata cyan glow, arc reactor dada bersinar, thruster boots berdenyut.

---

### Task 1: Tambahkan Animasi CSS Zero-G di `src/styles.css`

**Files:**
- Modify: `src/styles.css`

**Interfaces:**
- Produces: CSS utility classes/keyframes `.animate-antigravity-float`, `.animate-arc-pulse`, `.animate-thruster-flame`.

- [ ] **Step 1: Modifikasi `src/styles.css` untuk menambahkan keyframes animasi**

Tambahkan keyframes:
```css
@keyframes antigravity-float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-8px) rotate(2deg);
  }
}

@keyframes arc-pulse {
  0%, 100% {
    opacity: 0.85;
    filter: drop-shadow(0 0 4px #38bdf8);
  }
  50% {
    opacity: 1;
    filter: drop-shadow(0 0 10px #38bdf8);
  }
}

@keyframes thruster-flame {
  0%, 100% {
    transform: scaleY(1);
    opacity: 0.8;
  }
  50% {
    transform: scaleY(1.3) scaleX(0.9);
    opacity: 1;
  }
}

.animate-antigravity-float {
  animation: antigravity-float 3.2s ease-in-out infinite;
}

.animate-arc-pulse {
  animation: arc-pulse 2s ease-in-out infinite;
}

.animate-thruster-flame {
  animation: thruster-flame 0.8s ease-in-out infinite;
  transform-origin: top center;
}
```

- [ ] **Step 2: Verifikasi CSS tersimpan rapi**

Periksa file `src/styles.css` dan pastikan tidak merusak rule CSS yang sudah ada.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "style: add zero-g and thruster animation keyframes in styles.css"
```

---

### Task 2: Buat Komponen `AntigravityPet.tsx`

**Files:**
- Create: `src/components/features/AntigravityPet.tsx`

**Interfaces:**
- Produces: `export const AntigravityPet: React.FC`

- [ ] **Step 1: Implementasikan komponen `AntigravityPet.tsx`**

Komponen mencakup:
1. **Desain SVG Chibi Iron Man Berkepala Besar**:
   - Helm merah (`#dc2626`) & pelat emas (`#f59e0b` / `#fbbf24`).
   - Mata celah bersinar cyan (`#38bdf8`).
   - Arc Reactor dada bersinar bulat.
   - Semburan api thruster boots di bawah kaki.
2. **Interaksi Drag (Pointer Events)**:
   - `onPointerDown`, `onPointerMove`, `onPointerUp`, `setPointerCapture`.
   - Menghitung offset drag dan membatasi koordinat di dalam batas viewport window (`window.innerWidth` & `window.innerHeight`).
3. **Balon Ucapan (Speech Bubble)**:
   - State `dialogText` dan `isDialogOpen`.
   - Koleksi quotes (Iron Man humor, tips operasional SSES T2, pengingat istirahat/hidrasi).
   - Auto-hide setelah 4 detik atau toggle saat diklik.
4. **Minimize Toggle**:
   - Tombol mini untuk menyusutkan pet ke ikon docking kecil agar tidak menghalangi saat input data.

- [ ] **Step 2: Lakukan pengecekan tipe TypeScript**

Jalankan `npx tsc --noEmit` untuk memastikan tidak ada error tipe.

- [ ] **Step 3: Commit**

```bash
git add src/components/features/AntigravityPet.tsx
git commit -m "feat: create Chibi Iron Man AntigravityPet component"
```

---

### Task 3: Integrasikan `AntigravityPet` ke dalam `src/components/App.tsx`

**Files:**
- Modify: `src/components/App.tsx`

**Interfaces:**
- Consumes: `import { AntigravityPet } from './features/AntigravityPet'`

- [ ] **Step 1: Import dan render `<AntigravityPet />` di `App.tsx`**

Tambahkan `<AntigravityPet />` di bagian penutup kontainer utama `App.tsx` sehingga aktif di semua tab kerja.

- [ ] **Step 2: Uji build aplikasi dengan Vite**

Jalankan `npm run build` untuk memverifikasi proses bundling dan kompatibilitas.

- [ ] **Step 3: Commit**

```bash
git add src/components/App.tsx
git commit -m "feat: mount AntigravityPet into main App layout"
```
