/**
 * Main App Component - Tangle Map Generative Art Tool
 * Orchestrates all systems and provides the main user interface
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { SeededRandom } from './utils/random.js';
import { Transform3D } from './utils/transform3D.js';
import { ClusterSystem } from './systems/ClusterSystem.js';
import { LayerManager } from './systems/LayerManager.js';
import './index.css';

const TangleMapApp = () => {
  // Application component for Tangle Map generative art tool
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const layerManagerRef = useRef(new LayerManager());
  const clusterSystemRef = useRef(null);
  const transform3DRef = useRef(null);
  const randomRef = useRef(new SeededRandom(42));
  
  // State management
  const [isAnimating, setIsAnimating] = useState(false);
  const [seed, setSeed] = useState(42);
  const [layers, setLayers] = useState({
    grid: true,
    panels: true,
    arcs: true,
    infrastructure: true,
    particles: true,
    nodes: true,
    organic: true,
    flow: true,
    shading: true,
    cores: true
  });
  const [showControls, setShowControls] = useState(true);
  const [expandedLayers, setExpandedLayers] = useState({});
  const [parameters, setParameters] = useState({
    clusterCount: 3, // Default cluster count
    padding: 120,
    animationSpeed: 1.0,
    noiseScale: 0.02
  });

  // Main rendering function - defined first to avoid temporal dead zone
  const render = useCallback((time = 0, regenerateData = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const wrapper = canvas.parentElement;
    const wrapperRect = wrapper.getBoundingClientRect();
    const width = wrapperRect.width;
    const height = wrapperRect.height;
    
    // Only set up canvas if dimensions changed or first render
    if (!canvas._lastWidth || canvas._lastWidth !== width || canvas._lastHeight !== height) {
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      canvas._lastWidth = width;
      canvas._lastHeight = height;
      
      // Update systems with current dimensions
      clusterSystemRef.current.updateDimensions(width, height);
      transform3DRef.current.updateDimensions(width, height);
    }
    
    // Generate clusters only when needed
    let clusters;
    if (regenerateData || !clusterSystemRef.current.clusters.length) {
      clusters = clusterSystemRef.current.generateClusters(randomRef.current, parameters.clusterCount);
    } else {
      clusters = clusterSystemRef.current.getClusters(randomRef.current);
    }
    
    // Set up rendering parameters
    const renderParams = {
      width,
      height,
      time: time * parameters.animationSpeed,
      clusters,
      random: randomRef.current,
      noise: randomRef.current.noise.bind(randomRef.current),
      transform3D: transform3DRef.current,
      is3D: false, // Always 2D mode
      padding: parameters.padding
    };

    // Render all layers
    layerManagerRef.current.renderAll(ctx, renderParams, regenerateData);
    
  }, [parameters.animationSpeed, parameters.padding, parameters.clusterCount]);

  // Trigger canvas resize when controls visibility changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (canvasRef.current) {
        // Force canvas to recalculate dimensions after layout change
        const canvas = canvasRef.current;
        canvas._lastWidth = null;
        canvas._lastHeight = null;
        render(0, false);
      }
    }, 600); // Wait for transition to complete (500ms + buffer)

    return () => clearTimeout(timeoutId);
  }, [showControls, render]);

  // Initialize systems on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    clusterSystemRef.current = new ClusterSystem(rect.width, rect.height, parameters.padding);
    transform3DRef.current = new Transform3D(rect.width, rect.height);
    
    return () => {
      const currentAnimation = animationRef.current;
      const currentTimeout = debouncedRenderRef.current;
      const currentRenderTimeout = renderTimeoutRef.current;
      if (currentAnimation) {
        cancelAnimationFrame(currentAnimation);
      }
      // Clean up debounced render timeout
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
      if (currentRenderTimeout) {
        clearTimeout(currentRenderTimeout);
      }
    };
  }, [parameters.padding]);


  // Update random seed when changed
  useEffect(() => {
    randomRef.current.setSeed(seed);
  }, [seed]);

  // Regenerate when cluster count changes so it actually affects layout
  useEffect(() => {
    if (canvasRef.current) {
      render(0, true);
    }
  }, [parameters.clusterCount, render]);

  // Update layer states in layer manager
  useEffect(() => {
    layerManagerRef.current.setLayerStates(layers);
    // Trigger a re-render to show layer changes immediately
    if (canvasRef.current) {
      render(0, false); // Don't regenerate data, just re-render
    }
  }, [layers, render]);

  // Handle parameter changes that require re-rendering
  useEffect(() => {
    if (clusterSystemRef.current) {
      clusterSystemRef.current.clusters = []; // Clear clusters to regenerate
      // Trigger a re-render after parameter changes
      setTimeout(() => {
        if (canvasRef.current) {
          render(0, true); // Regenerate data for parameter changes
        }
      }, 0);
    }
  }, [parameters.clusterCount, render]);

  // Animation loop
  useEffect(() => {
    let startTime = Date.now();
    let animationId = null;
    
    const animate = () => {
      if (isAnimating) {
        const time = Date.now() - startTime;
        // Only animate the rendering, don't regenerate data
        render(time, false); // false = don't regenerate data
        animationId = requestAnimationFrame(animate);
      }
    };
    
    // Initial render with data generation
    render(0, true); // true = generate data
    
    // Start animation if enabled
    if (isAnimating) {
      animationId = requestAnimationFrame(animate);
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [render, isAnimating]);


  // Layer toggle handler
  const toggleLayer = useCallback((layerName) => {
    console.log('Toggling layer:', layerName);
    setLayers(prev => {
      const newLayers = {
        ...prev,
        [layerName]: !prev[layerName]
      };
      console.log('New layer state:', newLayers);
      return newLayers;
    });
  }, []);

  // Regenerate with new seed
  const regenerate = useCallback(() => {
    setSeed(Math.floor(Math.random() * 10000));
    clusterSystemRef.current.clusters = []; // Clear existing clusters
    render(0, true); // Regenerate data
  }, [render]);


  // Parameter update handlers
  const updateParameter = useCallback((key, value) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  // Toggle layer expansion
  const toggleLayerExpansion = useCallback((layerName) => {
    setExpandedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  }, []);

  // Debounced render for parameter updates
  const debouncedRenderRef = useRef(null);
  
  // Update layer parameter with no immediate render
  const updateLayerParameter = useCallback((layerName, paramName, value) => {
    const layer = layerManagerRef.current.getLayer(layerName);
    if (layer && layer[paramName] !== undefined) {
      layer[paramName] = value;
      
      // If grid parameters change, we need to regenerate all data
      if (layerName === 'grid') {
        // Clear cached data so it gets regenerated
        layerManagerRef.current.generatedData = new Map();
      }
      
      // Don't trigger any React re-renders - just update the layer property
    }
  }, []);

  // Debounced render for parameter changes
  const renderTimeoutRef = useRef(null);
  
  // Manual render trigger for when user finishes adjusting
  const triggerRender = useCallback(() => {
    if (canvasRef.current) {
      // Clear existing timeout
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
      
      // Debounce the render to avoid excessive calls
      renderTimeoutRef.current = setTimeout(() => {
        if (canvasRef.current) {
          // Check if we need to regenerate data (e.g., grid changes)
          const needsRegeneration = layerManagerRef.current.generatedData.size === 0;
          // Use requestAnimationFrame for smoother rendering
          requestAnimationFrame(() => {
            if (canvasRef.current) {
              render(0, needsRegeneration);
            }
          });
        }
      }, 50); // 50ms = 20fps for much better performance
    }
  }, [render]);

  // Render parameters for a specific layer
  const renderLayerParameters = useCallback((layerName) => {
    const layer = layerManagerRef.current.getLayer(layerName);
    if (!layer) return null;

    const renderSlider = (paramName, min, max, step = 1, unit = '') => {
      const currentValue = layer[paramName] || min;
      const displayValue = typeof currentValue === 'number' ? currentValue.toFixed(step < 1 ? 2 : 0) : currentValue;
      
      return (
        <div key={paramName}>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs text-gray-600 capitalize">
              {paramName.replace(/([A-Z])/g, ' $1').toLowerCase()} {unit && `(${unit})`}
            </label>
            <span className="text-xs text-gray-500 font-mono">
              {displayValue}
            </span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            defaultValue={currentValue}
            onChange={(e) => {
              updateLayerParameter(layerName, paramName, parseFloat(e.target.value));
              // Update the display value immediately
              e.target.previousElementSibling.querySelector('span').textContent = parseFloat(e.target.value).toFixed(step < 1 ? 2 : 0);
            }}
            onMouseUp={triggerRender}
            onTouchEnd={triggerRender}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      );
    };

    const renderColorInput = (paramName, displayName) => (
      <div key={paramName}>
        <label className="block text-xs text-gray-600 mb-1">{displayName}</label>
        <input
          type="text"
          defaultValue={layer[paramName] || ''}
          onChange={(e) => updateLayerParameter(layerName, paramName, e.target.value)}
          onBlur={triggerRender}
          onKeyDown={(e) => e.key === 'Enter' && triggerRender()}
          className="w-full px-2 py-1 text-xs border rounded font-mono"
          placeholder="rgba(r,g,b,a)"
        />
      </div>
    );

    switch (layerName) {
      case 'grid':
        return (
          <>
            {renderSlider('gridSize', 16, 128, 8, 'px')}
            {renderSlider('lineWidth', 0.1, 2, 0.1, 'px')}
            {renderColorInput('color', 'Grid Color')}
          </>
        );

      case 'panels':
        return (
          <>
            {renderSlider('columns', 4, 32, 1)}
            {renderSlider('rows', 3, 24, 1)}
            {renderSlider('fillRatio', 0, 1, 0.05)}
            {renderSlider('lineWidth', 0.1, 2, 0.1, 'px')}
            {renderColorInput('lineColor', 'Line Color')}
          </>
        );


      case 'arcs':
        return (
          <>
            {renderSlider('lineWidth', 0.5, 3, 0.1, 'px')}
            {renderSlider('solidRatio', 0, 1, 0.05)}
            {renderSlider('circleProbability', 0, 1, 0.05)}
            {renderSlider('concentricProbability', 0, 1, 0.05)}
            {renderColorInput('color', 'Arc Color')}
          </>
        );

      case 'infrastructure':
        return (
          <>
            {renderSlider('baseLineWidth', 0.5, 3, 0.1, 'px')}
            {renderSlider('connectionLineWidth', 0.3, 2, 0.1, 'px')}
            {renderSlider('staticLineWidth', 1, 5, 0.2, 'px')}
            {renderColorInput('structureColor', 'Structure Color')}
            {renderColorInput('connectionColor', 'Connection Color')}
            {renderColorInput('staticLineColor', 'Static Line Color')}
          </>
        );

      case 'particles':
        return (
          <>
            {renderColorInput('color', 'Particle Color')}
          </>
        );

      case 'nodes':
        return (
          <>
            {renderSlider('nodeLineWidth', 0.5, 3, 0.1, 'px')}
            {renderSlider('connectionLineWidth', 0.3, 2, 0.1, 'px')}
            {renderColorInput('nodeColor', 'Node Color')}
            {renderColorInput('connectionColor', 'Connection Color')}
          </>
        );

      case 'organic':
        return (
          <>
            {renderSlider('lineWidth', 0.5, 3, 0.1, 'px')}
            {renderSlider('noiseScale', 0.001, 0.02, 0.001)}
            {renderSlider('angleVariation', 0.1, 2, 0.1, 'rad')}
            {renderColorInput('color', 'Organic Color')}
          </>
        );

          case 'flow':
            return (
              <>
                {renderSlider('primaryWidth', 1, 5, 0.2, 'px')}
                {renderSlider('secondaryWidth', 0.5, 3, 0.1, 'px')}
                {renderSlider('roadCurviness', 0, 1, 0.1)}
                {renderSlider('interestPointDensity', 0, 1, 0.05)}
                {renderSlider('intersectionRadius', 15, 40, 5, 'px')}
                {renderSlider('interestPointRadius', 8, 25, 2, 'px')}
                {renderColorInput('color', 'Road Color')}
              </>
            );

      case 'shading':
        return (
          <>
            {renderSlider('boundaryLineWidth', 0.5, 3, 0.1, 'px')}
            {renderSlider('patternLineWidth', 0.2, 1.5, 0.05, 'px')}
            {renderColorInput('boundaryColor', 'Boundary Color')}
            {renderColorInput('fillColor', 'Fill Color')}
          </>
        );

      case 'cores':
        return (
          <>
            {renderSlider('lineWidth', 1, 5, 0.2, 'px')}
            {renderSlider('probability', 0, 1, 0.05)}
            {renderColorInput('fillColor', 'Fill Color')}
            {renderColorInput('strokeColor', 'Stroke Color')}
          </>
        );

      default:
        return <div className="text-xs text-gray-500">No parameters available</div>;
    }
  }, [triggerRender, updateLayerParameter]);

  return (
    <div className="w-full h-screen bg-gray-50 relative overflow-hidden">
      {/* Main Canvas Area */}
      <div 
        className={`absolute top-0 h-full transition-all duration-500 ease-in-out ${
          showControls ? 'left-0 right-80' : 'left-0 right-0'
        }`}
      >
        {/* Canvas Wrapper for Centering */}
        <div className="w-full h-full flex items-center justify-center">
          <canvas 
            ref={canvasRef}
            className="max-w-full max-h-full"
            style={{ background: 'rgba(250, 248, 245, 1)' }}
          />
        </div>
        
        {/* Canvas Overlay Controls */}
        <div className="absolute top-4 left-4">
          <h1 className="text-4xl instrument-serif text-gray-800 drop-shadow-sm">Tangle Map</h1>
        </div>
        
        {/* Show Controls Button - Top Right when hidden */}
        {!showControls && (
          <div className="absolute top-4 right-4">
            <button
              onClick={() => setShowControls(true)}
              className="px-3 py-1.5 bg-slate-700 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Show Controls
            </button>
          </div>
        )}
      </div>
      
      {/* Control Panel */}
      <div 
        className={`absolute top-0 right-0 w-80 h-full bg-white shadow-lg border-l max-h-screen overflow-y-auto transition-transform duration-500 ease-in-out ${
          showControls ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          {/* Hide Controls Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowControls(false)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors border border-gray-200"
            >
              ✕ Hide
            </button>
          </div>

          {/* Layers */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Layers</h3>
            <div className="space-y-1">
              {Object.entries(layers).map(([key, value]) => (
                <div key={key}>
                  {/* Layer Toggle Row */}
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => toggleLayer(key)}>
                      <div
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                          value ? 'bg-slate-700' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-3.5' : 'translate-x-0.5'
                          }`}
                        />
                      </div>
                      <span className="text-sm capitalize text-gray-700">{key}</span>
                    </label>
                    {/* Expand/Collapse Chevron */}
                    <button
                      onClick={() => toggleLayerExpansion(key)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                    >
                      <svg 
                        className={`w-4 h-4 text-gray-400 transform transition-transform ${expandedLayers[key] ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Expandable Parameters */}
                  {expandedLayers[key] && (
                    <div className="ml-6 mt-2 p-3 bg-gray-50 rounded space-y-3">
                      {renderLayerParameters(key)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Parameters */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Parameters</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">Cluster Count</label>
                  <span className="text-xs text-gray-500 font-mono">{parameters.clusterCount}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={parameters.clusterCount}
                  onChange={(e) => updateParameter('clusterCount', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-gray-600">Animation Speed</label>
                  <span className="text-xs text-gray-500 font-mono">{parameters.animationSpeed}x</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={parameters.animationSpeed}
                  onChange={(e) => updateParameter('animationSpeed', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            
            <button
              onClick={() => {
                setIsAnimating(!isAnimating);
                // Force a render when toggling animation
                setTimeout(() => {
                  if (canvasRef.current) {
                    render(0, false); // Don't regenerate data for animation toggle
                  }
                }, 0);
              }}
              className="w-full py-1.5 px-3 bg-transparent border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
            >
              {isAnimating ? 'Pause' : 'Animate'}
            </button>
            
            <button
              onClick={regenerate}
              className="w-full py-1.5 px-3 bg-slate-700 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Regenerate
            </button>
          </div>


          {/* Info */}
          <div className="mt-6 pt-6 border-t">
            <div className="text-xs text-gray-500">
              <p className="mb-2">Seed: {seed}</p>
              <p>Interactive generative diagram inspired by planning drawings and organic systems.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TangleMapApp;
