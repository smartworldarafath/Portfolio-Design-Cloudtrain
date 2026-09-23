<div align="center">

# 🚂 Cloud Rail
### Interactive 3D Scenic Tram Developer Portfolio & Procedural World

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-2ea44f?style=for-the-badge&logo=github&logoColor=white)](https://smartworldarafath.github.io/Portfolio-Design-Cloudtrain/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_Renderer-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![JavaScript](https://img.shields.io/badge/ES6_Modules-Native-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web_Audio-Procedural_Synth-orange?style=for-the-badge&logo=audio)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

<br/>

**[Explore Live Demo →](https://smartworldarafath.github.io/Portfolio-Design-Cloudtrain/)** &nbsp;|&nbsp; **[View Architecture ↓](#-system-architecture)** &nbsp;|&nbsp; **[Customization Guide ↓](#-customization-guide)**

<br/>

</div>

---

## 📖 Overview

**Cloud Rail** is an interactive, real-time 3D developer portfolio and experiential web journey built with **Three.js**, procedural mathematics, and modern web standards.

Set in a floating Mediterranean archipelago suspended high above the sea, visitors travel along a winding wooden railway aboard a vintage coastal tram. As the visitor scrolls, the camera and tram travel in fluid synchronization across the islands, stopping at designated stations that unveil featured projects, core engineering strengths, career milestones, and contact channels through translucent frosted-glass portfolio cards.

### 🌟 Highlights
- **100% Procedural 3D World**: Zero heavy external 3D model files (`.glb`/`.gltf`). All islands, tracks, foliage, clouds, and vintage tram meshes are procedurally constructed in real-time code.
- **Fluid Scroll-to-Travel Physics**: Custom inertial dampening system that converts standard mouse wheel and touchpad swipe gestures into silky-smooth train navigation along a closed 3D Catmull-Rom spline.
- **Dual Presentation Modes**:
  - **📜 Scroll Story Mode**: Frosted glass editorial cards guide visitors through an organized narrative of your work while the 3D scene responds in the background.
  - **🚋 Free Drive Mode**: Unconstrained manual driving with keyboard or mouse wheel, autopilot planner, dynamic camera views, and tram customization workshop.
- **Synthesized Audio Engine**: Integrated real-time Web Audio API sound generator producing motor resonance, click-clack rail harmonics, station chimes, and ambient sea breezes without downloading a single audio file.
- **Zero Build Tool Overhead**: Runs on standard ES modules with native browser import maps and CSS variables. Starts instantly with zero bundle compile steps.

---

## 🏗️ System Architecture

Cloud Rail is engineered with a modular, unidirectional reactive architecture dividing input handling, 3D simulation, presentation, and audio synthesis:

```mermaid
flowchart TD
    subgraph InputLayer["1. Input & Gesture Layer"]
        Wheel["Mouse Wheel / Trackpad Gesture"]
        Nav["Station Quick-Travel Pills"]
        Keys["Keyboard Controls (W / S / A / D / C / P)"]
    end

    subgraph ControllerLayer["2. Synchronization & Physics Controller"]
        ScrollCtrl["ScrollController<br/>(Inertial Dampening & Speed Capping)"]
        SplineEngine["Catmull-Rom 3D Spline Physics<br/>(Arc-Length Sampling & Tangents)"]
        StateStore["Engine State Manager<br/>(Distance, Speed, Mode, Station Locks)"]
    end

    subgraph RenderLayer["3. Three.js Real-Time 3D Engine"]
        World["Procedural World (Islands, Tracks, Foliage)"]
        TramMesh["Dynamic Tram Model (Suspension, Doors, Wheels)"]
        Lighting["Atmospheric Sky & Day/Night Shaders"]
        CamSys["Adaptive Camera Choreography (Postcard / Driver / Scenic)"]
    end

    subgraph UILayer["4. Presentation & Interaction Overlay"]
        Cards["Translucent Frosted Glass Story Cards"]
        HUD["Minimalist Journey Telemetry & Navigation"]
        Audio["Web Audio API Sound Synthesizer"]
    end

    Wheel -->|Normalized Scroll Delta| ScrollCtrl
    Nav -->|Direct Waypoint Target| ScrollCtrl
    Keys -->|Manual Throttle & Steering| StateStore

    ScrollCtrl -->|Target Distance & Capped Step| StateStore
    StateStore -->|Progress along Spline| SplineEngine

    SplineEngine -->|Transform & Quaternion Matrix| TramMesh
    SplineEngine -->|Camera Target & Focal Vectors| CamSys

    StateStore -->|Active Section / Progress (0..1)| Cards
    StateStore -->|Speed & Mode Updates| HUD
    StateStore -->|Speed-Modulated Pitch & Gain| Audio

    World --> RenderLayer
    CamSys --> RenderLayer
```

---

## 🔬 Architectural Subsystems

### 1. Procedural 3D Spline & Rail Engine
- **Mathematical Curve**: The railway track is governed by a closed 3-dimensional `THREE.CatmullRomCurve3` with arc-length divisions (`divisions = 3000`) ensuring constant linear velocity regardless of curvature.
- **Dynamic Tangent & Rail Framing**: At any distance $d$, the engine computes orthonormal basis matrices $(\vec{R}, \vec{U}, \vec{F})$:
  $$\vec{F} = \text{tangentAt}(d), \quad \vec{R} = \frac{\vec{U}_{\text{world}} \times \vec{F}}{\|\vec{U}_{\text{world}} \times \vec{F}\|}, \quad \vec{U} = \vec{F} \times \vec{R}$$
- **Procedural Extrusion**: Rails, wooden ties, and catenary power lines are generated on initialization via tube geometries and instanced beams without relying on static 3D model downloads.

### 2. Inertial Scroll Physics & Velocity Capping
- **Damped Scroll Interpolation**: Scroll wheel inputs modulate `targetScrollProgress` ($p \in [0, 1]$), which smoothly converges to `currentScrollProgress` via exponential relaxation:
  $$p_{t+\Delta t} = p_t + (p_{\text{target}} - p_t) \cdot \min(1, \Delta t \cdot 2.2)$$
- **Scenic Speed Clamping**: To prevent disorienting jumps during aggressive scrolling, distance displacement is capped at a gentle heritage tram speed ($v_{\max} = 4.2 \text{ m/s}$ or $\approx 15 \text{ km/h}$):
  $$\Delta d = \text{sign}(\text{diff}) \cdot \min(|\text{diff} \cdot 2.2 \cdot \Delta t|, v_{\max} \cdot \Delta t)$$
- **Automatic Station Release**: When a visitor scrolls past a station stop, the engine automatically unlatches station capture locks and resumes scenic traversal.

### 3. Procedural Web Audio Synthesizer
- Built using native `AudioContext` nodes:
  - **Motor Resonance**: Modulated sine oscillator ($38 \text{ Hz} + \text{speed} \times 6$) passing through dynamic gain nodes.
  - **Rail Wheel Clack**: Stochastic impulses filtered through lowpass biquad nodes triggered at calculated track intervals.
  - **Ambient Wind**: Procedural white-noise buffer running through dynamic resonant filters.
  - **Chimes & Station Bells**: Pure sine wave decay envelopes at harmonic frequencies ($660 \text{ Hz}$, $784 \text{ Hz}$).

### 4. Translucent Frosted-Glass UI
- Built with multi-layer CSS backdrop filters (`backdrop-filter: blur(14px)`), low-alpha tinted glass (`rgba(18, 32, 36, 0.28)`), and high-contrast typography shadows.
- Screen space is completely unobstructed: background destination markers and power/brake button clutter are removed during scroll story viewing.

---

## 📂 Project Directory Structure

```
Portfolio-Design-Cloudtrain/
├── index.html                   # Main entry point with semantic markup & importmap
├── package.json                 # Project configuration & npm scripts
├── README.md                    # Professional engineering documentation
├── server.js                    # Ultra-lightweight local HTTP development server
├── .gitignore                   # Clean production ignore definitions
│
└── src/
    ├── css/
    │   └── cloudrail.css        # Core stylesheet, glassmorphism tokens, and responsive layout
    │
    ├── data/
    │   └── portfolioData.js     # Structured developer data (About, Projects, Skills, Timeline)
    │
    ├── game/
    │   ├── engine.js            # Three.js 3D world, spline physics, lighting, and animation loop
    │   ├── autopilot.js         # Intelligent autonomous speed & curve planner
    │   ├── markup.html          # HUD components, SVG definitions, and story cards
    │   └── three.module.js      # Three.js ES6 module
    │
    └── portfolio/
        ├── portfolioOverlay.js  # Mode switcher, topbar navigation, and card scroll observer
        └── scrollController.js  # Inertial wheel gesture handler & spline distance synchronizer
```

---

## 🎨 Customization Guide

You can easily adapt Cloud Rail to showcase your own projects and experience by editing a single file:

### 1. Update Portfolio Data
Open [`src/data/portfolioData.js`](src/data/portfolioData.js) and update your details:

```javascript
export const portfolioData = {
  author: {
    name: "Your Name",
    tagline: "Full-Stack Engineer & Creative Developer",
    bio: "Passionate about building high-performance systems and interactive 3D experiences...",
    metrics: [
      { label: "YEARS EXP.", value: "5+" },
      { label: "PROJECTS SHIPPED", value: "30+" },
      { label: "PERFORMANCE", value: "60 FPS" }
    ]
  },
  
  projects: [
    {
      id: "my-project",
      title: "Project Name",
      category: "Full-Stack Web App",
      badge: "Production",
      description: "Brief description of the architecture and impact...",
      tags: ["React", "TypeScript", "Node.js", "PostgreSQL"],
      demoUrl: "https://yourproject.com",
      githubUrl: "https://github.com/yourusername/project"
    }
    // Add more projects as needed...
  ]
};
```

### 2. Update Story Card Markup
Open [`src/game/markup.html`](src/game/markup.html) to update your story sections or project descriptions, then run `node build_index.js` to compile the single entry point.

---

## ⚡ Performance & Benchmarks

| Metric | Target | Result |
|---|---|---|
| **Frame Rate** | 60 FPS | Solid 60 FPS on desktop & modern mobile |
| **External 3D Asset Weight** | Minimal | **0 KB** (100% Procedural WebGL Geometries) |
| **Audio File Weight** | Zero | **0 KB** (Synthesized in Real-Time via Web Audio API) |
| **First Contentful Paint (FCP)** | < 1.0s | **~0.4s** |
| **Build Time** | Instant | **0s** (Native ES Modules, No Bundler Wait) |

---

## 🎮 Interactive Controls

| Control | Input Method |
|---|---|
| **Scroll / Advance Journey** | Mouse Wheel Down &bull; Touchpad Swipe Down |
| **Reverse / Slow Down** | Mouse Wheel Up &bull; Touchpad Swipe Up |
| **Manual Acceleration** | Hold <kbd>W</kbd> or <kbd>&uarr;</kbd> (in Free Drive Mode) |
| **Manual Braking** | Hold <kbd>S</kbd> or <kbd>&darr;</kbd> (in Free Drive Mode) |
| **Rotate Camera / Look Around** | Hold <kbd>A</kbd> / <kbd>D</kbd> or <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> |
| **Toggle Story vs Free Drive** | Press <kbd>Tab</kbd> or click the Mode Pill in topbar |
| **Cycle Camera Perspective** | Press <kbd>C</kbd> (Postcard View &bull; Driver's Seat &bull; Scenic View) |
| **Toggle Autopilot System** | Press <kbd>P</kbd> |
| **Visit Workshop (Customization)** | Press <kbd>G</kbd> |
| **Toggle Synthesized Audio** | Press <kbd>M</kbd> |
| **Field Guide & Pause Menu** | Press <kbd>H</kbd> or <kbd>Esc</kbd> |

---

## 💻 Local Setup & Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18+ recommended)

### Quickstart
```bash
# 1. Clone repository
git clone https://github.com/smartworldarafath/Portfolio-Design-Cloudtrain.git

# 2. Navigate to project root
cd Portfolio-Design-Cloudtrain

# 3. Start local development server
node server.js
```

Open your browser and navigate to **`http://localhost:3000/`**.

---

## 🚀 Deployment

Cloud Rail is pre-configured for instant zero-config static hosting:
- **GitHub Pages**: Enabled on `main` branch root `/`.
- **Vercel / Netlify / Cloudflare Pages**: Simply point to the repository root directory (build command: none, output directory: root).

---

## 📜 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

Developed with ❤️ by **[SmartWorld Arafath](https://github.com/smartworldarafath)**.
