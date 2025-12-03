/**
 * Main App Component - Tangle Map Generative Art Tool
 * Orchestrates all systems and provides the main user interface
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

// Sortable Layer Item Component
const SortableLayerItem = ({ id, children, ...props }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
    zIndex: isSortableDragging ? 1000 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...props}
      className={`${isSortableDragging ? 'bg-blue-50 border-2 border-blue-200 rounded-lg shadow-lg' : ''}`}
    >
      {children({ listeners, attributes })}
    </div>
  );
};

// Drag Handle Component
const DragHandle = ({ listeners, attributes }) => {
  return (
    <div 
      className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded transition-colors"
      {...listeners}
      {...attributes}
    >
      <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 12 12">
        <rect x="2" y="2" width="1" height="1" rx="0.5"/>
        <rect x="2" y="5" width="1" height="1" rx="0.5"/>
        <rect x="2" y="8" width="1" height="1" rx="0.5"/>
        <rect x="5" y="2" width="1" height="1" rx="0.5"/>
        <rect x="5" y="5" width="1" height="1" rx="0.5"/>
        <rect x="5" y="8" width="1" height="1" rx="0.5"/>
      </svg>
    </div>
  );
};

const TangleMapApp = () => {
  // Application component for Tangle Map generative art tool
  const canvasRef = useRef(null);
  const layerManagerRef = useRef(new LayerManager());
  const clusterSystemRef = useRef(null);
  const transform3DRef = useRef(null);
  const randomRef = useRef(new SeededRandom(42));
  const lastClusterCountRef = useRef(3); // Track last cluster count used
  
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
  const [canvasTransitionDuration, setCanvasTransitionDuration] = useState('2000ms');
  const [editionIdOpacity, setEditionIdOpacity] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showControls, setShowControls] = useState(initialState.showControls);
  const [expandedLayers, setExpandedLayers] = useState(initialState.expandedLayers);
  const [parameters, setParameters] = useState({
    clusterCount: 3, // Default cluster count
    padding: 160, // Increased padding to prevent edge clipping
    noiseScale: 0.02
  });
  const [layerOrder, setLayerOrder] = useState(initialState.layerOrder);
  const [cornerOpacity, setCornerOpacity] = useState(0);
  const [isShowingCorners, setIsShowingCorners] = useState(true);
  const [is3D, setIs3D] = useState(false);
  const isDraggingCameraRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  // @dnd-kit sensors for better drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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
    // Get dimensions from the outer container (skip the opacity wrapper div)
    const outerContainer = canvas.parentElement?.parentElement;
    const wrapperRect = outerContainer ? outerContainer.getBoundingClientRect() : canvas.parentElement.getBoundingClientRect();
    const width = wrapperRect.width || window.innerWidth;
    const height = wrapperRect.height || window.innerHeight;
    
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
    // Regenerate if: data regeneration requested, no clusters exist, or cluster count changed
    const clusterCountChanged = lastClusterCountRef.current !== parameters.clusterCount;
    let clusters;
    if (regenerateData || !clusterSystemRef.current.clusters.length || clusterCountChanged) {
      clusters = clusterSystemRef.current.generateClusters(randomRef.current, parameters.clusterCount, 64);
      lastClusterCountRef.current = parameters.clusterCount; // Update tracked count
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
      is3D: is3D,
      padding: parameters.padding
    };

    // Render all layers
    layerManagerRef.current.renderAll(ctx, renderParams, regenerateData);
    
  }, [parameters.padding, parameters.clusterCount, is3D]);

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
    
    // Capture ref values at effect start for cleanup
    const debouncedTimeout = debouncedRenderRef.current;
    const renderTimeout = renderTimeoutRef.current;
    
    return () => {
      // Clean up debounced render timeout
      if (debouncedTimeout) {
        clearTimeout(debouncedTimeout);
      }
      if (renderTimeout) {
        clearTimeout(renderTimeout);
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
      // Clear clusters to force regeneration with new count
      if (clusterSystemRef.current) {
        clusterSystemRef.current.clusters = [];
      }
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

  // Trigger re-render when 3D mode changes
  useEffect(() => {
    if (canvasRef.current) {
      render(0, false); // Don't regenerate data, just re-render with new 3D state
    }
  }, [is3D, render]);

  // Handle camera rotation with Cmd/Ctrl + drag
  useEffect(() => {
    if (!is3D) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e) => {
      // Check for Cmd (Mac) or Ctrl (Windows/Linux)
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        isDraggingCameraRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
      }
    };

    const handleMouseMove = (e) => {
      if (!isDraggingCameraRef.current) return;

      const deltaX = (e.clientY - lastMousePosRef.current.y) * 0.01; // Vertical movement rotates X
      const deltaY = (e.clientX - lastMousePosRef.current.x) * 0.01; // Horizontal movement rotates Y

      if (transform3DRef.current) {
        transform3DRef.current.updateRotation(deltaX, deltaY);
        // Trigger render directly
        if (canvasRef.current) {
          render(0, false);
        }
      }

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (canvas) {
          canvas.style.cursor = is3D ? 'grab' : '';
        }
      }
    };

    const handleMouseLeave = () => {
      if (isDraggingCameraRef.current) {
        isDraggingCameraRef.current = false;
        if (canvas) {
          canvas.style.cursor = is3D ? 'grab' : '';
        }
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [is3D, render]);

  // Note: Removed duplicate useEffect for clusterCount - handled above

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

  // Track mouse activity to hide/show corner elements
  useEffect(() => {
    let inactivityTimeout;
    const INACTIVITY_DELAY = 2000; // 2 seconds of inactivity

    const handleMouseMove = () => {
      // Show corners immediately on mouse movement
      setIsShowingCorners(true);
      setCornerOpacity(1);
      
      // Clear existing timeout
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
      
      // Set new timeout to hide corners after inactivity
      inactivityTimeout = setTimeout(() => {
        setIsShowingCorners(false);
        setCornerOpacity(0);
      }, INACTIVITY_DELAY);
    };

    // Initial timeout
    inactivityTimeout = setTimeout(() => {
      setIsShowingCorners(false);
      setCornerOpacity(0);
    }, INACTIVITY_DELAY);

    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (inactivityTimeout) {
        clearTimeout(inactivityTimeout);
      }
    };
  }, []);

  // Handle page refresh - trigger redraw before page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (canvasRef.current) {
        // Trigger a redraw before page refreshes
        render(0, false); // false = don't regenerate data, just redraw
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
    const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits
    const random = Math.floor(Math.random() * 1000000);
    return `00${year}-${random.toString(36).toUpperCase()}`;
  }, []);

  // Simple regenerate with fade transition
  const regenerate = useCallback(async () => {
    if (isAnimating) return; // Prevent multiple animations
    
    setIsAnimating(true);
    
    // Quick fade out (300ms)
    setCanvasTransitionDuration('300ms');
    setCanvasOpacity(0);
    setEditionIdOpacity(0);
    
    // Wait for fade out to complete
    await new Promise(resolve => setTimeout(resolve, 350));
    
    // Generate new data
    setSeed(Math.floor(Math.random() * 10000));
    setEditionId(generateEditionId());
    
    // Randomize cluster count within bounds (1-6)
    const newClusterCount = Math.floor(Math.random() * 6) + 1; // 1 to 6
    setParameters(prev => ({ ...prev, clusterCount: newClusterCount }));
    
    clusterSystemRef.current.clusters = []; // Clear existing clusters
    
    // Render new data while wrapper is at opacity 0 (invisible)
    render(0, true); // Regenerate data
    
    // Wait a moment for render to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Enable button immediately after render completes - don't wait for fade-in
    setIsAnimating(false);
    
    // Change to slower fade in transition (1500ms for smoother effect)
    setCanvasTransitionDuration('1500ms');
    
    // Force a reflow to ensure opacity 0 is committed, then trigger fade-in
    if (canvasRef.current) {
      // Force reflow by reading a property
      void canvasRef.current.offsetHeight;
    }
    
    // Use double requestAnimationFrame to ensure the browser recognizes the state change
    // and applies the CSS transition properly
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setCanvasOpacity(1);
      });
    });
    
    // Fade in edition ID after a short delay (non-blocking)
    setTimeout(() => {
      setEditionIdOpacity(1);
    }, 500);
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

  // Fade in corner controls on initial page load
  useEffect(() => {
    const timer = setTimeout(() => {
      setCornerOpacity(1);
      setEditionIdOpacity(1);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);



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

  // @dnd-kit drag and drop handler
  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLayerOrder((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);

        return arrayMove(items, oldIndex, newIndex);
      });
    }
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
            style={{ accentColor: '#334155' }}
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
        {/* Canvas wrapper for smooth fade transitions */}
        <div
          style={{
            opacity: isInitialLoad ? 0 : canvasOpacity,
            transition: `opacity ${canvasTransitionDuration} ease-in-out`,
            willChange: 'opacity',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            position: 'absolute',
            inset: 0
          }}
        >
          <canvas 
            ref={canvasRef}
            style={{ 
              background: 'rgba(250, 248, 245, 1)',
              display: 'block',
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              cursor: is3D ? 'grab' : 'default'
            }}
          />
        </div>
        
        {/* Canvas Overlay Title */}
        <div 
          className="absolute top-10 left-10 transition-opacity ease-in-out"
          style={{ 
            opacity: cornerOpacity,
            transitionDuration: isShowingCorners ? '2000ms' : '500ms'
          }}
        >
          <h1 className="text-4xl instrument-serif text-gray-800 drop-shadow-sm">Tangle Map</h1>
        </div>

          {/* Footer */}
          <div 
            className="absolute bottom-10 right-10 text-right transition-opacity ease-in-out"
            style={{ 
              opacity: cornerOpacity,
              transitionDuration: isShowingCorners ? '2000ms' : '500ms'
            }}
          >
            <p className="font-serif text-gray-600 text-xl">
            Robotic by nature, organic by design  •  {new Date().getFullYear()}, PixelCzar ©
            </p>
          </div>

          {/* Edition ID - Swiss Style */}
          {editionId && (
            <div 
              className="absolute bottom-10 left-10 transition-opacity ease-in-out"
              style={{ 
                opacity: editionIdOpacity,
                transitionDuration: '2000ms'
              }}
            >
              <p className="text-3xl italic font-serif text-gray-800 mb-1">fig</p>
              <div className="w-6 h-px bg-gray-400 mb-2"></div>
              <p className="text-lg font-sans text-gray-600 tracking-widest uppercase">
                {editionId}
              </p>
            </div>
          )}

          {/* Top Right Buttons - Far right top corner with opacity transition */}
          <div 
            className="absolute top-10 right-10 transition-opacity ease-in-out flex gap-2"
            style={{ 
              opacity: showControls ? 0 : cornerOpacity, 
              pointerEvents: showControls ? 'none' : 'auto',
              transitionDuration: isShowingCorners ? '2000ms' : '500ms'
            }}
          >
            <button
              onClick={regenerate}
              disabled={isAnimating}
              className={`px-2 py-1 text-xs rounded-lg transition-colors duration-300 ease-in-out border border-gray-200 ${
                isAnimating
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              Redraw
            </button>
            <button
              onClick={() => setShowControls(true)}
              className="px-2 py-1 text-xs rounded-lg transition-colors duration-300 ease-in-out border border-gray-200 text-gray-600 hover:text-gray-800 hover:border-gray-300"
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
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={layerOrder.filter(key => key !== 'panels' && layers.hasOwnProperty(key))}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-1">
                  {layerOrder
                    .filter(key => key !== 'panels' && layers.hasOwnProperty(key))
                    .map((key) => {
                      const value = layers[key];
                      
                      return (
                    <SortableLayerItem key={key} id={key}>
                      {({ listeners, attributes }) => (
                        <>
                          {/* Layer Toggle Row */}
                          <div className="flex items-center">
                            {/* Drag Handle - subtle gripper */}
                            <DragHandle listeners={listeners} attributes={attributes} />
                    
                    <label className="flex items-center gap-3 cursor-pointer flex-1" onClick={(e) => {
                      e.stopPropagation();
                      toggleLayer(key);
                    }}>
                      <div
                        className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                          value ? 'bg-gray-600' : 'bg-gray-300'
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
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLayerExpansion(key);
                      }}
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
                        </>
                      )}
                    </SortableLayerItem>
                );
                })}
                </div>
              </SortableContext>
            </DndContext>
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
                  onMouseUp={(e) => {
                    // Ensure clusters are regenerated when user finishes adjusting
                    if (clusterSystemRef.current) {
                      clusterSystemRef.current.clusters = [];
                    }
                    // Force regeneration by calling render directly
                    if (canvasRef.current) {
                      render(0, true);
                    }
                  }}
                  onTouchEnd={(e) => {
                    // Ensure clusters are regenerated when user finishes adjusting (mobile)
                    if (clusterSystemRef.current) {
                      clusterSystemRef.current.clusters = [];
                    }
                    // Force regeneration by calling render directly
                    if (canvasRef.current) {
                      render(0, true);
                    }
                  }}
                  className="w-full"
                  style={{ accentColor: '#334155' }}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-600">3D Mode</label>
                <button
                  onClick={() => {
                    setIs3D(!is3D);
                    setTimeout(() => triggerRender(), 0);
                  }}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    is3D ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      is3D ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            
            
            <button
              onClick={regenerate}
              className="w-full py-1.5 px-3 bg-slate-700 text-white rounded-lg shadow-md hover:bg-slate-800 transition-colors text-xs font-medium"
            >
              Redraw
            </button>
          </div>


          {/* Info */}
          <div className="mt-8 pt-6 border-t">
            <div className="text-xs text-gray-500">
              <p className="mb-2">Seed: {seed}</p>
              <p className="mt-12">Tanglemap is generative art project inspirated by planning diagrams, the landscape, forms of humanity & geography, and the visualization of abstract ideas.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TangleMapApp;
