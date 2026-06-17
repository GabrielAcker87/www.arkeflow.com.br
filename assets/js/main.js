(function () {
  'use strict';

  // ── Canvas: firefly particles ────────────────────────────────
  var canvas = document.getElementById('bg');
  var ctx = canvas.getContext('2d');
  var W, H;

  function resizeCanvas() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });

  var CYAN = [0, 200, 220];
  var MINT = [38, 255, 147];
  var COUNT = 50;
  var particles = [];

  for (var i = 0; i < COUNT; i++) {
    var isCyan = Math.random() < 0.7;
    particles.push({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      r:     1 + Math.random() * 2,
      vx:    (Math.random() - 0.5) * 0.55,
      vy:    (Math.random() - 0.5) * 0.55,
      color: isCyan ? CYAN : MINT,
      phase: Math.random() * Math.PI * 2,
      speed: 0.0007 + Math.random() * 0.0012
    });
  }

  function drawParticles(ts) {
    ctx.clearRect(0, 0, W, H);

    for (var j = 0; j < particles.length; j++) {
      var p = particles[j];

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -20)    p.x = W + 20;
      else if (p.x > W + 20) p.x = -20;
      if (p.y < -20)    p.y = H + 20;
      else if (p.y > H + 20) p.y = -20;

      var pulse = 0.5 + 0.5 * Math.sin(p.phase + ts * p.speed);
      var alpha = 0.25 + pulse * 0.55;
      var r = p.color[0], g = p.color[1], b = p.color[2];
      var gR = p.r * 5;

      var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gR);
      grad.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',' + alpha.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');

      ctx.beginPath();
      ctx.arc(p.x, p.y, gR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + Math.min(1, alpha + 0.25).toFixed(3) + ')';
      ctx.fill();
    }

    requestAnimationFrame(drawParticles);
  }
  requestAnimationFrame(drawParticles);

  // ── Intro sequence ───────────────────────────────────────────
  var introEl  = document.getElementById('intro');
  var phraseEl = document.getElementById('intro-phrase');
  var navbarEl = document.getElementById('navbar');
  var gridEl   = document.getElementById('grid');

  var phrases = [
    { text: 'Toda operação precisa de uma base.', color: '#ffffff' },
    { text: 'Sólida. Específica. Sua.',           color: '#00C8DC' },
    { text: 'Somos a ARKEflow.',                  color: '#ffffff' }
  ];

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  async function showPhrase(text, color) {
    phraseEl.textContent  = text;
    phraseEl.style.color  = color;
    phraseEl.classList.remove('entering', 'exiting');
    phraseEl.getBoundingClientRect(); // force reflow → reset to base state
    phraseEl.classList.add('entering');
    await wait(1350);                 // 450ms transition in + ~900ms hold
    phraseEl.classList.remove('entering');
    phraseEl.classList.add('exiting');
    await wait(480);                  // 450ms transition out + buffer
  }

  async function runIntro() {
    await wait(180);
    for (var k = 0; k < phrases.length; k++) {
      await showPhrase(phrases[k].text, phrases[k].color);
      if (k < phrases.length - 1) await wait(80);
    }
    introEl.classList.add('done');
    await wait(650);
    introEl.style.display = 'none';
    navbarEl.classList.add('visible');
    gridEl.classList.add('visible');
  }

  runIntro();

  // ── Block: 3D tilt on hover ──────────────────────────────────
  var blocks = document.querySelectorAll('.block');

  blocks.forEach(function (block) {
    block.addEventListener('mousemove', function (e) {
      var rect = this.getBoundingClientRect();
      var dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      var dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      this.style.transform =
        'perspective(700px)' +
        ' rotateX(' + (-dy * 5).toFixed(2) + 'deg)' +
        ' rotateY(' + ( dx * 6).toFixed(2) + 'deg)' +
        ' translateY(-3px) scale(1.01)';
    });

    block.addEventListener('mouseleave', function () {
      var self = this;
      self.style.transition = 'transform 0.3s ease, filter 0.35s ease';
      self.style.transform  = '';
      setTimeout(function () { self.style.transition = ''; }, 320);
    });
  });

  // ── Drawer ───────────────────────────────────────────────────
  var drawerEl    = document.getElementById('drawer');
  var dimEl       = document.getElementById('grid-dim');
  var drawerClose = document.getElementById('drawer-close');
  var drawerTag   = document.getElementById('drawer-tag');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerBody  = document.getElementById('drawer-body');
  var drawerCta   = document.getElementById('drawer-cta');

  function openDrawer(block) {
    drawerTag.textContent   = block.dataset.tag;
    drawerTitle.textContent = block.dataset.title;
    drawerBody.textContent  = block.dataset.body;
    drawerCta.textContent   = block.dataset.cta;

    var href = block.dataset.ctaHref || '#';
    drawerCta.href = href;
    if (href.startsWith('http')) {
      drawerCta.setAttribute('target', '_blank');
      drawerCta.setAttribute('rel', 'noopener noreferrer');
    } else {
      drawerCta.removeAttribute('target');
      drawerCta.removeAttribute('rel');
    }

    drawerEl.classList.add('open');
    dimEl.classList.add('active');
    gridEl.classList.add('dimmed');
  }

  function closeDrawer() {
    drawerEl.classList.remove('open');
    dimEl.classList.remove('active');
    gridEl.classList.remove('dimmed');
  }

  blocks.forEach(function (block) {
    block.addEventListener('click', function () { openDrawer(this); });
  });

  drawerClose.addEventListener('click', closeDrawer);
  dimEl.addEventListener('click', closeDrawer);

}());
