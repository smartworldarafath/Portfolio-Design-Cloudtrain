// Smooth Scroll & Gesture Controller for Cloud Rail
export class ScrollController {
  constructor(engineState, routeLength) {
    this.state = engineState;
    this.routeLength = routeLength;
    this.scrollVelocity = 0;
    this.isStoryMode = true;
    this.storyContainer = document.getElementById('portfolio-story-container');

    // Initialize progress to match starting tram distance
    const initialProgress = ((engineState.distance % routeLength) + routeLength) % routeLength / routeLength;
    this.targetScrollProgress = initialProgress;
    this.currentScrollProgress = initialProgress;

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
      // Sync story scroll bar with current tram distance
      const progress = ((this.state.distance % this.routeLength) + this.routeLength) % this.routeLength / this.routeLength;
      this.currentScrollProgress = progress;
      this.targetScrollProgress = progress;
      const maxScroll = this.storyContainer.scrollHeight - this.storyContainer.clientHeight;
      if (maxScroll > 0) {
        this.storyContainer.scrollTop = progress * maxScroll;
      }
    }
  }

  update(dt) {
    if (!this.isStoryMode) return;

    // Calm, relaxed interpolation for story scroll (never jerky)
    this.currentScrollProgress += (this.targetScrollProgress - this.currentScrollProgress) * Math.min(1, dt * 2.2);

    // Map scroll progress (0..1) to route distance
    const targetDistance = this.currentScrollProgress * this.routeLength;
    let diff = targetDistance - (this.state.distance % this.routeLength);

    // Handle cyclic loop difference
    if (diff > this.routeLength / 2) diff -= this.routeLength;
    if (diff < -this.routeLength / 2) diff += this.routeLength;

    // If tram was stopped at station but user is scrolling away, release station lock
    if (this.state.mode === 'station' && Math.abs(diff) > 2.5) {
      this.state.mode = 'driving';
      this.state.stationTime = 0;
      this.state.stationBoarded = true;
    }

    // Limit maximum tram movement speed: gentle scenic cruise (max ~4.2 m/s or ~15 km/h)
    const maxSpeedMetersPerSec = 4.2;
    const maxStep = maxSpeedMetersPerSec * dt;
    const step = Math.sign(diff) * Math.min(Math.abs(diff * 2.2 * dt), maxStep);

    if (Math.abs(diff) > 0.01) {
      this.state.distance += step;
      // Set gentle realistic speedometer display
      const computedSpeed = (Math.abs(step) / Math.max(dt, 0.001)) * 3.6;
      this.state.speed = Math.min(15, computedSpeed * 0.75);
    } else {
      this.state.speed = Math.max(0, this.state.speed - dt * 2.5);
    }
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(`story-${sectionId}`);
    if (el && this.storyContainer) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
