/* ═══════════════════════════════════════════════════════
   KAVIN MANICKANNAN — PORTFOLIO JAVASCRIPT
═══════════════════════════════════════════════════════ */

'use strict';

// ──────────────────────────────────────────────────────────
// CURSOR GLOW
// ──────────────────────────────────────────────────────────
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
});

// ──────────────────────────────────────────────────────────
// NAVBAR — SCROLL STATE & HAMBURGER
// ──────────────────────────────────────────────────────────
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks  = document.getElementById('navLinks');

window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  hamburger.classList.toggle('open');
});

// Close mobile menu when a link is clicked
navLinks.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  });
});

// ──────────────────────────────────────────────────────────
// HERO CANVAS — PARTICLE NETWORK
// ──────────────────────────────────────────────────────────
const canvas = document.getElementById('heroCanvas');
const ctx    = canvas.getContext('2d');

let particles = [];
const PARTICLE_COUNT = 80;
const MAX_DIST       = 140;

function resize() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}

class Particle {
  constructor() { this.reset(true); }

  reset(init = false) {
    this.x  = Math.random() * canvas.width;
    this.y  = init ? Math.random() * canvas.height : canvas.height + 10;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.4 + 0.1);
    this.radius = Math.random() * 2 + 0.5;
    this.opacity = Math.random() * 0.5 + 0.2;
    this.color = Math.random() > 0.5 ? '0,212,255' : '124,58,237';
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    if (this.y < -10 || this.x < -10 || this.x > canvas.width + 10) {
      this.reset();
    }
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color},${this.opacity})`;
    ctx.fill();
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push(new Particle());
  }
}

function drawGrid() {
  const gridSize = 60;
  ctx.strokeStyle = 'rgba(0,212,255,0.04)';
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

function connectParticles() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx   = particles[i].x - particles[j].x;
      const dy   = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MAX_DIST) {
        const alpha = (1 - dist / MAX_DIST) * 0.3;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
      }
    }
  }
}

function drawHorizonGlow() {
  const grad = ctx.createRadialGradient(
    canvas.width / 2, canvas.height / 2, 0,
    canvas.width / 2, canvas.height / 2, canvas.width * 0.6
  );
  grad.addColorStop(0,   'rgba(0,212,255,0.04)');
  grad.addColorStop(0.5, 'rgba(124,58,237,0.02)');
  grad.addColorStop(1,   'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let animFrame;
function animate() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawGrid();
  drawHorizonGlow();
  particles.forEach(p => { p.update(); p.draw(); });
  connectParticles();
  animFrame = requestAnimationFrame(animate);
}

resize();
initParticles();
animate();

window.addEventListener('resize', () => {
  resize();
  initParticles();
});

// ──────────────────────────────────────────────────────────
// TYPING ANIMATION
// ──────────────────────────────────────────────────────────
const roles = [
  'Production Support Engineer',
  'Operations Lead @ Accenture',
  'Observability Specialist',
  'Incident Management Expert',
  'SRE / Platform Engineering Specialist',
];

const typingEl = document.getElementById('heroTyping');
let roleIndex   = 0;
let charIndex   = 0;
let isDeleting  = false;
let typingTimer;

function typeRole() {
  const currentRole = roles[roleIndex];
  if (isDeleting) {
    typingEl.textContent = currentRole.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typingEl.textContent = currentRole.substring(0, charIndex + 1);
    charIndex++;
  }

  let delay = isDeleting ? 50 : 90;

  if (!isDeleting && charIndex === currentRole.length) {
    delay = 2200;
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    delay = 400;
  }

  typingTimer = setTimeout(typeRole, delay);
}

typingTimer = setTimeout(typeRole, 800);

// ──────────────────────────────────────────────────────────
// ANIMATED STAT COUNTERS
// ──────────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  if (target === 0) { el.textContent = '0'; return; }
  const duration = 1800;
  const start = performance.now();

  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = String(target);
  }

  requestAnimationFrame(step);
}

// ──────────────────────────────────────────────────────────
// INTERSECTION OBSERVER — FADE-IN + COUNTERS
// ──────────────────────────────────────────────────────────
const faderObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      faderObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.fade-in').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 80}ms`;
  faderObs.observe(el);
});

const statNums  = document.querySelectorAll('.stat-num[data-target]');
let countersRun = false;
const heroObs   = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting && !countersRun) {
      countersRun = true;
      statNums.forEach(el => animateCounter(el));
    }
  });
}, { threshold: 0.5 });

const heroStats = document.querySelector('.hero-stats');
if (heroStats) heroObs.observe(heroStats);

// ──────────────────────────────────────────────────────────
// ACTIVE NAV LINK — SCROLL SPY
// ──────────────────────────────────────────────────────────
const sections  = document.querySelectorAll('section[id]');
const navAnchors = document.querySelectorAll('.nav-link');

const spyObs = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      navAnchors.forEach(a => a.classList.remove('active'));
      const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });

sections.forEach(s => spyObs.observe(s));

// Active nav link style (injected dynamically)
const navStyle = document.createElement('style');
navStyle.textContent = `.nav-link.active { color: var(--cyan); background: var(--cyan-dim); }`;
document.head.appendChild(navStyle);

// ──────────────────────────────────────────────────────────
// FOOTER YEAR
// ──────────────────────────────────────────────────────────
const footerYear = document.getElementById('footerYear');
if (footerYear) footerYear.textContent = new Date().getFullYear();

// ──────────────────────────────────────────────────────────
// SKILL TAG HOVER PARTICLES (micro-interaction)
// ──────────────────────────────────────────────────────────
document.querySelectorAll('.skill-tag').forEach(tag => {
  tag.addEventListener('mouseenter', function () {
    this.style.boxShadow = '0 0 16px rgba(0,212,255,0.35)';
  });
  tag.addEventListener('mouseleave', function () {
    this.style.boxShadow = '';
  });
});

// ──────────────────────────────────────────────────────────
// SERVICE CARD MOUSE-TRACK GLOW
// ──────────────────────────────────────────────────────────
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top)  / rect.height) * 100;
    card.querySelector('.service-card-glow').style.background =
      `radial-gradient(circle at ${x}% ${y}%, rgba(0,212,255,0.12), transparent 60%)`;
  });
});

// ──────────────────────────────────────────────────────────
// TIMELINE CARD ENTRANCE DELAY STAGGER
// ──────────────────────────────────────────────────────────
document.querySelectorAll('.timeline-item').forEach((item, i) => {
  item.style.transitionDelay = `${i * 100}ms`;
});

// ──────────────────────────────────────────────────────────
// GLITCH INTENSITY ON HOVER (hero name)
// ──────────────────────────────────────────────────────────
document.querySelectorAll('.glitch').forEach(el => {
  el.addEventListener('mouseenter', () => {
    el.style.animation = 'none';
    el.style.textShadow = `0 0 20px rgba(0,212,255,0.8)`;
  });
  el.addEventListener('mouseleave', () => {
    el.style.textShadow = '';
  });
});

// ──────────────────────────────────────────────────────────
// SMOOTH REVEAL: logo bracket color pulse
// ──────────────────────────────────────────────────────────
let bracketHue = 260;
const brackets = document.querySelectorAll('.logo-bracket');
setInterval(() => {
  bracketHue = (bracketHue + 1) % 360;
  brackets.forEach(b => {
    b.style.color = `hsl(${bracketHue}, 80%, 65%)`;
  });
}, 30);
