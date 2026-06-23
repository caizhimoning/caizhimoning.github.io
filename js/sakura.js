/**
 * 樱花飘落 Canvas 引擎 — 日间主题（仿真版）
 */
(function () {
  'use strict';

  var canvas = null;
  var ctx = null;
  var petals = [];
  var mouseWindX = 0;
  var animId = null;
  var resizeHandler = null;
  var mouseHandler = null;

  var density = parseInt(localStorage.getItem('sakura_density') || '35', 10);
  var speedMul = parseFloat(localStorage.getItem('sakura_speed') || '1');

  var COLORS = [
    { fill: 'rgba(255, 183, 197, 0.92)', vein: 'rgba(255, 140, 165, 0.35)' },
    { fill: 'rgba(255, 201, 212, 0.88)', vein: 'rgba(255, 160, 180, 0.3)' },
    { fill: 'rgba(255, 158, 173, 0.9)', vein: 'rgba(240, 120, 150, 0.35)' },
    { fill: 'rgba(255, 228, 235, 0.85)', vein: 'rgba(255, 180, 195, 0.25)' }
  ];

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function Petal(w, h, initial) {
    this.reset(w, h, initial);
  }

  Petal.prototype.reset = function (w, h, initial) {
    this.x = Math.random() * w;
    this.y = initial ? Math.random() * h : -30 - Math.random() * 80;
    this.size = Math.random() * 7 + 8;
    this.baseSpeedY = Math.random() * 0.6 + 0.5;
    this.drift = Math.random() * Math.PI * 2;
    this.driftSpeed = Math.random() * 0.018 + 0.008;
    this.swayAmp = Math.random() * 1.2 + 0.6;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.025;
    this.flip = Math.random() * Math.PI;
    this.flipSpeed = Math.random() * 0.04 + 0.02;
    this.opacity = Math.random() * 0.25 + 0.65;
    var c = COLORS[Math.floor(Math.random() * COLORS.length)];
    this.fill = c.fill;
    this.vein = c.vein;
  };

  Petal.prototype.update = function (w, h, wind, mul) {
    this.drift += this.driftSpeed;
    this.y += this.baseSpeedY * mul;
    this.x += Math.sin(this.drift) * this.swayAmp * 0.35 + wind * 0.6;
    this.rotation += this.rotSpeed;
    this.flip += this.flipSpeed;

    if (this.y > h + 40 || this.x < -40 || this.x > w + 40) {
      this.reset(w, h, false);
    }
  };

  Petal.prototype.draw = function (c) {
    var s = this.size;
    var flipScale = 0.35 + Math.abs(Math.sin(this.flip)) * 0.65;

    c.save();
    c.translate(this.x, this.y);
    c.rotate(this.rotation);
    c.scale(flipScale, 1);
    c.globalAlpha = this.opacity;

    /* 五瓣樱花造型（单瓣带切裂） */
    c.beginPath();
    c.moveTo(0, s * 0.15);
    c.bezierCurveTo(s * 0.15, -s * 0.55, s * 0.75, -s * 0.45, s * 0.05, s * 0.55);
    c.bezierCurveTo(-s * 0.15, s * 0.15, -s * 0.05, -s * 0.35, 0, s * 0.15);
    c.closePath();
    c.fillStyle = this.fill;
    c.fill();

    /* 叶脉 */
    c.beginPath();
    c.moveTo(0, s * 0.1);
    c.quadraticCurveTo(0, s * 0.35, 0, s * 0.45);
    c.strokeStyle = this.vein;
    c.lineWidth = 0.6;
    c.stroke();

    c.restore();
    c.globalAlpha = 1;
  };

  function populatePetals(initial) {
    if (!canvas) return;
    petals = [];
    for (var i = 0; i < density; i++) {
      petals.push(new Petal(canvas.width, canvas.height, initial));
    }
  }

  function loop() {
    if (!ctx || !canvas) return;
    var w = canvas.width;
    var h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    mouseWindX *= 0.98;
    for (var i = 0; i < petals.length; i++) {
      petals[i].update(w, h, mouseWindX, speedMul);
      petals[i].draw(ctx);
    }
    animId = requestAnimationFrame(loop);
  }

  window.SakuraEngine = {
    start: function () {
      if (canvas) return;
      canvas = document.createElement('canvas');
      canvas.id = 'sakura-canvas';
      Object.assign(canvas.style, {
        position: 'fixed', top: '0', left: '0',
        width: '100vw', height: '100vh',
        pointerEvents: 'none', zIndex: '5', opacity: '0.9'
      });
      document.body.appendChild(canvas);
      ctx = canvas.getContext('2d');
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      populatePetals(true);

      resizeHandler = function () {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      mouseHandler = function (e) {
        var cx = window.innerWidth / 2;
        mouseWindX = ((e.clientX - cx) / cx) * 1.2;
      };
      window.addEventListener('resize', resizeHandler);
      window.addEventListener('mousemove', mouseHandler);
      loop();
    },
    stop: function () {
      if (animId) cancelAnimationFrame(animId);
      if (resizeHandler) window.removeEventListener('resize', resizeHandler);
      if (mouseHandler) window.removeEventListener('mousemove', mouseHandler);
      if (canvas) { canvas.remove(); canvas = null; ctx = null; }
      petals = [];
      animId = null;
      resizeHandler = null;
      mouseHandler = null;
    },
    setDensity: function (count) {
      density = clamp(parseInt(count, 10) || 35, 5, 100);
      localStorage.setItem('sakura_density', String(density));
      populatePetals(true);
      return density;
    },
    setSpeed: function (speed) {
      speedMul = clamp(parseFloat(speed) || 1, 0.3, 3);
      localStorage.setItem('sakura_speed', String(speedMul));
      return speedMul;
    },
    getSettings: function () {
      return { density: density, speed: speedMul };
    }
  };
})();
