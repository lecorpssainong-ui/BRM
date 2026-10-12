const KEY = 'brm_voice';

export const voiceOn = (): boolean => {
  try {
    return localStorage.getItem(KEY) !== 'off';
  } catch {
    return true;
  }
};

export const setVoiceOn = (v: boolean): void => {
  try {
    localStorage.setItem(KEY, v ? 'on' : 'off');
  } catch {
    // ignore
  }
  if (!v) {
    stopSpeaking();
  }
};

export function stopSpeaking(): void {
  try {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  } catch {
    // ignore
  }
}

export function speak(text: string | undefined | null): void {
  if (!voiceOn() || !text || typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;

  try {
    synth.cancel(); // cancel any active speech
    const u = new SpeechSynthesisUtterance(String(text).slice(0, 500));
    u.lang = 'fr-FR';
    u.rate = 0.97;
    u.pitch = 1.02;

    const voices = synth.getVoices();
    const fr = voices.find((v) => /fr/i.test(v.lang));
    if (fr) {
      u.voice = fr;
    }
    synth.speak(u);
  } catch {
    // ignore
  }
}
