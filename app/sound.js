import { useCallback, useEffect, useRef, useState } from 'react';

function playNotes(context, notes, volume) {
  for (const [frequency, delay, length] of notes) {
    const time = context.currentTime + delay;
    const voice = context.createOscillator();
    const gain = context.createGain();
    voice.type = 'triangle';
    voice.frequency.value = frequency;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    voice.connect(gain).connect(context.destination);
    voice.start(time);
    voice.stop(time + length);
  }
}

export function useGameSound(phase, paused, hit) {
  const [enabled, setEnabled] = useState(false);
  const context = useRef(null);
  const playing = phase && phase !== 'scoreboard';

  function toggle() {
    if (enabled) {
      setEnabled(false);
      return;
    }
    if (!window.AudioContext) return;
    context.current ||= new AudioContext();
    context.current.resume().then(() => setEnabled(true)).catch(() => {});
  }

  useEffect(() => {
    const audio = context.current;
    if (!audio) return;
    if (enabled && !paused) audio.resume().catch(() => {});
    else audio.suspend().catch(() => {});
  }, [enabled, paused]);

  useEffect(() => {
    const audio = context.current;
    if (!audio || !enabled || phase !== 'result') return;
    const notes = hit
      ? [[523.25, 0, 0.22], [659.25, 0.1, 0.24], [783.99, 0.19, 0.37]]
      : [[150, 0, 0.2], [95, 0.07, 0.22]];
    playNotes(audio, notes, 0.14);
  }, [enabled, phase, hit]);

  useEffect(() => {
    const audio = context.current;
    if (!audio || !enabled || !playing || paused) return;
    const tune = [261.63, 329.63, 392, 440, 392, 329.63, 0, 0];
    let step = 0;
    function playBeat() {
      const note = tune[step++ % tune.length];
      if (note) playNotes(audio, [[note, 0, 0.26]], 0.022);
    }
    playBeat();
    const loop = setInterval(playBeat, 375);
    return () => clearInterval(loop);
  }, [enabled, playing, paused]);

  const scratch = useCallback(() => {
    const audio = context.current;
    if (!audio || audio.state !== 'running') return;
    const length = 0.35;
    const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * length), audio.sampleRate);
    const data = buffer.getChannelData(0);
    const noise = crypto.getRandomValues(new Int16Array(data.length));
    for (let index = 0; index < data.length; index++) data[index] = noise[index] / 32768;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const tone = audio.createBiquadFilter();
    tone.type = 'bandpass';
    tone.frequency.value = 1320;
    const gain = audio.createGain();
    const time = audio.currentTime;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.16, time + 0.055);
    gain.gain.exponentialRampToValueAtTime(0.001, time + length);
    source.connect(tone).connect(gain).connect(audio.destination);
    source.start();
  }, []);

  return { enabled, toggle, scratch };
}
