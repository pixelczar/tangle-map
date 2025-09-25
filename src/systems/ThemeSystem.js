/**
 * Theme System - Manages color palettes and visual styling
 * Provides multiple color themes for different moods and contexts
 */

export class ThemeSystem {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'architectural';
    this.customThemes = new Map();
    
    this.initializeDefaultThemes();
  }

  initializeDefaultThemes() {
    // Architectural Planning Theme (default)
    this.themes.set('architectural', {
      name: 'Architectural Planning',
      description: 'Classic architectural drawing colors',
      background: 'rgba(250, 248, 245, 1)',
      
      grid: {
        color: 'rgba(40, 60, 80, 1.0)',
        lineWidth: 0.3
      },
      
      infrastructure: {
        structure: 'rgba(50, 120, 160, 0.6)',
        connection: 'rgba(50, 120, 160, 0.4)',
        staticLine: 'rgba(30, 80, 120, 0.8)'
      },
      
      nodes: {
        fill: 'rgba(30, 80, 120, 0.8)',
        stroke: 'rgba(30, 80, 120, 1.0)'
      },
      
      organic: {
        flow: 'rgba(180, 80, 90, 0.4)'
      },
      
      flow: {
        arrow: 'rgba(80, 150, 120, 0.2)'
      },
      
      shading: {
        boundary: 'rgba(80, 120, 140, 0.4)',
        fill: 'rgba(100, 140, 120, 0.1)',
        stipple: 'rgba(80, 120, 100, 0.4)',
        crosshatch: 'rgba(80, 120, 140, 0.3)',
        flowLines: 'rgba(100, 140, 160, 0.3)'
      },
      
      cores: {
        fill: 'rgba(250, 248, 245, 1)',
        stroke: 'rgba(60, 60, 60, 0.8)'
      }
    });

    // Organic Nature Theme
    this.themes.set('organic', {
      name: 'Organic Nature',
      description: 'Natural, earth-toned colors',
      background: 'rgba(248, 246, 240, 1)',
      
      grid: {
        color: 'rgba(120, 140, 100, 0.06)',
        lineWidth: 0.3
      },
      
      infrastructure: {
        structure: 'rgba(90, 110, 70, 0.6)',
        connection: 'rgba(90, 110, 70, 0.4)',
        staticLine: 'rgba(70, 90, 50, 0.8)'
      },
      
      nodes: {
        fill: 'rgba(70, 90, 50, 0.8)',
        stroke: 'rgba(70, 90, 50, 1.0)'
      },
      
      organic: {
        flow: 'rgba(140, 120, 80, 0.4)'
      },
      
      flow: {
        arrow: 'rgba(100, 130, 90, 0.2)'
      },
      
      shading: {
        boundary: 'rgba(100, 120, 80, 0.4)',
        fill: 'rgba(120, 140, 100, 0.1)',
        stipple: 'rgba(100, 120, 80, 0.4)',
        crosshatch: 'rgba(90, 110, 70, 0.3)',
        flowLines: 'rgba(110, 130, 90, 0.3)'
      },
      
      cores: {
        fill: 'rgba(248, 246, 240, 1)',
        stroke: 'rgba(80, 70, 50, 0.8)'
      }
    });

    // High Contrast Theme
    this.themes.set('contrast', {
      name: 'High Contrast',
      description: 'Bold, high-contrast colors',
      background: 'rgba(255, 255, 255, 1)',
      
      grid: {
        color: 'rgba(200, 200, 200, 0.3)',
        lineWidth: 0.4
      },
      
      infrastructure: {
        structure: 'rgba(0, 0, 0, 0.8)',
        connection: 'rgba(0, 0, 0, 0.6)',
        staticLine: 'rgba(0, 0, 0, 1.0)'
      },
      
      nodes: {
        fill: 'rgba(0, 0, 0, 1.0)',
        stroke: 'rgba(0, 0, 0, 1.0)'
      },
      
      organic: {
        flow: 'rgba(100, 100, 100, 0.6)'
      },
      
      flow: {
        arrow: 'rgba(150, 150, 150, 0.4)'
      },
      
      shading: {
        boundary: 'rgba(100, 100, 100, 0.6)',
        fill: 'rgba(200, 200, 200, 0.2)',
        stipple: 'rgba(0, 0, 0, 0.6)',
        crosshatch: 'rgba(100, 100, 100, 0.5)',
        flowLines: 'rgba(150, 150, 150, 0.4)'
      },
      
      cores: {
        fill: 'rgba(255, 255, 255, 1)',
        stroke: 'rgba(0, 0, 0, 1.0)'
      }
    });

    // Minimal Monochrome Theme
    this.themes.set('minimal', {
      name: 'Minimal Monochrome',
      description: 'Clean, minimal monochrome palette',
      background: 'rgba(252, 252, 252, 1)',
      
      grid: {
        color: 'rgba(120, 120, 120, 0.04)',
        lineWidth: 0.2
      },
      
      infrastructure: {
        structure: 'rgba(80, 80, 80, 0.3)',
        connection: 'rgba(80, 80, 80, 0.2)',
        staticLine: 'rgba(60, 60, 60, 0.5)'
      },
      
      nodes: {
        fill: 'rgba(60, 60, 60, 0.6)',
        stroke: 'rgba(60, 60, 60, 0.8)'
      },
      
      organic: {
        flow: 'rgba(100, 100, 100, 0.2)'
      },
      
      flow: {
        arrow: 'rgba(120, 120, 120, 0.15)'
      },
      
      shading: {
        boundary: 'rgba(100, 100, 100, 0.3)',
        fill: 'rgba(200, 200, 200, 0.05)',
        stipple: 'rgba(80, 80, 80, 0.3)',
        crosshatch: 'rgba(100, 100, 100, 0.2)',
        flowLines: 'rgba(120, 120, 120, 0.2)'
      },
      
      cores: {
        fill: 'rgba(252, 252, 252, 1)',
        stroke: 'rgba(80, 80, 80, 0.6)'
      }
    });

    // Warm Sunset Theme
    this.themes.set('sunset', {
      name: 'Warm Sunset',
      description: 'Warm, sunset-inspired colors',
      background: 'rgba(254, 251, 246, 1)',
      
      grid: {
        color: 'rgba(200, 150, 100, 0.08)',
        lineWidth: 0.3
      },
      
      infrastructure: {
        structure: 'rgba(180, 100, 60, 0.6)',
        connection: 'rgba(180, 100, 60, 0.4)',
        staticLine: 'rgba(160, 80, 40, 0.8)'
      },
      
      nodes: {
        fill: 'rgba(160, 80, 40, 0.8)',
        stroke: 'rgba(160, 80, 40, 1.0)'
      },
      
      organic: {
        flow: 'rgba(200, 120, 80, 0.4)'
      },
      
      flow: {
        arrow: 'rgba(180, 140, 100, 0.2)'
      },
      
      shading: {
        boundary: 'rgba(180, 120, 80, 0.4)',
        fill: 'rgba(220, 180, 140, 0.1)',
        stipple: 'rgba(160, 100, 60, 0.4)',
        crosshatch: 'rgba(180, 120, 80, 0.3)',
        flowLines: 'rgba(200, 140, 100, 0.3)'
      },
      
      cores: {
        fill: 'rgba(254, 251, 246, 1)',
        stroke: 'rgba(140, 70, 40, 0.8)'
      }
    });

    // Cool Blueprint Theme
    this.themes.set('blueprint', {
      name: 'Cool Blueprint',
      description: 'Classic blueprint style',
      background: 'rgba(30, 50, 80, 1)',
      
      grid: {
        color: 'rgba(100, 150, 200, 0.15)',
        lineWidth: 0.3
      },
      
      infrastructure: {
        structure: 'rgba(150, 200, 255, 0.8)',
        connection: 'rgba(150, 200, 255, 0.6)',
        staticLine: 'rgba(200, 220, 255, 1.0)'
      },
      
      nodes: {
        fill: 'rgba(200, 220, 255, 0.9)',
        stroke: 'rgba(255, 255, 255, 1.0)'
      },
      
      organic: {
        flow: 'rgba(180, 210, 240, 0.6)'
      },
      
      flow: {
        arrow: 'rgba(160, 190, 220, 0.4)'
      },
      
      shading: {
        boundary: 'rgba(160, 190, 220, 0.6)',
        fill: 'rgba(100, 150, 200, 0.2)',
        stipple: 'rgba(180, 210, 240, 0.6)',
        crosshatch: 'rgba(160, 190, 220, 0.5)',
        flowLines: 'rgba(180, 210, 240, 0.4)'
      },
      
      cores: {
        fill: 'rgba(30, 50, 80, 1)',
        stroke: 'rgba(255, 255, 255, 0.9)'
      }
    });
  }

  /**
   * Get current theme
   * @returns {Object} Current theme object
   */
  getCurrentTheme() {
    return this.themes.get(this.currentTheme);
  }

  /**
   * Set current theme
   * @param {string} themeName - Name of theme to activate
   * @returns {boolean} Success status
   */
  setTheme(themeName) {
    if (this.themes.has(themeName) || this.customThemes.has(themeName)) {
      this.currentTheme = themeName;
      return true;
    }
    return false;
  }

  /**
   * Get available theme names
   * @returns {Array} Array of theme names
   */
  getThemeNames() {
    return [
      ...Array.from(this.themes.keys()),
      ...Array.from(this.customThemes.keys())
    ];
  }

  /**
   * Get theme by name
   * @param {string} themeName - Name of theme
   * @returns {Object} Theme object
   */
  getTheme(themeName) {
    return this.themes.get(themeName) || this.customThemes.get(themeName);
  }

  /**
   * Apply theme to layer manager
   * @param {LayerManager} layerManager - Layer manager instance
   */
  applyTheme(layerManager) {
    const theme = this.getCurrentTheme();
    if (!theme) return;

    // Apply grid theme
    const gridLayer = layerManager.getLayer('grid');
    if (gridLayer) {
      gridLayer.setColor(theme.grid.color);
      gridLayer.setLineWidth(theme.grid.lineWidth);
    }

    // Apply infrastructure theme
    const infrastructureLayer = layerManager.getLayer('infrastructure');
    if (infrastructureLayer) {
      infrastructureLayer.setStructureColor(theme.infrastructure.structure);
      infrastructureLayer.setConnectionColor(theme.infrastructure.connection);
      infrastructureLayer.setStaticLineColor(theme.infrastructure.staticLine);
    }

    // Apply node theme
    const nodeLayer = layerManager.getLayer('nodes');
    if (nodeLayer) {
      nodeLayer.setNodeColor(theme.nodes.fill);
      nodeLayer.setConnectionColor(theme.nodes.stroke);
    }

    // Apply organic theme
    const organicLayer = layerManager.getLayer('organic');
    if (organicLayer) {
      organicLayer.setColor(theme.organic.flow);
    }

    // Apply flow theme
    const flowLayer = layerManager.getLayer('flow');
    if (flowLayer) {
      flowLayer.setColor(theme.flow.arrow);
    }

    // Apply shading theme
    const shadingLayer = layerManager.getLayer('shading');
    if (shadingLayer) {
      shadingLayer.setBoundaryColor(theme.shading.boundary);
      shadingLayer.setFillColor(theme.shading.fill);
      shadingLayer.setPatternColor('stipple', theme.shading.stipple);
      shadingLayer.setPatternColor('crosshatch', theme.shading.crosshatch);
      shadingLayer.setPatternColor('flow', theme.shading.flowLines);
    }

    // Apply core theme
    const coreLayer = layerManager.getLayer('cores');
    if (coreLayer) {
      coreLayer.setFillColor(theme.cores.fill);
      coreLayer.setStrokeColor(theme.cores.stroke);
    }
  }

  /**
   * Create a custom theme
   * @param {string} name - Theme name
   * @param {Object} themeData - Theme configuration
   */
  createCustomTheme(name, themeData) {
    this.customThemes.set(name, {
      name: name,
      description: themeData.description || 'Custom theme',
      custom: true,
      ...themeData
    });
  }

  /**
   * Delete a custom theme
   * @param {string} name - Theme name
   * @returns {boolean} Success status
   */
  deleteCustomTheme(name) {
    return this.customThemes.delete(name);
  }

  /**
   * Export current theme
   * @returns {Object} Current theme data
   */
  exportCurrentTheme() {
    return JSON.parse(JSON.stringify(this.getCurrentTheme()));
  }

  /**
   * Import theme from data
   * @param {string} name - Theme name
   * @param {Object} themeData - Theme data
   */
  importTheme(name, themeData) {
    this.createCustomTheme(name, themeData);
  }

  /**
   * Get theme preview colors (for UI)
   * @param {string} themeName - Theme name
   * @returns {Object} Preview colors
   */
  getThemePreview(themeName) {
    const theme = this.getTheme(themeName);
    if (!theme) return null;

    return {
      background: theme.background,
      primary: theme.infrastructure.structure,
      secondary: theme.nodes.fill,
      accent: theme.organic.flow,
      text: theme.cores.stroke
    };
  }

  /**
   * Generate theme variations
   * @param {string} baseThemeName - Base theme to vary
   * @param {Object} variations - Variation parameters
   * @returns {Object} New theme data
   */
  generateThemeVariation(baseThemeName, variations = {}) {
    const baseTheme = this.getTheme(baseThemeName);
    if (!baseTheme) return null;

    const newTheme = JSON.parse(JSON.stringify(baseTheme));
    
    // Apply variations (brightness, saturation, hue shift, etc.)
    if (variations.brightness) {
      this.adjustThemeBrightness(newTheme, variations.brightness);
    }
    
    if (variations.saturation) {
      this.adjustThemeSaturation(newTheme, variations.saturation);
    }
    
    if (variations.hueShift) {
      this.adjustThemeHue(newTheme, variations.hueShift);
    }

    return newTheme;
  }

  /**
   * Adjust theme brightness
   * @param {Object} theme - Theme to modify
   * @param {number} factor - Brightness factor (-1 to 1)
   */
  adjustThemeBrightness(theme, factor) {
    // This is a simplified implementation
    // In a real implementation, you'd parse and modify RGB values
    console.log('Brightness adjustment not yet implemented');
  }

  /**
   * Adjust theme saturation
   * @param {Object} theme - Theme to modify
   * @param {number} factor - Saturation factor (-1 to 1)
   */
  adjustThemeSaturation(theme, factor) {
    // This is a simplified implementation
    console.log('Saturation adjustment not yet implemented');
  }

  /**
   * Adjust theme hue
   * @param {Object} theme - Theme to modify
   * @param {number} degrees - Hue shift in degrees
   */
  adjustThemeHue(theme, degrees) {
    // This is a simplified implementation
    console.log('Hue adjustment not yet implemented');
  }

  /**
   * Get random theme
   * @returns {string} Random theme name
   */
  getRandomTheme() {
    const themes = this.getThemeNames();
    return themes[Math.floor(Math.random() * themes.length)];
  }
}
