/**
 * Core Layer - Large circles that mask underlying content
 * Represents focal points and major decision nodes in the system
 */

import { BaseLayer } from './BaseLayer.js';

export class CoreLayer extends BaseLayer {
  constructor() {
    super('cores', -100); // Very low Z-index to be at bottom
    this.fillColor = 'rgba(250, 248, 245, 0.6)'; // More visible
    this.strokeColor = 'rgba(60, 60, 60, 0.5)'; // More visible stroke
    this.lineWidth = 2; // Thicker lines
    this.radiusRange = { min: 40, max: 100 }; // Larger, more noticeable
    this.probability = 0.4; // More frequent
  }

  generateData(params) {
    const { staticLinesData, random, clusters } = params;
    
    const data = {
      cores: []
    };

    // Generate cores at static line endpoints
    if (staticLinesData && staticLinesData.length > 0) {
      staticLinesData.forEach(line => {
        // Check both endpoints
        [{ x: line.x1, y: line.y1 }, { x: line.x2, y: line.y2 }].forEach(point => {
          const shouldDrawCore = random.random() > (1 - this.probability);
          
          if (shouldDrawCore) {
            const radius = this.radiusRange.min + random.random() * (this.radiusRange.max - this.radiusRange.min);
            
            // Add exciting variety to cores
            const coreType = random.random();
            const core = this.createExcitingCore(point.x, point.y, radius, coreType, random);
            
            data.cores.push(core);
          }
        });
      });
    }

    // Fallback: Generate cores at cluster centers if no static lines
    if (data.cores.length === 0 && clusters && clusters.length > 0) {
      clusters.forEach(cluster => {
        const shouldDrawCore = random.random() > (1 - this.probability);
        
        if (shouldDrawCore) {
          const radius = this.radiusRange.min + random.random() * (this.radiusRange.max - this.radiusRange.min);
          
          // Add exciting variety to cores
          const coreType = random.random();
          const core = this.createExcitingCore(cluster.x, cluster.y, radius, coreType, random);
          
          data.cores.push(core);
        }
      });
    }

    return data;
  }

  createExcitingCore(x, y, radius, coreType, random) {
    const core = {
      x: x,
      y: y,
      radius: radius,
      originalRadius: radius
    };

    // Determine core type and add subtle exciting properties
    if (coreType < 0.3) {
      // 30% - Simple pulsing cores
      core.type = 'pulsing';
      core.pulseSpeed = 0.005 + random.random() * 0.01; // Slower, more subtle
      core.pulseAmplitude = 0.08 + random.random() * 0.05; // Smaller amplitude
      core.fillColor = 'rgba(250, 248, 245, 0.7)';
      core.strokeColor = 'rgba(60, 60, 60, 0.5)';
    } else if (coreType < 0.6) {
      // 30% - Simple concentric rings (toned down)
      core.type = 'concentric';
      core.ringCount = 1 + Math.floor(random.random() * 2); // 1-2 rings only
      core.ringSpacing = radius * (0.2 + random.random() * 0.1);
      core.fillColor = 'rgba(250, 248, 245, 0.6)';
      core.strokeColor = 'rgba(60, 60, 60, 0.4)';
    } else if (coreType < 0.8) {
      // 20% - Subtle radial lines (toned down)
      core.type = 'radial';
      core.lineCount = 4 + Math.floor(random.random() * 3); // 4-6 lines only
      core.lineLength = radius * (0.4 + random.random() * 0.2); // Shorter lines
      core.fillColor = 'rgba(250, 248, 245, 0.6)';
      core.strokeColor = 'rgba(60, 60, 60, 0.4)';
    } else {
      // 20% - Simple dotted pattern (toned down)
      core.type = 'dotted';
      core.dotCount = 4 + Math.floor(random.random() * 4); // 4-7 dots only
      core.dotSize = radius * (0.03 + random.random() * 0.05); // Smaller dots
      core.fillColor = 'rgba(250, 248, 245, 0.4)';
      core.strokeColor = 'rgba(60, 60, 60, 0.5)';
    }

    return core;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    data.cores.forEach(core => {
      this.renderCore(ctx, core, { transform3D, time, is3D });
    });
  }

  renderCore(ctx, core, { transform3D, time, is3D }) {
    const pos = transform3D.transform(core.x, core.y, this.zIndex, time, is3D);
    const scale = transform3D.getScale(this.zIndex, time, is3D);
    
    // Calculate current radius (with pulsing if applicable)
    let currentRadius = core.radius;
    if (core.type === 'pulsing') {
      const pulseAmount = Math.sin(time * core.pulseSpeed) * core.originalRadius * core.pulseAmplitude;
      currentRadius = core.originalRadius + pulseAmount;
    }
    const scaledRadius = currentRadius * scale;
    
    // First, mask out the underlying content using destination-out
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    
    // Then draw the core background
    const fillColor = core.fillColor || this.fillColor;
    this.setFillStyle(ctx, fillColor);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw the exciting pattern based on core type
    const strokeColor = core.strokeColor || this.strokeColor;
    this.setLineStyle(ctx, strokeColor, this.lineWidth * scale);
    
    switch (core.type) {
      case 'concentric':
        this.renderConcentricPattern(ctx, pos, scaledRadius, core);
        break;
      case 'radial':
        this.renderRadialPattern(ctx, pos, scaledRadius, core);
        break;
      case 'dotted':
        this.renderDottedPattern(ctx, pos, scaledRadius, core);
        break;
      default:
        // Default outline for pulsing and other types
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
        ctx.stroke();
        break;
    }
  }

  renderConcentricPattern(ctx, pos, radius, core) {
    // Draw concentric rings
    for (let i = 1; i <= core.ringCount; i++) {
      const ringRadius = radius * (i / core.ringCount);
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }


  renderRadialPattern(ctx, pos, radius, core) {
    // Draw radial lines
    for (let i = 0; i < core.lineCount; i++) {
      const angle = (i / core.lineCount) * Math.PI * 2;
      const endX = pos.x + Math.cos(angle) * core.lineLength;
      const endY = pos.y + Math.sin(angle) * core.lineLength;
      
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  renderDottedPattern(ctx, pos, radius, core) {
    // Draw dotted pattern
    for (let i = 0; i < core.dotCount; i++) {
      const angle = (i / core.dotCount) * Math.PI * 2;
      const dotRadius = radius * (0.3 + Math.random() * 0.4); // Random distance from center
      const dotX = pos.x + Math.cos(angle) * dotRadius;
      const dotY = pos.y + Math.sin(angle) * dotRadius;
      
      ctx.beginPath();
      ctx.arc(dotX, dotY, core.dotSize, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Draw outer circle
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Alternative rendering method that doesn't use masking
  renderSimple(ctx, core, { transform3D, time, is3D }) {
    const pos = transform3D.transform(core.x, core.y, this.zIndex, time, is3D);
    const scale = transform3D.getScale(this.zIndex, time, is3D);
    const scaledRadius = core.radius * scale;
    
    // Draw filled circle
    this.setFillStyle(ctx, this.fillColor);
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, scaledRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw outline
    this.setLineStyle(ctx, this.strokeColor, this.lineWidth * scale);
    ctx.stroke();
  }

  // Method to add a core at a specific position (for interactivity)
  addCore(data, x, y, random) {
    const radius = this.radiusRange.min + random.random() * (this.radiusRange.max - this.radiusRange.min);
    
    const core = {
      x: x,
      y: y,
      radius: radius,
      originalRadius: radius
    };
    
    data.cores.push(core);
    return core;
  }

  // Method to remove core closest to a point
  removeClosestCore(data, x, y, maxDistance = 50) {
    let closestIndex = -1;
    let minDistance = Infinity;
    
    data.cores.forEach((core, index) => {
      const distance = Math.sqrt((x - core.x) ** 2 + (y - core.y) ** 2);
      if (distance < minDistance && distance <= maxDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    if (closestIndex >= 0) {
      return data.cores.splice(closestIndex, 1)[0];
    }
    
    return null;
  }

  // Method to find core at position
  findCoreAtPosition(data, x, y) {
    return data.cores.find(core => {
      const distance = Math.sqrt((x - core.x) ** 2 + (y - core.y) ** 2);
      return distance <= core.radius;
    });
  }

  // Method to animate core size
  animateCore(core, targetRadius, speed = 0.1) {
    const diff = targetRadius - core.radius;
    core.radius += diff * speed;
    return Math.abs(diff) < 0.1; // Returns true when animation is complete
  }

  // Method to create cores with different styles
  createStyledCore(x, y, style = 'default', random) {
    const baseRadius = this.radiusRange.min + random.random() * (this.radiusRange.max - this.radiusRange.min);
    
    const core = {
      x: x,
      y: y,
      radius: baseRadius,
      originalRadius: baseRadius,
      style: style
    };
    
    // Modify properties based on style
    switch (style) {
      case 'large':
        core.radius *= 1.5;
        core.originalRadius *= 1.5;
        break;
      
      case 'small':
        core.radius *= 0.6;
        core.originalRadius *= 0.6;
        break;
      
      case 'pulsing':
        core.pulsing = true;
        core.pulseSpeed = 0.02 + random.random() * 0.02;
        break;
      
      default:
        break;
    }
    
    return core;
  }

  // Update method for animated cores
  updateCores(data, time) {
    data.cores.forEach(core => {
      if (core.pulsing) {
        const pulseAmount = Math.sin(time * core.pulseSpeed) * core.originalRadius * 0.2;
        core.radius = core.originalRadius + pulseAmount;
      }
    });
  }

  // Configuration methods
  setFillColor(color) {
    this.fillColor = color;
  }

  setStrokeColor(color) {
    this.strokeColor = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  setRadiusRange(min, max) {
    this.radiusRange = { min, max };
  }

  setProbability(probability) {
    this.probability = Math.max(0, Math.min(1, probability));
  }

  // Get core statistics
  getCoreStats(data) {
    return {
      totalCores: data.cores.length,
      averageRadius: data.cores.reduce((sum, core) => sum + core.radius, 0) / data.cores.length || 0,
      totalArea: data.cores.reduce((sum, core) => sum + (Math.PI * core.radius * core.radius), 0),
      styleDistribution: data.cores.reduce((acc, core) => {
        const style = core.style || 'default';
        acc[style] = (acc[style] || 0) + 1;
        return acc;
      }, {})
    };
  }
}
