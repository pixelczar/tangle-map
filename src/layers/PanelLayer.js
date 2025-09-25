/**
 * Panel Layer - partitions canvas into rectilinear panels; provides rects for clipping
 */

import { BaseLayer } from './BaseLayer.js';

export class PanelLayer extends BaseLayer {
  constructor() {
    super('panels', -15);
    this.lineColor = 'rgba(40, 90, 120, 0.25)';
    this.lineWidth = 0.6;
    this.columns = 16;
    this.rows = 12;
    this.fillRatio = 0.45; // percent of panels to be visually emphasized
    this.showGuides = false; // avoid visible double-grid by default
  }

  generateData(params) {
    const { width, height, padding, random } = params;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const cellW = usableWidth / this.columns;
    const cellH = usableHeight / this.rows;

    const rects = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.columns; c++) {
        rects.push({
          x: padding + c * cellW,
          y: padding + r * cellH,
          w: cellW,
          h: cellH,
          emphasize: random.random() < this.fillRatio
        });
      }
    }

    return { rects, cellW, cellH };
  }

  render(ctx, data, params) {
    if (!this.showGuides) return; // used only for clipping by other layers
    const { transform3D, time, is3D } = params;
    const scale = transform3D.getScale(this.zIndex, time, is3D);
    this.setLineStyle(ctx, this.lineColor, this.lineWidth * scale);

    data.rects.forEach((r) => {
      const p1 = transform3D.transform(r.x, r.y, this.zIndex, time, is3D);
      const p2 = transform3D.transform(r.x + r.w, r.y, this.zIndex, time, is3D);
      const p3 = transform3D.transform(r.x + r.w, r.y + r.h, this.zIndex, time, is3D);
      const p4 = transform3D.transform(r.x, r.y + r.h, this.zIndex, time, is3D);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.stroke();
    });
  }
}


