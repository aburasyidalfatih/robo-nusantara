# Robo Nusantara

Game belajar coding dan robotik untuk anak 6–15 tahun. Anak menyusun kartu perintah agar robot **Bima** memanen padi dan sampai ke rangkiang, mulai dari urutan sederhana sampai perulangan dan debugging.

Versi ini adalah **Sprint 1 (fondasi)**: Jenjang 1 (Pemula, 6–7 tahun) dengan 6 level yang bisa dimainkan di laptop, tablet, dan ponsel.

## Menjalankan di komputer (Windows)

### 1. Pasang sekali saja

1. Pasang **Node.js 22 LTS** dari <https://nodejs.org> (pilih "LTS", centang semua pilihan bawaan).
2. Buka **PowerShell** lalu pasang pnpm:

   ```powershell
   npm install -g pnpm@9
   ```

### 2. Jalankan game

Buka PowerShell di folder proyek ini (`Documents\robo-nusantara`), lalu:

```powershell
pnpm install
pnpm dev
```

Buka <http://localhost:5173> di Chrome atau Edge.

Untuk mencoba di **tablet atau ponsel** yang tersambung ke Wi-Fi yang sama, buka alamat `Network:` yang muncul di PowerShell (contoh `http://192.168.1.10:5173`). Bila tidak bisa dibuka, izinkan Node.js di Windows Firewall saat diminta.

### Perintah lain

| Perintah | Fungsi |
| --- | --- |
| `pnpm dev` | Menjalankan game untuk pengembangan (otomatis memuat ulang saat kode diubah) |
| `pnpm test` | Menjalankan semua unit test |
| `pnpm typecheck` | Memeriksa tipe TypeScript |
| `pnpm build` | Membuat versi produksi di `apps/game/dist` |
| `pnpm preview` | Menjalankan hasil build untuk dicoba |
| `pnpm check` | Typecheck, test, dan build sekaligus (jalankan sebelum rilis) |

## Struktur proyek

```
robo-nusantara/
├── apps/
│   └── game/              Aplikasi game (Vite + React + Phaser)
│       ├── src/board/     Papan sawah Phaser dan animasinya
│       ├── src/game/      Pemutar program (Jalankan, Langkah, Ke awal)
│       ├── src/state/     Status permainan (zustand) dan penyimpanan kemajuan
│       ├── src/ui/        Layar, kartu seret-lepas, dialog, tutorial
│       ├── src/audio/     Efek suara, musik latar, narasi
│       ├── src/copy/id.ts Semua teks Bahasa Indonesia
│       └── src/assets/    Sprite SVG
├── packages/
│   ├── engine/            Aturan main: model program, simulasi, bintang, petunjuk, validasi level
│   └── levels/            Data level dalam JSON + skema
└── docs/                  Dokumentasi arsitektur dan cara membuat level
```

Aturan main (`packages/engine`) tidak bergantung pada tampilan. Papan Phaser hanya memutar ulang langkah hasil simulasi, sehingga jenjang berikutnya bisa memakai editor dan papan yang berbeda (Blockly, Python, 3D) dengan aturan yang sama.

## Menambah atau mengubah level

Level adalah file JSON di `packages/levels/src/jenjang-1/`. Panduan lengkap ada di [docs/membuat-level.md](docs/membuat-level.md). Setelah mengubah level, jalankan `pnpm test`: tes akan memastikan setiap level valid dan solusinya benar-benar menyelesaikan level.

## Teknologi

TypeScript 5.9 · React 19 · Phaser 3.90 · Vite 6 · zustand 5 · Vitest 3 · pnpm 9 + Turborepo.

Alasan pemilihan stack ada di dokumen desain Robo Nusantara dan di [docs/arsitektur.md](docs/arsitektur.md).

## Status dan langkah berikutnya

Sudah ada di Sprint 1:

- Layar judul, peta wilayah, dan permainan layar penuh (desktop, tablet, ponsel)
- 6 level Jenjang 1: urutan, belok, perulangan, debugging, proyek
- Kartu seret-lepas: sisip, urutkan ulang, masuk blok Ulangi, buang, Batal
- Bima berekspresi, petunjuk 3 tingkat, 3 bintang, Jembatan Dunia Nyata
- Tutorial tangan penunjuk, panel guru, narasi suara, musik latar
- Kemajuan tersimpan di perangkat
- 53 unit test

Rencana sprint berikutnya:

1. Jenjang 2 dengan editor blok **Blockly** dan sensor tersimulasi
2. **Kirim ke Robot** lewat WebUSB ke micro:bit
3. Mode luring (PWA) untuk sekolah dengan internet terbatas
4. Backend: akun siswa, kelas, dasbor guru, integrasi SchoolPro
5. Aset profesional: ilustrasi, rekaman suara pengisi suara Indonesia, musik
