/**
 * Base class for all layer generators
 * Provides common functionality and interface for layer rendering
 */

export class BaseLayer {
  constructor(name, zIndex = 0) {
    this.name = name;
    this.zIndex = zIndex;
    this.enabled = true;
    this.opacity = 1.0;
    this.generatedData = null;
  }

  /**
   * Generate data for this layer (to be implemented by subclasses)
   * This always runs to maintain random sequence consistency
   * @param {Object} params - Generation parameters
   * @returns {Object} Generated data for the layer
   */
  generateData(params) {
    throw new Error('generateData must be implemented by subclass');
  }

  /**
   * Render the layer to canvas (to be implemented by subclasses)
   * Only runs if layer is enabled
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} data - Generated data for the layer
   * @param {Object} params - Rendering parameters
   */
  render(ctx, data, params) {
    throw new Error('render must be implemented by subclass');
  }

  /**
   * Execute layer generation and rendering
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} params - Parameters for generation and rendering
   */
  execute(ctx, params) {
    // Always generate data to maintain random sequence
    this.generatedData = this.generateData(params);
    
    // Only render if layer is enabled
    if (this.enabled) {
      this.render(ctx, this.generatedData, params);
    }
  }

  /**
   * Toggle layer visibility
   */
  toggle() {
    this.enabled = !this.enabled;
  }

  /**
   * Set layer visibility
   * @param {boolean} enabled - Whether layer should be visible
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Set layer opacity
   * @param {number} opacity - Opacity value (0-1)
   */
  setOpacity(opacity) {
    this.opacity = Math.max(0, Math.min(1, opacity));
  }

  /**
   * Get layer info
   * @returns {Object} Layer information
   */
  getInfo() {
    return {
      name: this.name,
      zIndex: this.zIndex,
      enabled: this.enabled,
      opacity: this.opacity
    };
  }

  /**
   * Helper method to check if point is in bounds
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} padding - Safe zone padding
   * @returns {boolean} True if point is in bounds
   */
  isInBounds(x, y, width, height, padding = 80) {
    return x >= padding && x <= width - padding && 
           y >= padding && y <= height - padding;
  }

  /**
   * Helper method to apply opacity to color
   * @param {string} color - Color string (rgba format expected)
   * @param {number} additionalOpacity - Additional opacity multiplier
   * @returns {string} Color with adjusted opacity
   */
  applyOpacity(color, additionalOpacity = 1) {
    const opacity = this.opacity * additionalOpacity;
    
    // Simple regex to replace opacity in rgba color
    return color.replace(/rgba\(([^)]+),\s*([^)]+)\)/, (match, rgb, alpha) => {
      return `rgba(${rgb}, ${parseFloat(alpha) * opacity})`;
    });
  }

  /**
   * Helper method to set line style with layer opacity
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Stroke color
   * @param {number} width - Line width
   * @param {Array} dash - Line dash pattern
   */
  setLineStyle(ctx, color, width = 1, dash = []) {
    ctx.strokeStyle = this.applyOpacity(color);
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
  }

  /**
   * Helper method to set fill style with layer opacity
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {string} color - Fill color
   */
  setFillStyle(ctx, color) {
    ctx.fillStyle = this.applyOpacity(color);
  }

  /**
   * Hand-drawn line helper: draws a very thin line made of small segments with
   * slight perpendicular jitter and gentle width variation to imitate pressure.
   * The jitter is deterministic when a noise function is provided.
   */
  drawHandLine(ctx, color, width, p1, p2, options = {}) {
    const {
      noise = null,
      seed = 0,
      segments = 18,
      jitter = 0.6,
      scale = 1,
      widthVariation = 0.45, // 0..1 multiplier range around 1
      opacityVariation = 0.35, // 0..1 additional opacity modulation
      minAlpha = 0.5
    } = options;

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.max(1e-3, Math.hypot(dx, dy));
    const ux = dx / len;
    const uy = dy / len;
    // Perpendicular unit vector
    const px = -uy;
    const py = ux;

    let prev = { x: p1.x, y: p1.y };
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const baseX = p1.x + dx * t;
      const baseY = p1.y + dy * t;

      // Deterministic offset
      let n = 0;
      if (typeof noise === 'function') {
        n = noise(baseX * 0.01, baseY * 0.01, seed + i) - 0.5;
      } else {
        n = (Math.sin((seed + i) * 12.9898) * 43758.5453) % 1 - 0.5;
      }
      const offset = n * jitter * scale;
      const x = baseX + px * offset;
      const y = baseY + py * offset;

      // Subtle pressure and opacity variation per segment
      const wn = typeof noise === 'function' ? (noise(i * 0.13, seed, 7) - 0.5) : (((Math.sin((seed + i) * 78.233) * 43758.5453) % 1) - 0.5);
      const an = typeof noise === 'function' ? (noise(i * 0.17, seed, 11) - 0.5) : (((Math.sin((seed + i) * 57.913) * 127.1) % 1) - 0.5);
      const wVariation = 1 + wn * widthVariation * 2; // around 1
      const alphaFactor = Math.max(minAlpha, 1 + an * opacityVariation * 2);

      // Apply style directly to allow per-segment opacity
      ctx.strokeStyle = this.applyOpacity(color, alphaFactor);
      ctx.lineWidth = Math.max(0.08, width * wVariation);
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(prev.x, prev.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      prev = { x, y };
    }
  }

  /**
   * Overdraw variant: repeats hand-drawn strokes a few times to simulate
   * retracing lines. Useful for accentuating key lines without increasing
   * base width too much.
   */
  drawOverdrawLine(ctx, color, width, p1, p2, options = {}) {
    const passes = options.passes || 3;
    for (let k = 0; k < passes; k++) {
      const seed = (options.seed || 0) + k * 9973;
      this.drawHandLine(ctx, color, width * (0.9 + 0.08 * k), p1, p2, {
        ...options,
        seed,
        jitter: (options.jitter || 1) * (1 + 0.15 * k),
        widthVariation: Math.min(1, (options.widthVariation || 0.45) * (1 + 0.2 * k)),
        opacityVariation: Math.min(1, (options.opacityVariation || 0.35) * (1 + 0.15 * k))
      });
    }
  }
}
