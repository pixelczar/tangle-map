/**
 * Flow Layer - River network with gentle meanders and tributaries
 * Generates primary rivers and calmer secondary tributaries that read as waterways
 */

import { BaseLayer } from './BaseLayer.js';

export class FlowLayer extends BaseLayer {
  constructor() {
    super('flow', 3);
    this.color = 'rgba(22, 96, 108, 0.55)';
    this.lineWidth = 1.0;
    
    // River meander parameters (low-frequency, gentle)
    this.noiseScale = 0.0025; // lower frequency = wider, calmer bends
    this.stepSize = 12; // smaller steps for smoother paths
    this.primaryWidth = 2.6;
    this.secondaryWidth = 1.6;
    
    // Soft junction semantics (kept for compatibility, not rendered specially)
    this.intersectionRadius = 25;
    this.interestPointRadius = 12;
    this.interestPointDensity = 0.4;
    
    // Counts and curvature
    this.primaryRoadCount = { min: 1, max: 2 };
    this.secondaryRoadCount = { min: 1, max: 3 };
    this.roadCurviness = 0.35; // meander strength (0-1)
    this.roadLength = { min: 180, max: 360 };
  }

  generateData(params) {
    const { clusters, random, width, height, padding, noise } = params;
    
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
        const road = this.createRiverRoad(clusterA, clusterB, random, noise, width, height, 'primary');
        if (road.points.length > 5) {
          data.roads.push(road);
        }
      } else {
        // Create a river that flows to canvas edges
        const startCluster = clusters[Math.floor(random.random() * clusters.length)];
        const edgeTarget = this.generateEdgeTarget(random, width, height, padding);
        const road = this.createRiverRoad(startCluster, edgeTarget, random, noise, width, height, 'primary');
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
      
      const road = this.createRiverRoad(branchPoint, target, random, noise, width, height, 'secondary');
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

  createRiverRoad(start, end, random, noise, width, height, type) {
    const points = [];
    let x = start.x;
    let y = start.y;
    let angle = Math.atan2(end.y - y, end.x - x);
    const targetDist = Math.hypot(end.x - start.x, end.y - start.y);
    const maxSteps = Math.min(800, Math.ceil(targetDist / this.stepSize) * 3);
    const ns = this.noiseScale;
    const curvatureStrength = 0.6 * this.roadCurviness; // radians max deviation per step
    
    // Helper to keep within view
    const inBounds = (px, py) => px >= 0 && px <= width && py >= 0 && py <= height;
    
    points.push({ x, y });
    for (let i = 0; i < maxSteps; i++) {
      const toTarget = Math.atan2(end.y - y, end.x - x);
      // Slowly align towards the target to ensure overall directionality
      angle = angle * 0.92 + toTarget * 0.08;
      
      // Low-frequency noise to create wide meanders (very calm)
      const n = noise(x * ns, y * ns, 17.3) * 0.5 + noise((x + 1000) * ns, (y - 500) * ns, 91.8) * 0.5;
      angle += n * curvatureStrength;
      
      x += Math.cos(angle) * this.stepSize;
      y += Math.sin(angle) * this.stepSize;
      
      if (!inBounds(x, y)) break;
      
      // Add point every other step for performance
      if (i % 2 === 0) {
        points.push({ x, y });
      }
      
      // Stop when close to target
      if (Math.hypot(end.x - x, end.y - y) < 16) break;
    }
    
    // Ensure the path ends near the target
    points.push({ x: end.x, y: end.y });
    
    const smoothed = this.smoothPolyline(points, 2);
    
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
