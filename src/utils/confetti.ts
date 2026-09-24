import confetti from 'canvas-confetti';

export function fireSubtleConfetti() {
  if (typeof window === 'undefined') return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  try {
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#06b6d4', '#10b981', '#f59e0b', '#a855f7', '#ec4899'],
      ticks: 150,
      gravity: 1.2,
      scalar: 0.8,
      disableForReducedMotion: true,
    });
  } catch {
    // Graceful fallback
  }
}

export function fireLevelUpConfetti() {
  if (typeof window === 'undefined') return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  try {
    const end = Date.now() + 1.2 * 1000;
    const colors = ['#f59e0b', '#fbbf24', '#06b6d4', '#10b981', '#6366f1'];

    (function frame() {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  } catch {}
}
