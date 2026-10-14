# Membuat level

Setiap level adalah satu file JSON di `packages/levels/src/jenjang-<n>/`. Editor seperti VS Code akan memberi saran isian dan memeriksa format secara otomatis karena setiap file merujuk skema `packages/levels/schema/level.schema.json`.

## Contoh

```json
{
  "$schema": "../../schema/level.schema.json",
  "id": "j1-02",
  "jenjang": 1,
  "order": 2,
  "name": "Belok Pertama",
  "modul": "Modul 3 · Belok kiri, belok kanan",
  "map": [
    "#...~",
    "..L.~",
    "#.p..",
    "B....",
    "~~#.."
  ],
  "startDir": "E",
  "target": 5,
  "palette": ["maju", "kiri", "kanan"],
  "mission": "Rangkiang ada di atas sana. Bima perlu berbelok satu kali. Jangan lupa panen padinya!",
  "hint": "Kiri dan kanan dihitung dari arah hadap Bima, bukan dari arahmu.",
  "bridge": "Saat berangkat ke sekolah, kapan kamu belok kiri dan kapan belok kanan?",
  "solution": ["M", "M", "L", "M", "M"]
}
```

## Isi peta

| Kode | Arti |
| --- | --- |
| `.` | Sawah, bisa dilewati |
| `#` | Pohon, menghalangi |
| `~` | Petak berair, menghalangi |
| `p` | Padi, dipanen saat dilewati (semua padi wajib dipanen) |
| `L` | Rangkiang, tujuan akhir |
| `B` | Posisi awal Bima (tepat satu) |

Semua baris harus sama panjang. Ukuran yang nyaman untuk anak: 5×5 sampai 7×6.

## Kolom lain

| Kolom | Isi |
| --- | --- |
| `id` | Penanda unik dan tetap, mis. `j1-07`. Jangan diubah setelah dirilis karena dipakai untuk menyimpan bintang anak |
| `order` | Urutan di peta |
| `startDir` | Arah hadap awal: `N` utara (atas), `E` timur (kanan), `S` selatan (bawah), `W` barat (kiri) |
| `target` | Jumlah kartu paling hemat; syarat bintang kedua. Blok Ulangi dihitung satu kartu ditambah isinya |
| `palette` | Kartu yang tersedia: `maju`, `kiri`, `kanan`, `ulangi` |
| `hint` | Petunjuk tingkat 1, berupa pertanyaan penuntun (bukan jawaban) |
| `bridge` | Tugas Jembatan Dunia Nyata setelah level selesai |
| `solution` | Satu solusi resmi. `M` maju, `L` belok kiri, `R` belok kanan, `{ "rep": 3, "body": ["M", "L"] }` blok Ulangi |
| `prefill` | Opsional: program awal, mis. untuk level debugging |
| `tutorial` | Opsional: tampilkan tangan penunjuk |
| `feature` | Opsional: `kumbang-galat` untuk level debugging |

## Mendaftarkan level baru

1. Simpan file JSON baru, mis. `07-nama-level.json`.
2. Impor dan tambahkan ke daftar di `packages/levels/src/index.ts`.
3. Jalankan `pnpm test`. Tes gagal bila peta salah bentuk, solusi tidak menang, atau `target` tidak sama dengan jumlah kartu solusi.
4. Posisi titik level di peta diatur di `apps/game/src/ui/screens/MapScreen.tsx`.
