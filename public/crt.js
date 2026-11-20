// CRT toggles and tiny WebAudio beeps. No assets, no downloads.
export function applyClasses(body, { crt, seance }) {
  body.classList.toggle('crt-on', !!crt);
  body.classList.toggle('seance', !!seance);
}

let audio;
export function beep(freq = 880, ms = 40) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = 'square';
    o.frequency.value = freq;
    g.gain.value = 0.03;
    o.connect(g);
    g.connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + ms / 1000);
  } catch {
    /* audio blocked or unavailable */
  }
}
