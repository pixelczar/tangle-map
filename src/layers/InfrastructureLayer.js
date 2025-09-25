/**
 * Infrastructure Layer - Buildings, connections, and main structural lines
 * Represents the "clear, solvable" aspects of complex problems
 */

import { BaseLayer } from './BaseLayer.js';

export class InfrastructureLayer extends BaseLayer {
  constructor() {
    super('infrastructure', -10);
    this.structureColor = 'rgba(50, 120, 160, 0.6)';
    this.connectionColor = 'rgba(50, 120, 160, 0.4)';
    this.staticLineColor = 'rgba(30, 80, 120, 0.8)';
    this.baseLineWidth = 0.9;
    this.connectionLineWidth = 0.7;
    this.staticLineWidth = 2.2;
  }

  generateData(params) {
    const { clusters, random, width, height, padding, gridData, gridSize } = params;
    
    const data = {
      structures: [],
      connections: [],
      staticLines: [],
      terminalPoints: []
    };

    // Generate one plot per cluster with internal divisions like historical town maps
    clusters.forEach((cluster, clusterIndex) => {
      const plotSize = cluster.radius * 2.5; // Scale plot to cluster size
      
      // Create a large plot centered on the cluster
      const plot = this.generateClusterPlot(cluster, plotSize, random, width, height, padding, clusterIndex);
      if (plot) {
        data.structures.push(plot);
      }
    });

    // Generate straighter connection lines between clusters
    for (let i = 0; i < 8; i++) {
      const shouldDraw = random.random() > 0.4;
      const cluster1 = clusters[Math.floor(random.random() * clusters.length)];
      const cluster2 = clusters[Math.floor(random.random() * clusters.length)];
      
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

  generateClusterPlot(cluster, plotSize, random, width, height, padding, clusterIndex) {
    const centerX = cluster.x;
    const centerY = cluster.y;
    
    // Create radiating plot divisions without center square
    const plotDivisions = this.generateRadiatingPlots(centerX, centerY, plotSize, random, clusterIndex);
    
    // Check if plots are in bounds (use plot divisions instead of outer boundary)
    const inBounds = plotDivisions.some(division => 
      division.points.some(point => 
        this.isInBounds(point.x, point.y, width, height, padding)
      )
    );
    
    if (!inBounds) return null;
    
    return {
      x: centerX,
      y: centerY,
      plotSize,
      plotDivisions,
      clusterId: cluster.id,
      clusterIndex,
      inBounds: true
    };
  }

  generateTownBlock(centerX, centerY, plotSize, random) {
    // Create a smaller, more organized central rectangular town block
    const blockWidth = plotSize * 0.15; // Even smaller for better organization
    const blockHeight = plotSize * 0.18; // Even smaller for better organization
    
    // No rotation for more organized look
    const rotation = 0;
    
    const corners = [
      { x: -blockWidth/2, y: -blockHeight/2 },
      { x: blockWidth/2, y: -blockHeight/2 },
      { x: blockWidth/2, y: blockHeight/2 },
      { x: -blockWidth/2, y: blockHeight/2 }
    ];
    
    // Apply translation only (no rotation for organization)
    return corners.map(corner => {
      return {
        x: centerX + corner.x,
        y: centerY + corner.y
      };
    });
  }

  generateRadiatingPlots(centerX, centerY, plotSize, random, clusterIndex) {
    const divisions = [];
    
    // Variable number of divisions for more organic feel
    const numDivisions = 7 + Math.floor(random.random() * 6); // 7-12 divisions
    const baseAngle = (Math.PI * 2) / numDivisions;
    
    // Add overall skew to the entire system
    const systemSkew = (random.random() - 0.5) * Math.PI * 0.15; // ±27 degrees system skew
    
    // Start from center point (no center square) - make smaller
    const startRadius = plotSize * 0.03; // Even smaller center radius
    
    // Generate concentric arc radii for some plots - make smaller
    const concentricRadii = [];
    for (let r = 0; r < 3; r++) {
      concentricRadii.push(plotSize * (0.2 + r * 0.1 + random.random() * 0.08)); // Smaller radii
    }
    
    for (let i = 0; i < numDivisions; i++) {
      // Base angle with system skew and individual variation
      const individualSkew = (random.random() - 0.5) * Math.PI * 0.1; // ±18 degrees per plot
      const baseAngleWithSkew = i * baseAngle + systemSkew + individualSkew;
      
      // Variable plot sizes - make them generally smaller
      const sizeVariation = random.random();
      let endRadius;
      if (sizeVariation < 0.15) {
        // 15% chance for larger plots
        endRadius = plotSize * (0.35 + random.random() * 0.2); // 35-55% of plot size
      } else if (sizeVariation < 0.35) {
        // 20% chance for medium plots
        endRadius = plotSize * (0.25 + random.random() * 0.1); // 25-35% of plot size
      } else {
        // 65% chance for smaller plots
        endRadius = plotSize * (0.15 + random.random() * 0.1); // 15-25% of plot size
      }
      
      // 30% chance to extend to grid edges
      if (random.random() < 0.3) {
        endRadius = plotSize * (0.6 + random.random() * 0.3); // 60-90% of plot size
      }
      
      // Each plot gets its portion of the circle with variation
      const angleVariation = (random.random() - 0.5) * baseAngle * 0.3; // ±30% of base angle
      const plotAngle1 = baseAngleWithSkew - angleVariation;
      const plotAngle2 = baseAngleWithSkew + baseAngle + angleVariation;
      
      const wedgePoints = [];
      
      // Inner points (center) with more variation
      const innerRadiusVariation1 = (random.random() - 0.5) * startRadius * 0.5;
      const innerRadiusVariation2 = (random.random() - 0.5) * startRadius * 0.5;
      
      wedgePoints.push({
        x: centerX + Math.cos(plotAngle1) * (startRadius + innerRadiusVariation1),
        y: centerY + Math.sin(plotAngle1) * (startRadius + innerRadiusVariation1)
      });
      
      wedgePoints.push({
        x: centerX + Math.cos(plotAngle2) * (startRadius + innerRadiusVariation2),
        y: centerY + Math.sin(plotAngle2) * (startRadius + innerRadiusVariation2)
      });
      
      // Add intermediate points for less uniform inner shape
      const numInnerPoints = 1 + Math.floor(random.random() * 3); // 1-3 intermediate points
      for (let j = 1; j <= numInnerPoints; j++) {
        const t = j / (numInnerPoints + 1);
        const intermediateAngle = plotAngle1 + (plotAngle2 - plotAngle1) * t;
        const intermediateRadius = startRadius + (endRadius - startRadius) * t * 0.3; // Only go 30% toward outer edge
        const radiusVariation = (random.random() - 0.5) * intermediateRadius * 0.3;
        
        wedgePoints.push({
          x: centerX + Math.cos(intermediateAngle) * (intermediateRadius + radiusVariation),
          y: centerY + Math.sin(intermediateAngle) * (intermediateRadius + radiusVariation)
        });
      }
      
      // Outer edge - varied approaches
      const edgeType = random.random();
      
      if (edgeType < 0.3) {
        // 30% chance for concentric arc
        const arcRadius = concentricRadii[Math.floor(random.random() * concentricRadii.length)];
        const arcPoints = this.generateArcPoints(
          centerX, centerY, arcRadius, 
          plotAngle2, plotAngle1, 
          random, 8
        );
        wedgePoints.push(...arcPoints);
      } else if (edgeType < 0.6) {
        // 30% chance for organic curved edge
        const organicPoints = this.generateOrganicOuterEdge(
          centerX, centerY, endRadius, plotAngle1, plotAngle2, random
        );
        wedgePoints.push(...organicPoints);
      } else {
        // 40% chance for varied straight edge
        const straightPoints = this.generateVariedStraightEdge(
          centerX, centerY, endRadius, plotAngle1, plotAngle2, random
        );
        wedgePoints.push(...straightPoints);
      }
      
      divisions.push({
        points: wedgePoints,
        angle: baseAngleWithSkew,
        startRadius: startRadius,
        endRadius: endRadius,
        edgeType: edgeType,
        numInnerPoints: numInnerPoints
      });
    }
    
    return divisions;
  }

  generateArcPoints(centerX, centerY, radius, startAngle, endAngle, random, numPoints) {
    const points = [];
    const angleStep = (endAngle - startAngle) / (numPoints - 1);
    
    for (let i = 0; i < numPoints; i++) {
      const angle = startAngle + i * angleStep;
      // Add slight radius variation for organic feel
      const radiusVariation = 1 + (random.random() - 0.5) * 0.1;
      points.push({
        x: centerX + Math.cos(angle) * radius * radiusVariation,
        y: centerY + Math.sin(angle) * radius * radiusVariation
      });
    }
    
    return points;
  }

  generateOrganicOuterEdge(centerX, centerY, endRadius, plotAngle1, plotAngle2, random) {
    const points = [];
    const numPoints = 4 + Math.floor(random.random() * 4); // 4-7 points
    
    for (let i = 0; i < numPoints; i++) {
      const t = i / (numPoints - 1);
      const angle = plotAngle2 + (plotAngle1 - plotAngle2) * t;
      
      // Add organic variation
      const radiusVariation = (random.random() - 0.5) * endRadius * 0.2;
      const angleVariation = (random.random() - 0.5) * Math.PI * 0.1;
      
      const finalAngle = angle + angleVariation;
      const finalRadius = endRadius + radiusVariation;
      
      points.push({
        x: centerX + Math.cos(finalAngle) * finalRadius,
        y: centerY + Math.sin(finalAngle) * finalRadius
      });
    }
    
    return points;
  }

  generateVariedStraightEdge(centerX, centerY, endRadius, plotAngle1, plotAngle2, random) {
    const points = [];
    
    // Create 2-3 segments with slight variations
    const numSegments = 2 + Math.floor(random.random() * 2); // 2-3 segments
    
    for (let i = 0; i <= numSegments; i++) {
      const t = i / numSegments;
      const angle = plotAngle2 + (plotAngle1 - plotAngle2) * t;
      
      // Add slight variation to make it less sharp
      const radiusVariation = (random.random() - 0.5) * endRadius * 0.1;
      const angleVariation = (random.random() - 0.5) * Math.PI * 0.05;
      
      const finalAngle = angle + angleVariation;
      const finalRadius = endRadius + radiusVariation;
      
      points.push({
        x: centerX + Math.cos(finalAngle) * finalRadius,
        y: centerY + Math.sin(finalAngle) * finalRadius
      });
    }
    
    return points;
  }

  generateNaturalBoundary(centerX, centerY, plotSize, random) {
    // Create larger boundary to accommodate longer plots
    const numPoints = 10 + Math.floor(random.random() * 6); // 10-15 points for more organic look
    const boundary = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      
      // Create larger boundary to contain longer plots
      const baseRadius = plotSize * 0.55; // Increased to accommodate longer plots
      const radiusVariation = plotSize * 0.2; // More variation for organic feel
      
      // Add wave-like variations for natural contours
      const wave1 = Math.sin(angle * 3) * plotSize * 0.08; // More pronounced waves
      const wave2 = Math.sin(angle * 7 + Math.PI/4) * plotSize * 0.05; // More pronounced waves
      const randomVariation = (random.random() - 0.5) * radiusVariation;
      
      const radius = baseRadius + wave1 + wave2 + randomVariation;
      
      // Add noise for hand-drawn feel
      const noiseX = (random.random() - 0.5) * plotSize * 0.06; // More organic variation
      const noiseY = (random.random() - 0.5) * plotSize * 0.06; // More organic variation
      
      boundary.push({
        x: centerX + Math.cos(angle) * radius + noiseX,
        y: centerY + Math.sin(angle) * radius + noiseY
      });
    }
    
    return boundary;
  }

  generateInternalDivisions(centerX, centerY, plotSize, random, clusterIndex) {
    const divisions = [];
    const numDivisions = 4 + Math.floor(random.random() * 6); // 4-9 divisions
    
    // Create divisions radiating from center
    for (let i = 0; i < numDivisions; i++) {
      const angle = (i / numDivisions) * Math.PI * 2;
      const angleVariation = (random.random() - 0.5) * Math.PI * 0.3;
      const finalAngle = angle + angleVariation;
      
      // Only some lines extend beyond the boundary (30% chance)
      const extendsBeyond = random.random() < 0.3;
      let divisionLength;
      
      if (extendsBeyond) {
        // Extend beyond boundary
        divisionLength = plotSize * (0.5 + random.random() * 0.3);
      } else {
        // Stay within boundary
        divisionLength = plotSize * (0.2 + random.random() * 0.3);
      }
      
      const endX = centerX + Math.cos(finalAngle) * divisionLength;
      const endY = centerY + Math.sin(finalAngle) * divisionLength;
      
      divisions.push({
        startX: centerX,
        startY: centerY,
        endX: endX,
        endY: endY,
        angle: finalAngle,
        extendsBeyond: extendsBeyond
      });
    }
    
    return divisions;
  }

  generatePlotStructure(centerX, centerY, baseSize, random, width, height, padding) {
    // Create a centralized square element
    const centralSize = 12 + random.random() * 8;
    
    // Generate plot boundaries - mix of grid-aligned and organic edges
    const plotType = random.random();
    let boundaries = [];
    
    if (plotType < 0.4) {
      // Grid-aligned rectangular plot
      boundaries = this.generateRectangularPlot(centerX, centerY, baseSize, random);
    } else if (plotType < 0.7) {
      // Organic plot with some straight edges
      boundaries = this.generateOrganicPlot(centerX, centerY, baseSize, random);
    } else {
      // Circular arc-based plot
      boundaries = this.generateArcPlot(centerX, centerY, baseSize, random);
    }
    
    // Check if plot is in bounds
    const inBounds = boundaries.every(point => 
      this.isInBounds(point.x, point.y, width, height, padding)
    );
    
    if (!inBounds) return null;
    
    return {
      x: centerX,
      y: centerY,
      centralSize,
      boundaries,
      plotType: plotType < 0.4 ? 'rectangular' : plotType < 0.7 ? 'organic' : 'arc',
      clusterId: 'grid',
      inBounds: true
    };
  }

  generateRectangularPlot(centerX, centerY, baseSize, random) {
    // Create rectangular plot with some variation
    const width = baseSize + (random.random() - 0.5) * baseSize * 0.4;
    const height = baseSize + (random.random() - 0.5) * baseSize * 0.4;
    const rotation = (random.random() - 0.5) * Math.PI * 0.3; // Slight rotation
    
    const corners = [
      { x: -width/2, y: -height/2 },
      { x: width/2, y: -height/2 },
      { x: width/2, y: height/2 },
      { x: -width/2, y: height/2 }
    ];
    
    // Apply rotation and translation
    return corners.map(corner => ({
      x: centerX + corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation),
      y: centerY + corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation)
    }));
  }

  generateOrganicPlot(centerX, centerY, baseSize, random) {
    // Create organic plot with some straight edges and some curved
    const numPoints = 6 + Math.floor(random.random() * 4);
    const boundaries = [];
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const radius = baseSize * (0.4 + random.random() * 0.4);
      const noise = (random.random() - 0.5) * baseSize * 0.2;
      
      boundaries.push({
        x: centerX + Math.cos(angle) * (radius + noise),
        y: centerY + Math.sin(angle) * (radius + noise)
      });
    }
    
    return boundaries;
  }

  generateArcPlot(centerX, centerY, baseSize, random) {
    // Create plot with circular arc boundaries
    const numArcs = 3 + Math.floor(random.random() * 3);
    const boundaries = [];
    
    for (let i = 0; i < numArcs; i++) {
      const angle = (i / numArcs) * Math.PI * 2;
      const radius = baseSize * (0.3 + random.random() * 0.4);
      const arcLength = Math.PI * (0.8 + random.random() * 0.4);
      
      const startAngle = angle;
      const endAngle = angle + arcLength;
      const steps = Math.floor(arcLength * 4);
      
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const currentAngle = startAngle + (endAngle - startAngle) * t;
        const currentRadius = radius + (random.random() - 0.5) * baseSize * 0.1;
        
        boundaries.push({
          x: centerX + Math.cos(currentAngle) * currentRadius,
          y: centerY + Math.sin(currentAngle) * currentRadius
        });
      }
    }
    
    return boundaries;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    // Render structures
    this.renderStructures(ctx, data.structures, { transform3D, time, is3D });
    
    // Render connections
    this.renderConnections(ctx, data.connections, { transform3D, time, is3D });
    
    // Render static lines
    this.renderStaticLines(ctx, data.staticLines, { transform3D, time, is3D });
    
    // Render endpoint circles
    this.renderEndpointCircles(ctx, data.staticLines, { transform3D, time, is3D });
  }

      renderStructures(ctx, structures, { transform3D, time, is3D }) {
        const baseScale = transform3D.getScale(this.zIndex, time, is3D);
        
        structures.forEach((plot, i) => {
          if (!plot.inBounds) return;
          
          const { x, y, plotDivisions, clusterIndex } = plot;
          
          const edgeWidth = (this.baseLineWidth + Math.sin(time * 0.01) * 0.1) * baseScale;
          
          // Draw radiating plot divisions (wedge-shaped plots)
          if (plotDivisions && plotDivisions.length > 0) {
            plotDivisions.forEach((division, divIndex) => {
              const transformedPoints = division.points.map(point => 
                transform3D.transform(point.x, point.y, this.zIndex, time, is3D)
              );
              
              // Draw wedge boundary
              for (let j = 0; j < transformedPoints.length; j++) {
                const a = transformedPoints[j];
                const b = transformedPoints[(j + 1) % transformedPoints.length];
                this.drawHandLine(
                  ctx,
                  this.structureColor,
                  edgeWidth,
                  a,
                  b,
                  { seed: i * 47 + divIndex * 7 + j, segments: 5, jitter: 0.25, widthVariation: 0.12, opacityVariation: 0.1 }
                );
              }
            });
          }
        });
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
