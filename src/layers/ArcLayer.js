/**
 * Arc Layer - large, lightly indicated circular arcs and concentric hints
 * Evokes drafting/compass constructions without enclosing full perimeters
 */

import { BaseLayer } from './BaseLayer.js';

export class ArcLayer extends BaseLayer {
  constructor() {
    super('arcs', -7); // Changed from -8 to avoid conflict with TownPlotsLayer
    this.color = 'rgba(25, 70, 110, 0.5)'; // more noticeable
    this.lineWidth = 1.2; // slightly thicker
    this.arcCountRange = { min: 2, max: 4 }; // fewer overall
    this.radiusRange = { min: 80, max: 220 }; // slightly larger to feel airy
    this.spanRange = { min: Math.PI * 0.15, max: Math.PI * 0.65 };
    this.solidRatio = 0.5; // fewer solid
    this.circleProbability = 0.25; // fewer full outlines
    this.concentricProbability = 0.35; // fewer concentric
  }

  generateData(params) {
    const { clusters, random, gridData, gridSize } = params;
    const data = { arcs: [], arcGridFills: [] };

    // Create purposeful arc placements based on clusters and infrastructure
    const arcCenters = [];
    
    // Primary arc centers at cluster locations
    clusters.forEach(cluster => {
      const gridX = Math.round(cluster.x / gridSize) * gridSize;
      const gridY = Math.round(cluster.y / gridSize) * gridSize;
      arcCenters.push({ 
        x: gridX, 
        y: gridY, 
        type: 'cluster',
        clusterId: cluster.id,
        intensity: cluster.intensity
      });
    });
    
    // Secondary arc centers at strategic grid intersections
    if (gridData && gridData.vertical && gridData.horizontal) {
      const gridIntersections = [];
      gridData.vertical.forEach(vLine => {
        gridData.horizontal.forEach(hLine => {
          gridIntersections.push({ x: vLine.x, y: hLine.y });
        });
      });
      
      // Select strategic intersections (not too close to clusters)
      gridIntersections.forEach(intersection => {
        const tooCloseToCluster = clusters.some(cluster => {
          const distance = Math.hypot(intersection.x - cluster.x, intersection.y - cluster.y);
          return distance < 120; // Minimum distance from clusters
        });
        
        if (!tooCloseToCluster && random.random() < 0.3) {
          arcCenters.push({ 
            x: intersection.x, 
            y: intersection.y, 
            type: 'intersection',
            intensity: 0.5
          });
        }
      });
    }

    // Ensure we have at least one center to work with
    if (arcCenters.length === 0) {
      // Fallback: create a default center if no clusters or intersections available
      const fallbackX = params.width ? params.width / 2 : 400;
      const fallbackY = params.height ? params.height / 2 : 400;
      arcCenters.push({ 
        x: fallbackX, 
        y: fallbackY, 
        type: 'intersection',
        intensity: 0.5
      });
    }

    const arcCount = this.arcCountRange.min + Math.floor(random.random() * (this.arcCountRange.max - this.arcCountRange.min + 1));

    for (let i = 0; i < arcCount; i++) {
      const center = arcCenters[Math.floor(random.random() * arcCenters.length)];
      
      // Safety check: skip if center is undefined
      if (!center) continue;
      
      // Create purposeful arc types based on center type
      let arcs = [];
      
      if (center.type === 'cluster') {
        // Cluster-based arcs - create donut shapes
        arcs = this.generateClusterDonuts(center, clusters, random, gridSize);
      } else if (center.type === 'intersection') {
        // Intersection-based arcs - create smaller donuts
        arcs = this.generateIntersectionDonuts(center, random, gridSize);
      } else {
        // Fallback for any other type
        arcs = this.generateIntersectionDonuts(center, random, gridSize);
      }

      data.arcs.push(...arcs);
    }

    // Find arc intersections and add dots
    data.intersections = this.findArcIntersections(data.arcs, random);
    
    // Generate arc-grid intersection fills
    data.arcGridFills = this.generateArcGridFills(data.arcs, gridData, random);

    return data;
  }

  generateClusterDonuts(center, clusters, random, gridSize) {
    const arcs = [];
    const colors = [
      'rgba(25, 70, 110, 0.4)',   // Lighter blue
      'rgba(80, 40, 60, 0.3)',    // Lighter purple
      'rgba(40, 80, 40, 0.3)',    // Lighter green
    ];
    
    // Create concentric rings radiating from cluster center
    const numRings = 2 + Math.floor(random.random() * 3); // 2-4 rings
    
    for (let ring = 0; ring < numRings; ring++) {
      const baseRadius = (this.radiusRange.min + ring * 30) + random.random() * 20;
      const gridAlignedRadius = Math.round(baseRadius / gridSize) * gridSize;
      
      // Create concentric ring (no inner radius, just outline)
      const startAngle = random.random() * Math.PI * 2;
      const spanAngle = (Math.PI * 0.3) + random.random() * (Math.PI * 1.2); // 30-150 degrees (incomplete)
      
      arcs.push({
        cx: center.x,
        cy: center.y,
        r: gridAlignedRadius,
        innerRadius: 0, // No inner radius for rings
        start: startAngle,
        end: startAngle + spanAngle,
        color: colors[Math.floor(random.random() * colors.length)],
        shouldDrawCircle: false,
        type: 'ring'
      });
    }
    
    return arcs;
  }

  generateIntersectionDonuts(center, random, gridSize) {
    const arcs = [];
    const colors = [
      'rgba(25, 70, 110, 0.3)',   // Even lighter blue
      'rgba(80, 40, 60, 0.2)',    // Even lighter purple
      'rgba(40, 80, 40, 0.2)',    // Even lighter green
    ];
    
    // Create smaller incomplete rings at intersections (30% chance)
    if (random.random() < 0.3) {
      const baseRadius = (this.radiusRange.min * 0.6) + random.random() * (this.radiusRange.max * 0.4);
      const gridAlignedRadius = Math.round(baseRadius / gridSize) * gridSize;
      
      // Create incomplete ring
      const startAngle = random.random() * Math.PI * 2;
      const spanAngle = (Math.PI * 0.2) + random.random() * (Math.PI * 0.8); // 20-100 degrees (shorter)
      
      arcs.push({
        cx: center.x,
        cy: center.y,
        r: gridAlignedRadius,
        innerRadius: 0, // No inner radius
        start: startAngle,
        end: startAngle + spanAngle,
        color: colors[Math.floor(random.random() * colors.length)],
        shouldDrawCircle: false,
        type: 'ring'
      });
    }
    
    return arcs;
  }

  generateArcGridFills(arcs, gridData, random) {
    const fills = [];
    
    if (!gridData || !gridData.vertical || !gridData.horizontal) {
      return fills;
    }
    
    // For each arc, find intersections with grid lines and create fills
    arcs.forEach(arc => {
      // Find intersections with vertical grid lines
      gridData.vertical.forEach(vLine => {
        const intersections = this.findArcLineIntersections(arc, vLine.x, 'vertical');
        intersections.forEach(intersection => {
          if (random.random() < 0.4) { // 40% chance to fill
            fills.push({
              type: 'arc-grid-segment',
              arc: arc,
              gridLine: vLine,
              intersection: intersection,
              fillColor: this.getFillColor(arc, random)
            });
          }
        });
      });
      
      // Find intersections with horizontal grid lines
      gridData.horizontal.forEach(hLine => {
        const intersections = this.findArcLineIntersections(arc, hLine.y, 'horizontal');
        intersections.forEach(intersection => {
          if (random.random() < 0.4) { // 40% chance to fill
            fills.push({
              type: 'arc-grid-segment',
              arc: arc,
              gridLine: hLine,
              intersection: intersection,
              fillColor: this.getFillColor(arc, random)
            });
          }
        });
      });
    });
    
    return fills;
  }

  findArcLineIntersections(arc, linePos, direction) {
    const intersections = [];
    
    if (direction === 'vertical') {
      // Arc intersects vertical line at x = linePos
      const dx = linePos - arc.cx;
      if (Math.abs(dx) <= arc.r) {
        const dy = Math.sqrt(arc.r * arc.r - dx * dx);
        const y1 = arc.cy + dy;
        const y2 = arc.cy - dy;
        
        // Check if intersection points are on the arc segment
        const angle1 = Math.atan2(y1 - arc.cy, dx);
        const angle2 = Math.atan2(y2 - arc.cy, dx);
        
        if (this.isAngleOnArc(angle1, arc)) {
          intersections.push({ x: linePos, y: y1, angle: angle1 });
        }
        if (this.isAngleOnArc(angle2, arc)) {
          intersections.push({ x: linePos, y: y2, angle: angle2 });
        }
      }
    } else {
      // Arc intersects horizontal line at y = linePos
      const dy = linePos - arc.cy;
      if (Math.abs(dy) <= arc.r) {
        const dx = Math.sqrt(arc.r * arc.r - dy * dy);
        const x1 = arc.cx + dx;
        const x2 = arc.cx - dx;
        
        // Check if intersection points are on the arc segment
        const angle1 = Math.atan2(dy, x1 - arc.cx);
        const angle2 = Math.atan2(dy, x2 - arc.cx);
        
        if (this.isAngleOnArc(angle1, arc)) {
          intersections.push({ x: x1, y: linePos, angle: angle1 });
        }
        if (this.isAngleOnArc(angle2, arc)) {
          intersections.push({ x: x2, y: linePos, angle: angle2 });
        }
      }
    }
    
    return intersections;
  }

  isAngleOnArc(angle, arc) {
    // Normalize angles to 0-2π range
    let startAngle = arc.start;
    let endAngle = arc.end;
    
    if (startAngle < 0) startAngle += Math.PI * 2;
    if (endAngle < 0) endAngle += Math.PI * 2;
    if (angle < 0) angle += Math.PI * 2;
    
    // Handle wrap-around case
    if (startAngle > endAngle) {
      return angle >= startAngle || angle <= endAngle;
    } else {
      return angle >= startAngle && angle <= endAngle;
    }
  }

  getFillColor(arc, random) {
    const baseColor = arc.color || this.color;
    // Extract RGB values and create a lighter fill version
    const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      return `rgba(${r}, ${g}, ${b}, 0.15)`;
    }
    return 'rgba(25, 70, 110, 0.15)';
  }

  findArcIntersections(arcs, random) {
    const intersections = [];
    
    // Limit intersection checks for performance
    const maxChecks = Math.min(arcs.length, 8);
    
    for (let i = 0; i < maxChecks; i++) {
      for (let j = i + 1; j < maxChecks; j++) {
        const arcA = arcs[i];
        const arcB = arcs[j];
        
        // Quick distance check first
        const distance = Math.hypot(arcA.cx - arcB.cx, arcA.cy - arcB.cy);
        const radiusSum = arcA.r + arcB.r;
        
        if (distance < radiusSum && distance > 10) { // Minimum distance threshold
          // Simplified intersection - just add a dot at the midpoint
          const midX = (arcA.cx + arcB.cx) / 2;
          const midY = (arcA.cy + arcB.cy) / 2;
          
              intersections.push({
                x: midX,
                y: midY,
                size: 3 + random.random() * 3 // Bigger intersection dots
              });
        }
      }
    }
    
    return intersections;
  }

  findCircleIntersectionPoints(arcA, arcB) {
    const dx = arcB.cx - arcA.cx;
    const dy = arcB.cy - arcA.cy;
    const distance = Math.hypot(dx, dy);
    
    if (distance === 0) return [];
    
    const a = (arcA.r * arcA.r - arcB.r * arcB.r + distance * distance) / (2 * distance);
    const h = Math.sqrt(arcA.r * arcA.r - a * a);
    
    if (isNaN(h)) return [];
    
    const p2x = arcA.cx + (a * dx) / distance;
    const p2y = arcA.cy + (a * dy) / distance;
    
    const p3x1 = p2x + (h * dy) / distance;
    const p3y1 = p2y - (h * dx) / distance;
    const p3x2 = p2x - (h * dy) / distance;
    const p3y2 = p2y + (h * dx) / distance;
    
    return [
      { x: p3x1, y: p3y1 },
      { x: p3x2, y: p3y2 }
    ];
  }

  isPointOnArc(point, arc) {
    // Check if point is on the arc segment
    const dx = point.x - arc.cx;
    const dy = point.y - arc.cy;
    let angle = Math.atan2(dy, dx);
    
    // Normalize angles to 0-2π range
    let startAngle = arc.start;
    let endAngle = arc.end;
    
    if (startAngle < 0) startAngle += Math.PI * 2;
    if (endAngle < 0) endAngle += Math.PI * 2;
    if (angle < 0) angle += Math.PI * 2;
    
    // Handle wrap-around case
    if (startAngle > endAngle) {
      return angle >= startAngle || angle <= endAngle;
    } else {
      return angle >= startAngle && angle <= endAngle;
    }
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    const scale = transform3D.getScale(this.zIndex, time, is3D);

    // Render arc-grid fills first (background)
    if (data.arcGridFills) {
      this.renderArcGridFills(ctx, data.arcGridFills, { transform3D, time, is3D, scale });
    }

    // Render arcs as simple rings (no pie slices)
    data.arcs.forEach((arc, i) => {
      const center = transform3D.transform(arc.cx, arc.cy, this.zIndex, time, is3D);
      const arcColor = arc.color || this.color;
      
      // Render as simple arc/ring outline
      this.setLineStyle(ctx, arcColor, this.lineWidth * scale);
      ctx.beginPath();
      ctx.arc(center.x, center.y, arc.r * scale, arc.start, arc.end);
      ctx.stroke();
    });

    // Optional full circle outlines (reduced)
    data.arcs.forEach((arc, i) => {
      if (arc.shouldDrawCircle) return; // decision comes from data
      const center = transform3D.transform(arc.cx, arc.cy, this.zIndex, time, is3D);
      const arcColor = arc.color || this.color;
      if (i % 3 === 0 && Math.random() < 0.3) { // fewer outlines
        this.setLineStyle(ctx, arcColor, this.lineWidth * 0.7 * scale);
        ctx.beginPath();
        ctx.arc(center.x, center.y, arc.r * scale, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    // Draw intersection dots
    if (data.intersections) {
      ctx.fillStyle = this.color;
      data.intersections.forEach(intersection => {
        const pos = transform3D.transform(intersection.x, intersection.y, this.zIndex, time, is3D);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, intersection.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }


  renderArcGridFills(ctx, arcGridFills, { transform3D, time, is3D, scale }) {
    arcGridFills.forEach(fill => {
      const arc = fill.arc;
      const intersection = fill.intersection;
      
      // Transform arc center and intersection point
      const arcCenter = transform3D.transform(arc.cx, arc.cy, this.zIndex, time, is3D);
      const intersectionPoint = transform3D.transform(intersection.x, intersection.y, this.zIndex, time, is3D);
      
      // Create a filled segment between the arc and grid line
      ctx.save();
      ctx.fillStyle = fill.fillColor;
      
      // Create a path that fills the space between arc and grid line
      ctx.beginPath();
      ctx.moveTo(arcCenter.x, arcCenter.y);
      ctx.lineTo(intersectionPoint.x, intersectionPoint.y);
      
      // Add a small arc segment to create a filled area
      const arcRadius = arc.r * scale;
      const startAngle = intersection.angle - Math.PI * 0.1;
      const endAngle = intersection.angle + Math.PI * 0.1;
      
      ctx.arc(arcCenter.x, arcCenter.y, arcRadius, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();
      
      ctx.restore();
    });
  }
}


