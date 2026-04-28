/* ═══════════════════════════════════════════════════════════════════
   ANDAR — Main JavaScript
   Carousel, scroll animations, navigation, and form handling
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────────────
  const header = document.querySelector('.header');
  const hamburger = document.getElementById('nav-hamburger');
  const mobileOverlay = document.getElementById('mobile-nav-overlay');
  const carouselTrack = document.getElementById('carousel-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const tabs = document.querySelectorAll('.project-tab');
  const slides = document.querySelectorAll('.carousel-slide');
  const contactForm = document.getElementById('contact-form');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // ── State ───────────────────────────────────────────────────────
  let currentSlide = 0;
  const totalSlides = slides.length;
  let touchStartX = 0;
  let touchEndX = 0;
  let isDragging = false;
  let autoPlayTimer = null;
  const AUTO_PLAY_INTERVAL = 6000;

  // ═══════════════════════════════════════════════════════════════
  // HEADER SCROLL BEHAVIOR
  // ═══════════════════════════════════════════════════════════════

  function updateHeader() {
    const scrollY = window.scrollY;
    const heroHeight = document.getElementById('hero').offsetHeight;
    const projectsSection = document.getElementById('projects');
    const projectsTop = projectsSection ? projectsSection.offsetTop : heroHeight;
    const contactSection = document.getElementById('contact');
    const contactTop = contactSection ? contactSection.offsetTop : Infinity;

    if (scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    // Dark header when over projects section
    if (scrollY + 100 > projectsTop && scrollY + 100 < contactTop) {
      header.classList.add('dark');
    } else {
      header.classList.remove('dark');
    }
  }

  window.addEventListener('scroll', updateHeader, { passive: true });

  // ═══════════════════════════════════════════════════════════════
  // MOBILE NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      const isOpen = hamburger.classList.contains('active');
      hamburger.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', !isOpen);
      document.body.style.overflow = isOpen ? '' : 'hidden';
    });
  }

  // Close mobile nav on link click
  mobileNavLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      hamburger.classList.remove('active');
      mobileOverlay.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // CAROUSEL
  // ═══════════════════════════════════════════════════════════════

  function goToSlide(index) {
    if (index < 0 || index >= totalSlides) return;

    currentSlide = index;
    carouselTrack.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';

    // Update tabs
    tabs.forEach(function (tab, i) {
      tab.classList.toggle('active', i === currentSlide);
    });

    // Update arrows
    prevBtn.disabled = currentSlide === 0;
    nextBtn.disabled = currentSlide === totalSlides - 1;

    // Reset autoplay
    resetAutoPlay();
  }

  // Tab clicks
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      var index = parseInt(tab.dataset.index, 10);
      goToSlide(index);
    });
  });

  // Arrow clicks
  prevBtn.addEventListener('click', function () {
    goToSlide(currentSlide - 1);
  });

  nextBtn.addEventListener('click', function () {
    goToSlide(currentSlide + 1);
  });

  // Touch/swipe support
  var carousel = document.getElementById('carousel');

  carousel.addEventListener('touchstart', function (e) {
    touchStartX = e.changedTouches[0].screenX;
    isDragging = true;
    pauseAutoPlay();
  }, { passive: true });

  carousel.addEventListener('touchmove', function (e) {
    if (!isDragging) return;
    touchEndX = e.changedTouches[0].screenX;
  }, { passive: true });

  carousel.addEventListener('touchend', function () {
    if (!isDragging) return;
    isDragging = false;

    var diff = touchStartX - touchEndX;
    var threshold = 60;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentSlide < totalSlides - 1) {
        goToSlide(currentSlide + 1);
      } else if (diff < 0 && currentSlide > 0) {
        goToSlide(currentSlide - 1);
      }
    }

    resetAutoPlay();
  }, { passive: true });

  // Keyboard navigation
  carousel.setAttribute('tabindex', '0');
  carousel.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goToSlide(currentSlide - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goToSlide(currentSlide + 1);
    }
  });

  // Auto-play
  function startAutoPlay() {
    autoPlayTimer = setInterval(function () {
      var next = (currentSlide + 1) % totalSlides;
      goToSlide(next);
    }, AUTO_PLAY_INTERVAL);
  }

  function pauseAutoPlay() {
    clearInterval(autoPlayTimer);
  }

  function resetAutoPlay() {
    pauseAutoPlay();
    startAutoPlay();
  }

  // Initialize carousel
  goToSlide(0);
  startAutoPlay();

  // Pause autoplay on hover
  carousel.addEventListener('mouseenter', pauseAutoPlay);
  carousel.addEventListener('mouseleave', resetAutoPlay);

  // ═══════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS (Intersection Observer)
  // ═══════════════════════════════════════════════════════════════

  // Add fade-in class to elements
  var animateElements = [
    '.contact-title',
    '.contact-form',
    '.footer-container'
  ];

  animateElements.forEach(function (selector) {
    var el = document.querySelector(selector);
    if (el) el.classList.add('fade-in');
  });

  // Observe
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.fade-in').forEach(function (el) {
      observer.observe(el);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CONTACT FORM
  // ═══════════════════════════════════════════════════════════════

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();

      var submitBtn = document.getElementById('form-submit');
      var originalText = submitBtn.textContent;

      submitBtn.textContent = 'E N V I A N D O . . .';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Simulate form submission
      setTimeout(function () {
        submitBtn.textContent = '✓  E N V I A D O';
        submitBtn.style.background = '#2E7D32';

        setTimeout(function () {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
          submitBtn.style.background = '';
          contactForm.reset();
        }, 2500);
      }, 1500);
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // SMOOTH SCROLL FOR NAV LINKS
  // ═══════════════════════════════════════════════════════════════

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        var offsetTop = target.offsetTop - 80;
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });

})();
