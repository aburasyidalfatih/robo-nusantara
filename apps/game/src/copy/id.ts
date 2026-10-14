/**
 * Semua teks untuk anak dan guru (Bahasa Indonesia).
 * Dikumpulkan di satu tempat supaya mudah disunting dan diterjemahkan.
 */
import type { CardType, Diagnosis, EditError, Obstacle } from "@robo/engine";

export const CARD_LABEL: Record<CardType, string> = {
  maju: "Maju",
  kiri: "Belok kiri",
  kanan: "Belok kanan",
  ulangi: "Ulangi",
};

const OBSTACLE: Record<Obstacle, string> = {
  pohon: "pohon",
  air: "petak berair",
  tepi: "tepi sawah",
};

export const t = {
  appName: "Robo Nusantara",
  jenjang1: "Jenjang 1 · Pemula",
  tagline: "Bantu Bima memanen padi di sawah berundak dengan menyusun kartu perintah.",
  play: "Mulai bermain",
  chooseLevel: "Pilih level",
  teacherPanel: "Panel guru",
  titleFoot: "Versi pengembangan · Jenjang 1: urutan, belok, perulangan, debugging, proyek",
  regionLabel: "Wilayah 1 · pilih level",
  locked: "terkunci",

  programTitle: "Program Bima",
  dropHere: "Seret kartu ke sini",
  loopPlaceholder: "Seret kartu Maju atau Belok ke kotak ini",
  trash: "Buang di sini",
  run: "Jalankan",
  stop: "Berhenti",
  undo: "Batal",
  hint: "Petunjuk",
  step: "Langkah",
  reset: "Ke awal",
  cardsCount: (n: number, target: number) => `${n} kartu · hemat: ${target}`,
  loopIteration: (i: number, n: number) => `putaran ${i} dari ${n}`,

  // Ucapan Bima
  levelIntroGalat:
    "Kumbang Galat bersembunyi di programku! Tekan Jalankan untuk melihat di mana aku salah jalan.",
  tutorialDrag: "Halo, aku Bima! Seret kartu panah biru ke papan kayu di bawah.",
  tutorialMore: "Bagus! Aku butuh 3 langkah ke rangkiang. Tambah kartunya lagi.",
  tutorialRun: "Sekarang tekan tombol hijau Jalankan!",
  running: "Siap! Aku jalankan programmu…",
  stopped: "Program dihentikan. Tekan Ke awal untuk mengulang.",
  backToStart: "Aku kembali ke titik awal.",
  undone: "Langkah terakhir dibatalkan.",
  emptyProgram: "Programnya masih kosong. Seret kartu ke jalur program dulu.",
  emptyLoop: "Blok Ulangi masih kosong. Isi dengan kartu Maju atau Belok.",
  loopReady:
    "Blok Ulangi siap! Seret kartu ke dalam kotak hijaunya, lalu atur jumlah ulangan dengan tombol − dan +.",
  loopTapTarget: "Kartu yang kamu ketuk sekarang masuk ke blok Ulangi ini.",
  win: "Hore! Aku sampai di rangkiang dengan semua padi!",
  bump: (num: number, o: Obstacle) =>
    `Aduh, aku menabrak ${OBSTACLE[o]}! Lihat kartu nomor ${num} yang bergaris merah, dan kartu-kartu sebelumnya.`,
  padiLeft: (got: number, total: number) =>
    `Aku sampai, tapi baru membawa ${got} dari ${total} ikat padi. Lewati semua padinya, ya.`,
  notAtGoal: "Programnya habis, tapi aku belum sampai di rangkiang. Tambah kartu lagi?",
  stepInfo: (i: number, total: number, num: number, card: CardType, loop?: { iteration: number; count: number }) =>
    `Langkah ${i} dari ${total}: kartu ${num}, ${CARD_LABEL[card].toLowerCase()}${
      loop ? ` (putaran ${loop.iteration} dari ${loop.count})` : ""
    }.`,
  retryPrompt: "Ayo coba lagi dengan kartu lebih sedikit dan tanpa petunjuk!",

  editError: {
    "loop-in-loop": "Blok Ulangi tidak bisa dimasukkan ke dalam blok Ulangi lain.",
    "loop-full": "Blok Ulangi sudah penuh. Isinya paling banyak 6 kartu.",
    "too-many-cards": "Programnya sudah panjang sekali. Coba pakai kartu Ulangi.",
    "not-found": "Kartu itu sudah tidak ada.",
  } satisfies Record<EditError, string>,

  hintTitle: (tier: number) => `Petunjuk ${tier}/3.`,
  hintPreview: "Begini awal program yang benar. Lanjutkan sendiri, ya!",
  diagnosis: (d: Diagnosis, num?: number): string => {
    switch (d.kind) {
      case "empty":
        return "Mulai dari kartu pertama. Aku sedang menghadap ke mana?";
      case "already-correct":
        return "Programmu sudah benar! Tekan Jalankan.";
      case "bump":
        return `Periksa kartu nomor ${num} yang bergaris kuning. Di situ aku akan menabrak. Apakah arahku sudah benar sebelum kartu itu?`;
      case "padi-left":
        return "Jalannya sudah sampai, tapi ada padi yang terlewat. Coba lewati semua petak padi.";
      case "not-at-goal":
        return "Kartu-kartumu benar sejauh ini, tapi belum cukup. Tambahkan kartu di akhir program.";
    }
  },

  // Hasil
  resultTitle: (stars: number) => (stars === 3 ? "Sempurna!" : stars === 2 ? "Hebat!" : "Berhasil!"),
  critCompleted: "Misi selesai",
  critEfficient: (cards: number, target: number) => `Hemat kartu: ${cards} kartu (target ${target})`,
  critIndependent: "Tanpa petunjuk",
  bridgeTitle: "Jembatan Dunia Nyata",
  retry: "Coba raih 3 bintang",
  nextLevel: "Level berikutnya",
  backToMap: "Kembali ke peta",
  resultSpeech: (title: string, stars: number) => `${title} Kamu dapat ${stars} bintang.`,

  // Panel guru
  teacherEyebrow: "Untuk guru dan orang tua",
  teacherIntro: "Atur permainan untuk kelas atau anak Anda. Pengaturan tersimpan di perangkat ini.",
  speed: "Kecepatan robot",
  speedOptions: [
    { value: 700, label: "Pelan" },
    { value: 420, label: "Sedang" },
    { value: 220, label: "Cepat" },
  ],
  narration: "Narasi suara otomatis",
  narrationNote: "Bima membacakan pesan untuk anak yang belum lancar membaca",
  music: "Musik latar",
  sfx: "Efek suara",
  unlockAll: "Buka semua level",
  unlockAllNote: "Untuk meninjau atau mengajar level tertentu",
  wipe: "Hapus kemajuan",
  wipeNote: "Bintang dan tutorial diulang dari awal",
  wipeButton: "Hapus",
  wipeConfirm: "Yakin? Ketuk lagi",
  done: "Selesai",
};
