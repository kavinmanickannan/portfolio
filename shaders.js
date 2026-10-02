/* ═══════════════════════════════════════════════════════
   KAVIN MANICKANNAN — PORTFOLIO
   Full-page background effects, powered by Paper Shaders
   (https://github.com/paper-design/shaders, Apache-2.0)

   If the library can't load or WebGL is unavailable, the
   CSS gradient in .bg-fallback stays visible instead.
═══════════════════════════════════════════════════════ */

const SHADERS_URL = 'https://cdn.jsdelivr.net/npm/@paper-design/shaders@0.0.81/dist/index.js';

const root = document.documentElement;
const bgEl = document.getElementById('bgEffect');
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
const isSmallScreen = window.matchMedia('(max-width: 640px)').matches;

let lib = null;
let noiseTexture = null;
let bgMount = null;
let bgEffect = null;
const previewMounts = new Map();

/* ── HELPERS ───────────────────────────────────────────── */

function cssVar(name) {
  return getComputedStyle(root).getPropertyValue(name).trim();
}

function palette() {
  return {
    bg: cssVar('--bg'),
    c1: cssVar('--fx-1'),
    c2: cssVar('--fx-2'),
    c3: cssVar('--fx-3'),
  };
}

function motionEnabled() {
  return root.dataset.motion === 'on' && !reduceMotionQuery.matches;
}

function sizing(fit) {
  return {
    u_fit: lib.ShaderFitOptions[fit],
    u_scale: 1,
    u_rotation: 0,
    u_originX: 0.5,
    u_originY: 0.5,
    u_offsetX: 0,
    u_offsetY: 0,
    u_worldWidth: 0,
    u_worldHeight: 0,
  };
}

/* ── EFFECT DEFINITIONS ────────────────────────────────── */
// Each effect returns { shader, speed, uniforms } built from the current palette.

const EFFECTS = {
  'mesh-gradient': (p, col) => ({
    shader: lib.meshGradientFragmentShader,
    speed: 0.6,
    uniforms: {
      ...sizing('none'),
      u_colors: [col(p.c1), col(p.c2), col(p.c3), col(p.bg)],
      u_colorsCount: 4,
      u_distortion: 0.8,
      u_swirl: 0.15,
      u_grainMixer: 0,
      u_grainOverlay: 0,
    },
  }),

  'grain-gradient': (p, col) => ({
    shader: lib.grainGradientFragmentShader,
    speed: 0.8,
    uniforms: {
      ...sizing('none'),
      u_colorBack: col(p.bg),
      u_colors: [col(p.c1), col(p.c2), col(p.c3)],
      u_colorsCount: 3,
      u_softness: 0.6,
      u_intensity: 0.4,
      u_noise: 0.3,
      u_shape: lib.GrainGradientShapes.corners,
      u_noiseTexture: noiseTexture,
    },
  }),

  warp: (p, col) => ({
    shader: lib.warpFragmentShader,
    speed: 0.6,
    uniforms: {
      ...sizing('none'),
      u_colors: [col(p.bg), col(p.c1), col(p.c2), col(p.c3)],
      u_colorsCount: 4,
      u_proportion: 0.45,
      u_softness: 1,
      u_shape: lib.WarpPatterns.checks,
      u_shapeScale: 0.1,
      u_distortion: 0.25,
      u_swirl: 0.8,
      u_swirlIterations: 10,
      u_noiseTexture: noiseTexture,
    },
  }),

  'simplex-noise': (p, col) => ({
    shader: lib.simplexNoiseFragmentShader,
    speed: 0.4,
    uniforms: {
      ...sizing('none'),
      u_scale: 0.6,
      u_colors: [col(p.c1), col(p.c2), col(p.c3), col(p.bg)],
      u_colorsCount: 4,
      u_stepsPerColor: 2,
      u_softness: 0,
    },
  }),

  metaballs: (p, col) => ({
    shader: lib.metaballsFragmentShader,
    speed: 0.8,
    uniforms: {
      ...sizing('cover'),
      u_colorBack: col(p.bg),
      u_colors: [col(p.c1), col(p.c2), col(p.c3)],
      u_colorsCount: 3,
      u_count: 10,
      u_size: 0.83,
      u_noiseTexture: noiseTexture,
    },
  }),

  dithering: (p, col) => ({
    shader: lib.ditheringFragmentShader,
    speed: 0.6,
    uniforms: {
      ...sizing('none'),
      u_scale: 0.8,
      u_colorBack: col(p.bg),
      u_colorFront: col(p.c1),
      u_shape: lib.DitheringShapes.warp,
      u_type: lib.DitheringTypes['4x4'],
      u_pxSize: 2,
    },
  }),

  'pulsing-border': (p, col) => ({
    shader: lib.pulsingBorderFragmentShader,
    speed: 1,
    uniforms: {
      ...sizing('none'),
      u_colorBack: col(p.bg),
      u_colors: [col(p.c1), col(p.c2), col(p.c3)],
      u_colorsCount: 3,
      u_roundness: 0.18,
      u_thickness: 0.16,
      u_softness: 0.8,
      u_marginLeft: 0,
      u_marginRight: 0,
      u_marginTop: 0,
      u_marginBottom: 0,
      u_aspectRatio: lib.PulsingBorderAspectRatios.auto,
      u_intensity: 0.4,
      u_bloom: 0.35,
      u_spots: 3,
      u_spotSize: 0.5,
      u_pulse: 0.25,
      u_smoke: 0.5,
      u_smokeSize: 0.8,
      u_noiseTexture: noiseTexture,
    },
  }),
};

function build(effect) {
  const make = EFFECTS[effect] || EFFECTS['mesh-gradient'];
  return make(palette(), lib.getShaderColorFromString);
}

/* ── MOUNTING ──────────────────────────────────────────── */

function mount(el, effect, { speed, frame = 0, minPixelRatio = 2, maxPixelCount } = {}) {
  const def = build(effect);
  return new lib.ShaderMount(
    el,
    def.shader,
    def.uniforms,
    undefined,
    speed ?? def.speed,
    frame,
    minPixelRatio,
    maxPixelCount
  );
}

// ShaderMount.dispose() frees the shader but leaves the WebGL context alive,
// and browsers cap live contexts at ~16, so release it explicitly
function release(m) {
  if (!m) return;
  const gl = m.gl;
  m.dispose();
  gl?.getExtension('WEBGL_lose_context')?.loseContext();
}

function bgSpeed(effect) {
  return motionEnabled() ? build(effect).speed : 0;
}

function renderBackground() {
  const effect = root.dataset.effect;
  try {
    if (effect === 'none') {
      release(bgMount);
      bgMount = null;
      bgEffect = null;
      return;
    }
    // A different effect needs a new shader program; same effect only needs new colours/speed
    if (bgMount && bgEffect === effect) {
      bgMount.setUniforms(build(effect).uniforms);
      bgMount.setSpeed(bgSpeed(effect));
      return;
    }
    release(bgMount);
    // The canvas covers the whole viewport, so cap its resolution to keep it light
    bgMount = mount(bgEl, effect, {
      speed: bgSpeed(effect),
      frame: 8000,
      minPixelRatio: 1,
      maxPixelCount: isSmallScreen ? 900 * 600 : 1600 * 1000,
    });
    bgEffect = effect;
  } catch (err) {
    console.warn('Background effect unavailable, using CSS fallback.', err);
    bgMount = null;
    bgEffect = null;
  }
}

function renderPreviews() {
  document.querySelectorAll('[data-preview]').forEach((el) => {
    const effect = el.dataset.preview;
    try {
      const existing = previewMounts.get(effect);
      if (existing) {
        existing.setUniforms(build(effect).uniforms);
        return;
      }
      // Previews are still frames, rendered at low resolution to stay light
      previewMounts.set(effect, mount(el, effect, { speed: 0, frame: 8000, minPixelRatio: 1, maxPixelCount: 360 * 160 }));
    } catch (err) {
      console.warn(`Preview for ${effect} unavailable.`, err);
    }
  });
}

function disposePreviews() {
  previewMounts.forEach(release);
  previewMounts.clear();
}

/* ── INIT ──────────────────────────────────────────────── */

async function init() {
  try {
    lib = await import(SHADERS_URL);
  } catch (err) {
    console.warn('Could not load shader library, using CSS fallback.', err);
    return;
  }

  noiseTexture = lib.getShaderNoiseTexture();
  try { await noiseTexture.decode(); } catch (e) { /* fall through; shaders still render */ }

  renderBackground();

  let previewsOpen = false;

  document.addEventListener('prefs:change', () => {
    // Wait a frame so the new CSS variables have been applied
    requestAnimationFrame(() => {
      renderBackground();
      if (previewsOpen) renderPreviews();
    });
  });

  document.addEventListener('personalise:open', () => {
    previewsOpen = true;
    renderPreviews();
  });

  document.addEventListener('personalise:close', () => {
    previewsOpen = false;
    // Free the WebGL contexts once the panel has animated out
    setTimeout(() => { if (!previewsOpen) disposePreviews(); }, 300);
  });

  reduceMotionQuery.addEventListener('change', () => renderBackground());
}

init();
