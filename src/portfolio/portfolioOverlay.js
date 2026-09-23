// Portfolio Overlay & Interaction Manager for Cloud Rail
export class PortfolioOverlay {
  constructor(scrollController) {
    this.scrollCtrl = scrollController;
    this.isStoryMode = true;

    this.container = document.getElementById('portfolio-story-container');
    this.modeBtn = document.getElementById('mode-toggle-btn');
    this.modeText = document.getElementById('mode-btn-text');
    this.navPills = document.querySelectorAll('.nav-pill');
    this.sections = document.querySelectorAll('.story-section');
    const hud = document.getElementById('driving-hud');
    if (hud) hud.classList.add('story-active');

    this.initEvents();
  }

  initEvents() {
    // Mode toggle button click
    if (this.modeBtn) {
      this.modeBtn.addEventListener('click', () => {
        this.toggleMode();
      });
    }

    // Keyboard shortcut 'Tab' to toggle mode
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Tab' && !e.target.matches('input, textarea, select')) {
        e.preventDefault();
        this.toggleMode();
      }
    });

    // Topbar navigation pills
    this.navPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const target = pill.getAttribute('data-target');
        if (target) {
          if (!this.isStoryMode) {
            this.setMode(true);
          }
          this.scrollTo(target);
        }
      });
    });

    // Global helper for HTML onclick handlers
    window.portfolioScrollTo = (sectionId) => this.scrollTo(sectionId);
    window.setPortfolioMode = (mode) => this.setMode(mode === 'story');

    // Observe active section to update topbar pills
    if (this.container) {
      this.container.addEventListener('scroll', () => {
        this.updateActiveNav();
      }, { passive: true });
    }
  }

  toggleMode() {
    this.setMode(!this.isStoryMode);
  }

  setMode(storyMode) {
    this.isStoryMode = storyMode;
    this.scrollCtrl.setMode(storyMode);
    const hud = document.getElementById('driving-hud');

    if (storyMode) {
      this.container.classList.remove('drive-mode-active');
      this.modeBtn.classList.remove('drive-mode');
      this.modeText.textContent = 'Scroll Story';
      if (hud) hud.classList.add('story-active');
      if (window.toast) window.toast('Scroll Story Mode: Scroll to travel through my work.', 3.5);
    } else {
      this.container.classList.add('drive-mode-active');
      this.modeBtn.classList.add('drive-mode');
      this.modeText.textContent = 'Free Drive';
      if (hud) hud.classList.remove('story-active');
      if (window.toast) window.toast("Free Drive Mode: Use Mouse Wheel or W/S to cruise the rails freely.", 3.5);
    }
  }

  scrollTo(sectionId) {
    this.scrollCtrl.scrollToSection(sectionId);
  }

  updateActiveNav() {
    const scrollMiddle = this.container.scrollTop + this.container.clientHeight / 2;
    let currentSection = null;

    this.sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      if (scrollMiddle >= top && scrollMiddle <= top + height) {
        currentSection = section.getAttribute('data-section');
      }
    });

    if (currentSection) {
      this.navPills.forEach(pill => {
        if (pill.getAttribute('data-target') === currentSection) {
          pill.classList.add('active');
        } else {
          pill.classList.remove('active');
        }
      });
    }
  }
}
