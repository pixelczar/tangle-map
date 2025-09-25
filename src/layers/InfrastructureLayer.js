/**
 * Infrastructure Layer - Buildings, connections, and main structural lines
 * Represents the "clear, solvable" aspects of complex problems
 */

import { BaseLayer } from './BaseLayer.js';

export class InfrastructureLayer extends BaseLayer {
  constructor() {
    super('infrastructure', -10);
    this.connectionColor = 'rgba(50, 120, 160, 0.4)';
    this.staticLineColor = 'rgba(30, 80, 120, 0.8)';
    this.connectionLineWidth = 1.0;
    this.staticLineWidth = 4.0;
  }

  generateData(params) {
    const { clusters, random, width, height, padding, gridData, gridSize } = params;
    
    const data = {
      connections: [],
      staticLines: [],
      terminalPoints: []
    };

    // Safety check: ensure clusters array exists and has elements
    if (!clusters || clusters.length === 0) {
      return data; // Return empty data if no clusters
    }

    // Town plots are now handled by the separate TownPlotsLayer

    // Generate straighter connection lines between clusters
    for (let i = 0; i < 8; i++) {
      const shouldDraw = random.random() > 0.4;
      const cluster1 = clusters[Math.floor(random.random() * clusters.length)];
      const cluster2 = clusters[Math.floor(random.random() * clusters.length)];
      
      // Safety check: ensure clusters are valid
      if (!cluster1 || !cluster2) {
        continue;
      }
      
      // Make lines more direct with less random offset
      const x1 = cluster1.x + (random.random() - 0.5) * cluster1.radius * 0.2;
      const y1 = cluster1.y + (random.random() - 0.5) * cluster1.radius * 0.2;
      const x2 = cluster2.x + (random.random() - 0.5) * cluster2.radius * 0.2;
      const y2 = cluster2.y + (random.random() - 0.5) * cluster2.radius * 0.2;
      
      data.connections.push({
        x1, y1, x2, y2, shouldDraw
      });
    }

    // Generate static cross lines between adjacent clusters
    for (let i = 0; i < clusters.length - 1; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const shouldConnect = random.random() > 0.3;
        
        if (shouldConnect) {
          const cluster1 = clusters[i];
          const cluster2 = clusters[j];
          
          // Safety check: ensure clusters are valid
          if (!cluster1 || !cluster2) {
            continue;
          }
          
      const x1 = Math.max(0, Math.min(width, cluster1.x + (random.random() - 0.5) * cluster1.radius * 0.15));
      const y1 = Math.max(0, Math.min(height, cluster1.y + (random.random() - 0.5) * cluster1.radius * 0.15));
      const x2 = Math.max(0, Math.min(width, cluster2.x + (random.random() - 0.5) * cluster2.radius * 0.15));
      const y2 = Math.max(0, Math.min(height, cluster2.y + (random.random() - 0.5) * cluster2.radius * 0.15));
          
          data.staticLines.push({ x1, y1, x2, y2 });
          data.terminalPoints.push({ x: x1, y: y1 });
          data.terminalPoints.push({ x: x2, y: y2 });
        }
      }
    }

    return data;
  }




  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    // Structures (town plots) are now handled by TownPlotsLayer
    
    // Render connections
    this.renderConnections(ctx, data.connections, { transform3D, time, is3D });
    
    // Render static lines
    this.renderStaticLines(ctx, data.staticLines, { transform3D, time, is3D });
    
    // Render endpoint circles
    this.renderEndpointCircles(ctx, data.staticLines, { transform3D, time, is3D });
  }


  renderConnections(ctx, connections, { transform3D, time, is3D }) {
    const baseScale = transform3D.getScale(this.zIndex, time, is3D);
    
    const cWidth = (this.connectionLineWidth + Math.sin(time * 0.015) * 0.1) * baseScale * 1.1; // darker/stronger base
    
    connections.forEach((connection, idx) => {
      if (!connection.shouldDraw) return;
      
      const p1 = transform3D.transform(connection.x1, connection.y1, this.zIndex, time, is3D);
      const p2 = transform3D.transform(connection.x2, connection.y2, this.zIndex, time, is3D);
      // Make connection lines straighter with less jitter
      if ((idx % 5) === 0) {
        // promote to strong primary line - straighter
        this.drawOverdrawLine(ctx, this.connectionColor, cWidth * 1.9, p1, p2, { seed: idx * 13, segments: 8, jitter: 0.2, widthVariation: 0.15, opacityVariation: 0.1, passes: 3 });
      } else if ((idx % 4) === 0) {
        this.drawOverdrawLine(ctx, this.connectionColor, cWidth, p1, p2, { seed: idx, segments: 6, jitter: 0.3, widthVariation: 0.2, opacityVariation: 0.15, passes: 2 });
      } else {
        this.drawHandLine(ctx, this.connectionColor, cWidth, p1, p2, { seed: idx, segments: 8, jitter: 0.25, widthVariation: 0.15, opacityVariation: 0.1, minAlpha: 0.8 });
      }
    });
  }

  renderStaticLines(ctx, staticLines, { transform3D, time, is3D }) {
    const lineZ = -5; // Slightly higher Z than main infrastructure
    const lineScale = transform3D.getScale(lineZ, time, is3D);
    
    this.setLineStyle(
      ctx,
      this.staticLineColor,
      (this.staticLineWidth + Math.sin(time * 0.008) * 0.2) * lineScale
    );
    
    staticLines.forEach((line, i) => {
      const p1 = transform3D.transform(line.x1, line.y1, lineZ, time, is3D);
      const p2 = transform3D.transform(line.x2, line.y2, lineZ, time, is3D);
      // Use straighter static lines with minimal jitter
      this.drawOverdrawLine(
        ctx,
        this.staticLineColor,
        this.staticLineWidth * lineScale * 0.6,
        p1,
        p2,
        { noise: null, seed: i, segments: 6, jitter: 0.3, scale: 1, widthVariation: 0.2, opacityVariation: 0.15, passes: 2 }
      );
    });
  }

  renderEndpointCircles(ctx, staticLines, { transform3D, time, is3D }) {
    const circleZ = 1; // Slightly higher than static lines
    const circleScale = transform3D.getScale(circleZ, time, is3D);
    
    this.setFillStyle(ctx, 'rgba(30, 80, 120, 0.9)');
    this.setLineStyle(ctx, 'rgba(30, 80, 120, 1.0)', 1.2 * circleScale);
    
    staticLines.forEach((line, li) => {
      // Draw varied shapes at each endpoint
      [{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }].forEach((point, pi) => {
        const pos = transform3D.transform(point.x, point.y, circleZ, time, is3D);
        const rBase = 8 * circleScale;
        
        // More varied shapes
        const shapeType = (li * 7 + pi * 3) % 8;
        
        switch (shapeType) {
          case 0: // Regular circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, rBase, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
            
          case 1: // Large circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, rBase * 1.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            break;
            
          case 2: // Hollow circle
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, rBase, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, rBase, 0, Math.PI * 2);
            ctx.stroke();
            break;
            
          case 3: // Incomplete arc
            const start = (li + pi) % (Math.PI * 2);
            const end = start + Math.PI * (0.6 + ((li + pi) % 2) * 0.4);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, rBase, start, end);
            ctx.stroke();
            break;
            
          case 4: // Square
            const size = rBase * 1.2;
            ctx.beginPath();
            ctx.rect(pos.x - size/2, pos.y - size/2, size, size);
            ctx.fill();
            ctx.stroke();
            break;
            
          case 5: // Diamond
            const diamondSize = rBase * 1.1;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - diamondSize);
            ctx.lineTo(pos.x + diamondSize, pos.y);
            ctx.lineTo(pos.x, pos.y + diamondSize);
            ctx.lineTo(pos.x - diamondSize, pos.y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
            
          case 6: // Triangle
            const triSize = rBase * 1.3;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - triSize);
            ctx.lineTo(pos.x + triSize * 0.866, pos.y + triSize * 0.5);
            ctx.lineTo(pos.x - triSize * 0.866, pos.y + triSize * 0.5);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            break;
            
          case 7: // Cross
            const crossSize = rBase * 0.8;
            ctx.beginPath();
            ctx.moveTo(pos.x - crossSize, pos.y);
            ctx.lineTo(pos.x + crossSize, pos.y);
            ctx.moveTo(pos.x, pos.y - crossSize);
            ctx.lineTo(pos.x, pos.y + crossSize);
            ctx.stroke();
            break;
        }
      });
    });
  }

  // Configuration methods
  setStructureColor(color) {
    this.structureColor = color;
  }

  setConnectionColor(color) {
    this.connectionColor = color;
  }

  setStaticLineColor(color) {
    this.staticLineColor = color;
  }

  setLineWidths(base, connection, staticLine) {
    this.baseLineWidth = base;
    this.connectionLineWidth = connection;
    this.staticLineWidth = staticLine;
  }
}
