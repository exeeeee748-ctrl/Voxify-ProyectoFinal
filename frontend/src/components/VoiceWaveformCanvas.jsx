import React, { useEffect, useRef } from 'react';

export default function VoiceWaveformCanvas({ active = false, height = 112, accentColor = '#22d3ee' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let phase = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const waves = [
      { freq: 0.015, amp: active ? 28 : 13, speed: active ? 0.085 : 0.028, color: accentColor, width: 2.5, alpha: 0.95 },
      { freq: 0.022, amp: active ? 21 : 9, speed: active ? -0.065 : -0.022, color: '#818cf8', width: 2, alpha: 0.78 },
      { freq: 0.01, amp: active ? 16 : 7, speed: active ? 0.05 : 0.018, color: '#c084fc', width: 1.6, alpha: 0.6 },
    ];

    const render = () => {
      const width = canvas.getBoundingClientRect().width;
      const midY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Subtle center baseline
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, midY);
      ctx.lineTo(width, midY);
      ctx.stroke();

      // Harmonic voice spectrum bars in the background
      const barCount = Math.max(24, Math.floor(width / 16));
      const barStep = width / barCount;
      for (let i = 0; i < barCount; i++) {
        const norm = i / (barCount - 1);
        const envelope = Math.sin(norm * Math.PI);
        const level =
          (Math.sin(phase * 1.4 + i * 0.45) * 0.5 + 0.5) *
          (active ? 0.85 : 0.34) *
          envelope *
          (height * 0.42);
        const x = i * barStep + barStep * 0.5;
        ctx.fillStyle = `rgba(56, 189, 248, ${active ? 0.2 : 0.09})`;
        ctx.fillRect(x - 1.5, midY - level, 3, level * 2);
      }

      // Layered glowing sine ribbons
      waves.forEach((wave, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.globalAlpha = wave.alpha;
        ctx.lineWidth = wave.width;
        ctx.shadowColor = wave.color;
        ctx.shadowBlur = active ? 16 : 8;

        for (let x = 0; x <= width; x += 3) {
          const norm = x / width;
          const envelope = Math.pow(Math.sin(norm * Math.PI), 1.35);
          const harmonic =
            Math.sin(x * wave.freq + phase * (1 + idx * 0.35)) +
            0.45 * Math.sin(x * wave.freq * 2.1 - phase * 1.6);
          const y = midY + harmonic * wave.amp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      });

      phase += active ? 0.07 : 0.025;
      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [active, height, accentColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: `${height}px`,
        display: 'block',
      }}
      aria-label="Visualización de onda de voz Voxify"
    />
  );
}
