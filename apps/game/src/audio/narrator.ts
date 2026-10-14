/**
 * Narasi suara memakai Speech Synthesis bawaan peramban (id-ID).
 * Ini sementara: untuk rilis, ganti dengan rekaman pengisi suara
 * Indonesia supaya terdengar alami di semua perangkat.
 */
export const narratorAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

export function speak(text: string): void {
  if (!narratorAvailable || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "id-ID";
    u.rate = 0.95;
    u.pitch = 1.1;
    const voice = window.speechSynthesis.getVoices().find((v) => /^id/i.test(v.lang));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch {
    /* narasi tidak tersedia */
  }
}

export function stopSpeaking(): void {
  if (!narratorAvailable) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    /* abaikan */
  }
}
