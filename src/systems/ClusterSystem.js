/**
 * Cluster system for managing composition areas and visual interest points
 * Creates 2-3 areas of high activity that drive the overall composition
 */

export class ClusterSystem {
  constructor(width, height, padding = 80) {
    this.width = width;
    this.height = height;
    this.padding = padding;
    this.compositionWidth = width - (padding * 2);
    this.compositionHeight = height - (padding * 2);
    this.clusters = [];
  }

  updateDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.compositionWidth = width - (this.padding * 2);
    this.compositionHeight = height - (this.padding * 2);
  }

  /**
   * Generate clusters for the composition
   * @param {SeededRandom} random - Random number generator
   * @param {number} count - Number of clusters (default: 3)
   * @returns {Array} Array of cluster objects
   */
  generateClusters(random, count = 3) {
    this.clusters = [];
    
    for (let i = 0; i < count; i++) {
      const cluster = {
        id: i,
        x: this.padding + random.random() * this.compositionWidth,
        y: this.padding + random.random() * this.compositionHeight,
        radius: 80 + random.random() * 120,
        intensity: 0.6 + random.random() * 0.4,
        type: random.randomInt(0, 2), // 0: dense, 1: sparse, 2: flowing
        color: random.randomInt(0, 3) // For future color theming
      };
      
      this.clusters.push(cluster);
    }
    
    return this.clusters;
  }

  /**
   * Get clusters (returns current clusters or generates new ones)
   * @param {SeededRandom} random - Random number generator
   * @returns {Array} Array of cluster objects
   */
  getClusters(random) {
    if (this.clusters.length === 0) {
      return this.generateClusters(random);
    }
    return this.clusters;
  }

  /**
   * Add a new cluster at specified position (for interactivity)
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {SeededRandom} random - Random number generator
   */
  addCluster(x, y, random) {
    // Ensure the new cluster is within bounds
    const clampedX = Math.max(this.padding, Math.min(this.width - this.padding, x));
    const clampedY = Math.max(this.padding, Math.min(this.height - this.padding, y));
    
    const newCluster = {
      id: this.clusters.length,
      x: clampedX,
      y: clampedY,
      radius: 80 + random.random() * 120,
      intensity: 0.6 + random.random() * 0.4,
      type: random.randomInt(0, 2),
      color: random.randomInt(0, 3)
    };
    
    this.clusters.push(newCluster);
    return newCluster;
  }

  /**
   * Remove cluster by ID
   * @param {number} clusterId - ID of cluster to remove
   */
  removeCluster(clusterId) {
    this.clusters = this.clusters.filter(cluster => cluster.id !== clusterId);
  }

  /**
   * Find the closest cluster to a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Closest cluster or null if none found
   */
  findClosestCluster(x, y) {
    if (this.clusters.length === 0) return null;
    
    let closest = null;
    let minDistance = Infinity;
    
    this.clusters.forEach(cluster => {
      const distance = Math.sqrt((x - cluster.x) ** 2 + (y - cluster.y) ** 2);
      if (distance < minDistance) {
        minDistance = distance;
        closest = cluster;
      }
    });
    
    return closest;
  }

  /**
   * Check if a point is within any cluster
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Object|null} Cluster containing the point or null
   */
  getClusterAtPoint(x, y) {
    for (const cluster of this.clusters) {
      const distance = Math.sqrt((x - cluster.x) ** 2 + (y - cluster.y) ** 2);
      if (distance <= cluster.radius) {
        return cluster;
      }
    }
    return null;
  }

  /**
   * Get all clusters within a certain distance of a point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} maxDistance - Maximum distance
   * @returns {Array} Array of nearby clusters
   */
  getClustersNear(x, y, maxDistance) {
    return this.clusters.filter(cluster => {
      const distance = Math.sqrt((x - cluster.x) ** 2 + (y - cluster.y) ** 2);
      return distance <= maxDistance;
    });
  }

  /**
   * Update cluster properties (for interactive editing)
   * @param {number} clusterId - ID of cluster to update
   * @param {Object} updates - Properties to update
   */
  updateCluster(clusterId, updates) {
    const cluster = this.clusters.find(c => c.id === clusterId);
    if (cluster) {
      Object.assign(cluster, updates);
    }
  }

  /**
   * Check if clusters are in safe zone
   * @param {Object} cluster - Cluster to check
   * @returns {boolean} True if cluster is in safe zone
   */
  isInSafeZone(cluster) {
    return cluster.x >= this.padding && 
           cluster.x <= this.width - this.padding &&
           cluster.y >= this.padding && 
           cluster.y <= this.height - this.padding;
  }

  /**
   * Get composition statistics
   * @returns {Object} Statistics about current composition
   */
  getStats() {
    return {
      clusterCount: this.clusters.length,
      averageIntensity: this.clusters.reduce((sum, c) => sum + c.intensity, 0) / this.clusters.length || 0,
      totalArea: this.clusters.reduce((sum, c) => sum + (Math.PI * c.radius * c.radius), 0),
      compositionDensity: this.clusters.length / (this.compositionWidth * this.compositionHeight) * 10000
    };
  }
}
