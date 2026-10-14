# Arsitektur

## Prinsip

1. **Aturan main terpisah dari tampilan.** `@robo/engine` adalah TypeScript murni tanpa DOM, React, atau Phaser. Semua yang menentukan benar atau salah (simulasi, bintang, petunjuk, validasi) ada di sini dan diuji dengan unit test.
2. **Level berbasis data.** Level berupa JSON yang divalidasi oleh tes, sehingga guru atau desainer bisa menambah level tanpa programmer.
3. **Satu API robot untuk semua tempat.** Perintah `maju`, `kiri`, `kanan` (dan nanti sensor) punya arti yang sama di simulator 2D, 3D, dan robot fisik. Inilah dasar fitur Kirim ke Robot.

## Alur saat anak menekan Jalankan

```
Kartu di layar (React)
  └─ store.program            daftar kartu, termasuk blok Ulangi
       └─ engine.simulate()   menghitung SEMUA langkah sekaligus
            └─ runner          memutar langkah satu per satu
                 ├─ BoardScene.playStep()  animasi di Phaser
                 ├─ store.activeStep        kartu yang sedang menyala
                 └─ sound.sfx               efek suara
```

Karena simulasi selesai seketika, game tahu hasil akhirnya (menang, menabrak, padi tertinggal) sebelum animasi dimulai. Ini membuat fitur Langkah, petunjuk tingkat 2, dan penandaan kartu yang menabrak menjadi sederhana.

## Paket

| Paket | Isi | Bergantung pada |
| --- | --- | --- |
| `@robo/engine` | Tipe, model program (sisip, pindah, hapus), simulasi, penilaian, petunjuk, validasi | tidak ada |
| `@robo/levels` | Data level JSON, skema, tes validasi | engine |
| `@robo/game` | Aplikasi web: layar, papan Phaser, seret-lepas, audio | engine, levels |

Paket di dalam monorepo dipakai langsung dari kode sumber TypeScript (tanpa langkah build terpisah); Vite dan Vitest yang menerjemahkannya.

## Status permainan

`apps/game/src/state/store.ts` (zustand) menyimpan layar aktif, program, riwayat Batal, pesan Bima, petunjuk, hasil, kemajuan, dan pengaturan. Status seret kartu disimpan di store kecil terpisah (`ui/dnd/drag.ts`) supaya gerakan jari tidak membuat seluruh layar dirender ulang.

Kemajuan dan pengaturan disimpan di `localStorage` perangkat. Saat backend tersedia, `state/persistence.ts` adalah satu-satunya tempat yang perlu diganti untuk sinkronisasi ke akun siswa.

## Rencana perluasan

| Kebutuhan | Tempat perubahan |
| --- | --- |
| Editor Blockly (Jenjang 2–3) | Komponen editor baru di `apps/game/src/ui`, menghasilkan `Program` engine yang sama |
| Sensor dan percabangan | Tipe node baru di `engine/types.ts` + `simulate.ts` |
| Python (Jenjang 4) | Penerjemah Python ke langkah simulasi, atau MicroPython WASM memanggil API robot |
| Kirim ke Robot | Modul baru `apps/game/src/robot/` (WebUSB micro:bit, Web Serial Pico/ESP32) |
| Akun dan kelas | `apps/api` (Hono + PostgreSQL), integrasi SSO SchoolPro |
