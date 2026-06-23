/**
 * 林间雨水效果 — 夜间主题（仿真版 · 落地波纹）
 */
(function () {
  'use strict';

  var container = null;
  var forestBg = null;
  var animId = null;
  var drops = [];
  var ripples = [];
  var resizeHandler = null;
  var canvasRef = null;

  var density = parseInt(localStorage.getItem('rain_density') || '30', 10);
  if (isNaN(density)) density = 30;
  density = clamp(density, 0, 200);
  var speedMul = parseFloat(localStorage.getItem('rain_speed') || '1');
  if (isNaN(speedMul)) speedMul = 1;
  speedMul = clamp(speedMul, 0, 3);
  /** 页面级覆盖（如文章/项目页强制静止），不写 localStorage */
  var speedOverride = null;
  var MAX_RIPPLES = 120;

  function getEffectiveSpeed() {
    if (speedOverride !== null && speedOverride !== undefined) {
      return clamp(speedOverride, 0, 3);
    }
    return speedMul;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function createDrop(h) {
    var len = Math.random() * 22 + 14;
    return {
      x: Math.random() * window.innerWidth,
      y: Math.random() * h - h,
      length: len,
      baseSpeed: Math.random() * 10 + 14,
      width: Math.random() * 0.8 + 0.6,
      opacity: Math.random() * 0.3 + 0.55,
      wind: -0.8 - Math.random() * 0.6
    };
  }

  function spawnRipple(x, y) {
    if (ripples.length >= MAX_RIPPLES) ripples.shift();
    ripples.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: Math.random() * 14 + 8,
      life: 1,
      decay: Math.random() * 0.025 + 0.02,
      rings: Math.random() > 0.6 ? 2 : 1
    });
  }

  function populateDrops() {
    drops = [];
    var h = canvasRef ? canvasRef.height : window.innerHeight;
    for (var i = 0; i < density; i++) {
      drops.push(createDrop(h));
    }
  }

  function drawDrop(ctx, d) {
    var x2 = d.x + d.wind * (d.length / 12);
    var y2 = d.y + d.length;
    var grad = ctx.createLinearGradient(d.x, d.y, x2, y2);
    grad.addColorStop(0, 'rgba(180, 210, 255, 0)');
    grad.addColorStop(0.2, 'rgba(170, 210, 255, ' + (d.opacity * 0.65) + ')');
    grad.addColorStop(1, 'rgba(220, 240, 255, ' + Math.min(d.opacity + 0.25, 0.95) + ')');
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = grad;
    ctx.lineWidth = d.width;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function drawRipples(ctx) {
    for (var i = ripples.length - 1; i >= 0; i--) {
      var r = ripples[i];
      r.radius += (r.maxRadius - r.radius) * 0.12 * getEffectiveSpeed();
      r.life -= r.decay;

      if (r.life <= 0) {
        ripples.splice(i, 1);
        continue;
      }

      var alpha = r.life * 0.55;
      for (var ring = 0; ring < r.rings; ring++) {
        var offset = ring * 3;
        var rx = r.radius - offset;
        if (rx <= 0) continue;
        ctx.beginPath();
        ctx.ellipse(r.x, r.y, rx, rx * 0.28, 0, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(120, 190, 255, ' + (alpha * (1 - ring * 0.35)) + ')';
        ctx.lineWidth = 1.2 - ring * 0.3;
        ctx.stroke();
      }
    }
  }

  function loop() {
    if (!container || !canvasRef) return;
    var ctx = canvasRef.getContext('2d');
    var w = canvasRef.width;
    var h = canvasRef.height;

    ctx.clearRect(0, 0, w, h);

    /* 地面微湿反光 */
    var groundGrad = ctx.createLinearGradient(0, h - 30, 0, h);
    groundGrad.addColorStop(0, 'rgba(60, 100, 140, 0)');
    groundGrad.addColorStop(1, 'rgba(80, 130, 180, 0.08)');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, h - 30, w, 30);

    for (var i = 0; i < drops.length; i++) {
      var d = drops[i];
      drawDrop(ctx, d);

      var effSpeed = getEffectiveSpeed();
      var step = d.baseSpeed * effSpeed;
      d.y += step;
      d.x += d.wind * effSpeed * 0.15;

      var hitGround = d.y + d.length >= h - 6;
      if (hitGround) {
        spawnRipple(d.x + d.wind * 0.5, h - 4 - Math.random() * 3);
        drops[i] = createDrop(h);
        drops[i].y = -drops[i].length;
      } else if (d.x < -30 || d.x > w + 30) {
        drops[i] = createDrop(h);
      }
    }

    drawRipples(ctx);
    animId = requestAnimationFrame(loop);
  }

  window.RainEngine = {
    start: function () {
      if (container) return;

      forestBg = document.createElement('div');
      forestBg.id = 'forest-bg';
      Object.assign(forestBg.style, {
        position: 'fixed', inset: '0', zIndex: '-1', pointerEvents: 'none',
        background: [
          'radial-gradient(ellipse at 50% 80%, rgba(30, 60, 120, 0.12) 0%, transparent 55%)',
          'radial-gradient(ellipse at 20% 90%, rgba(255, 180, 80, 0.06) 0%, transparent 40%)',
          'linear-gradient(180deg, transparent 60%, rgba(8, 12, 20, 0.18) 100%)'
        ].join(', ')
      });
      document.body.appendChild(forestBg);

      container = document.createElement('div');
      container.id = 'rain-container';
      Object.assign(container.style, {
        position: 'fixed', inset: '0', zIndex: '10', pointerEvents: 'none'
      });

      canvasRef = document.createElement('canvas');
      canvasRef.width = window.innerWidth;
      canvasRef.height = window.innerHeight;
      Object.assign(canvasRef.style, { width: '100%', height: '100%' });
      container.appendChild(canvasRef);
      document.body.appendChild(container);

      ripples = [];
      populateDrops();

      resizeHandler = function () {
        canvasRef.width = window.innerWidth;
        canvasRef.height = window.innerHeight;
      };
      window.addEventListener('resize', resizeHandler);
      loop();
    },
    stop: function () {
      if (animId) cancelAnimationFrame(animId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (container) { container.remove(); container = null; }
      if (forestBg) { forestBg.remove(); forestBg = null; }
      drops = [];
      ripples = [];
      canvasRef = null;
      animId = null;
      resizeHandler = null;
    },
    setDensity: function (count) {
      var n = parseInt(count, 10);
      if (isNaN(n)) n = 30;
      density = clamp(n, 0, 200);
      localStorage.setItem('rain_density', String(density));
      populateDrops();
      return density;
    },
    setSpeed: function (speed) {
      var s = parseFloat(speed);
      if (isNaN(s)) s = 1;
      speedMul = clamp(s, 0, 3);
      localStorage.setItem('rain_speed', String(speedMul));
      return speedMul;
    },
    setSpeedOverride: function (speed) {
      if (speed === null || speed === undefined || speed === '') {
        speedOverride = null;
        return speedMul;
      }
      var s = parseFloat(speed);
      if (isNaN(s)) s = 0;
      speedOverride = clamp(s, 0, 3);
      return speedOverride;
    },
    clearSpeedOverride: function () {
      speedOverride = null;
      return speedMul;
    },
    getSettings: function () {
      return {
        density: density,
        speed: speedMul,
        effectiveSpeed: getEffectiveSpeed(),
        speedMuted: speedOverride !== null
      };
    }
  };
})();
