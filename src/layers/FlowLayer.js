/**
 * Flow Layer - River network with gentle meanders and tributaries
 * Generates primary rivers and calmer secondary tributaries that read as waterways
 */

import { BaseLayer } from './BaseLayer.js';

export class FlowLayer extends BaseLayer {
  constructor() {
    super('flow', 3);
    this.color = 'rgba(80, 140, 222, 0.4)';
    this.lineWidth = 1.0;
    
    // River meander parameters (low-frequency, gentle)
    this.noiseScale = 0.0025; // lower frequency = wider, calmer bends
    this.stepSize = 12; // smaller steps for smoother paths
    this.primaryWidth = 4.2;
    this.secondaryWidth = 1.2;
    
    // Soft junction semantics (kept for compatibility, not rendered specially)
    this.intersectionRadius = 20;
    this.interestPointRadius = 10;
    this.interestPointDensity = 0.9;
    
    // Counts and curvature
    this.primaryRoadCount = { min: 1, max: 1 }; // Fewer primary rivers
    this.secondaryRoadCount = { min: 1, max: 3 }; // More secondary rivers
    this.roadCurviness = 0.35; // meander strength (0-1)
    this.roadLength = { min: 180, max: 360 };
  }

  generateData(params) {
    const { clusters, random, width, height, padding, noise } = params;
    
    console.log('FlowLayer: Generating data with', clusters.length, 'clusters');
    
    const data = {
      roads: [],
      intersections: [],
      interestPoints: []
    };

    // Generate primary rivers that can flow to edges or connect clusters
    const roadCount = this.primaryRoadCount.min + Math.floor(random.random() * (this.primaryRoadCount.max - this.primaryRoadCount.min + 1));
    
    for (let i = 0; i < roadCount; i++) {
      // 60% chance to connect clusters, 40% chance to flow to edges
      if (random.random() < 0.6 && clusters.length >= 2) {
        // Pick two clusters to connect
        const clusterA = clusters[Math.floor(random.random() * clusters.length)];
        const clusterB = clusters[Math.floor(random.random() * clusters.length)];
        if (clusterA === clusterB) continue;
        
        // Create a river-like path between them
        const road = this.createRiverRoad(clusterA, clusterB, random, noise, width, height, 'primary', padding);
        if (road.points.length > 5) {
          data.roads.push(road);
        }
      } else {
        // Create a river that flows to canvas edges
        const startCluster = clusters[Math.floor(random.random() * clusters.length)];
        const edgeTarget = this.generateEdgeTarget(random, width, height, padding);
        const road = this.createRiverRoad(startCluster, edgeTarget, random, noise, width, height, 'primary', padding);
        if (road.points.length > 5) {
          data.roads.push(road);
        }
      }
    }

    // Generate secondary tributaries that branch organically
    const secondaryRoadCount = this.secondaryRoadCount.min + Math.floor(random.random() * (this.secondaryRoadCount.max - this.secondaryRoadCount.min + 1));
    
    for (let i = 0; i < secondaryRoadCount; i++) {
      if (data.roads.length === 0) break;
      
      // Pick a random river to branch from
      const parentRoad = data.roads[Math.floor(random.random() * data.roads.length)];
      const branchIndex = Math.floor(random.random() * (parentRoad.points.length - 2)) + 1; // Avoid endpoints
      const branchPoint = parentRoad.points[branchIndex];
      
      // 50% chance to flow to edge, 50% to cluster
      let target;
      if (random.random() < 0.5) {
        target = this.generateEdgeTarget(random, width, height, padding);
      } else {
        target = clusters[Math.floor(random.random() * clusters.length)];
      }
      
      const road = this.createRiverRoad(branchPoint, target, random, noise, width, height, 'secondary', padding);
      if (road.points.length > 5) {
        data.roads.push(road);
      }
    }

    // Find intersections between roads (but don't create special shapes)
    data.intersections = this.findIntersections(data.roads, random);

    return data;
  }

  generateEdgeTarget(random, width, height, padding) {
    // Generate a target point on one of the canvas edges
    const edge = Math.floor(random.random() * 4); // 0=top, 1=right, 2=bottom, 3=left
    
    switch (edge) {
      case 0: // Top edge
        return { x: padding + random.random() * (width - 2 * padding), y: padding };
      case 1: // Right edge
        return { x: width - padding, y: padding + random.random() * (height - 2 * padding) };
      case 2: // Bottom edge
        return { x: padding + random.random() * (width - 2 * padding), y: height - padding };
      case 3: // Left edge
        return { x: padding, y: padding + random.random() * (height - 2 * padding) };
      default:
        return { x: padding, y: padding };
    }
  }

  createRiverRoad(start, end, random, noise, width, height, type, padding) {
    const points = [];
    
    // Helper to keep within view with padding from edges
    const flowPadding = padding + 40; // Use system padding + extra 40px for flow lines
    const inBounds = (px, py) => px >= flowPadding && px <= width - flowPadding && py >= flowPadding && py <= height - flowPadding;
    
    // Create a series of connected circular arcs - NO straight segments possible
    let currentX = start.x;
    let currentY = start.y;
    let currentAngle = random.random() * Math.PI * 2;
    
    points.push({ x: currentX, y: currentY });
    
    const maxArcs = 20; // Maximum number of arcs
    
    for (let arcIndex = 0; arcIndex < maxArcs; arcIndex++) {
      // Calculate distance to target
      const distToTarget = Math.hypot(end.x - currentX, end.y - currentY);
      if (distToTarget < 30) break; // Close enough to target
      
      // Generate arc parameters - less loopy
      const radius = 80 + random.random() * 120; // Arc radius between 80-200px (larger = less loopy)
      const arcAngle = (Math.PI / 4) + random.random() * (Math.PI / 3); // 45-105 degrees (smaller = less loopy)
      const turnDirection = random.random() < 0.5 ? 1 : -1; // Left or right turn
      
      // Calculate arc center
      const centerAngle = currentAngle + (turnDirection * Math.PI / 2);
      const centerX = currentX + Math.cos(centerAngle) * radius;
      const centerY = currentY + Math.sin(centerAngle) * radius;
      
      // Generate points along the arc
      const numArcPoints = Math.ceil(arcAngle * radius / 8); // Points every 8px along arc
      const startAngle = currentAngle - (turnDirection * Math.PI / 2);
      
      for (let i = 1; i <= numArcPoints; i++) {
        const t = i / numArcPoints;
        const angle = startAngle + (turnDirection * arcAngle * t);
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        if (!inBounds(x, y)) break;
        
        points.push({ x, y });
        currentX = x;
        currentY = y;
        currentAngle = angle + (turnDirection * Math.PI / 2);
      }
      
      // Add some noise to the angle for next arc
      currentAngle += (random.random() - 0.5) * 0.5;
    }
    
    // Don't add straight line to target - let it end naturally at the last arc point
    
    const smoothed = this.smoothPolyline(points, 1); // Less smoothing for more natural curves
    
    return {
      points: smoothed,
      width: type === 'primary' ? this.primaryWidth : this.secondaryWidth,
      type
    };
  }

  // Chaikin-like smoothing for calmer curves
  smoothPolyline(points, iterations = 1) {
    let pts = points;
    for (let k = 0; k < iterations; k++) {
      const result = [];
      if (pts.length <= 2) return pts;
      result.push(pts[0]);
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const q = { x: p0.x * 0.75 + p1.x * 0.25, y: p0.y * 0.75 + p1.y * 0.25 };
        const r = { x: p0.x * 0.25 + p1.x * 0.75, y: p0.y * 0.25 + p1.y * 0.75 };
        result.push(q, r);
      }
      result.push(pts[pts.length - 1]);
      pts = result;
    }
    return pts;
  }


  findIntersections(roads, random) {
    const intersections = [];
    
    for (let i = 0; i < roads.length; i++) {
      for (let j = i + 1; j < roads.length; j++) {
        const roadA = roads[i];
        const roadB = roads[j];
        
        // Check for intersections between road segments
        for (let a = 0; a < roadA.points.length - 1; a++) {
          for (let b = 0; b < roadB.points.length - 1; b++) {
            const intersection = this.findLineIntersection(
              roadA.points[a], roadA.points[a + 1],
              roadB.points[b], roadB.points[b + 1]
            );
            
            if (intersection && this.isValidIntersection(intersection, intersections)) {
              intersections.push({
                x: intersection.x,
                y: intersection.y,
                roads: [roadA, roadB],
                segments: [{ road: i, segment: a }, { road: j, segment: b }]
              });
            }
          }
        }
      }
    }
    
    return intersections;
  }

  findLineIntersection(p1, p2, p3, p4) {
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const x3 = p3.x, y3 = p3.y;
    const x4 = p4.x, y4 = p4.y;
    
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (Math.abs(denom) < 0.001) return null; // Lines are parallel
    
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    
    if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
      return {
        x: x1 + t * (x2 - x1),
        y: y1 + t * (y2 - y1)
      };
    }
    
    return null;
  }

  isValidIntersection(intersection, existingIntersections) {
    // Check if this intersection is too close to existing ones
    for (const existing of existingIntersections) {
      const distance = Math.hypot(intersection.x - existing.x, intersection.y - existing.y);
      if (distance < this.intersectionRadius) {
        return false;
      }
    }
    return true;
  }

  getInterestPointType(random) {
    const types = ['building', 'landmark', 'junction', 'settlement'];
    return types[Math.floor(random.random() * types.length)];
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    // Draw roads with natural, smooth river appearance
    data.roads.forEach((road, rIdx) => {
      // Set base width for river type
      const baseWidth = road.type === 'primary' ? this.primaryWidth * 1.2 : this.secondaryWidth;
      
      // Draw the entire road as one smooth, natural curve
      if (road.points.length > 2) {
        ctx.beginPath();
        
        // Start with the first point
        const first = transform3D.transform(road.points[0].x, road.points[0].y, this.zIndex, time, is3D);
        ctx.moveTo(first.x, first.y);
        
        // Use smooth quadratic curves for natural river flow
        for (let i = 1; i < road.points.length - 1; i++) {
          const current = transform3D.transform(road.points[i].x, road.points[i].y, this.zIndex, time, is3D);
          const next = transform3D.transform(road.points[i + 1].x, road.points[i + 1].y, this.zIndex, time, is3D);
          
          // Calculate smooth control point for natural curves
          const controlX = current.x;
          const controlY = current.y;
          const endX = (current.x + next.x) / 2;
          const endY = (current.y + next.y) / 2;
          
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        }
        
        // Finish the path to the last point
        const last = transform3D.transform(
          road.points[road.points.length - 1].x, 
          road.points[road.points.length - 1].y, 
          this.zIndex, time, is3D
        );
        ctx.lineTo(last.x, last.y);
        
        // Set style and draw
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      } else if (road.points.length === 2) {
        // Simple line for very short roads
        const p1 = transform3D.transform(road.points[0].x, road.points[0].y, this.zIndex, time, is3D);
        const p2 = transform3D.transform(road.points[1].x, road.points[1].y, this.zIndex, time, is3D);
        
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = baseWidth;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    });

    // No special shapes at intersections - just let roads cross naturally
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

  setStepSize(size) {
    this.stepSize = size;
  }

  setPrimaryWidth(width) {
    this.primaryWidth = width;
  }

  setSecondaryWidth(width) {
    this.secondaryWidth = width;
  }

  setRoadCurviness(curviness) {
    this.roadCurviness = curviness;
  }

  setInterestPointDensity(density) {
    this.interestPointDensity = density;
  }

  // Get road network statistics
  getRoadStats(data) {
    return {
      totalRoads: data.roads.length,
      primaryRoads: data.roads.filter(r => r.type === 'primary').length,
      secondaryRoads: data.roads.filter(r => r.type === 'secondary').length,
      intersections: data.intersections.length,
      interestPoints: data.interestPoints.length
    };
  }
}
