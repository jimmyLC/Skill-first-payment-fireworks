/**
 * Fireworks on a throwaway full-screen canvas. No dependencies, no build step.
 *
 *   import { fireworks } from './fireworks.js';
 *   fireworks();                       // ~3 seconds, 8 shells
 *   fireworks({ host: openDialog });   // draw IN FRONT of an open <dialog>
 *
 * Why `host`: an open modal <dialog> lives in the browser's top layer and paints above everything
 * outside it, including a fixed canvas with z-index 9999. Appending the canvas inside the dialog
 * keeps the fireworks in front of the dialog's content.
 *
 * Does nothing when the visitor prefers reduced motion. Returns a function that stops the show early.
 */
export function fireworks({
  host = document.body,
  shells = 8,
  duration = 3000,
  colors = ['#ff6b5e', '#ffc83d', '#3ec3a4', '#4c8dff', '#a66bff', '#ff8fb1', '#ffffff'],
} = {}) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:transparent;pointer-events:none;z-index:9999';
  const dpr = window.devicePixelRatio || 1;
  const w = innerWidth;
  const h = innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  host.append(canvas);
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const start = performance.now();
  // Each shell rises from the bottom, then bursts at a random spot in the upper half of the screen.
  // Launches are spread over ~55% of the duration so the last bursts finish fading near the end.
  const launchWindow = duration * 0.57;
  const queue = Array.from({ length: shells }, (_, i) => ({
    launchAt: (i / shells) * launchWindow + Math.random() * 120,
    x: w * (0.15 + Math.random() * 0.7),
    targetY: h * (0.15 + Math.random() * 0.35),
    color: colors[Math.floor(Math.random() * colors.length)],
    y: h,
    burst: false,
  }));
  let sparks = [];
  let stopped = false;

  const explode = (shell) => {
    const n = 46;
    for (let k = 0; k < n; k++) {
      const angle = (k / n) * Math.PI * 2 + Math.random() * 0.2;
      const speed = 2.2 + Math.random() * 3.2;
      sparks.push({
        x: shell.x, y: shell.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
        life: 0, ttl: 38 + Math.random() * 16, color: Math.random() < 0.25 ? '#ffffff' : shell.color,
      });
    }
  };

  const finish = () => { stopped = true; canvas.remove(); };

  const tick = (now) => {
    if (stopped) return;
    const t = now - start;
    // Fading the old frame (instead of clearing it) leaves short trails behind moving points.
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'source-over';

    for (const shell of queue) {
      if (shell.burst || t < shell.launchAt) continue;
      shell.y -= Math.max(6, (shell.y - shell.targetY) * 0.09);
      ctx.fillStyle = '#fff4d6';
      ctx.beginPath();
      ctx.arc(shell.x, shell.y, 2, 0, Math.PI * 2);
      ctx.fill();
      if (shell.y <= shell.targetY + 4) { shell.burst = true; explode(shell); }
    }

    sparks = sparks.filter((p) => p.life < p.ttl);
    for (const p of sparks) {
      p.life++;
      p.vx *= 0.96;
      p.vy = p.vy * 0.96 + 0.06; // a little gravity
      p.x += p.vx;
      p.y += p.vy;
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (t < duration || sparks.length) requestAnimationFrame(tick); else finish();
  };
  requestAnimationFrame(tick);
  setTimeout(finish, duration + 600); // hard stop: the overlay can never linger
  return finish;
}
