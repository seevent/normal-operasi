// src/lib/utils/shareFlow.ts
// Alur berbagi laporan + lampiran ke WhatsApp lewat Web Share API. Semua ketergantungan (navigator,
// state antrean, log, unduhan) disuntikkan agar alur ini bisa diuji di Node tanpa peramban.
//
// Aturan yang dijaga di sini (lihat docs/superpowers/plans/2026-11-10-video-whatsapp-share.md):
//   1. Kirim ditekan = navigator.share dipanggil SEKETIKA, di ketukan yang sama. Tidak pernah menunggu
//      unggah atau konversi video: video memakai salinan MP4 bila sudah siap, selain itu berkas asli.
//   2. Antrean kiriman lanjutan dan tombol kirim ulang dipasang SEBELUM share dipanggil, karena di iOS
//      promise navigator.share bisa tidak pernah selesai.
//   3. Kiriman yang ditolak peramban tetap di antrean; tidak ada unduhan diam-diam.

import { buildShareBatches, isRiskyBatch, isVideo, planShareItems, splitMediaSafely } from './shareBatches.ts';
import type { ShareItem } from './shareBatches.ts';

/** 'gabung': video bersama laporan dan foto dalam satu share. 'pisah': tiap video kiriman tersendiri. */
export type ShareMode = 'gabung' | 'pisah';
/** 'siap': salinan MP4 bila sudah siap, selain itu asli. 'asli': selalu berkas asli. */
export type VideoChoice = 'siap' | 'asli';
export type ShareOutcome = 'resolved' | 'aborted' | 'rejected' | 'unsupported' | 'timeout';
export type ShareKind = 'laporan' | 'lanjutan' | 'uji';

export interface ShareFailure {
  reason: 'ditolak' | 'tidak_didukung';
  errorName?: string;
}

export interface ShareSession {
  attemptId: string;
  kind: ShareKind;
  tab?: string;
  mode: ShareMode;
  step: number;
  /** Nama mode pada halaman uji; kosong untuk laporan biasa. */
  test?: string;
}

export interface ShareFlowState {
  /** Kiriman yang belum dibagikan; tiap kiriman butuh ketukan baru. */
  queue: ShareItem[];
  /** Kiriman campur video terakhir; bisa dikirim ulang terpisah bila WhatsApp menolaknya. */
  retry: ShareItem | null;
  /** Kiriman terdepan ditolak peramban pada percobaan terakhir. */
  failure: ShareFailure | null;
  /** Kiriman terdepan sudah pernah dicoba tetapi belum dipastikan selesai (promise bisa menggantung). */
  attempted: boolean;
  session?: ShareSession;
}

export interface ShareLogEntry {
  attemptId: string;
  kind: ShareKind;
  step: number;
  tab?: string;
  mode: ShareMode;
  test?: string;
  photos: number;
  videos: number;
  videoSource: 'asli' | 'konversi' | 'campur' | null;
  bytes: number;
  outcome: ShareOutcome;
  errorName: string | null;
  durationMs: number;
}

interface ShareDataLike {
  files?: File[];
  text?: string;
  title?: string;
}

export interface ShareFlowDeps {
  nav: { share?: (data: ShareDataLike) => Promise<void>; canShare?: (data: ShareDataLike) => boolean };
  getState: () => ShareFlowState;
  setState: (patch: Partial<ShareFlowState>) => void;
  /** Salinan MP4 ramah WhatsApp bila konversinya sudah selesai. */
  preparedVideo: (file: File) => File | undefined;
  log: (entry: ShareLogEntry) => void;
  now: () => number;
  newId: () => string;
  setTimer: (fn: () => void, ms: number) => unknown;
  /** Dipanggil setelah satu kiriman selesai dibagikan (penyemangat maskot, tanda "tersalin"). */
  onShared?: (item: ShareItem) => void;
  /** Tanpa Web Share (PC): salin teks, buka wa.me, unduh berkas. */
  fallback: (message: string, files: File[]) => Promise<void>;
  download: (file: File) => void;
  copyText: (text: string) => void;
}

/** Promise share yang belum selesai selama ini dicatat sebagai menggantung (alur tidak terpengaruh). */
export const SHARE_HANG_MS = 60_000;
const TEXT_SHARE_TITLE = 'Laporan SSES T2';

/** Berkas hasil konversi yang dipakai dalam share, untuk kolom sumber video di log. */
const convertedFiles = new WeakSet<File>();

const videoSourceOf = (files: File[]): ShareLogEntry['videoSource'] => {
  const videos = files.filter(isVideo);
  if (videos.length === 0) return null;
  const converted = videos.filter((v) => convertedFiles.has(v)).length;
  return converted === videos.length ? 'konversi' : converted === 0 ? 'asli' : 'campur';
};

const canWebShare = (deps: ShareFlowDeps, item: ShareItem): boolean =>
  typeof deps.nav.share === 'function' && (item.files.length === 0 || deps.nav.canShare?.({ files: item.files }) === true);

/** Satu panggilan navigator.share untuk satu kiriman, dengan pencatatan hasil. */
const attemptShare = async (
  deps: ShareFlowDeps,
  item: ShareItem,
  session: ShareSession,
): Promise<{ outcome: ShareOutcome; errorName: string | null }> => {
  const started = deps.now();
  const entry = (outcome: ShareOutcome, errorName: string | null): ShareLogEntry => ({
    attemptId: session.attemptId,
    kind: session.kind,
    step: session.step,
    tab: session.tab,
    mode: session.mode,
    test: session.test,
    photos: item.files.filter((f) => !isVideo(f)).length,
    videos: item.files.filter(isVideo).length,
    videoSource: videoSourceOf(item.files),
    bytes: item.files.reduce((sum, f) => sum + f.size, 0),
    outcome,
    errorName,
    durationMs: deps.now() - started,
  });

  if (!canWebShare(deps, item)) {
    deps.log(entry('unsupported', null));
    return { outcome: 'unsupported', errorName: null };
  }

  const hasFiles = item.files.length > 0;
  // Berkas dibagikan tanpa title: WhatsApp tidak memakainya dan title dilaporkan mengganggu share berkas di iOS.
  const data: ShareDataLike = {
    ...(hasFiles ? { files: item.files } : { title: TEXT_SHARE_TITLE }),
    ...(item.caption ? { text: item.caption } : {}),
  };

  let settled = false;
  const promise = deps.nav.share!(data);
  deps.setTimer(() => {
    if (!settled) deps.log(entry('timeout', null));
  }, SHARE_HANG_MS);

  try {
    await promise;
    settled = true;
    deps.log(entry('resolved', null));
    return { outcome: 'resolved', errorName: null };
  } catch (err) {
    settled = true;
    const errorName = (err as { name?: string } | null)?.name ?? 'Error';
    const outcome: ShareOutcome = errorName === 'AbortError' ? 'aborted' : 'rejected';
    deps.log(entry(outcome, errorName));
    return { outcome, errorName };
  }
};

export interface StartShareOptions {
  message: string;
  /** Lampiran per grup kolase; laporan menjadi caption kiriman pertama. */
  groups: File[][];
  cheerTab?: ShareItem['cheerTab'];
  mode?: ShareMode;
  video?: VideoChoice;
  kind?: ShareKind;
  test?: string;
}

export type StartShareResult = 'shared' | 'aborted' | 'fallback' | 'queued';

/**
 * Membagikan laporan beserta lampirannya. Laporan + media Grup Kolase 1 dibagikan seketika;
 * media grup lain (dan video, pada mode 'pisah') menunggu di antrean untuk ketukan berikutnya.
 */
export const startReportShare = async (
  deps: ShareFlowDeps,
  { message, groups, cheerTab, mode = 'gabung', video = 'siap', kind = 'laporan', test }: StartShareOptions,
): Promise<{ result: StartShareResult; attemptId: string }> => {
  const session: ShareSession = { attemptId: deps.newId(), kind, tab: cheerTab, mode, step: 1, test };
  const reset: ShareFlowState = { queue: [], retry: null, failure: null, attempted: false, session };

  const chosen = groups.map((group) =>
    group.map((file) => {
      if (video !== 'siap' || !isVideo(file)) return file;
      const prepared = deps.preparedVideo(file);
      if (!prepared) return file;
      convertedFiles.add(prepared);
      return prepared;
    }),
  );
  const [head, ...rest] = planShareItems(buildShareBatches(chosen), message, mode === 'pisah');
  const first: ShareItem = { ...head, cheerTab };

  deps.copyText(message);

  if (!canWebShare(deps, first)) {
    deps.setState(reset);
    await attemptShare(deps, first, session); // hanya mencatat 'unsupported'
    await deps.fallback(message, first.files);
    rest.flatMap((item) => item.files).forEach(deps.download);
    return { result: 'fallback', attemptId: session.attemptId };
  }

  // Dipasang sebelum share: bila promise tidak pernah selesai, tombol kiriman lanjutan tetap tampil.
  deps.setState({ ...reset, queue: rest, retry: isRiskyBatch(first.files, first.caption) ? first : null });

  const { outcome, errorName } = await attemptShare(deps, first, session);
  if (deps.getState().session?.attemptId !== session.attemptId) return { result: 'aborted', attemptId: session.attemptId };

  if (outcome === 'aborted') {
    deps.setState(reset);
    return { result: 'aborted', attemptId: session.attemptId };
  }
  if (outcome !== 'resolved') {
    // Peramban menolak (mis. izin ketukan kedaluwarsa): laporan menunggu di antrean untuk diketuk ulang.
    deps.setState({ queue: [first, ...rest], retry: null, failure: { reason: 'ditolak', errorName: errorName ?? undefined } });
    return { result: 'queued', attemptId: session.attemptId };
  }
  deps.onShared?.(first);
  return { result: 'shared', attemptId: session.attemptId };
};

/** Membagikan kiriman terdepan di antrean. Harus dipanggil dari ketukan pengguna. */
export const shareNext = async (deps: ShareFlowDeps): Promise<void> => {
  const before = deps.getState();
  const [next] = before.queue;
  if (!next) return;

  const session: ShareSession = {
    ...(before.session ?? { attemptId: deps.newId(), kind: 'lanjutan', mode: 'gabung' }),
    kind: before.session?.kind === 'uji' ? 'uji' : 'lanjutan',
    step: (before.session?.step ?? 1) + 1,
  };
  if (next.caption) deps.copyText(next.caption);
  deps.setState({ attempted: true, failure: null, session });

  const { outcome, errorName } = await attemptShare(deps, next, session);
  const now = deps.getState();
  if (now.queue[0] !== next) return; // sudah dilewati atau antrean diganti selagi menunggu

  if (outcome === 'aborted') return;
  if (outcome === 'resolved') {
    deps.setState({ queue: now.queue.slice(1), retry: isRiskyBatch(next.files, next.caption) ? next : null, failure: null, attempted: false });
    deps.onShared?.(next);
    return;
  }
  deps.setState({
    failure: outcome === 'unsupported' ? { reason: 'tidak_didukung' } : { reason: 'ditolak', errorName: errorName ?? undefined },
  });
};

/** Membuang kiriman terdepan (sudah terkirim tetapi peramban tidak melapor, atau pengguna memilih melewati). */
export const skipNext = (deps: ShareFlowDeps): void => {
  const { queue } = deps.getState();
  deps.setState({ queue: queue.slice(1), failure: null, attempted: false });
};

/** Mengirim ulang kiriman berisi video secara terpisah: laporan + foto sekali, lalu tiap video sendiri. */
export const retrySeparately = async (deps: ShareFlowDeps): Promise<void> => {
  const { retry, queue } = deps.getState();
  if (!retry) return;
  deps.setState({ retry: null, failure: null, attempted: false, queue: [...splitMediaSafely(retry), ...queue] });
  await shareNext(deps);
};

/** Teks pesan WhatsApp berisi tautan video, dipakai bila berkas video tidak bisa dibagikan. */
export const videoLinkMessage = (urls: string[]): string =>
  urls.length === 1 ? `Video: ${urls[0]}` : urls.map((url, i) => `Video ${i + 1}: ${url}`).join('\n');
