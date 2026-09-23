# 🚂 Cloud Rail — 3D Scenic Tram Developer Portfolio

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-brightgreen?style=for-the-badge&logo=github)](https://smartworldarafath.github.io/Portfolio-Design-Cloudtrain/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL-black?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

An interactive, real-time 3D creative developer portfolio set in a procedural miniature archipelago above the sea. As visitors scroll, a vintage wooden tram smoothly navigates the scenic railway network, gliding past island stations that present featured works, skill sets, career milestones, and contact channels.

🌐 **Live Demo:** [https://smartworldarafath.github.io/Portfolio-Design-Cloudtrain/](https://smartworldarafath.github.io/Portfolio-Design-Cloudtrain/)

---

## ✨ Features

- **Procedural 3D World**: Floating Mediterranean islands, Catmull-Rom spline railway physics, ties, overhead power lines, and seaside vistas powered by Three.js.
- **Synchronized Scroll Physics**: Scrolling the mouse wheel or touch gesture moves the tram smoothly along the rails with inertial dampening, aligning the 3D journey with the portfolio content.
- **Dual Experience Modes**:
  - **Scroll Story Mode**: Editorial frosted-glass cards reveal About, Projects, Skills, and Experience as the camera follows the tram along the scenic line.
  - **Free Drive Mode**: Direct interactive manual cruising with W/S or mouse wheel, autopilot planner (<kbd>P</kbd>), multiple camera views (<kbd>C</kbd>), and the Oliver's Cloudworks workshop (<kbd>G</kbd>).
- **Procedural Lighting & Atmosphere**: Day-to-night gradient sky transitions, twilight reflections, moving volumetric clouds, and wave shaders.
- **Procedural Sound Synthesis**: Built-in Web Audio API synthesizer for harmonic rail rumble, station bells, and wind atmosphere (zero external MP3 dependencies).
- **Zero Build Tool Overhead**: Native ES modules, standard DOM, and CSS. Runs directly in any modern browser without heavy node bundles.

---

## 🎮 Controls

| Action | Key / Input |
|---|---|
| **Scroll / Advance Journey** | Mouse Wheel Down / Touchpad Swipe Down |
| **Reverse / Slow Down** | Mouse Wheel Up / Touchpad Swipe Up |
| **Manual Accelerate** | <kbd>W</kbd> or <kbd>&uarr;</kbd> |
| **Manual Brake** | <kbd>S</kbd> or <kbd>&darr;</kbd> |
| **Look Around** | <kbd>A</kbd> / <kbd>D</kbd> or <kbd>&larr;</kbd> / <kbd>&rarr;</kbd> |
| **Toggle Story vs Free Drive** | <kbd>Tab</kbd> or Topbar Mode Pill |
| **Cycle Camera View** | <kbd>C</kbd> (Postcard, Driver, Scenic) |
| **Toggle Autopilot** | <kbd>P</kbd> |
| **Visit Workshop (Customization)** | <kbd>G</kbd> |
| **Toggle Audio** | <kbd>M</kbd> |
| **Field Guide & Pause** | <kbd>H</kbd> or <kbd>Esc</kbd> |

---

## 🛠️ Local Development

Clone the repository and start the lightweight local dev server:

```bash
git clone https://github.com/smartworldarafath/Portfolio-Design-Cloudtrain.git
cd Portfolio-Design-Cloudtrain

# Start the server
node server.js
```

Then visit **`http://localhost:3000/`** in your browser.

---

## 📄 License

MIT &copy; 2026 Alex Morgan / SmartWorld Arafath
