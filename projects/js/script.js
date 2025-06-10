class Projects {
  constructor() {
    this.isLoaded = false;
    this.particles = [];
    this.animationFrameId = null;
    this.resizeTimeout = null;
    this.scrollTimeout = null;
    
    this.config = {
      particleCount: this.getOptimalParticleCount(),
      animationSpeed: 0.02,
      floatRange: 30,
      fadeThreshold: 0.8
    };
    
    this.init();
  }

  init() {
    this.detectCapabilities();
    this.showLoader();
    this.bindEvents();
    this.createParticleSystem();
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.onDOMReady());
    } else {
      this.onDOMReady();
    }
  }

  detectCapabilities() {
    this.supportsIntersectionObserver = 'IntersectionObserver' in window;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isHighPerformanceDevice = this.checkDevicePerformance();
    
    if (this.prefersReducedMotion) {
      this.config.particleCount = 0;
      this.config.animationSpeed = 0;
    }
    
    if (!this.isHighPerformanceDevice) {
      this.config.particleCount = Math.floor(this.config.particleCount * 0.5);
    }
  }

  checkDevicePerformance() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    
    if (!gl) return false;
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    
    return !(
      /mobile|android|iphone|ipad/i.test(navigator.userAgent) ||
      renderer.toLowerCase().includes('intel') ||
      navigator.hardwareConcurrency < 4
    );
  }

  getOptimalParticleCount() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const area = width * height;
    
    if (area < 500000) return 15; 
    if (area < 1000000) return 30; 
    return 50;
  }

  showLoader() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
      overlay.classList.remove('hidden');
    }
  }

  hideLoader() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
        this.isLoaded = true;
        this.triggerCardAnimations();
      }, 500);
    }
  }

  onDOMReady() {
    setTimeout(() => {
      this.hideLoader();
      this.initializeCards();
      this.setupScrollObserver();
      this.startAnimationLoop();
    }, 800);
  }

  bindEvents() {
    let scrollTicking = false;
    window.addEventListener('scroll', () => {
      if (!scrollTicking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          scrollTicking = false;
        });
        scrollTicking = true;
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => this.handleResize(), 250);
    });

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    mediaQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
      this.updateAnimationSettings();
    });

    document.addEventListener('keydown', (e) => this.handleKeyboard(e));

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  }

  handleScroll() {
    this.updateProgressBar();
    this.updateParticleOpacity();
  }

  updateProgressBar() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = Math.min((scrollTop / docHeight) * 100, 100);
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
      progressBar.style.width = `${progress}%`;
    }
  }

  updateParticleOpacity() {
    if (this.prefersReducedMotion) return;
    
    const scrollPercent = window.pageYOffset / (document.body.scrollHeight - window.innerHeight);
    const opacity = Math.max(0.1, 1 - scrollPercent * 0.7);
    
    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
      particlesContainer.style.opacity = opacity;
    }
  }

  handleResize() {
    this.config.particleCount = this.getOptimalParticleCount();
    this.recreateParticles();
    this.repositionElements();
  }

  handleKeyboard(e) {
    switch (e.key) {
      case 'Escape':
        this.closeAllModals();
        break;
      case 'Tab':
        this.handleTabNavigation(e);
        break;
    }
  }

  createParticleSystem() {
    if (this.config.particleCount === 0 || this.prefersReducedMotion) return;

    const container = document.getElementById('particles');
    if (!container) return;

    container.innerHTML = '';
    this.particles = [];

    const fragment = document.createDocumentFragment();

    for (let i = 0; i < this.config.particleCount; i++) {
      const particle = this.createParticle(i);
      fragment.appendChild(particle.element);
      this.particles.push(particle);
    }

    container.appendChild(fragment);
  }

  createParticle(index) {
    const element = document.createElement('div');
    element.className = 'particle';
    
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    const size = Math.random() * 2 + 1;
    const speed = Math.random() * 0.5 + 0.2;
    const phase = Math.random() * Math.PI * 2;
    
    const particle = {
      element,
      x,
      y,
      baseY: y,
      size,
      speed,
      phase,
      opacity: Math.random() * 0.5 + 0.3,
      time: 0
    };

    this.updateParticleElement(particle);
    
    return particle;
  }

  updateParticleElement(particle) {
    const { element, x, y, size, opacity } = particle;
    element.style.cssText = `
      left: ${x}px;
      top: ${y}px;
      width: ${size}px;
      height: ${size}px;
      opacity: ${opacity};
      position: absolute;
      background: rgba(139, 92, 246, ${opacity});
      border-radius: 50%;
      pointer-events: none;
    `;
  }

  startAnimationLoop() {
    if (this.prefersReducedMotion || this.config.particleCount === 0) return;

    const animate = (timestamp) => {
      this.updateParticles(timestamp);
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  updateParticles(timestamp) {
    if (!this.isLoaded || document.hidden) return;

    this.particles.forEach(particle => {
      particle.time += this.config.animationSpeed;
      
      particle.y = particle.baseY + Math.sin(particle.time + particle.phase) * this.config.floatRange;
      
      particle.x += Math.sin(particle.time * 0.5) * 0.5;
      
      if (particle.x < -10) particle.x = window.innerWidth + 10;
      if (particle.x > window.innerWidth + 10) particle.x = -10;
      
      particle.opacity = 0.3 + Math.sin(particle.time * 0.8) * 0.2;
      
      this.updateParticleElement(particle);
    });
  }

  pauseAnimations() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  resumeAnimations() {
    if (!this.animationFrameId && !this.prefersReducedMotion) {
      this.startAnimationLoop();
    }
  }

  recreateParticles() {
    this.pauseAnimations();
    this.createParticleSystem();
    this.resumeAnimations();
  }

  initializeCards() {
    const cards = document.querySelectorAll('.project-card');
    
    cards.forEach((card, index) => {
      this.enhanceCard(card, index);
      
      if (!this.prefersReducedMotion) {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
      }
    });
  }

  enhanceCard(card, index) {
    card.addEventListener('click', (e) => this.handleCardClick(e, card));
    
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.handleCardClick(e, card);
      }
    });

    if (!this.prefersReducedMotion) {
      card.addEventListener('mouseenter', () => this.onCardHover(card, true));
      card.addEventListener('mouseleave', () => this.onCardHover(card, false));
    }

    const techTags = card.querySelectorAll('.tech-tag');
    techTags.forEach(tag => {
      tag.addEventListener('click', (e) => {
        e.stopPropagation();
        this.handleTechTagClick(tag);
      });
    });
  }

  handleCardClick(e, card) {
    e.preventDefault();
    
    const primaryLink = card.querySelector('.project-link[href]:not([href="#"])');
    if (primaryLink) {
      window.open(primaryLink.href, '_blank', 'noopener,noreferrer');
    }
    
    this.addClickFeedback(card);
  }

  onCardHover(card, isEntering) {
    if (this.prefersReducedMotion) return;
    
    const image = card.querySelector('.project-image img');
    const techTags = card.querySelectorAll('.tech-tag');
    
    if (isEntering) {
      card.style.transform = 'translateY(-10px) scale(1.02)';
      if (image) image.style.transform = 'scale(1.1)';
      
      techTags.forEach((tag, i) => {
        setTimeout(() => {
          tag.style.transform = 'translateY(-2px)';
        }, i * 50);
      });
    } else {
      card.style.transform = 'translateY(0) scale(1)';
      if (image) image.style.transform = 'scale(1)';
      
      techTags.forEach(tag => {
        tag.style.transform = 'translateY(0)';
      });
    }
  }

  handleTechTagClick(tag) {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(139, 92, 246, 0.3);
      pointer-events: none;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      width: 20px;
      height: 20px;
      left: 50%;
      top: 50%;
      margin-left: -10px;
      margin-top: -10px;
    `;
    
    tag.style.position = 'relative';
    tag.appendChild(ripple);
    
    setTimeout(() => ripple.remove(), 600);
    
    this.showTechInfo(tag.textContent.trim());
  }

  addClickFeedback(card) {
    if (this.prefersReducedMotion) return;
    
    card.style.transform = 'scale(0.98)';
    setTimeout(() => {
      card.style.transform = '';
    }, 150);
  }

  setupScrollObserver() {
    if (!this.supportsIntersectionObserver) {
      this.triggerCardAnimations();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCardIn(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    document.querySelectorAll('.project-card').forEach(card => {
      observer.observe(card);
    });
  }

  animateCardIn(card) {
    if (this.prefersReducedMotion) {
      card.style.opacity = '1';
      card.style.transform = 'none';
      return;
    }

    const delay = Array.from(card.parentNode.children).indexOf(card) * 100;
    
    setTimeout(() => {
      card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0)';
    }, delay);
  }

  triggerCardAnimations() {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach((card, index) => {
      setTimeout(() => this.animateCardIn(card), index * 100);
    });
  }

  showTechInfo(tech) {
    const existingTooltip = document.querySelector('.tech-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tech-tooltip';
    tooltip.textContent = `Click to learn more about ${tech}`;
    tooltip.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(139, 92, 246, 0.9);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      z-index: 1000;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(tooltip);
    
    requestAnimationFrame(() => tooltip.style.opacity = '1');
    
    setTimeout(() => {
      tooltip.style.opacity = '0';
      setTimeout(() => tooltip.remove(), 300);
    }, 2000);
  }

  repositionElements() {
    this.particles.forEach(particle => {
      if (particle.x > window.innerWidth) {
        particle.x = Math.random() * window.innerWidth;
      }
      if (particle.baseY > window.innerHeight) {
        particle.baseY = Math.random() * window.innerHeight;
      }
    });
  }

  updateAnimationSettings() {
    if (this.prefersReducedMotion) {
      this.pauseAnimations();
      this.config.particleCount = 0;
      this.recreateParticles();
    } else {
      this.config.particleCount = this.getOptimalParticleCount();
      this.recreateParticles();
      this.resumeAnimations();
    }
  }

  closeAllModals() {
    const expandedCards = document.querySelectorAll('.project-card.expanded');
    expandedCards.forEach(card => card.classList.remove('expanded'));
  }

  handleTabNavigation(e) {
    const focusableElements = document.querySelectorAll(
      'a, button, [tabindex]:not([tabindex="-1"]), .project-card'
    );
    
    const currentIndex = Array.from(focusableElements).indexOf(document.activeElement);
    
    if (e.shiftKey && currentIndex === 0) {
      e.preventDefault();
      focusableElements[focusableElements.length - 1].focus();
    } else if (!e.shiftKey && currentIndex === focusableElements.length - 1) {
      e.preventDefault();
      focusableElements[0].focus();
    }
  }

  destroy() {
    this.pauseAnimations();
    
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);
    if (this.scrollTimeout) clearTimeout(this.scrollTimeout);
    
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('keydown', this.handleKeyboard);
  }
}

const portfolio = new Projects();

const additionalStyles = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
  
  .tech-tooltip {
    font-family: 'Space Grotesk', sans-serif;
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  }
  
  .project-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .project-card:focus {
    outline: 2px solid #8b5cf6;
    outline-offset: 4px;
  }
  
  @media (prefers-reduced-motion: reduce) {
    .project-card {
      transition: none !important;
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
