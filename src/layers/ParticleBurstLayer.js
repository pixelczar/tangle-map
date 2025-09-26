/**
 * Particle Burst Layer - anisotropic point sprays for energetic accents
 */

import { BaseLayer } from './BaseLayer.js';

export class ParticleBurstLayer extends BaseLayer {
  constructor() {
    super('particles', 40);
    this.color = 'rgba(60, 60, 60, .01)'; // Gray color with maximum opacity
    this.countRange = { min: 1, max: 3 }; // even fewer bursts; tie to features
    this.particlesPer = { min: 80, max: 400 };
    this.radiusRange = { min: 280, max: 1880 };
  }

  generateData(params) {
    const { random, allData } = params;
    const bursts = [];


    // Get plot areas data
    const plotAreasData = allData && allData.get ? allData.get('plotAreas') : null;
    if (plotAreasData && plotAreasData.structures) {
      // For each epicenter (plot area), select only 1-2 divisions to fill with particles
      for (const plotArea of plotAreasData.structures) {
        if (!plotArea.plotDivisions || plotArea.plotDivisions.length === 0) continue;
        
        // Select 1-2 random divisions from this plot area
        const numDivisionsToFill = 1 + Math.floor(random.random() * 2); // 1 or 2 divisions
        const shuffledDivisions = [...plotArea.plotDivisions].sort(() => random.random() - 0.5);
        const selectedDivisions = shuffledDivisions.slice(0, numDivisionsToFill);
        
        for (const division of selectedDivisions) {
          if (!division.points || division.points.length < 3) continue;
          
          // Calculate bounding box of the plot division
          const bounds = this.calculateBounds(division.points);
          const area = this.calculatePolygonArea(division.points);
          
          // Determine particle density based on area size - increased density
          const baseDensity = 0.4; // increased particles per square unit
          const particleCount = Math.floor(area * baseDensity * (0.3 + random.random() * 0.5));
          
          // Calculate center point of the plot division, but offset towards the cluster epicenter
          const divisionCenterX = bounds.minX + (bounds.maxX - bounds.minX) / 2;
          const divisionCenterY = bounds.minY + (bounds.maxY - bounds.minY) / 2;
          
          // Find the cluster epicenter (center of the plot area)
          const plotAreaCenterX = plotArea.x;
          const plotAreaCenterY = plotArea.y;
          
          // Move the burst center closer to the cluster epicenter (70% towards epicenter)
          const centerX = divisionCenterX + (plotAreaCenterX - divisionCenterX) * 0.7;
          const centerY = divisionCenterY + (plotAreaCenterY - divisionCenterY) * 0.7;
          
          const particles = [];
          for (let i = 0; i < particleCount; i++) {
            // Generate particles that spray out from the center
            const angle = random.random() * Math.PI * 2; // Random direction
            const distance = random.random() * Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.6; // Increased spray distance
            
            let x = centerX + Math.cos(angle) * distance;
            let y = centerY + Math.sin(angle) * distance;
            
            // Ensure the particle is within the polygon, if not, try a few more times
            let attempts = 0;
            while (!this.isPointInPolygon(x, y, division.points) && attempts < 10) {
              const newAngle = random.random() * Math.PI * 2;
              const newDistance = random.random() * Math.min(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * 0.6;
              x = centerX + Math.cos(newAngle) * newDistance;
              y = centerY + Math.sin(newAngle) * newDistance;
              attempts++;
            }
            
            if (attempts < 10) { // Only add if we found a valid point
              const size = 1.2 + random.random() * 1.8; // larger particles
              const alpha = 0.8 + random.random() * 0.2; // higher opacity
              particles.push({ x, y, size, alpha });
            }
          }
          
          if (particles.length > 0) {
            const burstAlpha = 0.8 + random.random() * 0.2; // higher opacity
            bursts.push({
              origin: { x: bounds.minX + (bounds.maxX - bounds.minX) / 2, y: bounds.minY + (bounds.maxY - bounds.minY) / 2 },
              particles,
              burstAlpha,
              plotArea: true // Flag to indicate this is a plot area fill
            });
          }
        }
      }
    }

    return { bursts };
  }

  // Helper method to calculate bounding box of a polygon
  calculateBounds(points) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const point of points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }
    return { minX, maxX, minY, maxY };
  }

  // Helper method to calculate polygon area using shoelace formula
  calculatePolygonArea(points) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    return Math.abs(area) / 2;
  }

  // Helper method to test if a point is inside a polygon using ray casting
  isPointInPolygon(x, y, points) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      if (((points[i].y > y) !== (points[j].y > y)) &&
          (x < (points[j].x - points[i].x) * (y - points[i].y) / (points[j].y - points[i].y) + points[i].x)) {
        inside = !inside;
      }
    }
    return inside;
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    data.bursts.forEach(b => {
      ctx.save();
      ctx.globalAlpha = b.burstAlpha;
      this.setFillStyle(ctx, this.color);
      b.particles.forEach(p => {
        const pos = transform3D.transform(p.x, p.y, this.zIndex, time, is3D);
        ctx.beginPath();
        ctx.globalAlpha = b.burstAlpha * p.alpha;
        ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    });
  }
}


