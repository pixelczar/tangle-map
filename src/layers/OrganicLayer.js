/**
 * Organic Layer - Flowing boundaries using noise-driven curves
 * Represents the "murky, unknown" aspects of complex problems
 */

import { BaseLayer } from './BaseLayer.js';

export class OrganicLayer extends BaseLayer {
  constructor() {
    super('organic', 3);
    this.color = 'rgba(0, 150, 120, 0.1)'; // More prominent teal color
    this.lineWidth = 2.5; // Thicker lines
    // Scale adjustments for broader, more legible meanders
    this.noiseScale = 0.2;
    this.angleVariation = 10.0;
    this.stepSize = { min: 4, max: 10 };
    this.pointCount = { min: 20, max: 200 }; // Even larger organic flows
  }

  generateData(params) {
    const { clusters, random, width, height, padding, noise } = params;
    
    const data = {
      flows: [],
      terminalPoints: []
    };

    clusters.forEach(cluster => {
      const flowCount = Math.floor(cluster.intensity * 4);
      
      for (let i = 0; i < flowCount; i++) {
        const startAngle = random.randomAngle();
        const startDistance = random.random() * cluster.radius * 0.3;
        const startX = cluster.x + Math.cos(startAngle) * startDistance;
        const startY = cluster.y + Math.sin(startAngle) * startDistance;
        
        const flow = {
          startX, startY,
          clusterId: cluster.id,
          points: [],
          shouldClose: random.random() > 0.7,
          inBounds: this.isInBounds(startX, startY, width, height, padding)
        };

        // Generate flow path
        const points = this.pointCount.min + Math.floor(random.random() * (this.pointCount.max - this.pointCount.min));
        let x = startX;
        let y = startY;
        let prevAngle = random.randomAngle();
        
        flow.points.push({ x, y, isStart: true });
        
        for (let j = 0; j < points; j++) {
          // Use noise to determine direction change
          const noiseVal = noise(x * this.noiseScale, y * this.noiseScale, 1);
          const angleChange = (noiseVal - 0.5) * this.angleVariation;
          prevAngle += angleChange;
          
          // Move to next point
          const step = this.stepSize.min + random.random() * (this.stepSize.max - this.stepSize.min);
          x += Math.cos(prevAngle) * step;
          y += Math.sin(prevAngle) * step;
          
          // Keep within the canvas (allow flirting with padding but not off-canvas)
          x = Math.max(0, Math.min(width, x));
          y = Math.max(0, Math.min(height, y));
          
          // Check if we've moved too far from cluster
          const distFromCluster = Math.sqrt((x - cluster.x) ** 2 + (y - cluster.y) ** 2);
          if (distFromCluster > cluster.radius * 1.2) break;
          
          // Add control point for bezier curves
          const cp1x = x + (random.random() - 0.5) * 15;
          const cp1y = y + (random.random() - 0.5) * 15;
          
          flow.points.push({
            x, y,
            cp1x, cp1y,
            isBezier: true
          });
        }
        
        data.flows.push(flow);
        data.terminalPoints.push({ x, y });
      }
    });

    return data;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    this.setLineStyle(ctx, this.color, this.lineWidth);
    
    data.flows.forEach((flow, idx) => {
      if (!flow.inBounds || flow.points.length < 2) return;
      
      this.renderFlow(ctx, flow, { transform3D, time, is3D, index: idx });
    });
  }

  renderFlow(ctx, flow, { transform3D, time, is3D, index = 0 }) {
    const startPos = transform3D.transform(flow.startX, flow.startY, this.zIndex, time, is3D);
    
    // Render the flow path using many small hand-drawn segments with curvature wobble
    let prev = startPos;
    for (let i = 1; i < flow.points.length; i++) {
      const point = flow.points[i];
      // Add additional micro-curvature so lines feel more organic
      const wobble = Math.sin((i + index) * 0.9) * 1.2;
      const px = point.x + Math.cos(i * 0.7) * wobble;
      const py = point.y + Math.sin(i * 0.6) * wobble;
      const pointPos = transform3D.transform(px, py, this.zIndex, time, is3D);
      this.drawHandLine(
        ctx,
        this.color,
        this.lineWidth * (point.isBezier ? 0.95 : 0.85),
        prev,
        pointPos,
        { seed: index * 37 + i, segments: 6, jitter: 1.6, widthVariation: 0.6, opacityVariation: 0.5 }
      );
      prev = pointPos;
    }
    // Optionally close with a final sketchy stroke
    if (flow.shouldClose) {
      this.drawHandLine(ctx, this.color, this.lineWidth * 0.8, prev, startPos, { seed: index * 97 + 13, segments: 6, jitter: 1.6, widthVariation: 0.6, opacityVariation: 0.5 });
    }
  }

  // Helper method to create a more complex organic shape
  generateOrganicBoundary(centerX, centerY, radius, random, points = 8) {
    const boundary = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const radiusVariation = 0.4 + random.random() * 0.6;
      const noiseOffset = (random.random() - 0.5) * radius * 0.3;
      
      const x = centerX + Math.cos(angle) * (radius * radiusVariation + noiseOffset);
      const y = centerY + Math.sin(angle) * (radius * radiusVariation + noiseOffset);
      
      boundary.push({ x, y });
    }
    
    return boundary;
  }

  // Method to check if a point is inside any organic flow
  isPointInFlow(data, x, y, tolerance = 5) {
    return data.flows.some(flow => {
      return flow.points.some(point => {
        const distance = Math.sqrt((x - point.x) ** 2 + (y - point.y) ** 2);
        return distance <= tolerance;
      });
    });
  }

  // Configuration methods
  setColor(color) {
    this.color = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  setNoiseScale(scale) {
    this.noiseScale = scale;
  }

  setAngleVariation(variation) {
    this.angleVariation = variation;
  }

  setStepSize(min, max) {
    this.stepSize = { min, max };
  }

  setPointCount(min, max) {
    this.pointCount = { min, max };
  }

  // Get flow statistics
  getFlowStats(data) {
    return {
      totalFlows: data.flows.length,
      averagePoints: data.flows.reduce((sum, flow) => sum + flow.points.length, 0) / data.flows.length || 0,
      closedFlows: data.flows.filter(flow => flow.shouldClose).length,
      inBoundsFlows: data.flows.filter(flow => flow.inBounds).length
    };
  }
}
