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
  var progressBars = document.querySelectorAll('.project-progress-bar');
  var contactForm = document.getElementById('contact-form');
  var mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

  // ── State ───────────────────────────────────────────────────────
  var currentProject = 0;
  var totalProjects = panels.length;
  var autoPlayTimer = null;
  var AUTO_PLAY_INTERVAL = 12000; // 12 seconds — much slower
  var assetIndices = {}; // track current asset index per project

  // Project keys in order
  var projectKeys = ['aequs', 'distritozeta', 'bucefalo', 'onecar'];

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
      if (sec.offsetTop <= midPoint && sec.offsetTop + sec.offsetHeight > midPoint) {
        activeSection = sec;
      }
    });

    if (!activeSection) return;

    header.classList.remove('dark', 'scrolled');

    if (activeSection.id === 'projects') {
      header.classList.add('dark');
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
    if (track.dataset.initialized === 'true') return;

    var assets = JSON.parse(track.dataset.assets);
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
        img.alt = projectKey + ' asset ' + (i + 1);
        img.loading = (i === 0) ? 'eager' : 'lazy';
        div.appendChild(img);
      }

      track.appendChild(div);
    });

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

  // ═══════════════════════════════════════════════════════════════
  // PROJECT CAROUSEL (auto-rotating between projects)
  // ═══════════════════════════════════════════════════════════════

  function pauseAllVideos() {
    document.querySelectorAll('.project-panel video').forEach(function (v) {
      v.pause();
    });
  }

  function goToProject(index) {
    if (index < 0 || index >= totalProjects) index = 0;

    // Pause videos on current panel
    pauseAllVideos();

    currentProject = index;

    // Update panels
    panels.forEach(function (p, i) {
      p.classList.toggle('active', i === currentProject);
    });

    // Update tabs
    tabs.forEach(function (t, i) {
      t.classList.toggle('active', i === currentProject);
    });

    // Update progress bars
    progressBars.forEach(function (bar, i) {
      bar.classList.remove('active', 'completed');
      if (i < currentProject) {
        bar.classList.add('completed');
      } else if (i === currentProject) {
        bar.classList.add('active');
      }
    });

    // Initialize assets for the new panel
    var activePanel = panels[currentProject];
    initAssets(activePanel);

    // Reset asset to first
    var projectKey = projectKeys[currentProject];
    var track = activePanel.querySelector('.asset-track');
    var items = track.querySelectorAll('.asset-item');

    // Reset to first asset
    items.forEach(function (item, i) {
      item.classList.toggle('active', i === 0);
      var vid = item.querySelector('video');
      if (vid) vid.pause();
    });
    assetIndices[projectKey] = 0;

    var counterEl = activePanel.querySelector('.asset-counter-current');
    if (counterEl) counterEl.textContent = '1';

    // Play first video
    var firstVideo = items[0] ? items[0].querySelector('video') : null;
    if (firstVideo) {
      firstVideo.currentTime = 0;
      firstVideo.play().catch(function () {});
    }

    // Reset autoplay timer
    resetAutoPlay();
  }

  // Tab clicks
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () {
      goToProject(i);
    });
  });

  // Auto-play: rotate projects slowly
  function startAutoPlay() {
    autoPlayTimer = setInterval(function () {
      var next = (currentProject + 1) % totalProjects;
      goToProject(next);
    }, AUTO_PLAY_INTERVAL);
  }

  function pauseAutoPlay() {
    clearInterval(autoPlayTimer);
  }

  function resetAutoPlay() {
    pauseAutoPlay();
    // Restart progress bar animation
    var activeBar = progressBars[currentProject];
    if (activeBar) {
      activeBar.classList.remove('active');
      // Force reflow to restart CSS animation
      void activeBar.offsetWidth;
      activeBar.classList.add('active');
    }
    startAutoPlay();
  }

  // Set CSS variable for progress bar duration
  document.documentElement.style.setProperty('--auto-play-duration', AUTO_PLAY_INTERVAL + 'ms');

  // Initialize first project
  goToProject(0);

  // Pause autoplay when hovering projects section
  var projectsSection = document.getElementById('projects');
  projectsSection.addEventListener('mouseenter', pauseAutoPlay);
  projectsSection.addEventListener('mouseleave', resetAutoPlay);

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

})();
