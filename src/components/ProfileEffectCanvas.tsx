import React, { useEffect, useRef } from 'react';
import { ProfileEffectId } from '../types/profileEffects';

interface ProfileEffectCanvasProps {
  effectId: ProfileEffectId | string;
  className?: string;
}

export const ProfileEffectCanvas: React.FC<ProfileEffectCanvasProps> = ({
  effectId,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!effectId || effectId === 'none') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 360);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 260);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // ==========================================
    // INITIALIZE PARTICLES FOR EACH EFFECT
    // ==========================================
    let frame = 0;

    // 1. SNOW
    const snowParticles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 2.2 + 0.8,
      speedY: Math.random() * 0.7 + 0.35,
      speedX: Math.random() * 0.4 - 0.2,
      wobbleSpeed: Math.random() * 0.03 + 0.015,
      wobbleOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.5 + 0.35,
    }));

    // 2. RAIN
    const rainParticles = Array.from({ length: 55 }, () => ({
      x: Math.random() * (width + 50) - 25,
      y: Math.random() * height,
      len: Math.random() * 12 + 10,
      speed: Math.random() * 7 + 11,
      opacity: Math.random() * 0.4 + 0.25,
    }));

    // 3. INFERNO
    const fireParticles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: height + Math.random() * 20,
      vx: (Math.random() - 0.5) * 1.2,
      vy: -(Math.random() * 2 + 1.2),
      size: Math.random() * 7 + 4,
      life: Math.random(),
      maxLife: Math.random() * 50 + 40,
    }));

    // 4. BUBBLES
    const bubbles = Array.from({ length: 28 }, () => {
      const sizeType = Math.random();
      let radius = Math.random() * 5 + 4; // tiny
      if (sizeType > 0.75) radius = Math.random() * 9 + 17; // large
      else if (sizeType > 0.4) radius = Math.random() * 6 + 10; // medium

      return {
        x: Math.random() * width,
        y: height + Math.random() * 40,
        radius,
        speedY: -(Math.random() * 0.6 + 0.35),
        wobbleSpeed: Math.random() * 0.03 + 0.015,
        wobbleAmp: Math.random() * 0.8 + 0.4,
        wobbleOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.35 + 0.2,
      };
    });

    // 5. STORM
    let lightningOpacity = 0;
    const stormRain = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      len: Math.random() * 10 + 8,
      speed: Math.random() * 6 + 10,
      opacity: Math.random() * 0.3 + 0.15,
    }));

    // 6. NEON
    const neonLines = Array.from({ length: 8 }, (_, i) => ({
      y: (height / 8) * i + Math.random() * 10,
      speed: (Math.random() * 0.8 + 0.4) * (i % 2 === 0 ? 1 : -1),
      offset: Math.random() * 100,
      color: i % 3 === 0 ? '#00f0ff' : i % 3 === 1 ? '#ff007f' : '#a855f7',
      length: Math.random() * 80 + 60,
    }));

    // 8. MATRIX
    const matrixCols = 16;
    const colWidth = width / matrixCols;
    const matrixDrops = Array.from({ length: matrixCols }, () => Math.random() * -30);

    // 9. STARS
    const stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.6,
      twinkleSpeed: Math.random() * 0.05 + 0.02,
      phase: Math.random() * Math.PI * 2,
      isGlint: Math.random() > 0.85,
    }));

    // 11. PLASMA
    const plasmaBlobs = [
      { x: width * 0.3, y: height * 0.4, vx: 0.5, vy: 0.4, radius: 80, color: 'rgba(168, 85, 247, 0.15)' },
      { x: width * 0.7, y: height * 0.6, vx: -0.4, vy: 0.6, radius: 90, color: 'rgba(236, 72, 153, 0.14)' },
      { x: width * 0.5, y: height * 0.8, vx: 0.6, vy: -0.5, radius: 75, color: 'rgba(6, 182, 212, 0.13)' },
      { x: width * 0.2, y: height * 0.7, vx: -0.5, vy: -0.3, radius: 85, color: 'rgba(139, 92, 246, 0.15)' },
    ];

    // 12. FOG
    const fogLayers = [
      { x: 0, speed: 0.25, y: height * 0.3, radius: 90, opacity: 0.12 },
      { x: 50, speed: -0.2, y: height * 0.6, radius: 110, opacity: 0.14 },
      { x: -30, speed: 0.35, y: height * 0.8, radius: 100, opacity: 0.16 },
    ];

    // 15. RETRO TV
    let tvJitter = 0;

    // 16. COSMIC
    const cosmicParticles = Array.from({ length: 35 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.5 + 0.5,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      opacity: Math.random() * 0.6 + 0.2,
      color: Math.random() > 0.5 ? '#c084fc' : '#38bdf8',
    }));

    // 18. FLOWERS
    const flowers = Array.from({ length: 28 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 3.5,
      speedY: Math.random() * 0.6 + 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      wobbleOffset: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.4 + 0.45,
    }));

    // 19. FIREWORKS
    interface Spark {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      alpha: number;
    }
    let fireworkSparks: Spark[] = [];

    // 20. ROSES
    const rosePetals = Array.from({ length: 25 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 5 + 4,
      speedY: Math.random() * 0.7 + 0.4,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.03,
      wobble: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.45 + 0.4,
    }));

    // 21. KITTY
    const kittyParticles = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 5 + 6,
      speedY: -(Math.random() * 0.4 + 0.25),
      wobble: Math.random() * Math.PI * 2,
      opacity: Math.random() * 0.35 + 0.25,
      type: Math.random() > 0.4 ? 'paw' : 'sparkle',
    }));

    // 22. SPARKLE
    const sparkles = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 5 + 3,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 0.05 + 0.02,
      color: Math.random() > 0.3 ? '#fef08a' : '#ffffff',
    }));

    // 24. VIBE
    const vibeOrbs = Array.from({ length: 12 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 25 + 15,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      hue: Math.random() * 60 + 260, // purple/pink/blue range
      opacity: Math.random() * 0.15 + 0.08,
    }));

    // ==========================================
    // RENDER LOOP
    // ==========================================
    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      switch (effectId) {
        // ----------------------------------------------------
        // 1. SNOW
        // ----------------------------------------------------
        case 'snow': {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (const p of snowParticles) {
            p.y += p.speedY;
            p.x += Math.sin(frame * p.wobbleSpeed + p.wobbleOffset) * 0.5 + p.speedX;
            if (p.y > height + 5) {
              p.y = -5;
              p.x = Math.random() * width;
            }
            if (p.x < -10) p.x = width + 5;
            if (p.x > width + 10) p.x = -5;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            ctx.fill();
          }
          break;
        }

        // ----------------------------------------------------
        // 2. RAIN
        // ----------------------------------------------------
        case 'rain': {
          ctx.lineWidth = 1;
          for (const p of rainParticles) {
            p.y += p.speed;
            p.x -= 0.8; // slight angle
            if (p.y > height + 20) {
              p.y = -20;
              p.x = Math.random() * (width + 50) - 25;
            }

            ctx.strokeStyle = `rgba(186, 220, 255, ${p.opacity})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 2, p.y + p.len);
            ctx.stroke();
          }
          break;
        }

        // ----------------------------------------------------
        // 3. INFERNO
        // ----------------------------------------------------
        case 'inferno': {
          // Bottom glowing flame base
          const baseGrad = ctx.createLinearGradient(0, height, 0, height - 60);
          baseGrad.addColorStop(0, 'rgba(239, 68, 68, 0.18)');
          baseGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = baseGrad;
          ctx.fillRect(0, height - 60, width, 60);

          for (const p of fireParticles) {
            p.life++;
            p.x += p.vx + Math.sin(frame * 0.1 + p.y * 0.05) * 0.5;
            p.y += p.vy;

            const progress = p.life / p.maxLife;
            const currentSize = Math.max(1, p.size * (1 - progress));
            const alpha = (1 - progress) * 0.65;

            // Color shift from yellow/orange to deep red
            const color =
              progress < 0.4
                ? `rgba(253, 224, 71, ${alpha})`
                : progress < 0.75
                ? `rgba(249, 115, 22, ${alpha})`
                : `rgba(220, 38, 38, ${alpha})`;

            ctx.beginPath();
            ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();

            // Reset when life expires or reaches top
            if (p.life >= p.maxLife || p.y < -10) {
              p.life = 0;
              p.x = Math.random() * width;
              p.y = height + Math.random() * 10;
              p.vx = (Math.random() - 0.5) * 1.2;
              p.vy = -(Math.random() * 2 + 1.2);
            }
          }
          break;
        }

        // ----------------------------------------------------
        // 4. BUBBLES
        // ----------------------------------------------------
        case 'bubbles': {
          for (const b of bubbles) {
            b.y += b.speedY;
            b.x += Math.sin(frame * b.wobbleSpeed + b.wobbleOffset) * b.wobbleAmp;

            if (b.y < -b.radius * 2) {
              b.y = height + b.radius * 2;
              b.x = Math.random() * width;
            }

            // Outer bubble outline
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(192, 132, 252, ${b.opacity * 0.9})`;
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Soft radial interior sheen
            const radGrad = ctx.createRadialGradient(
              b.x - b.radius * 0.3,
              b.y - b.radius * 0.3,
              b.radius * 0.1,
              b.x,
              b.y,
              b.radius
            );
            radGrad.addColorStop(0, `rgba(255, 255, 255, ${b.opacity * 0.4})`);
            radGrad.addColorStop(0.7, `rgba(168, 85, 247, ${b.opacity * 0.15})`);
            radGrad.addColorStop(1, `rgba(56, 189, 248, ${b.opacity * 0.25})`);
            ctx.fillStyle = radGrad;
            ctx.fill();

            // Specular shine highlight
            ctx.beginPath();
            ctx.arc(
              b.x - b.radius * 0.35,
              b.y - b.radius * 0.35,
              Math.max(1, b.radius * 0.2),
              0,
              Math.PI * 2
            );
            ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.85})`;
            ctx.fill();
          }
          break;
        }

        // ----------------------------------------------------
        // 5. STORM
        // ----------------------------------------------------
        case 'storm': {
          // Occasional lightning flash
          if (frame % 220 === 0 && Math.random() > 0.3) {
            lightningOpacity = 0.22;
          }
          if (lightningOpacity > 0) {
            ctx.fillStyle = `rgba(224, 242, 254, ${lightningOpacity})`;
            ctx.fillRect(0, 0, width, height);
            lightningOpacity -= 0.02;
          }

          // Dark storm clouds layer
          const stormGrad = ctx.createLinearGradient(0, 0, 0, height);
          stormGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
          stormGrad.addColorStop(0.5, 'rgba(30, 41, 59, 0.25)');
          stormGrad.addColorStop(1, 'rgba(15, 23, 42, 0.35)');
          ctx.fillStyle = stormGrad;
          ctx.fillRect(0, 0, width, height);

          // Storm rain
          ctx.lineWidth = 1;
          for (const p of stormRain) {
            p.y += p.speed;
            p.x -= 1.2;
            if (p.y > height + 20) {
              p.y = -20;
              p.x = Math.random() * (width + 40);
            }
            ctx.strokeStyle = `rgba(148, 163, 184, ${p.opacity})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - 3, p.y + p.len);
            ctx.stroke();
          }
          break;
        }

        // ----------------------------------------------------
        // 6. NEON
        // ----------------------------------------------------
        case 'neon': {
          for (const line of neonLines) {
            line.offset = (line.offset + line.speed + width) % width;
            const grad = ctx.createLinearGradient(
              line.offset,
              line.y,
              line.offset + line.length,
              line.y
            );
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.5, line.color);
            grad.addColorStop(1, 'transparent');

            ctx.lineWidth = 2;
            ctx.strokeStyle = grad;
            ctx.beginPath();
            ctx.moveTo(line.offset, line.y);
            ctx.lineTo(line.offset + line.length, line.y);
            ctx.stroke();

            // Glowing dot at head
            ctx.beginPath();
            ctx.arc(line.offset + line.length * 0.5, line.y, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
          break;
        }

        // ----------------------------------------------------
        // 7. GLITCH
        // ----------------------------------------------------
        case 'glitch': {
          // Subtle digital scan slices
          if (frame % 35 < 4) {
            const sliceY = (Math.sin(frame * 0.7) * 0.5 + 0.5) * height;
            const sliceH = Math.random() * 14 + 4;
            const offsetX = (Math.random() - 0.5) * 12;

            ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
            ctx.fillRect(offsetX, sliceY, width, sliceH);

            ctx.fillStyle = 'rgba(236, 72, 153, 0.12)';
            ctx.fillRect(-offsetX, sliceY + 2, width, sliceH);
          }

          // Subtle horizontal sync lines
          ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
          for (let y = 0; y < height; y += 4) {
            ctx.fillRect(0, y, width, 1);
          }
          break;
        }

        // ----------------------------------------------------
        // 8. MATRIX
        // ----------------------------------------------------
        case 'matrix': {
          ctx.font = '10px monospace';
          for (let i = 0; i < matrixCols; i++) {
            matrixDrops[i] += 0.65;
            if (matrixDrops[i] > height / 14 + 10) {
              matrixDrops[i] = Math.random() * -15;
            }

            const x = i * colWidth + 4;
            const currentY = matrixDrops[i] * 14;

            // Fading trail characters
            for (let j = 0; j < 6; j++) {
              const charY = currentY - j * 14;
              if (charY > 0 && charY < height) {
                const alpha = Math.max(0.1, (1 - j / 6) * 0.7);
                ctx.fillStyle = j === 0 ? '#bbf7d0' : `rgba(34, 197, 94, ${alpha})`;
                const char = String.fromCharCode(0x30a0 + ((frame + i * 5 + j) % 60));
                ctx.fillText(char, x, charY);
              }
            }
          }
          break;
        }

        // ----------------------------------------------------
        // 9. STARS
        // ----------------------------------------------------
        case 'stars': {
          for (const s of stars) {
            const alpha = 0.25 + 0.6 * Math.sin(frame * s.twinkleSpeed + s.phase);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, alpha)})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
            ctx.fill();

            // Diamond glint on special stars
            if (s.isGlint && alpha > 0.65) {
              ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha - 0.65) * 1.5})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(s.x - 4, s.y);
              ctx.lineTo(s.x + 4, s.y);
              ctx.moveTo(s.x, s.y - 4);
              ctx.lineTo(s.x, s.y + 4);
              ctx.stroke();
            }
          }
          break;
        }

        // ----------------------------------------------------
        // 10. RAINBOW
        // ----------------------------------------------------
        case 'rainbow': {
          const shift = (frame * 0.4) % 360;
          const rainbowGrad = ctx.createLinearGradient(0, 0, width, height);
          rainbowGrad.addColorStop(0, `hsla(${shift}, 85%, 65%, 0.12)`);
          rainbowGrad.addColorStop(0.3, `hsla(${(shift + 60) % 360}, 85%, 65%, 0.12)`);
          rainbowGrad.addColorStop(0.6, `hsla(${(shift + 180) % 360}, 85%, 65%, 0.12)`);
          rainbowGrad.addColorStop(1, `hsla(${(shift + 260) % 360}, 85%, 65%, 0.12)`);

          ctx.fillStyle = rainbowGrad;
          ctx.fillRect(0, 0, width, height);

          // Flowing ribbon wave
          ctx.beginPath();
          ctx.moveTo(0, height * 0.6);
          for (let x = 0; x <= width; x += 10) {
            const y = height * 0.6 + Math.sin(x * 0.02 + frame * 0.03) * 18;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(width, height);
          ctx.lineTo(0, height);
          ctx.closePath();
          ctx.fillStyle = `hsla(${(shift + 120) % 360}, 80%, 60%, 0.08)`;
          ctx.fill();
          break;
        }

        // ----------------------------------------------------
        // 11. PLASMA
        // ----------------------------------------------------
        case 'plasma': {
          for (const b of plasmaBlobs) {
            b.x += b.vx;
            b.y += b.vy;
            if (b.x < 0 || b.x > width) b.vx *= -1;
            if (b.y < 0 || b.y > height) b.vy *= -1;

            const rad = ctx.createRadialGradient(b.x, b.y, 5, b.x, b.y, b.radius);
            rad.addColorStop(0, b.color);
            rad.addColorStop(1, 'transparent');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        // ----------------------------------------------------
        // 12. FOG
        // ----------------------------------------------------
        case 'fog': {
          for (const fog of fogLayers) {
            fog.x = (fog.x + fog.speed + width) % width;
            const grad = ctx.createRadialGradient(
              fog.x,
              fog.y,
              10,
              fog.x,
              fog.y,
              fog.radius * 1.5
            );
            grad.addColorStop(0, `rgba(226, 232, 240, ${fog.opacity})`);
            grad.addColorStop(0.6, `rgba(203, 213, 225, ${fog.opacity * 0.5})`);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);
          }
          break;
        }

        // ----------------------------------------------------
        // 13. PULSE
        // ----------------------------------------------------
        case 'pulse': {
          const pulseProgress = (frame * 0.02) % 1;
          const maxRadius = Math.max(width, height) * 0.75;
          const currentRad = pulseProgress * maxRadius;
          const alpha = (1 - pulseProgress) * 0.28;

          const cx = width / 2;
          const cy = height * 0.7;

          const radGrad = ctx.createRadialGradient(
            cx,
            cy,
            Math.max(0, currentRad - 30),
            cx,
            cy,
            currentRad
          );
          radGrad.addColorStop(0, 'transparent');
          radGrad.addColorStop(0.7, `rgba(168, 85, 247, ${alpha})`);
          radGrad.addColorStop(1, 'transparent');

          ctx.fillStyle = radGrad;
          ctx.beginPath();
          ctx.arc(cx, cy, currentRad, 0, Math.PI * 2);
          ctx.fill();
          break;
        }

        // ----------------------------------------------------
        // 14. SCAN
        // ----------------------------------------------------
        case 'scan': {
          const scanY = (frame * 1.2) % height;

          // Trail
          const trailGrad = ctx.createLinearGradient(0, scanY - 35, 0, scanY);
          trailGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
          trailGrad.addColorStop(1, 'rgba(6, 182, 212, 0.16)');
          ctx.fillStyle = trailGrad;
          ctx.fillRect(0, Math.max(0, scanY - 35), width, 35);

          // Crisp scan line
          ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(0, scanY);
          ctx.lineTo(width, scanY);
          ctx.stroke();

          // Subtle background grid
          ctx.fillStyle = 'rgba(6, 182, 212, 0.03)';
          for (let x = 0; x < width; x += 25) {
            ctx.fillRect(x, 0, 1, height);
          }
          break;
        }

        // ----------------------------------------------------
        // 15. RETRO TV
        // ----------------------------------------------------
        case 'retro_tv': {
          tvJitter = (tvJitter + 0.5) % 3;

          // CRT scan lines
          ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
          for (let y = tvJitter; y < height; y += 3) {
            ctx.fillRect(0, y, width, 1.5);
          }

          // Subtle phosphor flicker
          const flicker = 0.04 + Math.sin(frame * 0.3) * 0.02;
          ctx.fillStyle = `rgba(52, 211, 153, ${flicker})`;
          ctx.fillRect(0, 0, width, height);
          break;
        }

        // ----------------------------------------------------
        // 16. COSMIC
        // ----------------------------------------------------
        case 'cosmic': {
          // Nebula background gradient
          const nebula = ctx.createRadialGradient(
            width * 0.7,
            height * 0.4,
            10,
            width * 0.7,
            height * 0.4,
            120
          );
          nebula.addColorStop(0, 'rgba(147, 51, 234, 0.16)');
          nebula.addColorStop(0.5, 'rgba(59, 130, 246, 0.09)');
          nebula.addColorStop(1, 'transparent');
          ctx.fillStyle = nebula;
          ctx.fillRect(0, 0, width, height);

          // Moving cosmic stardust
          for (const p of cosmicParticles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = width;
            if (p.x > width) p.x = 0;
            if (p.y < 0) p.y = height;
            if (p.y > height) p.y = 0;

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.opacity;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ----------------------------------------------------
        // 17. OCEAN
        // ----------------------------------------------------
        case 'ocean': {
          // Sine wave water ripples
          for (let wave = 0; wave < 3; wave++) {
            ctx.beginPath();
            const yOffset = height * (0.65 + wave * 0.12);
            ctx.moveTo(0, yOffset);
            for (let x = 0; x <= width; x += 10) {
              const y =
                yOffset +
                Math.sin(x * 0.025 + frame * (0.025 + wave * 0.01) + wave) * (6 + wave * 2);
              ctx.lineTo(x, y);
            }
            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const opacity = 0.08 + wave * 0.04;
            ctx.fillStyle = `rgba(14, 165, 233, ${opacity})`;
            ctx.fill();
          }
          break;
        }

        // ----------------------------------------------------
        // 18. FLOWERS
        // ----------------------------------------------------
        case 'flowers': {
          for (const f of flowers) {
            f.y += f.speedY;
            f.x += Math.sin(frame * 0.02 + f.wobbleOffset) * 0.6;
            f.rotation += f.rotSpeed;

            if (f.y > height + 10) {
              f.y = -10;
              f.x = Math.random() * width;
            }

            ctx.save();
            ctx.translate(f.x, f.y);
            ctx.rotate(f.rotation);
            ctx.fillStyle = `rgba(244, 114, 182, ${f.opacity})`;

            // Draw petal
            ctx.beginPath();
            ctx.ellipse(0, 0, f.size * 0.6, f.size, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          break;
        }

        // ----------------------------------------------------
        // 19. FIREWORKS
        // ----------------------------------------------------
        case 'fireworks': {
          if (frame % 70 === 0) {
            const burstX = Math.random() * (width * 0.7) + width * 0.15;
            const burstY = Math.random() * (height * 0.5) + height * 0.15;
            const colors = ['#f43f5e', '#38bdf8', '#facc15', '#a855f7', '#4ade80'];
            const burstColor = colors[Math.floor(Math.random() * colors.length)];

            for (let i = 0; i < 22; i++) {
              const angle = (Math.PI * 2 * i) / 22;
              const spd = Math.random() * 2 + 1.2;
              fireworkSparks.push({
                x: burstX,
                y: burstY,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: burstColor,
                alpha: 1,
              });
            }
          }

          // Update & draw sparks
          for (let i = fireworkSparks.length - 1; i >= 0; i--) {
            const spk = fireworkSparks[i];
            spk.x += spk.vx;
            spk.y += spk.vy;
            spk.vy += 0.04; // gravity
            spk.alpha -= 0.025;

            if (spk.alpha <= 0) {
              fireworkSparks.splice(i, 1);
            } else {
              ctx.fillStyle = spk.color;
              ctx.globalAlpha = spk.alpha * 0.7;
              ctx.beginPath();
              ctx.arc(spk.x, spk.y, 1.8, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ----------------------------------------------------
        // 20. ROSES
        // ----------------------------------------------------
        case 'roses': {
          for (const r of rosePetals) {
            r.y += r.speedY;
            r.x += Math.sin(frame * 0.02 + r.wobble) * 0.55;
            r.rot += r.rotSpeed;

            if (r.y > height + 10) {
              r.y = -10;
              r.x = Math.random() * width;
            }

            ctx.save();
            ctx.translate(r.x, r.y);
            ctx.rotate(r.rot);
            ctx.fillStyle = `rgba(225, 29, 72, ${r.opacity})`;

            // Soft curved rose petal
            ctx.beginPath();
            ctx.ellipse(0, 0, r.size * 0.7, r.size * 1.1, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          break;
        }

        // ----------------------------------------------------
        // 21. KITTY
        // ----------------------------------------------------
        case 'kitty': {
          for (const k of kittyParticles) {
            k.y += k.speedY;
            k.x += Math.sin(frame * 0.025 + k.wobble) * 0.4;
            if (k.y < -15) {
              k.y = height + 10;
              k.x = Math.random() * width;
            }

            ctx.fillStyle = `rgba(216, 180, 254, ${k.opacity})`;

            if (k.type === 'paw') {
              // Main pad
              ctx.beginPath();
              ctx.arc(k.x, k.y, k.size * 0.4, 0, Math.PI * 2);
              ctx.fill();
              // Toe beans
              for (let t = -1; t <= 1; t++) {
                ctx.beginPath();
                ctx.arc(
                  k.x + t * k.size * 0.35,
                  k.y - k.size * 0.35,
                  k.size * 0.18,
                  0,
                  Math.PI * 2
                );
                ctx.fill();
              }
            } else {
              // Cute 4-point sparkle
              ctx.beginPath();
              ctx.arc(k.x, k.y, k.size * 0.25, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          break;
        }

        // ----------------------------------------------------
        // 22. SPARKLE
        // ----------------------------------------------------
        case 'sparkle': {
          for (const s of sparkles) {
            const alpha = Math.max(0, Math.sin(frame * s.speed + s.phase));
            if (alpha > 0.05) {
              ctx.strokeStyle = s.color;
              ctx.globalAlpha = alpha * 0.8;
              ctx.lineWidth = 1.2;

              // 4-point diamond star
              ctx.beginPath();
              ctx.moveTo(s.x - s.size, s.y);
              ctx.lineTo(s.x + s.size, s.y);
              ctx.moveTo(s.x, s.y - s.size);
              ctx.lineTo(s.x, s.y + s.size);
              ctx.stroke();

              // Center dot
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(s.x, s.y, 1, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ----------------------------------------------------
        // 23. GALAXY
        // ----------------------------------------------------
        case 'galaxy': {
          const cx = width / 2;
          const cy = height * 0.65;
          const rot = frame * 0.008;

          // Glowing central core
          const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, 45);
          coreGrad.addColorStop(0, 'rgba(236, 72, 153, 0.22)');
          coreGrad.addColorStop(0.5, 'rgba(147, 51, 234, 0.12)');
          coreGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = coreGrad;
          ctx.fillRect(cx - 50, cy - 50, 100, 100);

          // Spiral arms particles
          for (let i = 0; i < 40; i++) {
            const arm = i % 2 === 0 ? 0 : Math.PI;
            const dist = 8 + i * 2.2;
            const angle = rot + arm + dist * 0.05;
            const px = cx + Math.cos(angle) * dist * 1.3;
            const py = cy + Math.sin(angle) * dist * 0.7; // elliptical tilt

            ctx.fillStyle = i % 3 === 0 ? '#38bdf8' : '#f472b6';
            ctx.globalAlpha = Math.max(0.15, 0.6 - dist * 0.005);
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          break;
        }

        // ----------------------------------------------------
        // 24. VIBE
        // ----------------------------------------------------
        case 'vibe': {
          for (const orb of vibeOrbs) {
            orb.x += orb.vx;
            orb.y += orb.vy;
            if (orb.x < -orb.radius) orb.x = width + orb.radius;
            if (orb.x > width + orb.radius) orb.x = -orb.radius;
            if (orb.y < -orb.radius) orb.y = height + orb.radius;
            if (orb.y > height + orb.radius) orb.y = -orb.radius;

            const rad = ctx.createRadialGradient(
              orb.x,
              orb.y,
              orb.radius * 0.1,
              orb.x,
              orb.y,
              orb.radius
            );
            rad.addColorStop(0, `hsla(${orb.hue}, 80%, 65%, ${orb.opacity})`);
            rad.addColorStop(1, 'transparent');
            ctx.fillStyle = rad;
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }

        default:
          break;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effectId]);

  if (!effectId || effectId === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none w-full h-full ${className}`}
      style={{ display: 'block' }}
    />
  );
};
