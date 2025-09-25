/**
 * Particle Burst Layer - anisotropic point sprays for energetic accents
 */

import { BaseLayer } from './BaseLayer.js';

export class ParticleBurstLayer extends BaseLayer {
  constructor() {
    super('particles', 20);
    this.color = 'rgba(30, 80, 120, 0.65)';
    this.countRange = { min: 1, max: 3 }; // even fewer bursts; tie to features
    this.particlesPer = { min: 200, max: 700 };
    this.radiusRange = { min: 50, max: 180 };
  }

  generateData(params) {
    const { width, height, padding, random, staticLinesData, allData } = params;
    const bursts = [];
    const count = this.countRange.min + Math.floor(random.random() * (this.countRange.max - this.countRange.min + 1));

    const seeds = [];
    // prefer endpoints of static lines
    (staticLinesData || []).forEach(l => {
      // sample subset of endpoints to reduce density
      if (random.random() > 0.5) seeds.push({ x: l.x1, y: l.y1 });
      if (random.random() > 0.5) seeds.push({ x: l.x2, y: l.y2 });
    });
    // also use node centers for seeding
    const nodesData = allData && allData.get ? allData.get('nodes') : null;
    if (nodesData && nodesData.nodes) {
      nodesData.nodes.slice(0, 4).forEach(n => seeds.push({ x: n.x, y: n.y }));
    }
    while (seeds.length < count) {
      seeds.push({
        x: padding + random.random() * (width - padding * 2),
        y: padding + random.random() * (height - padding * 2)
      });
    }

    for (let i = 0; i < count; i++) {
      const origin = seeds[i % seeds.length];
      const particles = [];
      const n = this.particlesPer.min + Math.floor(random.random() * (this.particlesPer.max - this.particlesPer.min + 1));
      const radius = this.radiusRange.min + random.random() * (this.radiusRange.max - this.radiusRange.min);
      const aspect = 0.5 + random.random() * 1.2; // anisotropy
      const angle = random.random() * Math.PI * 2;
      for (let j = 0; j < n; j++) {
        const r = (random.random() ** 0.7) * radius;
        const a = angle + (random.random() - 0.5) * Math.PI * 0.6;
        const x = origin.x + Math.cos(a) * r * aspect;
        const y = origin.y + Math.sin(a) * r / aspect;
        const size = 0.6 + random.random() * 1.2; // variable dot size
        const alpha = 0.35 + (1 - r / radius) * 0.45; // fade outward
        particles.push({ x, y, size, alpha });
      }
      // per-burst tint strength
      const burstAlpha = 0.7 - i * 0.05;
      bursts.push({ origin, particles, burstAlpha });
    }

    return { bursts };
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    data.bursts.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.burstAlpha;
      this.setFillStyle(ctx, this.color);
      b.particles.forEach(p => {
        const pos = transform3D.transform(p.x, p.y, this.zIndex, time, is3D);
        ctx.beginPath();
        ctx.globalAlpha = b.burstAlpha * p.alpha;
        ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
  }
}


