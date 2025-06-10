    function createParticles() {
      const particlesContainer = document.getElementById('particles');
      const particleCount = window.innerWidth < 768 ? 25 : 50;

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
      }
    }

    let ticking = false;
    function updateProgressBar() {
      if (!ticking) {
        requestAnimationFrame(function() {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const docHeight = document.body.scrollHeight - window.innerHeight;
          const scrollPercent = Math.min((scrollTop / docHeight) * 100, 100);
          document.getElementById('progressBar').style.width = scrollPercent + '%';
          ticking = false;
        });
        ticking = true;
      }
    }

    function addTechItemListeners() {
      const techItems = document.querySelectorAll('.tech-item');
      techItems.forEach(item => {
        item.addEventListener('click', function() {
          this.style.transform = 'scale(0.95)';
          setTimeout(() => {
            this.style.transform = '';
          }, 150);
        });

        item.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.click();
          }
        });

        item.addEventListener('touchstart', function() {
          this.style.transform = 'scale(0.98)';
        }, { passive: true });

        item.addEventListener('touchend', function() {
          this.style.transform = '';
        }, { passive: true });
      });
    }

    function initializeAnimations() {
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
              observer.unobserve(entry.target);
            }
          });
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.fade-in').forEach(el => {
          observer.observe(el);
        });
      } else {
        document.querySelectorAll('.fade-in').forEach(el => {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
      }
    }

    function preloadResources() {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
      link.as = 'style';
      document.head.appendChild(link);
    }

    function handleReducedMotion() {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      
      if (prefersReducedMotion.matches) {
        document.querySelectorAll('.particle').forEach(particle => {
          particle.style.animation = 'none';
        });
      }
    }

    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    const handleResize = debounce(() => {
      const particles = document.getElementById('particles');
      if (particles.children.length !== (window.innerWidth < 768 ? 25 : 50)) {
        particles.innerHTML = '';
        createParticles();
      }
    }, 250);

    function initializeApp() {
      preloadResources();
      createParticles();
      addTechItemListeners();
      initializeAnimations();
      handleReducedMotion();
      
      window.addEventListener('scroll', updateProgressBar, { passive: true });
      window.addEventListener('resize', handleResize, { passive: true });
      
      updateProgressBar();
      
      if (CSS.supports('scroll-behavior', 'smooth')) {
        document.documentElement.style.scrollBehavior = 'smooth';
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initializeApp);
    } else {
      initializeApp();
    }

    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        document.body.style.opacity = '1';
      });
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
      });
    }