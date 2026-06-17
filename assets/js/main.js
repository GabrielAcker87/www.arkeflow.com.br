(function () {
  'use strict';

  // ── Canvas: bubble system ────────────────────────────────────
  var canvas = document.getElementById('bg');
  var ctx    = canvas.getContext('2d');
  var W, H;

  var CYAN = [0, 200, 220];
  var MINT = [38, 255, 147];

  var SMALL_COUNT  = 20;
  var MEDIUM_COUNT = 22;
  var bubbles = [];

  function makeBubble(isSmall) {
    var isCyan = Math.random() < 0.7;
    var r = isSmall
      ? 2 + Math.random() * 3
      : 6 + Math.random() * 7;
    return {
      x:           Math.random() * W,
      y:           Math.random() * H,
      r:           r,
      vx:          (Math.random() - 0.5) * 0.28,
      vy:          (Math.random() - 0.5) * 0.24,
      color:       isCyan ? CYAN : MINT,
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
    for (var i = 0; i < SMALL_COUNT; i++)  bubbles.push(makeBubble(true));
    for (var j = 0; j < MEDIUM_COUNT; j++) bubbles.push(makeBubble(false));
  }

  function resizeCanvas() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    buildBubbles();
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  function drawBubble(b, opacity) {
    var x = b.x, y = b.y, r = b.r;
    var rc = b.color[0], gc = b.color[1], bc = b.color[2];

    // 1. Outer glow
    var glowR = r * 5.5;
    var g1 = ctx.createRadialGradient(x, y, 0, x, y, glowR);
    g1.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.08).toFixed(4) + ')');
    g1.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
    ctx.beginPath();
    ctx.arc(x, y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = g1;
    ctx.fill();

    // 2. Body fill
    var hx = x - r * 0.30, hy = y - r * 0.35;
    var g2 = ctx.createRadialGradient(hx, hy, 0, x, y, r);
    g2.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.13).toFixed(4) + ')');
    g2.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.03).toFixed(4) + ')');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g2;
    ctx.fill();

    // 3. Rim stroke
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (opacity * 0.70).toFixed(4) + ')';
    ctx.lineWidth = 0.9;
    ctx.stroke();

    // 4. Highlight — clipped to bubble arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.clip();
    var hx2 = x - r * 0.33, hy2 = y - r * 0.33;
    var g3 = ctx.createRadialGradient(hx2, hy2, 0, hx2, hy2, r * 0.5);
    g3.addColorStop(0, 'rgba(255,255,255,' + (opacity * 0.58).toFixed(4) + ')');
    g3.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = g3;
    ctx.fill();
    ctx.restore();
  }

  function startPop(b) {
    b.popping     = true;
    b.popFrame    = 0;
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
    var isSmall = b.r <= 5;
    var nb = makeBubble(isSmall);
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
      var lp    = (prog - p.delay) / (1 - p.delay);
      if (lp > 1) lp = 1;
      var angle = p.angle + p.wobble * lp;
      var dist  = p.speed * lp * b.r * 2.5;
      var px    = b.x + Math.cos(angle) * dist;
      var py    = b.y + Math.sin(angle) * dist;
      var alpha = (1 - lp) * p.fade;

      var glowR = p.radius * 5;
      var grd = ctx.createRadialGradient(px, py, 0, px, py, glowR);
      grd.addColorStop(0, 'rgba(' + rc + ',' + gc + ',' + bc + ',' + (alpha * 0.6).toFixed(4) + ')');
      grd.addColorStop(1, 'rgba(' + rc + ',' + gc + ',' + bc + ',0)');
      ctx.beginPath();
      ctx.arc(px, py, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px, py, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + rc + ',' + gc + ',' + bc + ',' + alpha.toFixed(4) + ')';
      ctx.fill();
    }

    if (b.popFrame >= b.popDuration) resetBubble(b);
  }

  function drawFrame() {
    ctx.clearRect(0, 0, W, H);

    // Background depth — 1. linear gradient top→bottom
    var bgGrd = ctx.createLinearGradient(0, 0, 0, H);
    bgGrd.addColorStop(0,    'rgba(0,0,0,0.22)');
    bgGrd.addColorStop(0.45, 'rgba(0,0,0,0)');
    bgGrd.addColorStop(1,    'rgba(0,12,28,0.28)');
    ctx.fillStyle = bgGrd;
    ctx.fillRect(0, 0, W, H);

    // Background depth — 2. radial ambient glow
    var acx = W * 0.5, acy = H * 0.6, ambR = W * 0.5;
    var ambGrd = ctx.createRadialGradient(acx, acy, 0, acx, acy, ambR);
    ambGrd.addColorStop(0, 'rgba(0,40,60,0.10)');
    ambGrd.addColorStop(1, 'rgba(0,40,60,0)');
    ctx.fillStyle = ambGrd;
    ctx.fillRect(0, 0, W, H);

    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];

      if (b.popping) { drawPop(b); continue; }

      b.x += b.vx;
      b.y += b.vy;

      var margin = b.r * 6;
      if (b.x < -margin)         b.x = W + margin;
      else if (b.x > W + margin) b.x = -margin;
      if (b.y < -margin)         b.y = H + margin;
      else if (b.y > H + margin) b.y = -margin;

      b.phase += b.phaseSpd;
      var pulse   = 0.82 + 0.18 * Math.sin(b.phase);
      var opacity = b.baseOpacity * pulse;

      drawBubble(b, opacity);

      b.ttl--;
      if (b.ttl <= 0) startPop(b);
    }

    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);

  // ── Intro sequence (precise timestamp-based timing) ──────────
  var introEl  = document.getElementById('intro');
  var phraseEl = document.getElementById('intro-phrase');
  var navbarEl = document.getElementById('navbar');
  var gridEl   = document.getElementById('grid');

  var P1 = 'Quando o negócio cresce, o improviso para de funcionar.';
  var P2 = 'Processo dependente de pessoa. Decisão sem dado. Equipe sem visibilidade.';
  var P3 = 'A ARKEflow constrói a estrutura que o seu negócio precisa para escalar.';

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function enterPhrase(text, color) {
    phraseEl.textContent = text;
    phraseEl.style.color = color;
    phraseEl.classList.remove('entering', 'exiting');
    phraseEl.getBoundingClientRect(); // force reflow → reset to base state
    phraseEl.classList.add('entering');
  }

  function exitPhrase() {
    phraseEl.classList.remove('entering');
    phraseEl.classList.add('exiting');
  }

  async function runIntro() {
    await wait(400);            enterPhrase(P1, '#ffffff');
    await wait(2200 - 400);     exitPhrase();

    await wait(2750 - 2200);    enterPhrase(P2, '#00C8DC');
    await wait(4500 - 2750);    exitPhrase();

    await wait(5000 - 4500);    enterPhrase(P3, '#ffffff');
    await wait(6600 - 5000);    exitPhrase();

    await wait(7100 - 6600);    introEl.classList.add('done');
    await wait(7600 - 7100);
    navbarEl.classList.add('visible');
    gridEl.classList.add('visible');
  }

  runIntro();

  // ── Block grid: expand/push 3D interaction ───────────────────
  var blocks = document.querySelectorAll('.block');

  // CSS transition used during enter/leave (includes transform)
  var BASE_TRANS =
    'transform 0.38s cubic-bezier(0.15,0.85,0.3,1),' +
    'filter 0.35s ease, opacity 0.35s ease,' +
    'border-color 0.25s ease, box-shadow 0.25s ease';

  // CSS transition used during mousemove (transform updates instantly)
  var TILT_TRANS =
    'filter 0.35s ease, opacity 0.35s ease,' +
    'border-color 0.25s ease, box-shadow 0.25s ease';

  var activeBlock = null;
  var leaveTimer  = null;

  function activateBlock(el) {
    if (leaveTimer) { clearTimeout(leaveTimer); leaveTimer = null; }

    activeBlock = el;
    var ar = parseInt(el.dataset.r, 10);
    var ac = parseInt(el.dataset.c, 10);
    var cx = ac === 0 ? 30 : ac === 2 ? -30 : 0;
    var cy = ar === 0 ? 25 : -25;

    blocks.forEach(function (b) {
      b.style.transition = BASE_TRANS;
      if (b === el) {
        b.classList.add('is-active');
        b.classList.remove('is-pushed');
        b.style.transform   = 'translateX(' + cx + 'px) translateY(' + cy + 'px) translateZ(50px) scale(1.16)';
        b.style.borderColor = 'rgba(0,200,220,0.32)';
        b.style.boxShadow   = '0 20px 60px rgba(0,0,0,0.55), inset 0 0 40px rgba(0,200,220,0.04)';
        b.style.filter      = 'brightness(1.1)';
        b.style.zIndex      = '10';
        b.style.opacity     = '1';
      } else {
        var br = parseInt(b.dataset.r, 10);
        var bc = parseInt(b.dataset.c, 10);
        var dx = (bc - ac) * 20;
        var dy = (br - ar) * 16;
        b.classList.add('is-pushed');
        b.classList.remove('is-active');
        b.style.transform   = 'translateX(' + dx + 'px) translateY(' + dy + 'px) translateZ(-65px) scale(0.85)';
        b.style.filter      = 'brightness(0.48) saturate(0.6)';
        b.style.opacity     = '0.65';
        b.style.borderColor = '';
        b.style.boxShadow   = '';
        b.style.zIndex      = '';
      }
    });
  }

  function resetAll() {
    activeBlock = null;

    blocks.forEach(function (b) {
      b.style.transition = BASE_TRANS;
      b.style.transform  = 'translateZ(0)';
      b.style.filter     = '';
      b.style.opacity    = '';
      b.style.borderColor = '';
      b.style.boxShadow  = '';
      b.style.zIndex     = '';
      b.classList.remove('is-active', 'is-pushed');
    });

  }

  blocks.forEach(function (block) {

    block.addEventListener('mouseenter', function () {
      activateBlock(this);
    });

    block.addEventListener('mousemove', function (e) {
      if (activeBlock !== this) return;
      var rect = this.getBoundingClientRect();
      var dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      var dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      var mc = parseInt(this.dataset.c, 10);
      var mr = parseInt(this.dataset.r, 10);
      var cx = mc === 0 ? 30 : mc === 2 ? -30 : 0;
      var cy = mr === 0 ? 25 : -25;
      // Disable transform transition during live tracking
      this.style.transition = TILT_TRANS;
      this.style.transform  =
        'rotateX(' + (-dy * 6).toFixed(2) + 'deg)' +
        ' rotateY(' + (dx * 7).toFixed(2) + 'deg)' +
        ' translateX(' + cx + 'px) translateY(' + cy + 'px)' +
        ' translateZ(50px) scale(1.16)';
    });

    block.addEventListener('mouseleave', function () {
      if (activeBlock !== this) return;
      // Short debounce: if mouse enters another block within 12ms,
      // activateBlock cancels this timer and no reset happens.
      leaveTimer = setTimeout(resetAll, 12);
    });

  });

}());
