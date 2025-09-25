/**
 * Layer Manager - Coordinates all visual layers and handles rendering order
 * Manages layer states, data generation, and rendering pipeline
 */

import { GridLayer } from '../layers/GridLayer.js';
import { InfrastructureLayer } from '../layers/InfrastructureLayer.js';
import { NodeLayer } from '../layers/NodeLayer.js';
import { OrganicLayer } from '../layers/OrganicLayer.js';
import { FlowLayer } from '../layers/FlowLayer.js';
import { ShadingLayer } from '../layers/ShadingLayer.js';
import { CoreLayer } from '../layers/CoreLayer.js';
import { ArcLayer } from '../layers/ArcLayer.js';
import { TownPlotsLayer } from '../layers/TownPlotsLayer.js';
import { PanelLayer } from '../layers/PanelLayer.js';
import { ParticleBurstLayer } from '../layers/ParticleBurstLayer.js';

export class LayerManager {
  constructor() {
    this.layers = new Map();
    this.layerOrder = [];
    this.generatedData = new Map();
    this.lastRenderTime = 0;
    
    this.initializeLayers();
  }

  initializeLayers() {
    // Create all layer instances
    const layerInstances = [
      new GridLayer(),
      new PanelLayer(),
      new ArcLayer(),
      new InfrastructureLayer(),
      new TownPlotsLayer(),
      new ParticleBurstLayer(),
      new NodeLayer(),
      new OrganicLayer(),
      new FlowLayer(),
      new ShadingLayer(),
      new CoreLayer()
    ];

    // Register layers and sort by Z-index
    layerInstances.forEach(layer => {
      this.layers.set(layer.name, layer);
    });

    // Create ordered list sorted by Z-index (low to high)
    this.layerOrder = layerInstances
      .sort((a, b) => a.zIndex - b.zIndex)
      .map(layer => layer.name);
  }

  /**
   * Generate data for all layers (maintains random sequence)
   * @param {Object} params - Generation parameters
   * @returns {Map} Generated data for all layers
   */
  generateAllData(params) {
    const allData = new Map();
    
    // Generate grid data first and make it available to all other layers
    const gridLayer = this.layers.get('grid');
    if (gridLayer) {
      const gridData = gridLayer.generateData(params);
      allData.set('grid', gridData);
      
      // Add grid information to params for other layers to use
      params.gridData = gridData;
      params.gridSize = gridLayer.gridSize;
    }
    
    // Generate data in order; inject dependencies for later layers
    this.layerOrder.forEach(layerName => {
      if (layerName === 'grid') return; // Already generated
      
      if (layerName === 'particles') {
        const infra = allData.get('infrastructure');
        params.staticLinesData = infra ? infra.staticLines : [];
      }
      
      if (layerName === 'flow') {
        const infra = allData.get('infrastructure');
        params.infrastructureData = infra;
      }
      
      const layer = this.layers.get(layerName);
      // Pass allData to layers that need access to previously generated data
      const layerParams = { ...params, allData };
      const layerData = layer.generateData(layerParams);
      allData.set(layerName, layerData);
    });

    // Store for potential reuse
    this.generatedData = allData;
    return allData;
  }

  /**
   * Render all enabled layers
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Object} params - Rendering parameters
   * @param {boolean} regenerateData - Whether to regenerate data or use cached data
   */
  renderAll(ctx, params, regenerateData = true) {
    // Clear canvas
    this.clearCanvas(ctx, params.width, params.height);
    
    let allData;
    if (regenerateData || !this.generatedData.size) {
      // Generate fresh data
      allData = this.generateAllData(params);
    } else {
      // Use cached data
      allData = this.generatedData;
    }
    
    // Special case: Infrastructure layer generates static lines data needed by Core layer
    const infrastructureData = allData.get('infrastructure');
    params.staticLinesData = infrastructureData ? infrastructureData.staticLines : [];
    
    // Make all generated data available to renderers (for cross-layer references)
    params.allData = allData;

    // Render layers in Z-index order
    this.layerOrder.forEach(layerName => {
      const layer = this.layers.get(layerName);
      const layerData = allData.get(layerName);
      
      if (layer.enabled && layerData) {
        layer.render(ctx, layerData, params);
      }
    });

    this.lastRenderTime = Date.now();
  }

  /**
   * Render only specific layers (for optimization)
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Array} layerNames - Names of layers to render
   * @param {Object} params - Rendering parameters
   */
  renderLayers(ctx, layerNames, params) {
    // Generate data for all layers (to maintain sequence)
    const allData = this.generateAllData(params);
    
    // Render only specified layers in Z-index order
    const orderedLayersToRender = this.layerOrder.filter(name => layerNames.includes(name));
    
    orderedLayersToRender.forEach(layerName => {
      const layer = this.layers.get(layerName);
      const layerData = allData.get(layerName);
      
      if (layer.enabled && layerData) {
        layer.render(ctx, layerData, params);
      }
    });
  }

  /**
   * Clear the canvas
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  clearCanvas(ctx, width, height) {
    ctx.fillStyle = 'rgba(250, 248, 245, 1)';
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Toggle layer visibility
   * @param {string} layerName - Name of layer to toggle
   * @returns {boolean} New visibility state
   */
  toggleLayer(layerName) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.toggle();
      return layer.enabled;
    }
    return false;
  }

  /**
   * Set layer visibility
   * @param {string} layerName - Name of layer
   * @param {boolean} enabled - Visibility state
   */
  setLayerEnabled(layerName, enabled) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.setEnabled(enabled);
    }
  }

  /**
   * Set layer opacity
   * @param {string} layerName - Name of layer
   * @param {number} opacity - Opacity value (0-1)
   */
  setLayerOpacity(layerName, opacity) {
    const layer = this.layers.get(layerName);
    if (layer) {
      layer.setOpacity(opacity);
    }
  }

  /**
   * Get layer information
   * @param {string} layerName - Name of layer
   * @returns {Object} Layer information
   */
  getLayerInfo(layerName) {
    const layer = this.layers.get(layerName);
    return layer ? layer.getInfo() : null;
  }

  /**
   * Get all layer information
   * @returns {Array} Array of layer information objects
   */
  getAllLayerInfo() {
    return this.layerOrder.map(name => {
      const layer = this.layers.get(name);
      return {
        name,
        ...layer.getInfo()
      };
    });
  }

  /**
   * Get layer by name
   * @param {string} layerName - Name of layer
   * @returns {BaseLayer} Layer instance
   */
  getLayer(layerName) {
    return this.layers.get(layerName);
  }

  /**
   * Update layers that need animation
   * @param {number} time - Current time
   */
  updateAnimatedLayers(time) {
    // Update core layer animations
    const coreLayer = this.layers.get('cores');
    const coreData = this.generatedData.get('cores');
    
    if (coreLayer && coreData) {
      coreLayer.updateCores(coreData, time);
    }
  }

  /**
   * Set layer states from configuration object
   * @param {Object} layerStates - Object with layer names as keys and enabled states as values
   */
  setLayerStates(layerStates) {
    Object.entries(layerStates).forEach(([layerName, enabled]) => {
      this.setLayerEnabled(layerName, enabled);
    });
  }

  /**
   * Set layer rendering order
   * @param {Array} order - Array of layer names in rendering order
   */
  setLayerOrder(order) {
    this.layerOrder = order;
  }

  /**
   * Get current layer states
   * @returns {Object} Object with layer names as keys and enabled states as values
   */
  getLayerStates() {
    const states = {};
    this.layerOrder.forEach(layerName => {
      const layer = this.layers.get(layerName);
      states[layerName] = layer.enabled;
    });
    return states;
  }

  /**
   * Reset all layers to default state
   */
  resetToDefaults() {
    this.layers.forEach(layer => {
      layer.setEnabled(true);
      layer.setOpacity(1.0);
    });
  }

  /**
   * Get rendering statistics
   * @returns {Object} Statistics about the current rendering
   */
  getRenderStats() {
    const enabledLayers = Array.from(this.layers.values()).filter(layer => layer.enabled);
    
    return {
      totalLayers: this.layers.size,
      enabledLayers: enabledLayers.length,
      layerNames: this.layerOrder,
      lastRenderTime: this.lastRenderTime,
      layerStates: this.getLayerStates()
    };
  }

  /**
   * Export layer data for debugging or analysis
   * @returns {Object} Exported layer data
   */
  exportLayerData() {
    const exportData = {};
    
    this.generatedData.forEach((data, layerName) => {
      exportData[layerName] = {
        enabled: this.layers.get(layerName).enabled,
        zIndex: this.layers.get(layerName).zIndex,
        data: data
      };
    });
    
    return exportData;
  }

  /**
   * Validate layer configuration
   * @returns {Array} Array of validation errors
   */
  validateLayers() {
    const errors = [];
    
    // Check for duplicate Z-indices
    const zIndices = new Map();
    this.layers.forEach((layer, name) => {
      if (zIndices.has(layer.zIndex)) {
        errors.push(`Duplicate Z-index ${layer.zIndex} found in layers: ${name} and ${zIndices.get(layer.zIndex)}`);
      } else {
        zIndices.set(layer.zIndex, name);
      }
    });
    
    // Check layer order consistency
    for (let i = 1; i < this.layerOrder.length; i++) {
      const prevLayer = this.layers.get(this.layerOrder[i - 1]);
      const currLayer = this.layers.get(this.layerOrder[i]);
      
      if (prevLayer.zIndex > currLayer.zIndex) {
        errors.push(`Layer order inconsistency: ${this.layerOrder[i - 1]} (z:${prevLayer.zIndex}) should come after ${this.layerOrder[i]} (z:${currLayer.zIndex})`);
      }
    }
    
    return errors;
  }
}
