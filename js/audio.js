export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function resume() {
    ensure();
    if (ctx.state === 'suspended') ctx.resume();
  }

  function shoot() {
    if (muted) return;
    ensure();
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(220, t + 0.08);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  function explosion() {
    if (muted) return;
    ensure();
    const t = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(120, t);
    osc2.frequency.setValueAtTime(80, t);
    osc1.frequency.exponentialRampToValueAtTime(40, t + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(30, t + 0.4);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.45);
    osc2.stop(t + 0.45);
  }

  function toggleMute() { muted = !muted; }

  return { resume, shoot, explosion, toggleMute };
}

