/**
 * Logika penentuan Shortcut Cerdas untuk Tab Initial Report.
 *
 * Seluruh fungsi di berkas ini murni: hasilnya hanya bergantung pada argumen
 * yang diberikan, tanpa menyentuh store maupun DOM. Pemanggil bertanggung jawab
 * meresolusi `jenis` / `varian` peralatan terlebih dahulu.
 */

export interface LokasiEntry {
  lokasi1?: string;
  lokasi2?: string;
}

export interface ShortcutContext {
  /** Nama tipe peralatan seperti yang dipilih user, misal "X-Ray Rapiscan 620DV". */
  peralatan: string;
  /** Jenis peralatan hasil resolusi, misal "X-Ray", "Access Control". */
  jenis: string;
  /** Varian peralatan hasil resolusi, misal "Cabin" / "Bagasi". */
  varian?: string;
  lokasiList?: LokasiEntry[];
  lokasi1?: string;
}

const normalize = (value: string | undefined): string => (value || '').trim().toLowerCase();

const resolveLokasiList = (ctx: ShortcutContext): LokasiEntry[] =>
  ctx.lokasiList && ctx.lokasiList.length > 0 ? ctx.lokasiList : [{ lokasi1: ctx.lokasi1 }];

const isConveyorLocation = (locStr?: string): boolean => {
  const s = normalize(locStr);
  if (!s) return false;
  return s.includes('conveyor') || s.includes('convayer') || s.includes('belt');
};

const isCustomLocation = (locStr?: string): boolean => {
  const s = normalize(locStr);
  if (!s) return false;
  return (
    s.includes('redline') ||
    s.includes('arrival hall f') ||
    s.includes('arrival f') ||
    s.includes('monitoring custom') ||
    (s.includes('ruang monitoring') && s.includes('custom')) ||
    s.includes('custom')
  );
};

const isDataNetworkLocation = (locStr?: string): boolean => {
  const s = normalize(locStr);
  if (!s) return false;
  const isUmrah = s.includes('umrah') || s.includes('umroh');
  const isArrivalF = s.includes('arrival f') || s.includes('arrival hall f');
  const isAviobridgeF = s.includes('aviobridge f') || s.includes('avio f');
  const isRampoutF = s.includes('rampout f');
  const isBLF = s.includes('bl f') || s.includes('bl-f') || s.includes('bl/f') || s.includes('avio & bl f');
  return isUmrah || isArrivalF || isAviobridgeF || isRampoutF || isBLF;
};

const locationIncludes = (locStr: string | undefined, keyword: string): boolean => {
  const s = normalize(locStr);
  return s ? s.includes(keyword) : false;
};

/** Penanda jenis peralatan yang dipakai berulang oleh ketiga daftar shortcut. */
const classifyJenis = (jenis: string) => {
  const jenisNorm = normalize(jenis);
  return {
    jenisNorm,
    isXRay: jenisNorm === 'x-ray',
    isAccessControl: jenisNorm.includes('access control'),
    isMirroringXRay: jenisNorm.includes('mirroring'),
    isExtensionConveyor:
      jenisNorm.includes('extension conveyor') || jenisNorm.includes('conveyor') || jenisNorm.includes('convayer'),
    isAtrs: jenisNorm.includes('atrs'),
    isBodyScanner: jenisNorm.includes('body scanner'),
    isWtmd: jenisNorm === 'wtmd' || jenisNorm.includes('wtmd'),
    isEtd: jenisNorm === 'etd' || jenisNorm.includes('etd'),
    isHhmd: jenisNorm === 'hhmd' || jenisNorm.includes('hhmd'),
  };
};

export const getApplicableMitigasiList = (ctx: ShortcutContext): string[] => {
  const { isXRay, isAccessControl, isMirroringXRay, isExtensionConveyor, isAtrs, isBodyScanner, isWtmd, isEtd } =
    classifyJenis(ctx.jenis);
  const isPetd = isEtd && (ctx.peralatan || '').toUpperCase().includes('PETD');

  const pengecekanText = ctx.jenis
    ? `Melakukan pengecekan peralatan ${ctx.jenis}.`
    : 'Melakukan pengecekan peralatan.';

  const list = resolveLokasiList(ctx);
  const hasConveyorLoc = list.some((item) => isConveyorLocation(item.lokasi1));
  const hasCustomLoc = list.some((item) => isCustomLocation(item.lokasi1));
  const hasHbscpLoc = list.some((item) => locationIncludes(item.lokasi1, 'hbscp'));
  const hasPscpLoc = list.some((item) => locationIncludes(item.lokasi1, 'pscp'));
  const hasDataNetworkLoc = list.some((item) => isDataNetworkLocation(item.lokasi1));
  const hasLiftLoc = list.some((item) => locationIncludes(item.lokasi1, 'lift'));
  const hasServerLoc = list.some((item) => locationIncludes(item.lokasi1, 'server'));
  const hasMonitoringLoc = list.some((item) => locationIncludes(item.lokasi1, 'monitoring'));

  let koordinasiPihak = 'Koordinasi dengan pihak Avsec.';
  if (isMirroringXRay) {
    koordinasiPihak = 'Koordinasi dengan pihak Custom.';
  } else if (hasConveyorLoc && isExtensionConveyor) {
    koordinasiPihak = 'Koordinasi dengan Ground Handling.';
  } else if (hasConveyorLoc || hasCustomLoc) {
    koordinasiPihak = 'Koordinasi dengan pihak Custom.';
  }

  const items: string[] = ['Koordinasi dengan TOCC.', pengecekanText, koordinasiPihak];

  const addItem = (item: string) => {
    if (!items.includes(item)) {
      items.push(item);
    }
  };

  if (hasHbscpLoc && isXRay) {
    addItem('Koordinasi dengan Teknik Mekanik untuk pemindahan jalur pemeriksaan bagasi jika diperlukan.');
  }

  if (hasPscpLoc && isXRay) {
    addItem('Pindahkan jalur pemeriksaan pada line yang kosong.');
  }

  if (isAccessControl) {
    if (hasDataNetworkLoc) {
      addItem('Koordinasi dengan Unit Data Network.');
    }
    if (!hasLiftLoc) {
      addItem('Pecahkan Emergency Breakglass jika diperlukan.');
    }
    if (hasLiftLoc) {
      addItem('Koordinasi dengan Teknik Mekanik.');
    } else if (!hasServerLoc && !hasMonitoringLoc) {
      addItem('Melakukan pengecekan pintu.');
      addItem('Koordinasi dengan Teknik Sipil.');
    }
  }

  if (isAccessControl || isMirroringXRay) {
    addItem('Melakukan pengecekan jaringan.');
  }

  if (isXRay || isAccessControl || isExtensionConveyor || isAtrs || isBodyScanner || isWtmd || (isEtd && !isPetd)) {
    addItem('Melakukan pengecekan power listrik.');
    addItem('Koordinasi dengan Teknik Listrik.');
  }

  return items;
};

export const getApplicableDampakList = (ctx: ShortcutContext): string[] => {
  const { isXRay, isMirroringXRay, isEtd, isAccessControl, isWtmd, isHhmd, isAtrs, isBodyScanner } = classifyJenis(
    ctx.jenis
  );

  const varian = normalize(ctx.varian);
  const peralatanNorm = normalize(ctx.peralatan);
  const isCabin = varian.includes('cabin') || peralatanNorm.includes('cabin');
  const isBagasi = varian.includes('bagasi') || peralatanNorm.includes('bagasi');

  const list = resolveLokasiList(ctx);
  const hasPscpLoc = list.some((item) => locationIncludes(item.lokasi1, 'pscp'));
  const hasHbscpLoc = list.some((item) => locationIncludes(item.lokasi1, 'hbscp'));
  const hasSscpLoc = list.some((item) => locationIncludes(item.lokasi1, 'sscp'));
  const hasRedlineOrConveyorLoc = list.some((item) => {
    const s = normalize(item.lokasi1);
    return s.includes('redline') || s.includes('conveyor belt') || (s.includes('conveyor') && s.includes('belt'));
  });

  const items: string[] = [];

  const addItem = (item: string) => {
    if (!items.includes(item)) {
      items.push(item);
    }
  };

  if (isMirroringXRay) {
    addItem('Custom tidak dapat memonitoring pemeriksaan barang di area HBS Internasional.');
  }

  if (isHhmd) {
    addItem('Proses pemeriksaan orang terganggu.');
  }

  if (isWtmd) {
    addItem('Proses pemeriksaan orang terganggu.');
    addItem('Terjadi penumpukan antrian pemeriksaan orang.');
  }

  if (isBodyScanner) {
    addItem('Proses pemeriksaan orang terganggu.');
    addItem('Terjadi penumpukan antrian pemeriksaan orang.');
  }

  if (isAtrs) {
    addItem('Proses pemeriksaan barang pax terganggu.');
    addItem('Terjadi penumpukan antrian pemeriksaan barang.');
  }

  if (isXRay && hasPscpLoc) {
    addItem('Terjadi resiko penumpukan jumlah antrian pax.');
  }

  if (isXRay && hasHbscpLoc) {
    addItem('Terjadi resiko penumpukan jumlah bagasi.');
  }

  if (isXRay && isBagasi && hasHbscpLoc) {
    addItem('Proses pemeriksaan bagasi pax terganggu.');
  }

  if (isXRay && isCabin) {
    if (hasSscpLoc) {
      addItem('Proses pemeriksaan barang terganggu.');
    } else {
      addItem('Proses pemeriksaan barang pax terganggu.');
    }
  }

  if (isXRay && isBagasi && hasRedlineOrConveyorLoc) {
    addItem('Proses pemeriksaan barang oleh Custom di area Kedatangan Internasional terganggu.');
  }

  if (isEtd) {
    addItem('Barang yang mengandung senyawa Explosive tidak dapat terdeteksi.');
    addItem('Pelaksanaan random check terganggu.');
  }

  if (isAccessControl) {
    addItem('Resiko pintu Access dilewati oleh orang yang tidak berhak.');
    addItem('Akses keluar masuk pintu Access menjadi terganggu.');
    addItem('Perijinan keluar masuk pintu Access menjadi terganggu.');
  }

  if (isWtmd || isHhmd) {
    addItem('Barang yang mengandung bahan metal tidak dapat terdeteksi.');
  }

  return items;
};

export const getApplicablePermasalahanList = (ctx: ShortcutContext): string[] => {
  const { jenisNorm, isAccessControl, isBodyScanner, isMirroringXRay, isWtmd, isEtd, isHhmd, isExtensionConveyor } =
    classifyJenis(ctx.jenis);

  // Permasalahan memakai pencocokan X-Ray yang lebih longgar dibanding daftar lain.
  const isXRay = jenisNorm === 'x-ray' || jenisNorm.includes('x-ray') || jenisNorm.includes('xray');
  const isAtrs = jenisNorm === 'atrs' || jenisNorm.includes('atrs');
  const peralatanNorm = normalize(ctx.peralatan);
  const isRapiscan = peralatanNorm.includes('rapiscan');
  const isNuctech = peralatanNorm.includes('nuctech');

  const items: string[] = [];

  if (isXRay && isRapiscan) {
    items.push(
      'Muncul notif Inverter Fault.',
      'Muncul notif X-Ray Subsystem Fault.',
      'User akun terblokir.',
      'Control Panel tidak dapat dioperasikan.',
      'X-Ray off.',
      'Tampilan gambar hasil scan blur/tidak jelas.',
      'Tampilan gambar hasil scan blok hitam.',
      'Terdapat tetesan oli di bawah mesin X-Ray.',
      'X-Ray hang.',
      'Tampilan monitor berwarna kuning.'
    );
  }

  if (isXRay && isNuctech) {
    items.push(
      'Muncul notif Missing Data Aquisition.',
      'Muncul notif X-Ray Generator Fault.',
      'X-Ray off.',
      'Tampilan gambar hasil scan blur/tidak jelas.',
      'Tampilan gambar hasil scan blok hitam.',
      'Terdapat tetesan oli di bawah mesin X-Ray.',
      'X-Ray hang.',
      'Tampilan monitor berwarna kuning.'
    );
  }

  if (isWtmd) {
    items.push(
      'WTMD off.',
      'WTMD mengalami interferensi.',
      'WTMD berbunyi terus menerus tanpa adanya orang yang melewati.',
      'WTMD tidak dapat mendeteksi test piece kalibrasi.'
    );
  }

  if (isMirroringXRay) {
    items.push('Tampilan mirroring monitor X-Ray tidak muncul.', 'Monitor mirroring off.');
  }

  if (isBodyScanner) {
    items.push('Body Scanner off.', 'Touchscreen pada monitor operator tidak berfungsi.');
  }

  if (isAccessControl) {
    items.push(
      'Pintu Access tidak bisa terkunci.',
      'Pintu Access tidak bisa dibuka oleh Operator Avsec.',
      'CCTV Access freeze.',
      'Mikrofon tidak mengeluarkan suara/suara kecil.',
      'Breakglass pecah.',
      'Access Control off.'
    );
  }

  if (isEtd) {
    items.push(
      'Muncul Notif Verification Required.',
      'Muncul Notif Calibration Required.',
      'Muncul Notif Calibration Failed.',
      'Muncul Notif Verification Failed.',
      'Muncul Notif High Humidity.',
      'Muncul Notif Cleaning in progress.',
      'Muncul Notif Regeneration in progress.',
      'ETD off.'
    );
  }

  if (isHhmd) {
    items.push(
      'HHMD off.',
      'Tombol HHMD mengalami kerusakan.',
      'Baterai HHMD tidak bisa diisi ulang.',
      'Charger baterai HHMD mengalami kerusakan.'
    );
  }

  if (isAtrs) {
    items.push(
      'ATRS off.',
      'ATRS tidak dapat dijalankan.',
      'Baki ATRS tersangkut.',
      'Dispenser baki berhenti/tersangkut.',
      'Tampilan mirroring mengalami error.',
      'Tampilan deteksi barang pada baki mengalami error.'
    );
  }

  if (isExtensionConveyor) {
    items.push(
      'Extension Conveyor off.',
      'Extension Conveyor mengeluarkan suara berisik ketika dijalankan.',
      'Conveyor belt terlalu mepet ke samping.',
      'Conveyor belt sobek/rusak.',
      'Extension Conveyor tidak dapat dijalankan.',
      'Conveyor belt kendor.'
    );
  }

  return items;
};

/**
 * Menambahkan satu butir ke daftar bernomor ("1. ", "2. ", ...).
 * Mengembalikan `null` bila butir sudah ada, sehingga pemanggil dapat
 * membiarkan state tidak berubah.
 */
export const appendNumberedItem = (current: string | undefined, itemText: string): string | null => {
  const raw = current ? current.trim() : '';
  if (!raw || raw === '1.' || raw === '1. ') {
    return `1. ${itemText}`;
  }
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const alreadyExists = lines.some((l) => l.replace(/^\d+\.\s*/, '').toLowerCase() === itemText.toLowerCase());
  if (alreadyExists) {
    return null;
  }
  return `${raw}\n${lines.length + 1}. ${itemText}`;
};

/**
 * Menambahkan satu butir ke daftar bullet ("• "). Mengembalikan `null` bila
 * butir sudah ada.
 */
export const appendBulletItem = (current: string | undefined, itemText: string): string | null => {
  const raw = (current || '').trim();
  if (!raw || raw === '•') {
    return `• ${itemText}`;
  }
  const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
  const cleanLines = lines.filter((l) => l !== '•');
  const alreadyExists = cleanLines.some((l) => l.replace(/^•\s*/, '').toLowerCase() === itemText.toLowerCase());
  if (alreadyExists) {
    return null;
  }
  return `${cleanLines.join('\n')}\n• ${itemText}`;
};
