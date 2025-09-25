/**
 * Rect Mask Layer - carves large rectangular voids (destination-out)
 */

import { BaseLayer } from './BaseLayer.js';

export class RectMaskLayer extends BaseLayer {
  constructor() {
    super('rectMasks', 90); // high z but rendered first to carve voids
    this.maskCount = { min: 2, max: 4 };
    this.sizeRange = { min: 0.25, max: 0.45 }; // of canvas min dimension
  }

  generateData(params) {
    const { width, height, padding, random } = params;
    const minDim = Math.min(width, height);
    const count = this.maskCount.min + Math.floor(random.random() * (this.maskCount.max - this.maskCount.min + 1));
    const masks = [];
    for (let i = 0; i < count; i++) {
      const w = (this.sizeRange.min + random.random() * (this.sizeRange.max - this.sizeRange.min)) * minDim;
      const h = (this.sizeRange.min + random.random() * (this.sizeRange.max - this.sizeRange.min)) * minDim * (0.6 + random.random() * 0.8);
      const x = padding + random.random() * (width - padding * 2 - w);
      const y = padding + random.random() * (height - padding * 2 - h);
      masks.push({ x, y, w, h });
    }
    return { masks };
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    data.masks.forEach((m) => {
      const p1 = transform3D.transform(m.x, m.y, this.zIndex, time, is3D);
      const p2 = transform3D.transform(m.x + m.w, m.y, this.zIndex, time, is3D);
      const p3 = transform3D.transform(m.x + m.w, m.y + m.h, this.zIndex, time, is3D);
      const p4 = transform3D.transform(m.x, m.y + m.h, this.zIndex, time, is3D);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();
  }
}


