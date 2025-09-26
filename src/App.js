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

// Persistence keys (module scope to avoid React Hook dependency warnings)
const STORAGE_KEYS = {
  layers: 'tm_layers',
  showControls: 'tm_showControls',
  expandedLayers: 'tm_expandedLayers',
  layerOrder: 'tm_layerOrder'
};

const TangleMapApp = () => {
  // Application component for Tangle Map generative art tool
  const canvasRef = useRef(null);
  const layerManagerRef = useRef(new LayerManager());
  const clusterSystemRef = useRef(null);
  const transform3DRef = useRef(null);
  const randomRef = useRef(new SeededRandom(42));
  
  // Initialize state with localStorage values
  const getInitialState = () => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return {
        layers: {
          grid: true,
          panels: true,
          arcs: true,
          infrastructure: true,
          plotAreas: true,
          particles: true,
          nodes: true,
          organic: true,
          flow: true, // FORCE ENABLE FLOW LAYER
          shading: false,
          cores: true
        },
        showControls: false,
        expandedLayers: {},
        layerOrder: [] // Will be set by LayerManager based on z-index
      };
    }

    try {
      const savedLayersRaw = localStorage.getItem(STORAGE_KEYS.layers);
      const savedLayers = savedLayersRaw ? JSON.parse(savedLayersRaw) : {
        grid: true,
        panels: true,
        arcs: true,
        infrastructure: true,
        plotAreas: true,
        particles: true,
        nodes: true,
        organic: true,
        flow: true,
        shading: false,
        cores: true
      };
      
      
      // FORCE ENABLE FLOW LAYER - it must always be on!
      savedLayers.flow = true;
      
      // FORCE ENABLE PLOT AREAS LAYER - it must always be on!
      savedLayers.plotAreas = true;

      // Clear the showControls localStorage to force hidden state
      localStorage.removeItem(STORAGE_KEYS.showControls);
      const savedShowControls = false;

      const savedExpandedRaw = localStorage.getItem(STORAGE_KEYS.expandedLayers);
      const savedExpanded = savedExpandedRaw ? JSON.parse(savedExpandedRaw) : {};
      
      const savedLayerOrderRaw = localStorage.getItem(STORAGE_KEYS.layerOrder);
      const savedLayerOrder = savedLayerOrderRaw ? JSON.parse(savedLayerOrderRaw) : []; // Will be set by LayerManager

      return {
        layers: savedLayers,
        showControls: savedShowControls,
        expandedLayers: savedExpanded,
        layerOrder: savedLayerOrder
      };
    } catch (e) {
      console.warn('Failed to load initial state from localStorage:', e);
      return {
        layers: {
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
        },
        showControls: true,
        expandedLayers: {}
      };
    }
  };

  const initialState = getInitialState();

  // State management
  const [seed, setSeed] = useState(42);
  const [editionId, setEditionId] = useState(null);
  const [layers, setLayers] = useState(initialState.layers);
  const [isAnimating, setIsAnimating] = useState(false);
  const [canvasOpacity, setCanvasOpacity] = useState(1);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showControls, setShowControls] = useState(initialState.showControls);
  const [expandedLayers, setExpandedLayers] = useState(initialState.expandedLayers);
  const [parameters, setParameters] = useState({
    clusterCount: 3, // Default cluster count
    padding: 160, // Increased padding to prevent edge clipping
    noiseScale: 0.02
  });
  const [layerOrder, setLayerOrder] = useState(initialState.layerOrder);
  const [draggedLayer, setDraggedLayer] = useState(null);
  const [dragOverLayer, setDragOverLayer] = useState(null);

  // Note: State is now initialized with localStorage values directly, no hydration needed

  // Persist UI state on change
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.layers, JSON.stringify(layers));
    } catch {}
  }, [layers]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.showControls, showControls ? 'true' : 'false');
    } catch {}
  }, [showControls]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.expandedLayers, JSON.stringify(expandedLayers));
    } catch {}
  }, [expandedLayers]);

  // Persist layer order state
  useEffect(() => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      localStorage.setItem(STORAGE_KEYS.layerOrder, JSON.stringify(layerOrder));
    } catch {}
  }, [layerOrder]);



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
      clusters = clusterSystemRef.current.generateClusters(randomRef.current, parameters.clusterCount, 64);
    } else {
      clusters = clusterSystemRef.current.getClusters(randomRef.current);
    }
    
    // Set up rendering parameters
    const renderParams = {
      width,
      height,
      time: time,
      clusters,
      random: randomRef.current,
      noise: randomRef.current.noise.bind(randomRef.current),
      transform3D: transform3DRef.current,
      is3D: false, // Always 2D mode
      padding: parameters.padding
    };

    // Render all layers
    layerManagerRef.current.renderAll(ctx, renderParams, regenerateData);
    
  }, [parameters.padding, parameters.clusterCount]);

  // Removed resize on controls toggle to avoid redraw; canvas remains constant size

  // Initialize systems on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    clusterSystemRef.current = new ClusterSystem(rect.width, rect.height, parameters.padding);
    transform3DRef.current = new Transform3D(rect.width, rect.height);
    
    // Initialize layer order from LayerManager if not already set
    if (layerOrder.length === 0) {
      const managerOrder = layerManagerRef.current.layerOrder;
      setLayerOrder(managerOrder);
    }
    
    return () => {
      const currentTimeout = debouncedRenderRef.current;
      const currentRenderTimeout = renderTimeoutRef.current;
      // Clean up debounced render timeout
      if (currentTimeout) {
        clearTimeout(currentTimeout);
      }
      if (currentRenderTimeout) {
        clearTimeout(currentRenderTimeout);
      }
    };
  }, [parameters.padding, layerOrder.length]);


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

  // Initial render
  useEffect(() => {
    // Initial render with data generation
    render(0, true); // true = generate data
  }, [render]);

  // Handle window resize - redraw canvas without regenerating data
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Trigger a redraw without regenerating data
        render(0, false); // false = don't regenerate data, just redraw
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [render]);


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

  // Generate unique edition identifier
  const generateEditionId = useCallback(() => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    const year = new Date().getFullYear();
    return `TM-${year}-${timestamp.toString(36).toUpperCase()}`;
  }, []);

  // Simple regenerate with fade transition
  const regenerate = useCallback(async () => {
    if (isAnimating) return; // Prevent multiple animations
    
    setIsAnimating(true);
    
    // Fade out current canvas
    setCanvasOpacity(0);
    
    // Wait for fade out to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate new data
    setSeed(Math.floor(Math.random() * 10000));
    setEditionId(generateEditionId());
    clusterSystemRef.current.clusters = []; // Clear existing clusters
    
    // Render new data
    render(0, true); // Regenerate data
    
    // Wait a moment for render to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Fade in new canvas
    setCanvasOpacity(1);
    
    // Wait for fade in to complete
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setIsAnimating(false);
  }, [render, generateEditionId, isAnimating]);

  // Initialize edition ID on first load
  useEffect(() => {
    if (!editionId) {
      setEditionId(generateEditionId());
    }
  }, [editionId, generateEditionId]);

  // Trigger initial fade-in after first render
  useEffect(() => {
    if (isInitialLoad) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 100); // Small delay to ensure canvas is rendered
      return () => clearTimeout(timer);
    }
  }, [isInitialLoad]);



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

  // Drag and drop functions
  const handleDragStart = useCallback((e, layerName) => {
    setDraggedLayer(layerName);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e) => {
    e.target.style.opacity = '1';
    setDraggedLayer(null);
    setDragOverLayer(null);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnter = useCallback((e, layerName) => {
    e.preventDefault();
    setDragOverLayer(layerName);
  }, []);

  const handleDragLeave = useCallback((e) => {
    // Only clear if we're leaving the entire layer item, not just moving between child elements
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverLayer(null);
    }
  }, []);

  const handleDrop = useCallback((e, targetLayerName) => {
    e.preventDefault();
    
    if (draggedLayer && draggedLayer !== targetLayerName) {
      const newOrder = [...layerOrder];
      const draggedIndex = newOrder.indexOf(draggedLayer);
      const targetIndex = newOrder.indexOf(targetLayerName);
      
      // Remove dragged layer from its current position
      newOrder.splice(draggedIndex, 1);
      
      // Insert at new position
      const newTargetIndex = draggedIndex < targetIndex ? targetIndex - 1 : targetIndex;
      newOrder.splice(newTargetIndex, 0, draggedLayer);
      
      setLayerOrder(newOrder);
    }
    
    setDragOverLayer(null);
  }, [draggedLayer, layerOrder]);

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

  // Update layer manager order when layer order changes
  useEffect(() => {
    if (layerManagerRef.current) {
      // Ensure layer order is not empty before setting it
      if (layerOrder.length > 0) {
        layerManagerRef.current.setLayerOrder(layerOrder);
        // Trigger a re-render when layer order changes
        triggerRender();
      }
    }
  }, [layerOrder, triggerRender]);

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

    const renderColorInput = (paramName, displayName) => {
      // Parse rgba string to extract RGB values and alpha
      const parseRgba = (rgba) => {
        if (!rgba || !rgba.includes('rgba')) return { r: 120, g: 140, b: 160, a: 0.2 };
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
        if (!match) return { r: 120, g: 140, b: 160, a: 0.2 };
        return {
          r: parseInt(match[1]),
          g: parseInt(match[2]),
          b: parseInt(match[3]),
          a: parseFloat(match[4])
        };
      };

      // Convert RGB to hex for color picker
      const rgbToHex = (r, g, b) => {
        return `#${[r, g, b].map(x => x.toString(16).padStart(2, '0')).join('')}`;
      };

      // Convert hex to rgba preserving existing alpha
      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
      };

      const currentValue = layer[paramName] || 'rgba(120, 140, 160, 0.2)';
      const { r, g, b, a } = parseRgba(currentValue);
      const currentHex = rgbToHex(r, g, b);

      return (
        <div key={paramName}>
          <label className="block text-xs text-gray-600 mb-1">{displayName}</label>
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={currentHex}
              onChange={(e) => {
                // Preserve existing alpha value when color picker changes
                const newRgba = hexToRgba(e.target.value, a);
                updateLayerParameter(layerName, paramName, newRgba);
                // Don't trigger render on color picker change - let text input handle it
              }}
              className="w-8 h-6 border border-gray-300 rounded cursor-pointer"
              title={`Pick ${displayName.toLowerCase()}`}
            />
            <input
              type="text"
              value={currentValue}
              onChange={(e) => updateLayerParameter(layerName, paramName, e.target.value)}
              onBlur={triggerRender}
              onKeyDown={(e) => e.key === 'Enter' && triggerRender()}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded font-mono focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="rgba(r,g,b,a)"
            />
          </div>
        </div>
      );
    };

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
            {renderSlider('connectionLineWidth', 0.3, 2, 0.1, 'px')}
            {renderSlider('staticLineWidth', 1, 5, 0.2, 'px')}
            {renderColorInput('connectionColor', 'Connection Color')}
            {renderColorInput('staticLineColor', 'Static Line Color')}
          </>
        );

      case 'plotAreas':
        return (
          <>
            {renderSlider('baseLineWidth', 0.5, 3, 0.1, 'px')}
            {renderColorInput('structureColor', 'Plot Color')}
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
    <div className="w-full h-screen relative overflow-hidden" style={{ background: 'rgba(250, 248, 245, 1)' }}>
      {/* Canvas area - directly centered */}
      <div 
        className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-in-out"
        style={{ 
          width: showControls ? 'calc(100% - 280px)' : '100%',
          right: showControls ? '280px' : '0'
        }}
      >
        <canvas 
          ref={canvasRef}
          className={`transition-opacity duration-300 ease-in-out ${
            isInitialLoad ? 'opacity-0' : 'opacity-100'
          }`}
          style={{ 
            background: 'rgba(250, 248, 245, 1)',
            display: 'block',
            opacity: isInitialLoad ? undefined : canvasOpacity,
            maxWidth: '90vw',
            maxHeight: '90vh',
            objectFit: 'contain'
          }}
        />
        
        {/* Canvas Overlay Title */}
        <div className="absolute top-10 left-10">
          <h1 className="text-4xl instrument-serif text-gray-800 drop-shadow-sm">Tangle Map</h1>
        </div>

          {/* Footer */}
          <div className="absolute bottom-10 right-10 text-right">
            <p className="font-serif text-gray-600 text-lg">
            Robotic by nature, organic by design  •  {new Date().getFullYear()}, PixelCzar ©
            </p>
          </div>

          {/* Edition ID - Swiss Style */}
          {editionId && (
            <div className="absolute bottom-10 left-10">
              <div className="w-16 h-px bg-gray-400 mb-2"></div>
              <p className="text-xs font-sans text-gray-500 tracking-widest uppercase">
                {editionId}
              </p>
            </div>
          )}

          {/* Top Right Buttons - Far right top corner with opacity transition */}
          <div 
            className="absolute top-10 right-10 transition-opacity duration-300 ease-in-out flex gap-2"
            style={{ opacity: showControls ? 0 : 1, pointerEvents: showControls ? 'none' : 'auto' }}
          >
            <button
              onClick={regenerate}
              disabled={isAnimating}
              className={`px-2 py-1 text-xs rounded-lg transition-colors border border-gray-200 ${
                isAnimating
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-700 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Redraw
            </button>
            <button
              onClick={() => setShowControls(true)}
              className="px-2 py-1 text-xs rounded-lg transition-colors border border-gray-200 text-gray-700 hover:text-gray-700 hover:bg-gray-100"
            >
              Controls
            </button>
          </div>
        </div>

        {/* Control Panel - always rendered, slides in/out smoothly */}
        <div 
          className="h-full bg-white max-h-screen overflow-y-auto transition-all duration-500 ease-in-out absolute right-0 top-0"
          style={{ 
            width: '280px',
            transform: showControls ? 'translateX(0)' : 'translateX(100%)',
            borderLeft: showControls ? '1px solid #e5e7eb' : 'none'
          }}
        >
        <div className="px-6 py-4">
          {/* Hide Controls Button */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => setShowControls(false)}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200"
            >
              Hide Controls <span className="ml-2 text-sm">✕</span> 
            </button>
          </div>

          {/* Layers */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-700">Layers</h3>
            <div className="space-y-1">
              {layerOrder
                .filter(key => key !== 'panels' && layers.hasOwnProperty(key))
                .map((key) => {
                  const value = layers[key];
                  const isDragging = draggedLayer === key;
                  const isDragOver = dragOverLayer === key;
                  
                  return (
                <div 
                  key={key}
                  className={`transition-all duration-200 ease-in-out ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${
                    isDragOver ? 'transform translate-y-1' : ''
                  }`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, key)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragEnter={(e) => handleDragEnter(e, key)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, key)}
                >
                  {/* Layer Toggle Row */}
                  <div className="flex items-center">
                    {/* Drag Handle */}
                    <div 
                      className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                      </svg>
                    </div>
                    
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
                      <span className="text-sm capitalize text-gray-700">
                        {key === 'plotAreas' ? 'Plot Areas' : key}
                      </span>
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
                    <div className="mt-2 p-3 bg-gray-50 rounded space-y-3">
                      {renderLayerParameters(key)}
                    </div>
                  )}
                </div>
                );
                })}
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
                  style={{ accentColor: '#334155' }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            
            
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
