import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: "es2022",
    // Sprite SVG harus tetap berupa file: pemuat Phaser hanya mengerti data URI base64,
    // sedangkan Vite menyisipkan SVG kecil sebagai data URI teks biasa.
    assetsInlineLimit: (file) => (file.endsWith(".svg") ? false : undefined),
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ["phaser"],
          react: ["react", "react-dom", "zustand"],
        },
      },
    },
  },
});
