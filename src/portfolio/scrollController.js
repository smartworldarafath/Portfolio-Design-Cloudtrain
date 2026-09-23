// Smooth Scroll & Gesture Controller for Cloud Rail
export class ScrollController {
  constructor(engineState, routeLength) {
    this.state = engineState;
    this.routeLength = routeLength;
    this.scrollVelocity = 0;
    this.isStoryMode = true;
    this.storyContainer = document.getElementById('portfolio-story-container');

    const maxScroll = this.storyContainer ? (this.storyContainer.scrollHeight - this.storyContainer.clientHeight) : 0;
    const initialScrollRatio = (this.storyContainer && maxScroll > 0) ? (this.storyContainer.scrollTop / maxScroll) : 0;

    // Anchor base distance so at scrollTop = 0, distance starts cleanly at starting tram position
    this.baseDistance = engineState.distance - initialScrollRatio * routeLength;
    this.targetScrollProgress = initialScrollRatio;
    this.currentScrollProgress = initialScrollRatio;

    this.initEvents();
  }

  initEvents() {
    // Wheel event for driving & story scroll
    window.addEventListener('wheel', (e) => {
      // In Free Drive mode: Gentle, controlled cruise acceleration
      if (!this.isStoryMode) {
        e.preventDefault();
        const delta = e.deltaY;
        if (delta > 0) {
          // Gentle acceleration: +0.12 per tick capped at 12 km/h
          this.state.speed = Math.min(12, this.state.speed + 0.12);
          this.state.throttle = Math.min(0.75, this.state.throttle + 0.08);
          if (window.audioGesture) window.audioGesture();
        } else if (delta < 0) {
          // Gentle braking
          this.state.speed = Math.max(0, this.state.speed - 0.22);
          this.state.brake = Math.min(0.8, this.state.brake + 0.12);
          if (window.audioGesture) window.audioGesture();
        }
      }
    }, { passive: false });

    // Track scroll in portfolio story container
    if (this.storyContainer) {
      this.storyContainer.addEventListener('scroll', () => {
        if (!this.isStoryMode) return;
        const maxScroll = this.storyContainer.scrollHeight - this.storyContainer.clientHeight;
        if (maxScroll > 0) {
          const progress = Math.min(1, Math.max(0, this.storyContainer.scrollTop / maxScroll));
          this.targetScrollProgress = progress;
        }
      }, { passive: true });
    }
  }

  setMode(storyMode) {
    this.isStoryMode = storyMode;
    if (storyMode && this.storyContainer) {
      const maxScroll = this.storyContainer.scrollHeight - this.storyContainer.clientHeight;
      const currentScrollRatio = maxScroll > 0 ? (this.storyContainer.scrollTop / maxScroll) : 0;
      // Re-anchor baseDistance so tram position continues seamlessly
      this.baseDistance = this.state.distance - currentScrollRatio * this.routeLength;
      this.currentScrollProgress = currentScrollRatio;
      this.targetScrollProgress = currentScrollRatio;
    }
  }

  update(dt) {
    if (!this.isStoryMode) return;

    // Smooth, relaxed interpolation for story scroll (never jerky)
    this.currentScrollProgress += (this.targetScrollProgress - this.currentScrollProgress) * Math.min(1, dt * 2.8);

    // Map scroll progress (0..1) to route distance from baseDistance
    const targetDistance = this.baseDistance + (this.currentScrollProgress * this.routeLength);
    const diff = targetDistance - this.state.distance;

    // If tram was in station mode, release when scrolling in either direction
    if (this.state.mode === 'station' && Math.abs(diff) > 1.5) {
      this.state.mode = 'driving';
      this.state.stationTime = 0;
      this.state.stationBoarded = true;
    }

    // Limit maximum tram movement speed: gentle scenic cruise (max ~4.8 m/s or ~17 km/h)
    const maxSpeedMetersPerSec = 4.8;
    const maxStep = maxSpeedMetersPerSec * dt;
    const step = Math.sign(diff) * Math.min(Math.abs(diff * 3.0 * dt), maxStep);

    if (Math.abs(diff) > 0.01) {
      // When scrolling down: step > 0 (forward)
      // When scrolling up: step < 0 (backward in reverse!)
      this.state.distance += step;
      // Set realistic speedometer display
      const computedSpeed = (Math.abs(step) / Math.max(dt, 0.001)) * 3.6;
      this.state.speed = Math.min(16, computedSpeed * 0.85);
    } else {
      this.state.speed = Math.max(0, this.state.speed - dt * 3.0);
    }
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(`story-${sectionId}`);
    if (el && this.storyContainer) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
