/**
 * Grid Layer - Background structural grid
 * Provides the foundational geometric structure
 */

import { BaseLayer } from './BaseLayer.js';

export class GridLayer extends BaseLayer {
  constructor() {
    super('grid', -20);
    this.gridSize = 64;
    this.color = 'rgba(40, 60, 80, 0.2)';
    this.lineWidth = 0.3;
  }

  generateData(params) {
    const { width, height, padding, random, clusters } = params;
    
    const data = {
      vertical: [],
      horizontal: [],
      angledBreaks: [],
      filledSquares: [],
      intersectionDots: [],
      maskingRectangles: []
    };

    // Calculate centered grid bounds
    const centerX = width / 2;
    const centerY = height / 2;
    const gridWidth = width - (padding * 2);
    const gridHeight = height - (padding * 2);
    
    // Calculate grid bounds centered on canvas
    const leftBound = centerX - (gridWidth / 2);
    const rightBound = centerX + (gridWidth / 2);
    const topBound = centerY - (gridHeight / 2);
    const bottomBound = centerY + (gridHeight / 2);

    // Generate vertical lines with variation
    const startX = Math.ceil(leftBound / this.gridSize) * this.gridSize;
    const endX = Math.floor(rightBound / this.gridSize) * this.gridSize;
    
    for (let x = startX; x <= endX; x += this.gridSize) {
      // Skip border lines
      if (x > leftBound && x < rightBound) {
        // 80% chance to show vertical line
        if (random.random() < 0.8) {
          data.vertical.push({
            x,
            y1: topBound,
            y2: bottomBound,
            visible: true
          });
        }
      }
    }

    // Generate horizontal lines with variation
    const startY = Math.ceil(topBound / this.gridSize) * this.gridSize;
    const endY = Math.floor(bottomBound / this.gridSize) * this.gridSize;
    
    for (let y = startY; y <= endY; y += this.gridSize) {
      // Skip border lines
      if (y > topBound && y < bottomBound) {
        // 80% chance to show horizontal line
        if (random.random() < 0.8) {
          data.horizontal.push({
            y,
            x1: leftBound,
            x2: rightBound,
            visible: true
          });
        }
      }
    }

    // Generate angled breaks parallel to infrastructure lines
    this.generateAngledBreaks(data, { leftBound, rightBound, topBound, bottomBound, random, clusters });

    // Generate filled squares and missing squares
    this.generateFilledSquares(data, { leftBound, rightBound, topBound, bottomBound, random });

    // Generate intersection dots with clustering
    this.generateIntersectionDots(data, { random });

    // Generate masking rectangles aligned to grid
    this.generateMaskingRectangles(data, { leftBound, rightBound, topBound, bottomBound, random });

    return data;
  }

  generateAngledBreaks(data, { leftBound, rightBound, topBound, bottomBound, random, clusters }) {
    // Generate angled breaks parallel to infrastructure lines
    const numBreaks = 3 + Math.floor(random.random() * 4); // 3-6 breaks
    
    for (let i = 0; i < numBreaks; i++) {
      // Calculate angle based on infrastructure lines (diagonal patterns)
      const baseAngle = Math.PI / 4; // 45 degrees
      const angleVariation = (random.random() - 0.5) * Math.PI / 6; // ±30 degrees variation
      const angle = baseAngle + angleVariation;
      
      // Random start and end points
      const startX = leftBound + random.random() * (rightBound - leftBound);
      const startY = topBound + random.random() * (bottomBound - topBound);
      const length = 100 + random.random() * 200;
      
      const endX = startX + Math.cos(angle) * length;
      const endY = startY + Math.sin(angle) * length;
      
      // Only add if within bounds
      if (endX >= leftBound && endX <= rightBound && endY >= topBound && endY <= bottomBound) {
        data.angledBreaks.push({
          x1: startX,
          y1: startY,
          x2: endX,
          y2: endY,
          angle: angle
        });
      }
    }
  }

  generateFilledSquares(data, { leftBound, rightBound, topBound, bottomBound, random }) {
    // Generate filled squares and missing squares
    const numSquares = 8 + Math.floor(random.random() * 12); // 8-19 squares
    
    for (let i = 0; i < numSquares; i++) {
      // Random grid position
      const gridX = Math.floor((leftBound + random.random() * (rightBound - leftBound)) / this.gridSize) * this.gridSize;
      const gridY = Math.floor((topBound + random.random() * (bottomBound - topBound)) / this.gridSize) * this.gridSize;
      
      // Ensure within bounds
      if (gridX >= leftBound && gridX < rightBound - this.gridSize && 
          gridY >= topBound && gridY < bottomBound - this.gridSize) {
        
        const squareType = random.random();
        
        if (squareType < 0.3) {
          // Filled square with shading
          data.filledSquares.push({
            x: gridX,
            y: gridY,
            size: this.gridSize,
            type: 'filled',
            intensity: 0.3 + random.random() * 0.4
          });
        } else if (squareType < 0.5) {
          // Missing square (no grid lines in this area)
          data.filledSquares.push({
            x: gridX,
            y: gridY,
            size: this.gridSize,
            type: 'missing'
          });
        }
      }
    }
  }

  generateIntersectionDots(data, { random }) {
    // Find all intersections between vertical and horizontal lines
    const intersections = new Set();
    
    data.vertical.forEach(vLine => {
      data.horizontal.forEach(hLine => {
        intersections.add(`${vLine.x},${hLine.y}`);
      });
    });

    // Create clusters of larger dots
    const intersectionArray = Array.from(intersections);
    const numClusters = 2 + Math.floor(random.random() * 4); // 2-5 clusters
    
    for (let i = 0; i < numClusters; i++) {
      // Pick a random intersection as cluster center
      const centerPoint = intersectionArray[Math.floor(random.random() * intersectionArray.length)];
      const [centerX, centerY] = centerPoint.split(',').map(Number);
      
      // Find nearby intersections for the cluster
      const clusterSize = 2 + Math.floor(random.random() * 3); // 2-4 dots per cluster
      const clusterRadius = this.gridSize * 1.5; // Within 1.5 grid units
      
      const clusterDots = [];
      intersectionArray.forEach(pointStr => {
        const [x, y] = pointStr.split(',').map(Number);
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        
        if (distance <= clusterRadius && clusterDots.length < clusterSize) {
          clusterDots.push({ x, y, isLarge: true });
        }
      });
      
      data.intersectionDots.push(...clusterDots);
    }

    // Add regular small dots for remaining intersections
    intersectionArray.forEach(pointStr => {
      const [x, y] = pointStr.split(',').map(Number);
      
      // Check if this point is already in a cluster
      const isInCluster = data.intersectionDots.some(dot => 
        Math.abs(dot.x - x) < 1 && Math.abs(dot.y - y) < 1
      );
      
      if (!isInCluster) {
        data.intersectionDots.push({ x, y, isLarge: false });
      }
    });
  }

  generateMaskingRectangles(data, { leftBound, rightBound, topBound, bottomBound, random }) {
    // Generate masking rectangles aligned to grid for crisp edges
    const numRectangles = 4 + Math.floor(random.random() * 6); // 4-9 rectangles
    
    for (let i = 0; i < numRectangles; i++) {
      // Align to grid for crisp edges
      const gridX = Math.floor((leftBound + random.random() * (rightBound - leftBound)) / this.gridSize) * this.gridSize;
      const gridY = Math.floor((topBound + random.random() * (bottomBound - topBound)) / this.gridSize) * this.gridSize;
      
      // Ensure within bounds
      if (gridX >= leftBound && gridX < rightBound - this.gridSize && 
          gridY >= topBound && gridY < bottomBound - this.gridSize) {
        
        // Rectangle size aligned to grid
        const width = this.gridSize * (1 + Math.floor(random.random() * 3)); // 1-3 grid units wide
        const height = this.gridSize * (1 + Math.floor(random.random() * 3)); // 1-3 grid units tall
        
        // Ensure rectangle fits within bounds
        if (gridX + width <= rightBound && gridY + height <= bottomBound) {
          // 30% chance for "blowing" effect (background color, higher z-index)
          const isBlowing = random.random() < 0.3;
          
          // Determine if this should be a textured block (for darker areas)
          const useTexture = !isBlowing && random.random() < 0.4; // 40% chance for texture
          const opacity = isBlowing ? 1.0 : (0.1 + random.random() * 0.2); // 10-30% opacity for normal, 100% for blowing
          
          data.maskingRectangles.push({
            x: gridX,
            y: gridY,
            width: width,
            height: height,
            opacity: opacity,
            isBlowing: isBlowing,
            useTexture: useTexture,
            textureType: useTexture ? this.getRandomTextureType(random) : null,
            zIndex: isBlowing ? 10 : 0 // Higher z-index for blowing effect
          });
        }
      }
    }
  }

  getRandomTextureType(random) {
    const textureTypes = ['stipple', 'crosshatch', 'diagonal', 'dots'];
    return textureTypes[Math.floor(random.random() * textureTypes.length)];
  }

  render(ctx, data, params) {
    const { transform3D, time, is3D } = params;
    
    const scale = transform3D.getScale(this.zIndex, time, is3D);
    
    // Render filled squares first (background)
    this.renderFilledSquares(ctx, data.filledSquares, { transform3D, time, is3D, scale });
    
    // Render regular grid lines
    this.setLineStyle(ctx, this.color, this.lineWidth * scale);

    // Render vertical lines
    data.vertical.forEach(line => {
      const p1 = transform3D.transform(line.x, line.y1, this.zIndex, time, is3D);
      const p2 = transform3D.transform(line.x, line.y2, this.zIndex, time, is3D);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Render horizontal lines
    data.horizontal.forEach(line => {
      const p1 = transform3D.transform(line.x1, line.y, this.zIndex, time, is3D);
      const p2 = transform3D.transform(line.x2, line.y, this.zIndex, time, is3D);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Render angled breaks
    this.renderAngledBreaks(ctx, data.angledBreaks, { transform3D, time, is3D, scale });

    // Render intersection dots
    this.renderIntersectionDots(ctx, data.intersectionDots, { transform3D, time, is3D, scale });

    // Render masking rectangles
    this.renderMaskingRectangles(ctx, data.maskingRectangles, { transform3D, time, is3D, scale });
  }

  renderFilledSquares(ctx, filledSquares, { transform3D, time, is3D, scale }) {
    filledSquares.forEach(square => {
      if (square.type === 'filled') {
        const pos = transform3D.transform(square.x, square.y, this.zIndex, time, is3D);
        const size = square.size * scale;
        
        // Render filled square with shading
        this.setFillStyle(ctx, `rgba(40, 60, 80, ${square.intensity * 0.3})`);
        ctx.fillRect(pos.x, pos.y, size, size);
      }
      // Missing squares are handled by not rendering grid lines in those areas
    });
  }

  renderAngledBreaks(ctx, angledBreaks, { transform3D, time, is3D, scale }) {
    this.setLineStyle(ctx, this.color, this.lineWidth * scale * 1.2); // Slightly thicker
    
    angledBreaks.forEach(breakLine => {
      const p1 = transform3D.transform(breakLine.x1, breakLine.y1, this.zIndex, time, is3D);
      const p2 = transform3D.transform(breakLine.x2, breakLine.y2, this.zIndex, time, is3D);
      
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  }

  renderIntersectionDots(ctx, intersectionDots, { transform3D, time, is3D, scale }) {
    this.setFillStyle(ctx, this.color);
    
    intersectionDots.forEach(dot => {
      const pos = transform3D.transform(dot.x, dot.y, this.zIndex, time, is3D);
      const dotRadius = dot.isLarge ? 2.4 * scale : 0.8 * scale; // 3x larger for clustered dots
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  renderMaskingRectangles(ctx, maskingRectangles, { transform3D, time, is3D, scale }) {
    // Sort by z-index to render blowing rectangles on top
    const sortedRectangles = maskingRectangles.sort((a, b) => a.zIndex - b.zIndex);
    
    sortedRectangles.forEach(rect => {
      const pos = transform3D.transform(rect.x, rect.y, this.zIndex + rect.zIndex, time, is3D);
      const width = rect.width * scale;
      const height = rect.height * scale;
      
      if (rect.isBlowing) {
        // Blowing effect - use background color
        this.setFillStyle(ctx, 'rgba(250, 248, 245, 1.0)'); // Background color
        ctx.fillRect(pos.x, pos.y, width, height);
      } else if (rect.useTexture) {
        // Textured rectangle
        this.renderTexturedRectangle(ctx, pos.x, pos.y, width, height, rect.textureType, rect.opacity);
      } else {
        // Normal masking rectangle
        this.setFillStyle(ctx, `rgba(40, 60, 80, ${rect.opacity})`);
        ctx.fillRect(pos.x, pos.y, width, height);
      }
    });
  }

  renderTexturedRectangle(ctx, x, y, width, height, textureType, opacity) {
    ctx.save();
    
    // Set clipping path for the rectangle
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    
    // Set texture color
    const textureColor = `rgba(40, 60, 80, ${opacity})`;
    this.setFillStyle(ctx, textureColor);
    this.setLineStyle(ctx, textureColor, 0.5);
    
    switch (textureType) {
      case 'stipple':
        this.renderStippleTexture(ctx, x, y, width, height);
        break;
      case 'crosshatch':
        this.renderCrosshatchTexture(ctx, x, y, width, height);
        break;
      case 'diagonal':
        this.renderDiagonalTexture(ctx, x, y, width, height);
        break;
      case 'dots':
        this.renderDotsTexture(ctx, x, y, width, height);
        break;
    }
    
    ctx.restore();
  }

  renderStippleTexture(ctx, x, y, width, height) {
    const dotSize = 1.5;
    const spacing = 4;
    
    for (let px = x; px < x + width; px += spacing) {
      for (let py = y; py < y + height; py += spacing) {
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  renderCrosshatchTexture(ctx, x, y, width, height) {
    const spacing = 6;
    const lineWidth = 0.8;
    
    // Horizontal lines
    for (let py = y; py < y + height; py += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, py);
      ctx.lineTo(x + width, py);
      ctx.stroke();
    }
    
    // Vertical lines
    for (let px = x; px < x + width; px += spacing) {
      ctx.beginPath();
      ctx.moveTo(px, y);
      ctx.lineTo(px, y + height);
      ctx.stroke();
    }
  }

  renderDiagonalTexture(ctx, x, y, width, height) {
    const spacing = 8;
    const lineWidth = 0.6;
    
    // Diagonal lines
    for (let offset = -height; offset < width; offset += spacing) {
      ctx.beginPath();
      ctx.moveTo(x + offset, y);
      ctx.lineTo(x + offset + height, y + height);
      ctx.stroke();
    }
  }

  renderDotsTexture(ctx, x, y, width, height) {
    const dotSize = 2;
    const spacing = 8;
    
    for (let px = x + spacing/2; px < x + width; px += spacing) {
      for (let py = y + spacing/2; py < y + height; py += spacing) {
        ctx.beginPath();
        ctx.arc(px, py, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Configuration methods
  setGridSize(size) {
    this.gridSize = size;
  }

  setColor(color) {
    this.color = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }
}
