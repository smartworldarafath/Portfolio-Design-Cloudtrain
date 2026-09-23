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
      // In Free Drive mode: Wheel drives the tram
      if (!this.isStoryMode) {
        e.preventDefault();
        const delta = e.deltaY;
        if (delta > 0) {
          // Scroll Down = Accelerate forward
          this.state.speed = Math.min(16, this.state.speed + 0.75);
          this.state.throttle = Math.min(1, this.state.throttle + 0.25);
          if (window.audioGesture) window.audioGesture();
        } else if (delta < 0) {
          // Scroll Up = Apply brake
          this.state.speed = Math.max(0, this.state.speed - 0.95);
          this.state.brake = Math.min(1, this.state.brake + 0.35);
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

    // Smoothly interpolate scroll progress towards target
    const prev = this.currentScrollProgress;
    this.currentScrollProgress += (this.targetScrollProgress - this.currentScrollProgress) * Math.min(1, dt * 4.5);

    // Map scroll progress (0..1) to route distance
    const targetDistance = this.currentScrollProgress * this.routeLength;
    const diff = targetDistance - (this.state.distance % this.routeLength);

    // If tram was stopped at station but user is scrolling away, release station lock
    if (this.state.mode === 'station' && Math.abs(diff) > 2.5) {
      this.state.mode = 'driving';
      this.state.stationTime = 0;
      this.state.stationBoarded = true;
    }

    // Set virtual speed for wheel and suspension effects
    const delta = this.currentScrollProgress - prev;
    const scrollSpeed = Math.abs(delta) / Math.max(dt, 0.001) * this.routeLength;
    this.state.speed = Math.min(18, scrollSpeed * 0.45);

    // Smoothly ease distance along route
    if (Math.abs(diff) > 0.01) {
      this.state.distance += diff * Math.min(1, dt * 5.0);
    }
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(`story-${sectionId}`);
    if (el && this.storyContainer) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }
}
