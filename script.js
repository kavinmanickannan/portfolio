/* ═══════════════════════════════════════════════════════
   KAVIN MANICKANNAN — PORTFOLIO
   Page behaviour: preferences panel, nav, reveal, counters
═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  var DEFAULTS = { theme: 'auto', accent: 'green', effect: 'mesh-gradient', motion: 'on' };
  var STORAGE_PREFIX = 'km-';

  function store(key, value) {
    try { localStorage.setItem(STORAGE_PREFIX + key, value); } catch (e) {}
  }

  function getPrefs() {
    return {
      theme: root.dataset.theme,
      accent: root.dataset.accent,
      effect: root.dataset.effect,
      motion: root.dataset.motion
    };
  }

  /* ── PREFERENCES ─────────────────────────────────────── */
  var prefButtons = document.querySelectorAll('[data-pref]');

  function syncPrefButtons() {
    prefButtons.forEach(function (btn) {
      var on = root.dataset[btn.dataset.pref] === btn.dataset.value;
      btn.setAttribute('aria-checked', on ? 'true' : 'false');
      btn.tabIndex = on ? 0 : -1;
    });
  }

  function setPref(key, value) {
    if (root.dataset[key] === value) return;
    root.dataset[key] = value;
    store(key, value);
    syncPrefButtons();
    updateThemeColor();
    document.dispatchEvent(new CustomEvent('prefs:change', { detail: { key: key, prefs: getPrefs() } }));
  }

  prefButtons.forEach(function (btn) {
    btn.addEventListener('click', function () { setPref(btn.dataset.pref, btn.dataset.value); });
  });

  // Arrow keys move within each radio group
  document.querySelectorAll('[role="radiogroup"]').forEach(function (group) {
    group.addEventListener('keydown', function (e) {
      var keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
      if (keys.indexOf(e.key) < 0) return;
      e.preventDefault();
      var items = Array.prototype.slice.call(group.querySelectorAll('[role="radio"]'));
      var i = items.indexOf(document.activeElement);
      var step = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : -1;
      var next = items[(i + step + items.length) % items.length];
      next.focus();
      next.click();
    });
  });

  document.getElementById('prefReset').addEventListener('click', function () {
    Object.keys(DEFAULTS).forEach(function (k) { setPref(k, DEFAULTS[k]); });
  });

  // Browser chrome colour follows the resolved theme
  var darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  function updateThemeColor() {
    var dark = root.dataset.theme === 'dark' || (root.dataset.theme === 'auto' && darkQuery.matches);
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.setAttribute('content', dark ? '#111412' : '#f4f3ef');
    });
  }
  darkQuery.addEventListener('change', function () {
    updateThemeColor();
    if (root.dataset.theme === 'auto') {
      document.dispatchEvent(new CustomEvent('prefs:change', { detail: { key: 'theme', prefs: getPrefs() } }));
    }
  });

  syncPrefButtons();
  updateThemeColor();

  /* ── PERSONALISE PANEL ───────────────────────────────── */
  var panel = document.getElementById('personalise');
  var scrim = document.getElementById('scrim');
  var openBtn = document.getElementById('personaliseBtn');
  var closeBtn = document.getElementById('personaliseClose');
  var lastFocus = null;

  function openPanel() {
    lastFocus = document.activeElement;
    panel.hidden = false;
    scrim.hidden = false;
    requestAnimationFrame(function () {
      panel.classList.add('is-open');
      scrim.classList.add('is-open');
    });
    document.body.classList.add('panel-open');
    openBtn.setAttribute('aria-expanded', 'true');
    var current = panel.querySelector('[aria-checked="true"]');
    (current || closeBtn).focus();
    document.dispatchEvent(new CustomEvent('personalise:open'));
  }

  function closePanel() {
    panel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.body.classList.remove('panel-open');
    openBtn.setAttribute('aria-expanded', 'false');
    setTimeout(function () { panel.hidden = true; scrim.hidden = true; }, 250);
    document.dispatchEvent(new CustomEvent('personalise:close'));
    if (lastFocus) lastFocus.focus();
  }

  openBtn.setAttribute('aria-expanded', 'false');
  openBtn.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);
  scrim.addEventListener('click', closePanel);

  document.addEventListener('keydown', function (e) {
    if (panel.hidden) return;
    if (e.key === 'Escape') { closePanel(); return; }
    if (e.key !== 'Tab') return;
    // Keep focus inside the panel while it is open
    var focusable = Array.prototype.filter.call(
      panel.querySelectorAll('button'),
      function (el) { return el.tabIndex !== -1; }
    );
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ── MOBILE MENU ─────────────────────────────────────── */
  var sidebar = document.getElementById('sidebar');
  var menuToggle = document.getElementById('menuToggle');
  var menuLabel = menuToggle.querySelector('.menu-toggle-label');

  function setMenu(open) {
    sidebar.classList.toggle('is-open', open);
    menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuLabel.textContent = open ? 'Close' : 'Menu';
  }
  menuToggle.addEventListener('click', function () {
    setMenu(!sidebar.classList.contains('is-open'));
  });
  sidebar.querySelectorAll('.side-link, .brand').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ── ACTIVE NAV LINK ─────────────────────────────────── */
  var links = document.querySelectorAll('.side-link');
  var sections = Array.prototype.map.call(links, function (a) {
    return document.querySelector(a.getAttribute('href'));
  });

  function updateActive() {
    var y = window.innerHeight * 0.35;
    var active = -1;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= y) active = i;
    });
    links.forEach(function (a, i) { a.classList.toggle('is-active', i === active); });
  }
  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive();

  /* ── REVEAL ON SCROLL ────────────────────────────────── */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ── COUNTERS ────────────────────────────────────────── */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var counters = document.querySelectorAll('.count[data-target]');

  function runCounter(el) {
    var target = parseInt(el.dataset.target, 10);
    var start = null;
    var duration = 1200;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  if (!reduceMotion && root.dataset.motion === 'on' && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

  /* ── FOOTER YEAR ─────────────────────────────────────── */
  document.getElementById('footerYear').textContent = new Date().getFullYear();
})();
