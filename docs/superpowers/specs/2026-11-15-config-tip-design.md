# Config TIP: pilih X-Ray yang tampil di tab TIP

Tanggal: 2026-11-15 · Ukuran: perubahan kecil

## Maksud

Pengguna ingin mengatur unit X-Ray mana yang muncul di tab TIP. Sekarang daftar TIP diturunkan otomatis dari
semua item kategori X-RAY di master Checklist (8 lokasi, 40 unit, termasuk BREAKDOWN Belt 15/16 dan SSCP),
tanpa bisa dikecualikan.

## Tujuan

- Di tab Data, sub-tab **"Data TIP Tersimpan" diganti nama menjadi "Config TIP"**.
- Di sub-tab itu, **daftar peralatan X-Ray** (dikelompokkan per lokasi, dari master Checklist) tampil di atas
  dengan centang; **daftar data TIP tersimpan** (yang sudah ada) tampil di bawahnya.
- Unit yang tidak dicentang tidak tampil di tab TIP (tabel, penghitung, gambar yang dibagikan).

## Bukan tujuan

- Menambah unit yang tidak ada di Checklist, mengganti nama, atau mengubah urutan.
- Mengubah master Checklist atau riwayat centang TIP bulanan.

## Pendekatan (dipilih pengguna: A)

- **A. Simpan daftar yang disembunyikan (dipilih).** Semua X-Ray tampil kecuali yang dihilangkan centangnya.
  Default: ke-40 unit tetap tampil seperti sekarang. X-Ray baru di Checklist otomatis tampil di TIP.
- B. Simpan daftar yang dipilih. Unit baru tidak tampil sampai dicentang; risiko terlupa dari laporan. Tidak dipilih.

## Desain

- **Data:** `master_configs` dengan kunci `master_tip_hidden`, berisi larik kunci unit yang disembunyikan.
  Kunci unit sama dengan kunci centang TIP bulanan: `<id lokasi>-<label>` (mis. `hbscp-1.1`, `breakdown-Belt 15`),
  sehingga riwayat tetap cocok. Dimuat bersama konfigurasi lain saat aplikasi dibuka (useMasterDataStore).
- **Satu sumber daftar:** penurunan daftar TIP dari master Checklist dipindah ke fungsi murni (dipakai tab TIP
  dan Config TIP) yang juga mengembalikan nama lengkap tiap unit untuk ditampilkan di Config TIP.
- **Tab TIP:** daftar disaring dengan `master_tip_hidden`; lokasi yang semua unitnya disembunyikan tidak tampil;
  pembagian kolom kiri/kanan dihitung setelah disaring. Penghitung "x / total", "pilih semua" dan centang per
  lokasi hanya menghitung unit yang tampil.
- **Config TIP (atas):** per lokasi: judul lokasi dengan jumlah "x dari n tampil" dan tombol Semua / Kosongkan;
  per unit: kotak centang, label (mis. 1.1) dan nama lengkap. Ringkasan "x dari 40 tampil di tab TIP".
  Setiap perubahan langsung disimpan dengan status Menyimpan… / Tersimpan / Gagal menyimpan (sama seperti
  "* Perubahan otomatis disimpan ke database" di sub-tab lain). Akses mengikuti tab Data (wajib login).
- **Config TIP (bawah):** daftar data TIP tersimpan seperti sekarang, tanpa perubahan perilaku.

## Keputusan pembuat (bisa dikoreksi)

- Pengaturan berlaku untuk semua bulan, termasuk saat membuka bulan lalu di tab TIP: unit yang disembunyikan
  tidak ditampilkan, tetapi centang tersimpannya tidak dihapus dan kembali tampil bila unit dicentang lagi.
- Kode daftar TIP lama yang tidak pernah dipakai (`tipLeftCol`/`tipRightCol`, `master_tip_left/right`,
  `DEFAULT_TIP_LEFT_COL/RIGHT_COL`) dihapus agar tidak membingungkan.
- Label unit tetap aturan lama (teks dalam kurung; tanpa kurung = `No1`) supaya kunci riwayat tidak berubah.

## Verifikasi

- Tes unit fungsi penurunan daftar dan penyaringan; tes susunan sub-tab (nama "Config TIP", peralatan di atas
  data tersimpan).
- Uji di browser: hilangkan centang BREAKDOWN di Config TIP → tab TIP tidak menampilkan BREAKDOWN dan
  penghitung menjadi x / 38; centang lagi → kembali.
