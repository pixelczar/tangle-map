/**
 * Town Plots Layer - Radiating plot divisions around cluster centers
 * Represents the organized, planned aspects of urban development
 */

import { BaseLayer } from './BaseLayer.js';

export class TownPlotsLayer extends BaseLayer {
  constructor() {
    super('plotAreas', -8);
    this.structureColor = 'rgba(180, 80, 60, 0.4)'; // Brick reddish color
    this.baseLineWidth = 1.0;
  }

  generateData(params) {
    const { clusters, random, width, height, padding } = params;
    
    const data = {
      structures: []
    };

    // Generate one plot per cluster with internal divisions like historical town maps
    clusters.forEach((cluster, clusterIndex) => {
      const plotSize = cluster.radius * 1.25; // Scale plot to cluster size (reduced by half)
      
      // Create a large plot centered on the cluster
      const plot = this.generateClusterPlot(cluster, plotSize, random, width, height, padding, clusterIndex);
      if (plot) {
        data.structures.push(plot);
      }
    });

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
      
      // Outer edge with different styles
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
        clusterIndex,
        plotIndex: i,
        endRadius,
        plotAngle1,
        plotAngle2
      });
    }
    
    return divisions;
  }

  generateArcPoints(centerX, centerY, radius, startAngle, endAngle, random, numPoints) {
    const points = [];
    const angleRange = endAngle - startAngle;
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const angle = startAngle + angleRange * t;
      const radiusVariation = (random.random() - 0.5) * radius * 0.1;
      
      points.push({
        x: centerX + Math.cos(angle) * (radius + radiusVariation),
        y: centerY + Math.sin(angle) * (radius + radiusVariation)
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
      
      points.push({
        x: centerX + Math.cos(angle + angleVariation) * (endRadius + radiusVariation),
        y: centerY + Math.sin(angle + angleVariation) * (endRadius + radiusVariation)
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
      
      points.push({
        x: centerX + Math.cos(angle + angleVariation) * (endRadius + radiusVariation),
        y: centerY + Math.sin(angle + angleVariation) * (endRadius + radiusVariation)
      });
    }
    
    return points;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    // Render town plot structures
    this.renderStructures(ctx, data.structures, { transform3D, time, is3D });
  }

  renderStructures(ctx, structures, { transform3D, time, is3D }) {
    const baseScale = transform3D.getScale(this.zIndex, time, is3D);
    
    structures.forEach((plot, i) => {
      if (!plot.inBounds) return;
      
      const { plotDivisions } = plot;
      
      const edgeWidth = (this.baseLineWidth + Math.sin(time * 0.01) * 0.1) * baseScale;
      
      // Draw radiating plot divisions (wedge-shaped plots)
      plotDivisions.forEach((division, divisionIndex) => {
        if (division.points.length < 3) return;
        
        // Set line style for plot boundaries
        this.setLineStyle(ctx, this.structureColor, edgeWidth);
        
        // Draw the plot boundary
        ctx.beginPath();
        const firstPoint = transform3D.transform(division.points[0].x, division.points[0].y, this.zIndex, time, is3D);
        ctx.moveTo(firstPoint.x, firstPoint.y);
        
        for (let j = 1; j < division.points.length; j++) {
          const point = transform3D.transform(division.points[j].x, division.points[j].y, this.zIndex, time, is3D);
          ctx.lineTo(point.x, point.y);
        }
        
        ctx.closePath();
        ctx.stroke();
      });
    });
  }
}
