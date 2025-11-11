/**
 * 3D perspective transformation utilities
 * Handles rotation and perspective projection for visual depth
 */

export class Transform3D {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.perspective = 1200;
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.rotationX = 0.3; // Slight tilt down
    this.rotationY = 0.2; // Slight rotation
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  /**
   * Update rotation angles
   * @param {number} deltaX - Change in X rotation (pitch)
   * @param {number} deltaY - Change in Y rotation (yaw)
   */
  updateRotation(deltaX, deltaY) {
    this.rotationX += deltaX;
    this.rotationY += deltaY;
    
    // Clamp X rotation to prevent flipping
    this.rotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.rotationX));
  }

  /**
   * Set rotation angles directly
   * @param {number} rotationX - X rotation (pitch)
   * @param {number} rotationY - Y rotation (yaw)
   */
  setRotation(rotationX, rotationY) {
    this.rotationX = rotationX;
    this.rotationY = rotationY;
  }

  /**
   * Transform a 3D point to 2D screen coordinates with perspective
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} z - Z coordinate (depth)
   * @param {number} time - Time for animation
   * @param {boolean} is3D - Whether to apply 3D transformation
   * @returns {Object} Transformed coordinates and scale
   */
  transform(x, y, z = 0, time = 0, is3D = false) {
    if (!is3D) {
      return { x, y, scale: 1 };
    }

    // Center coordinates
    let px = x - this.centerX;
    let py = y - this.centerY;
    let pz = z;

    // Apply rotation around X axis (pitch)
    const cosX = Math.cos(this.rotationX);
    const sinX = Math.sin(this.rotationX);
    const y1 = py * cosX - pz * sinX;
    const z1 = py * sinX + pz * cosX;

    // Apply rotation around Y axis (yaw)
    const cosY = Math.cos(this.rotationY);
    const sinY = Math.sin(this.rotationY);
    const x1 = px * cosY + z1 * sinY;
    const z2 = -px * sinY + z1 * cosY;

    // Perspective projection
    const scale = this.perspective / (this.perspective + z2);
    const screenX = this.centerX + x1 * scale;
    const screenY = this.centerY + y1 * scale;

    return { x: screenX, y: screenY, scale };
  }

  /**
   * Transform multiple points at once
   * @param {Array} points - Array of {x, y, z} points
   * @param {number} time - Time for animation
   * @param {boolean} is3D - Whether to apply 3D transformation
   * @returns {Array} Array of transformed points
   */
  transformPoints(points, time = 0, is3D = false) {
    return points.map(point => this.transform(point.x, point.y, point.z || 0, time, is3D));
  }

  /**
   * Get the scale factor for a given Z depth
   * @param {number} z - Z coordinate
   * @param {number} time - Time for animation
   * @param {boolean} is3D - Whether to apply 3D transformation
   * @returns {number} Scale factor
   */
  getScale(z = 0, time = 0, is3D = false) {
    if (!is3D) {
      return 1;
    }

    // Apply same rotation to get effective Z
    const cosX = Math.cos(this.rotationX);
    const cosY = Math.cos(this.rotationY);
    
    // Simplified: approximate Z after rotation
    const effectiveZ = z * cosX * cosY;
    return this.perspective / (this.perspective + effectiveZ);
  }
}
