// Smooth Scroll & Gesture Controller for Cloud Rail
export class ScrollController {
  constructor(engineState, routeLength) {
    this.state = engineState;
    this.routeLength = routeLength;
    this.isStoryMode = true;
    this.storyContainer = document.getElementById('portfolio-story-container');

    // Scenic journey distance: calm, comfortable pace across the islands
    this.journeyDistance = this.routeLength * 0.55;

    // Anchor starting distance so at scrollTop = 0, distance starts cleanly at starting tram position
    this.startDistance = engineState.distance;
    this.targetScrollProgress = 0;
    this.currentScrollProgress = 0;

    // Check if container already has scroll position on refresh
    if (this.storyContainer) {
      const maxScroll = this.storyContainer.scrollHeight - this.storyContainer.clientHeight;
      if (maxScroll > 0 && this.storyContainer.scrollTop > 0) {
        const ratio = Math.min(1, Math.max(0, this.storyContainer.scrollTop / maxScroll));
        this.targetScrollProgress = ratio;
        this.currentScrollProgress = ratio;
        this.startDistance = engineState.distance - ratio * this.journeyDistance;
      }
    }

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
          // Gentle acceleration: +0.10 per tick capped at 12 km/h
          this.state.speed = Math.min(12, this.state.speed + 0.10);
          this.state.throttle = Math.min(0.70, this.state.throttle + 0.06);
          if (window.audioGesture) window.audioGesture();
        } else if (delta < 0) {
          // Gentle braking
          this.state.speed = Math.max(0, this.state.speed - 0.20);
          this.state.brake = Math.min(0.8, this.state.brake + 0.10);
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
      // Re-anchor startDistance so tram position continues seamlessly from where it currently is
      this.startDistance = this.state.distance - currentScrollRatio * this.journeyDistance;
      this.currentScrollProgress = currentScrollRatio;
      this.targetScrollProgress = currentScrollRatio;
    }
  }

  update(dt) {
    if (!this.isStoryMode) return;

    // Read current scroll progress directly from container
    if (this.storyContainer) {
      const maxScroll = this.storyContainer.scrollHeight - this.storyContainer.clientHeight;
      if (maxScroll > 0) {
        this.targetScrollProgress = Math.min(1, Math.max(0, this.storyContainer.scrollTop / maxScroll));
      }
    }

    // Smooth scroll interpolation: relaxed and calm
    this.currentScrollProgress = this.damp(this.currentScrollProgress, this.targetScrollProgress, 4.8, dt);

    // Map scroll progress (0..1) to route distance
    const targetDistance = this.startDistance + (this.currentScrollProgress * this.journeyDistance);
    const distDiff = targetDistance - this.state.distance;

    // If tram was stopped in station mode, release when scrolling
    if (this.state.mode === 'station' && Math.abs(distDiff) > 0.4) {
      this.state.mode = 'driving';
      this.state.stationTime = 0;
      this.state.stationBoarded = true;
    }

    const prevDistance = this.state.distance;
    
    // Smooth scenic dampening: calm, comfortable pace
    this.state.distance = this.damp(this.state.distance, targetDistance, 4.5, dt);
    
    const delta = this.state.distance - prevDistance;
    const computedSpeed = (Math.abs(delta) / Math.max(dt, 0.001)) * 3.6;

    if (Math.abs(delta) > 0.0008) {
      // Gentle scenic speed capped around 12–14 km/h
      this.state.speed = Math.min(13.5, computedSpeed * 0.85);
      this.state.acceleration = (delta / dt) * 0.3;
    } else {
      this.state.speed = this.damp(this.state.speed, 0, 8.0, dt);
      if (this.state.speed < 0.08) this.state.speed = 0;
      this.state.acceleration = 0;
    }
  }

  damp(a, b, rate, dt) {
    return a + (b - a) * (1 - Math.exp(-rate * dt));
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(`story-${sectionId}`);
    if (el && this.storyContainer) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
