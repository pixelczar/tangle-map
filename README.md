# Tangle Map

An interactive generative art tool for visualizing complex multi-factor problems through dynamic diagrams inspired by architectural planning drawings and organic systems.

![Tangle Map Preview](./docs/preview.png)

## 🎨 Concept

Tangle Map creates generative diagrams that blend structured geometric elements with organic, flowing systems. The tool visualizes the mental process of solving complex problems in software design and architecture, where some parts are clear and structured while others are organic and undefined.

**Inspiration:**
- Bjørn Staal's "Losing Oneself" series (generative NFTs with plotter drawings)
- Architectural planning methodologies
- Technical drawings showing both "clear, solvable" and "murky, unknown" aspects
- The visual representation of complex problem-solving processes

## ✨ Features

### Visual Systems
- **7 Distinct Layers** with independent toggle controls
- **Cluster-based Composition** (2-3 areas of high visual interest)  
- **3D Perspective Mode** with smooth rotation animations
- **Hand-drawn Aesthetic** with variable line weights
- **Safe-zone Padding** (80px from edges)

### Interactive Controls
- **Mouse Interaction** - Click to add/remove clusters
- **Real-time Layer Toggles** - Show/hide without regeneration
- **Parameter Sliders** - Adjust cluster count, padding, animation speed
- **Theme System** - 6 built-in color palettes
- **Seed Control** - Reproducible results with random seed generation

### Layer Structure
1. **Grid Layer** (z: -20) - Background structure grid
2. **Infrastructure Layer** (z: -10, -5) - Buildings, connections, main structural lines  
3. **Node Layer** (z: 0) - Connection points with radiating lines
4. **Organic Layer** (z: 2) - Flowing boundaries using noise-driven curves
5. **Flow Layer** (z: 3) - Directional arrows in cluster areas
6. **Shading Layer** (z: 5+) - Textured areas (stippling, cross-hatching, flowing lines)
7. **Core Layer** (top) - Large circles that mask underlying content

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd tangle-map

# Install dependencies  
npm install

# Start development server
npm start
```

The application will open at `http://localhost:3000`

## 🎮 Usage

### Basic Controls
- **View Mode**: Navigate and observe the diagram
- **Add Mode**: Click anywhere to add new clusters
- **Remove Mode**: Click on clusters to remove them

### Layer Controls
Toggle any of the 7 layers on/off:
- Grid - Background structural grid
- Infrastructure - Buildings and main connections  
- Nodes - Connection points and terminals
- Organic - Flowing organic boundaries
- Flow - Directional flow field arrows
- Shading - Textured areas with patterns
- Cores - Focal point circles

### Themes
Choose from 6 built-in themes:
- **Architectural Planning** - Classic architectural drawing colors
- **Organic Nature** - Natural, earth-toned palette
- **High Contrast** - Bold black and white
- **Minimal Monochrome** - Clean, subtle grays
- **Warm Sunset** - Warm, sunset-inspired colors  
- **Cool Blueprint** - Classic blueprint style

### Parameters
- **Cluster Count** (1-6) - Number of composition focal points
- **Safe Zone Padding** (40-120px) - Border margin  
- **Animation Speed** (0-3x) - Animation playback speed

### Export
- **PNG Export** - High-resolution image download
- **SVG Export** - Vector format (coming soon)
- **Plotter Format** - Pen plotter compatible output (coming soon)

## 🏗️ Architecture

### Modular Design
The codebase is organized into focused, reusable modules:

```
src/
├── utils/
│   ├── random.js          # Seeded random number generation
│   └── transform3D.js     # 3D perspective transformations
├── systems/
│   ├── ClusterSystem.js   # Composition area management
│   ├── LayerManager.js    # Layer coordination and rendering
│   └── ThemeSystem.js     # Color palette management
├── layers/
│   ├── BaseLayer.js       # Abstract layer interface
│   ├── GridLayer.js       # Background grid
│   ├── InfrastructureLayer.js # Buildings and connections
│   ├── NodeLayer.js       # Connection points
│   ├── OrganicLayer.js    # Flowing boundaries
│   ├── FlowLayer.js       # Directional arrows
│   ├── ShadingLayer.js    # Textured areas
│   └── CoreLayer.js       # Focal circles
└── App.js                 # Main application component
```

### Key Technical Features
- **Seeded Random Generation** - Consistent results for the same seed
- **Layer Data Separation** - Data generation separated from rendering
- **3D Transform Pipeline** - Perspective projection with rotation
- **Canvas-based Rendering** - High-performance 2D drawing
- **React Hooks Integration** - Modern React patterns

### Design Patterns
- **Strategy Pattern** - Interchangeable layer implementations
- **Observer Pattern** - Theme and state management
- **Factory Pattern** - Random number and noise generation
- **Composition Pattern** - Modular system assembly

## 🎨 Customization

### Creating Custom Themes
```javascript
// Example custom theme
const customTheme = {
  name: 'My Custom Theme',
  description: 'A unique color palette',
  background: 'rgba(240, 240, 240, 1)',
  grid: { color: 'rgba(100, 100, 100, 0.1)' },
  infrastructure: { 
    structure: 'rgba(50, 50, 200, 0.6)',
    connection: 'rgba(50, 50, 200, 0.4)'
  },
  // ... other layer colors
};

themeSystem.createCustomTheme('myTheme', customTheme);
```

### Extending Layers
```javascript
import { BaseLayer } from './BaseLayer.js';

class CustomLayer extends BaseLayer {
  constructor() {
    super('custom', 10); // name, zIndex
  }
  
  generateData(params) {
    // Generate layer-specific data
    return { /* your data */ };
  }
  
  render(ctx, data, params) {
    // Render your custom visuals
  }
}
```

## 📊 Performance

### Optimization Features
- **Selective Layer Rendering** - Only redraw changed layers
- **Canvas Pixel Ratio Support** - High-DPI display optimization  
- **Animation Frame Management** - Smooth 60fps animations
- **Data Generation Caching** - Reuse generated data when possible

### Performance Tips
- Disable animation when not needed
- Use fewer clusters for better performance
- Toggle off complex layers (Shading, Organic) for smoother interaction

## 🛠️ Development

### Project Structure
```
tangle-map/
├── public/              # Static assets
├── src/                 # Source code
│   ├── utils/          # Utility functions
│   ├── systems/        # Core systems
│   ├── layers/         # Visual layer generators
│   └── App.js         # Main component
├── docs/              # Documentation
├── package.json       # Dependencies
└── README.md         # This file
```

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Commands
```bash
npm start      # Start development server
npm build      # Build for production  
npm test       # Run tests
npm eject      # Eject from Create React App (irreversible)
```

## 🔮 Roadmap

### Short Term
- [ ] SVG export functionality
- [ ] Plotter-ready format export  
- [ ] Undo/redo system
- [ ] Preset compositions
- [ ] Real-time parameter preview

### Medium Term
- [ ] Animation keyframe system
- [ ] Custom pattern creation
- [ ] Collaborative editing
- [ ] Plugin architecture
- [ ] Mobile touch support

### Long Term
- [ ] AI-assisted composition
- [ ] 3D scene export
- [ ] Virtual reality mode
- [ ] Physical plotter integration
- [ ] Generative NFT minting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bjørn Staal** for "Losing Oneself" series inspiration
- **Generative art community** for techniques and approaches
- **Architectural drawing tradition** for visual language
- **Open source contributors** for tools and libraries

---

**Created with ❤️ for the generative art community**
