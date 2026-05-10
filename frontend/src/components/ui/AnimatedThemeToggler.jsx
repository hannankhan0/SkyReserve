import React, { useEffect, useId, useRef, useState } from 'react';
import { motion } from 'motion/react';

let audioContext = null;
let audioBuffer = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextCtor();
  }
  if (audioContext.state === 'suspended') audioContext.resume();
  return audioContext;
}

function getAudioBuffer(ac) {
  if (audioBuffer && audioBuffer.sampleRate === ac.sampleRate) return audioBuffer;

  const rate = ac.sampleRate;
  const length = Math.floor(rate * 0.006);
  const buffer = ac.createBuffer(1, length, rate);
  const channel = buffer.getChannelData(0);

  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    const sine = Math.sin(2 * Math.PI * 3400 * t);
    const noise = Math.random() * 2 - 1;
    channel[i] = (sine * 0.6 + noise * 0.4) * ((1 - t) ** 3);
  }

  audioBuffer = buffer;
  return buffer;
}

function playTick(lastSoundRef) {
  const now = performance.now();
  if (now - lastSoundRef.current < 80) return;
  lastSoundRef.current = now;

  try {
    const ac = getAudioContext();
    const buffer = getAudioBuffer(ac);
    const source = ac.createBufferSource();
    const gain = ac.createGain();

    source.buffer = buffer;
    gain.gain.value = 0.08;
    source.connect(gain);
    gain.connect(ac.destination);
    source.start();
  } catch {
    // Audio is optional; keep the toggle silent if the browser blocks it.
  }
}

function applyTheme(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  localStorage.setItem('skyreserve-theme', isDark ? 'dark' : 'light');
}

function getInitialTheme() {
  if (typeof window === 'undefined') return false;
  const storedTheme = localStorage.getItem('skyreserve-theme');
  if (storedTheme) return storedTheme === 'dark';
  return document.documentElement.classList.contains('dark');
}

export default function AnimatedThemeToggler({ sound = true }) {
  const rawId = useId();
  const maskId = `att${rawId.replace(/:/g, '')}`;
  const lastSoundRef = useRef(0);
  const isFirst = useRef(true);
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(isDark);
    requestAnimationFrame(() => {
      isFirst.current = false;
    });
  }, [isDark]);

  const toggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (sound) playTick(lastSoundRef);
  };

  const spring = isFirst.current
    ? { duration: 0 }
    : { type: 'spring', stiffness: 380, damping: 30 };

  return (
    <motion.button
      className="att-btn"
      onClick={toggle}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.86 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-pressed={isDark}
      title={isDark ? 'Light mode' : 'Dark mode'}
      type="button"
    >
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        initial={false}
        animate={{ rotate: isDark ? 270 : 0 }}
        transition={spring}
        style={{ overflow: 'visible' }}
      >
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <motion.circle
            initial={false}
            animate={{ cx: isDark ? 17 : 33, cy: isDark ? 8 : 0 }}
            transition={spring}
            r="9"
            fill="black"
          />
        </mask>

        <motion.circle
          cx="12"
          cy="12"
          fill="currentColor"
          stroke="none"
          mask={`url(#${maskId})`}
          initial={false}
          animate={{ r: isDark ? 9 : 5 }}
          transition={spring}
        />

        <motion.g
          initial={false}
          animate={{
            opacity: isDark ? 0 : 1,
            scale: isDark ? 0 : 1,
            rotate: isDark ? -30 : 0,
          }}
          transition={spring}
          style={{ transformOrigin: '12px 12px' }}
        >
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="5.64" y1="5.64" x2="4.22" y2="4.22" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          <line x1="5.64" y1="18.36" x2="4.22" y2="19.78" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        </motion.g>
      </motion.svg>
    </motion.button>
  );
}
