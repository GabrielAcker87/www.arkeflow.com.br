(function () {
  'use strict';

  // ── Scale ─────────────────────────────────────────────────
  var BASE_W = 1366, BASE_H = 768;
  var appEl = document.getElementById('app');

  function getScale() {
    return Math.min(window.innerWidth / BASE_W, window.innerHeight / BASE_H);
  }

  function updateScale() {
    var s = getScale();
    document.documentElement.style.setProperty('--scale', s);
    appEl.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
  }
  updateScale();
  window.addEventListener('resize', updateScale, { passive: true });

  // ── Canvas: bubble system ─────────────────────────────────
  var canvas = document.getElementById('bg');
  var ctx    = canvas.getContext('2d');
  var W = 1366, H = 768;

  var CYAN   = [0, 200, 220];
  var MINT_C = [38, 255, 147];
  var SMALL_COUNT  = 20;
  var MEDIUM_COUNT = 22;
  var bubbles = [];

  function makeBubble(isSmall) {
    var isCyan = Math.random() < 0.7;
    var r = isSmall ? 2 + Math.random() * 3 : 6 + Math.random() * 7;
    return {
      x:           Math.random() * W,
      y:           Math.random() * H,
      r:           r,
      vx:          (Math.random() - 0.5) * 0.28,
      vy:          (Math.random() - 0.5) * 0.24,
      color:       isCyan ? CYAN : MINT_C,
      phase:       Math.random() * Math.PI * 2,
      phaseSpd:    0.008 + Math.random() * 0.012,
      baseOpacity: 0.30 + Math.random() * 0.42,
      ttl:         2500 + Math.floor(Math.random() * 3501),
      popping:     false,
      popFrame:    0,
      popDuration: 0,
      particles:   []
    };
  }

  function buildBubbles() {
    bubbles = [];
    for (var i = 0; i < SMALL_COUNT;  i++) bubbles.push(makeBubble(true));
    for (var j = 0; j < MEDIUM_COUNT; j++) bubbles.push(makeBubble(false));
  }

  function initCanvas() {
    var mobile = window.matchMedia('(max-width: 767px) and (hover: none)').matches;
    W = canvas.width  = mobile ? 390  : 1366;
    H = canvas.height = mobile ? 844  : 768;
    buildBubbles();
  }
  initCanvas();
  window.addEventListener('resize', initCanvas, { passive: true });

  function drawBubble(b, opacity) {
    var x = b.x, y = b.y, r = b.r;
    var rc = b.color[0], gc = b.color[1], bc = b.color[2];

    var glowR = r * 5.5;
    var g1 = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g1.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.08).toFixed(4) + ')');
    g1.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
    ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = g1; ctx.fill();

    var hx = x - r * 0.30, hy = y - r * 0.35;
    var g2 = ctx.createRadialGradient(hx, hy, 0, x, y, r);
    g2.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.13).toFixed(4) + ')');
    g2.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.03).toFixed(4) + ')');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g2; ctx.fill();

    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.70).toFixed(4) + ')';
    ctx.lineWidth = 0.9; ctx.stroke();

    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
    var hx2 = x - r * 0.33, hy2 = y - r * 0.33;
    var g3 = ctx.createRadialGradient(hx2, hy2, 0, hx2, hy2, r * 0.5);
    g3.addColorStop(0, 'rgba(255,255,255,' + (opacity * 0.58).toFixed(4) + ')');
    g3.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g3; ctx.fill();
    ctx.restore();
  }

  function startPop(b) {
    b.popping = true; b.popFrame = 0;
    b.popDuration = 45 + Math.floor(Math.random() * 30);
    var count = 4 + Math.floor(Math.random() * 6);
    b.particles = [];
    for (var i = 0; i < count; i++) {
      b.particles.push({
        angle:  Math.random() * Math.PI * 2,
        speed:  0.6 + Math.random() * 2.9,
        radius: 0.8 + Math.random() * Math.max(0, b.r * 0.28 - 0.8),
        delay:  Math.random() * 0.25,
        wobble: (Math.random() - 0.5) * 0.8,
        fade:   0.6 + Math.random() * 0.4
      });
    }
  }

  function resetBubble(b) {
    var nb = makeBubble(b.r <= 5);
    b.x = nb.x; b.y = nb.y; b.r = nb.r;
    b.vx = nb.vx; b.vy = nb.vy;
    b.color = nb.color; b.phase = nb.phase;
    b.phaseSpd = nb.phaseSpd; b.baseOpacity = nb.baseOpacity;
    b.ttl = nb.ttl; b.popping = false; b.particles = [];
  }

  function drawPop(b) {
    var prog = b.popFrame / b.popDuration;
    b.popFrame++;
    var rc = b.color[0], gc = b.color[1], bc = b.color[2];
    for (var i = 0; i < b.particles.length; i++) {
      var p = b.particles[i];
      if (prog < p.delay) continue;
      var lp = Math.min(1, (prog - p.delay) / (1 - p.delay));
      var angle = p.angle + p.wobble * lp;
      var dist  = p.speed * lp * b.r * 2.5;
      var px = b.x + Math.cos(angle) * dist;
      var py = b.y + Math.sin(angle) * dist;
      var alpha = (1 - lp) * p.fade;
      var glowR = p.radius * 5;
      var grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grd.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (alpha * 0.6).toFixed(4) + ')');
      grd.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
      ctx.beginPath(); ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
      ctx.beginPath(); ctx.arc(px, py, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + alpha.toFixed(4) + ')';
      ctx.fill();
    }
    if (b.popFrame >= b.popDuration) resetBubble(b);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    var bgGrd = ctx.createLinearGradient(0, 0, 0, H);
    bgGrd.addColorStop(0,    'rgba(0,0,0,0.22)');
    bgGrd.addColorStop(0.45, 'rgba(0,0,0,0)');
    bgGrd.addColorStop(1,    'rgba(0,12,28,0.28)');
    ctx.fillStyle = bgGrd; ctx.fillRect(0, 0, W, H);

    var acx = W * 0.5, acy = H * 0.6, ambR = W * 0.5;
    var ambGrd = ctx.createRadialGradient(acx, acy, 0, acx, acy, ambR);
    ambGrd.addColorStop(0, 'rgba(0,40,60,0.10)');
    ambGrd.addColorStop(1, 'rgba(0,40,60,0)');
    ctx.fillStyle = ambGrd; ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      if (b.popping) { drawPop(b); continue; }
      b.x += b.vx; b.y += b.vy;
      var margin = b.r * 6;
      if (b.x < -margin)        b.x = W + margin;
      else if (b.x > W + margin) b.x = -margin;
      if (b.y < -margin)        b.y = H + margin;
      else if (b.y > H + margin) b.y = -margin;
      b.phase += b.phaseSpd;
      var opacity = b.baseOpacity * (0.82 + 0.18 * Math.sin(b.phase));
      drawBubble(b, opacity);
      b.ttl--;
      if (b.ttl <= 0) startPop(b);
    }
    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);

}());
