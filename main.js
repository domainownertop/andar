/* ═══════════════════════════════════════════════════════════════════
   ANDAR — Main JavaScript
   Snap scroll, project carousel, asset navigation, form handling
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── DOM References ──────────────────────────────────────────────
  var header = document.getElementById('header');
  var hamburger = document.getElementById('nav-hamburger');
  var mobileOverlay = document.getElementById('mobile-nav-overlay');
  var snapContainer = document.getElementById('snap-container');
  var tabs = document.querySelectorAll('.project-tab');
  var panels = document.querySelectorAll('.project-panel');
  var contactForm = document.getElementById('contact-form');
  var mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // ── State ───────────────────────────────────────────────────────
  var assetIndices = {}; // track current asset index per project

  // Project IDs in order
  var projectIds = ['project-aequs', 'project-distritozeta', 'project-bucefalo', 'project-onecar'];

  // ═══════════════════════════════════════════════════════════════
  // HEADER THEME BASED ON VISIBLE SECTION
  // ═══════════════════════════════════════════════════════════════

  function updateHeaderTheme() {
    var sections = snapContainer.querySelectorAll('.snap-section');
    var scrollTop = snapContainer.scrollTop;
    var viewportH = snapContainer.clientHeight;
    var midPoint = scrollTop + viewportH / 2;

    var activeSection = null;
    sections.forEach(function (sec) {
      sec.classList.remove('active'); // Limpiamos primero
      if (sec.offsetTop <= midPoint && sec.offsetTop + sec.offsetHeight > midPoint) {
        activeSection = sec;
      }
    });
    
    if (activeSection) {
      activeSection.classList.add('active'); // Marcamos la actual
      header.classList.remove('dark', 'scrolled');
      if (activeSection.classList.contains('projects')) {
        header.classList.add('dark');
      }
    }
    // On hero or contact (gold), no dark class
  }

  snapContainer.addEventListener('scroll', updateHeaderTheme, { passive: true });

  // ═══════════════════════════════════════════════════════════════
  // MOBILE NAVIGATION
  // ═══════════════════════════════════════════════════════════════

  function closeMobileNav() {
    hamburger.classList.remove('active');
    mobileOverlay.classList.remove('active');
    hamburger.setAttribute('aria-expanded', 'false');
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.classList.contains('active');
      hamburger.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', String(!isOpen));
    });
  }

  mobileNavLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      closeMobileNav();
      var targetId = link.getAttribute('href').slice(1);
      var targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // NAV LINK SCROLL (desktop)
  // ═══════════════════════════════════════════════════════════════

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.getAttribute('href').slice(1);
      var targetSection = document.getElementById(targetId);
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // ASSET CAROUSEL (per-project inner carousel)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Initialize asset elements for a given project panel.
   * Lazily creates DOM elements from the data-assets JSON.
   */
  function initAssets(panel) {
    var track = panel.querySelector('.asset-track');
    if (!track || track.dataset.initialized === 'true') return;

    var assets = [];
    try {
      assets = JSON.parse(track.dataset.assets || '[]');
    } catch (e) {
      console.error('Error parsing assets for panel:', panel, e);
      return;
    }

    if (assets.length === 0) return;

    var projectKey = panel.dataset.project;
    assetIndices[projectKey] = 0;

    // Update total counter
    var totalEl = panel.querySelector('.asset-counter-total');
    if (totalEl) totalEl.textContent = assets.length;

    assets.forEach(function (asset, i) {
      var div = document.createElement('div');
      div.className = 'asset-item' + (i === 0 ? ' active' : '');

      if (asset.type === 'video') {
        var video = document.createElement('video');
        video.src = asset.src;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.autoplay = (i === 0);
        video.preload = (i === 0) ? 'auto' : 'metadata';
        video.setAttribute('playsinline', '');
        div.appendChild(video);
      } else {
        var img = document.createElement('img');
        img.src = asset.src;
        img.alt = (projectKey || 'project') + ' asset ' + (i + 1);
        img.loading = (i === 0) ? 'eager' : 'lazy';
        div.appendChild(img);
      }

      track.appendChild(div);
    });

    // Create indicators (segments)
    var indicatorsContainer = document.createElement('div');
    indicatorsContainer.className = 'asset-indicators';
    assets.forEach(function (_, i) {
      var dot = document.createElement('div');
      dot.className = 'indicator-segment' + (i === 0 ? ' active' : '');
      indicatorsContainer.appendChild(dot);
    });
    panel.querySelector('.slide-info').appendChild(indicatorsContainer);

    track.dataset.initialized = 'true';

    // Start first video if applicable
    var firstItem = track.querySelector('.asset-item.active video');
    if (firstItem) {
      firstItem.play().catch(function () {});
    }
  }

  /**
   * Navigate asset within a project panel
   */
  function goToAsset(panel, direction) {
    var track = panel.querySelector('.asset-track');
    var items = track.querySelectorAll('.asset-item');
    var projectKey = panel.dataset.project;
    var current = assetIndices[projectKey] || 0;

    // Pause current video
    var currentVideo = items[current].querySelector('video');
    if (currentVideo) currentVideo.pause();

    items[current].classList.remove('active');

    // Calculate next index (wrap around)
    var next;
    if (direction === 'next') {
      next = (current + 1) % items.length;
    } else {
      next = (current - 1 + items.length) % items.length;
    }

    items[next].classList.add('active');
    assetIndices[projectKey] = next;

    // Update counter
    var counterEl = panel.querySelector('.asset-counter-current');
    if (counterEl) counterEl.textContent = next + 1;

    // Play next video if applicable
    var nextVideo = items[next].querySelector('video');
    if (nextVideo) {
      nextVideo.currentTime = 0;
      nextVideo.play().catch(function () {});
    }

    // Update indicators
    var indicators = panel.querySelectorAll('.indicator-segment');
    indicators.forEach(function (dot, i) {
      dot.classList.toggle('active', i === next);
    });
  }

  // Wire up asset arrows for all panels
  panels.forEach(function (panel) {
    var prevArrow = panel.querySelector('.asset-arrow--prev');
    var nextArrow = panel.querySelector('.asset-arrow--next');

    if (prevArrow) {
      prevArrow.addEventListener('click', function (e) {
        e.stopPropagation();
        goToAsset(panel, 'prev');
      });
    }
    if (nextArrow) {
      nextArrow.addEventListener('click', function (e) {
        e.stopPropagation();
        goToAsset(panel, 'next');
      });
    }
  });

  // Touch swipe for assets
  panels.forEach(function (panel) {
    var carousel = panel.querySelector('.asset-carousel');
    var touchStartX = 0;
    var touchEndX = 0;

    carousel.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carousel.addEventListener('touchend', function (e) {
      touchEndX = e.changedTouches[0].screenX;
      var diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        goToAsset(panel, diff > 0 ? 'next' : 'prev');
      }
    }, { passive: true });
  });

  /**
   * Navigate to a project block by ID
   */
  function scrollToProject(projectId) {
    console.log('Scrolling to:', projectId);
    var target = document.getElementById(projectId);
    if (!target) return;

    if (snapContainer && snapContainer.scrollHeight > snapContainer.clientHeight) {
      var containerRect = snapContainer.getBoundingClientRect();
      var targetRect = target.getBoundingClientRect();
      var relativeTop = targetRect.top - containerRect.top + snapContainer.scrollTop;

      snapContainer.scrollTo({
        top: relativeTop,
        behavior: 'smooth'
      });
    } else {
      // Fallback for window scroll
      target.scrollIntoView({ behavior: 'smooth' });
    }
  }

  // Tab clicks: scroll to the relevant section
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      var projectKey = tab.dataset.project;
      console.log('Tab clicked:', projectKey, 'Current active:', tab.classList.contains('active'));

      if (tab.classList.contains('active')) {
        return;
      }
      
      scrollToProject('project-' + projectKey);
    });
  });

  // Initialize all project assets on load
  console.log('Found panels:', panels.length);
  panels.forEach(function (panel, idx) {
    console.log('Initializing panel', idx, panel.dataset.project);
    initAssets(panel);
  });

  // ═══════════════════════════════════════════════════════════════
  // SCROLL ANIMATIONS (Intersection Observer)
  // ═══════════════════════════════════════════════════════════════

  var animateElements = ['.contact-title', '.contact-form', '.footer-container'];

  animateElements.forEach(function (selector) {
    var el = document.querySelector(selector);
    if (el) el.classList.add('fade-in');
  });

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
      root: snapContainer
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
      var originalText = submitBtn.textContent.trim();

      submitBtn.textContent = 'E N V I A N D O . . .';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Encode form data as required by Netlify Forms
      var formData = new FormData(contactForm);
      var encoded = new URLSearchParams(formData).toString();

      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encoded
      })
        .then(function () {
          submitBtn.textContent = '✓  E N V I A D O';
          submitBtn.style.background = '#2E7D32';
          submitBtn.style.opacity = '1';
          contactForm.reset();

          setTimeout(function () {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
          }, 3000);
        })
        .catch(function () {
          submitBtn.textContent = '✗  ERROR — INTÉNTALO DE NUEVO';
          submitBtn.style.background = '#C62828';
          submitBtn.style.opacity = '1';

          setTimeout(function () {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            submitBtn.style.background = '';
          }, 3000);
        });
    });
  }

  // Initialize
  updateHeaderTheme();
})();
