/**
 * Shading Layer - Textured areas with stippling, cross-hatching, and flowing lines
 * Adds visual weight and texture to composition areas
 */

import { BaseLayer } from './BaseLayer.js';

export class ShadingLayer extends BaseLayer {
  constructor() {
    super('shading', 5);
    this.boundaryColor = 'rgba(60, 100, 120, 0.4)'; // Less dark, more subtle boundary
    this.fillColor = 'rgba(100, 140, 120, 0.2)'; // More visible fill
    this.patternColors = {
      stipple: 'rgba(60, 100, 80, 0.6)', // More prominent patterns
      crosshatch: 'rgba(60, 100, 120, 0.5)',
      flow: 'rgba(80, 120, 140, 0.5)'
    };
    this.boundaryLineWidth = 0.8; // Thinner, less robotic boundaries
    this.patternLineWidth = 0.8; // Thicker pattern lines
    this.patterns = ['stipple', 'crosshatch', 'flow'];
  }

  generateData(params) {
    const { clusters, random, width, height, padding, noise, gridData, gridSize } = params;
    
    const data = {
      shadingAreas: []
    };

    // Use grid intersection points as potential shading centers
    const shadingCenters = [];
    
    if (gridData && gridData.vertical && gridData.horizontal) {
      // Add grid intersection points
      gridData.vertical.forEach(vLine => {
        gridData.horizontal.forEach(hLine => {
          shadingCenters.push({ x: vLine.x, y: hLine.y });
        });
      });
    }
    
    // Also add cluster centers aligned to grid
    clusters.forEach(cluster => {
      const gridX = Math.round(cluster.x / gridSize) * gridSize;
      const gridY = Math.round(cluster.y / gridSize) * gridSize;
      shadingCenters.push({ x: gridX, y: gridY });
    });

        // Create shading areas at grid points - show more often
        const shadingCount = Math.min(shadingCenters.length, 8 + Math.floor(random.random() * 6)); // 8-13 areas (more frequent)
    
    for (let i = 0; i < shadingCount; i++) {
      const center = shadingCenters[Math.floor(random.random() * shadingCenters.length)];
      const centerX = center.x;
      const centerY = center.y;
          const size = (200 + random.random() * 150); // More consistent size range (200-350)
        
        const shadingArea = {
          centerX, centerY, size,
          clusterId: i,
          clusterIndex: i,
          intensity: 0.8 + random.random() * 0.2,
          patternType: this.patterns[i % this.patterns.length],
          zOffset: i * 2, // Stagger Z positions
          inBounds: this.isInBounds(centerX - size, centerY - size, width, height, padding) &&
                   this.isInBounds(centerX + size, centerY + size, width, height, padding),
          boundary: this.generateBoundary(centerX, centerY, size, random, noise)
        };
        
        // Generate pattern-specific data
        shadingArea.patternData = this.generatePatternData(shadingArea, random, noise);
        
        data.shadingAreas.push(shadingArea);
    }

    return data;
  }

  generateBoundary(centerX, centerY, size, random, noise) {
    const numPoints = 10 + Math.floor(random.random() * 6); // 10-15 points for more organic shape
    const boundary = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const baseRadius = size * 0.5; // Slightly smaller base radius
      
      // Add multiple layers of organic variation
      const noise1 = noise(centerX * 0.008, centerY * 0.008, i * 0.1) * 30;
      const noise2 = noise(centerX * 0.02, centerY * 0.02, i * 0.3) * 15;
      const randomVariation = (random.random() - 0.5) * 20;
      
      const radius = baseRadius + noise1 + noise2 + randomVariation;
      
      // Add slight angle variation for more organic feel
      const angleVariation = (random.random() - 0.5) * 0.1;
      const finalAngle = angle + angleVariation;
      
      boundary.push({
        x: centerX + Math.cos(finalAngle) * radius,
        y: centerY + Math.sin(finalAngle) * radius
      });
    }
    
    return boundary;
  }

  generatePatternData(area, random, noise) {
    const { centerX, centerY, size, patternType, intensity } = area;
    
    switch (patternType) {
      case 'stipple':
        return this.generateStippleData(centerX, centerY, size, intensity, random);
      
      case 'crosshatch':
        return this.generateCrosshatchData(centerX, centerY, size, intensity, random);
      
      case 'flow':
        return this.generateFlowLinesData(centerX, centerY, size, intensity, random, noise);
      
      default:
        return this.generateStippleData(centerX, centerY, size, intensity, random);
    }
  }

  generateStippleData(centerX, centerY, size, intensity, random) {
    const dots = [];
    const dotCount = Math.floor(size * intensity * 0.5); // Reduced density
    
    for (let i = 0; i < dotCount; i++) {
      const px = centerX + (random.random() - 0.5) * size * 1.2;
      const py = centerY + (random.random() - 0.5) * size * 1.2;
      const distFromCenter = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
      
      if (distFromCenter < size * 0.7) {
        dots.push({
          x: px,
          y: py,
          radius: 0.5 + random.random() * 0.5 // Simplified radius range
        });
      }
    }
    
    return { dots };
  }

  generateCrosshatchData(centerX, centerY, size, intensity, random) {
    const lines = [];
    const spacing = 6; // Increased spacing for better performance
    
    for (let x = centerX - size; x < centerX + size; x += spacing) {
      for (let y = centerY - size; y < centerY + size; y += spacing) {
        const distFromCenter = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
        
        if (distFromCenter < size * 0.6 && random.random() > 0.6) { // Reduced probability
          const lineLength = 3 + random.random() * 2; // Simplified length
          const angle = (random.random() > 0.5 ? 0 : Math.PI / 2);
          
          lines.push({
            startX: x,
            startY: y,
            endX: x + Math.cos(angle) * lineLength,
            endY: y + Math.sin(angle) * lineLength
          });
        }
      }
    }
    
    return { lines };
  }

  generateFlowLinesData(centerX, centerY, size, intensity, random, noise) {
    const flows = [];
    const flowCount = Math.floor(size * intensity * 0.3);
    
    for (let i = 0; i < flowCount; i++) {
      const startX = centerX + (random.random() - 0.5) * size * 0.8;
      const startY = centerY + (random.random() - 0.5) * size * 0.8;
      
      const flow = {
        points: [{ x: startX, y: startY }]
      };
      
      let fx = startX;
      let fy = startY;
      
      for (let j = 0; j < 8; j++) {
        const flowAngle = noise(fx * 0.02, fy * 0.02, i) * Math.PI * 2;
        fx += Math.cos(flowAngle) * 2;
        fy += Math.sin(flowAngle) * 2;
        
        const distFromCenter = Math.sqrt((fx - centerX) ** 2 + (fy - centerY) ** 2);
        if (distFromCenter > size * 0.7) break;
        
        flow.points.push({ x: fx, y: fy });
      }
      
      flows.push(flow);
    }
    
    return { flows };
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    // Always render shading areas without clipping for now
    data.shadingAreas.forEach(area => {
      if (!area.inBounds) return;
      
      const currentZ = this.zIndex + area.zOffset;
      this.renderShadingArea(ctx, area, { transform3D, time, is3D, currentZ });
    });
  }

  renderShadingArea(ctx, area, { transform3D, time, is3D, currentZ }) {
    // Render boundary
    this.renderBoundary(ctx, area, { transform3D, time, is3D, currentZ });
    
    // Render pattern
    this.renderPattern(ctx, area, { transform3D, time, is3D, currentZ });
  }

  renderBoundary(ctx, area, { transform3D, time, is3D, currentZ }) {
    if (area.boundary.length === 0) return;
    
    // Use hand-drawn style for more organic boundaries
    for (let i = 0; i < area.boundary.length; i++) {
      const curr = transform3D.transform(area.boundary[i].x, area.boundary[i].y, currentZ, time, is3D);
      const next = transform3D.transform(
        area.boundary[(i + 1) % area.boundary.length].x, 
        area.boundary[(i + 1) % area.boundary.length].y, 
        currentZ, time, is3D
      );
      
      // Draw each boundary segment with hand-drawn style
      this.drawHandLine(
        ctx,
        this.boundaryColor,
        this.boundaryLineWidth,
        curr,
        next,
        { 
          seed: area.clusterIndex * 17 + i, 
          segments: 6, 
          jitter: 0.3, 
          widthVariation: 0.2, 
          opacityVariation: 0.15 
        }
      );
    }
  }

  renderPattern(ctx, area, { transform3D, time, is3D, currentZ }) {
    const patternColor = this.patternColors[area.patternType] || this.patternColors.stipple;
    
    switch (area.patternType) {
      case 'stipple':
        this.renderStipple(ctx, area, patternColor, { transform3D, time, is3D, currentZ });
        break;
      
      case 'crosshatch':
        this.renderCrosshatch(ctx, area, patternColor, { transform3D, time, is3D, currentZ });
        break;
      
      case 'flow':
        this.renderFlowLines(ctx, area, patternColor, { transform3D, time, is3D, currentZ });
        break;
    }
  }

  renderStipple(ctx, area, color, { transform3D, time, is3D, currentZ }) {
    // Fill background
    this.setFillStyle(ctx, this.fillColor);
    this.renderBoundaryFill(ctx, area, { transform3D, time, is3D, currentZ });
    
    // Draw dots
    this.setFillStyle(ctx, color);
    
    area.patternData.dots.forEach(dot => {
      const pos = transform3D.transform(dot.x, dot.y, currentZ, time, is3D);
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dot.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderCrosshatch(ctx, area, color, { transform3D, time, is3D, currentZ }) {
    this.setLineStyle(ctx, color, this.patternLineWidth);
    
    // Draw property-plot like segmented strokes with slight offsets
    area.patternData.lines.forEach((line, idx) => {
      const startPos = transform3D.transform(line.startX, line.startY, currentZ, time, is3D);
      const endPos = transform3D.transform(line.endX, line.endY, currentZ, time, is3D);
      this.drawHandLine(ctx, color, this.patternLineWidth, startPos, endPos, { seed: idx, segments: 4, jitter: 0.4, widthVariation: 0.2, opacityVariation: 0.2, minAlpha: 0.7 });
    });
  }

  renderFlowLines(ctx, area, color, { transform3D, time, is3D, currentZ }) {
    this.setLineStyle(ctx, color, this.patternLineWidth * 1.5);
    
    area.patternData.flows.forEach(flow => {
      if (flow.points.length < 2) return;
      
      ctx.beginPath();
      const firstPos = transform3D.transform(flow.points[0].x, flow.points[0].y, currentZ, time, is3D);
      ctx.moveTo(firstPos.x, firstPos.y);
      
      for (let i = 1; i < flow.points.length; i++) {
        const pos = transform3D.transform(flow.points[i].x, flow.points[i].y, currentZ, time, is3D);
        ctx.lineTo(pos.x, pos.y);
      }
      
      ctx.stroke();
    });
  }

  renderBoundaryFill(ctx, area, { transform3D, time, is3D, currentZ }) {
    if (area.boundary.length === 0) return;
    
    ctx.beginPath();
    const firstPoint = transform3D.transform(area.boundary[0].x, area.boundary[0].y, currentZ, time, is3D);
    ctx.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < area.boundary.length; i++) {
      const point = transform3D.transform(area.boundary[i].x, area.boundary[i].y, currentZ, time, is3D);
      ctx.lineTo(point.x, point.y);
    }
    
    ctx.closePath();
    ctx.fill();
  }

  // Configuration methods
  setBoundaryColor(color) {
    this.boundaryColor = color;
  }

  setFillColor(color) {
    this.fillColor = color;
  }

  setPatternColor(patternType, color) {
    if (this.patternColors[patternType]) {
      this.patternColors[patternType] = color;
    }
  }

  setLineWidths(boundary, pattern) {
    this.boundaryLineWidth = boundary;
    this.patternLineWidth = pattern;
  }

  // Get shading statistics
  getShadingStats(data) {
    const stats = {
      totalAreas: data.shadingAreas.length,
      patternCounts: { stipple: 0, crosshatch: 0, flow: 0 },
      averageSize: 0,
      inBoundsAreas: 0
    };
    
    data.shadingAreas.forEach(area => {
      stats.patternCounts[area.patternType]++;
      stats.averageSize += area.size;
      if (area.inBounds) stats.inBoundsAreas++;
    });
    
    stats.averageSize = stats.averageSize / data.shadingAreas.length || 0;
    
    return stats;
  }
}
