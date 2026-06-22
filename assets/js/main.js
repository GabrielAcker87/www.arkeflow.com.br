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
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
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
      if (b.x < -margin)         b.x = W + margin;
      else if (b.x > W + margin) b.x = -margin;
      if (b.y < -margin)         b.y = H + margin;
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

  // ── Intro: references ─────────────────────────────────────
  var introLogoEl  = document.getElementById('intro-logo');
  var logoPerm     = document.getElementById('logo-permanent');
  var phraseA      = document.getElementById('intro-phrase-a');
  var phraseB      = document.getElementById('intro-phrase-b');
  var skipWrap     = document.getElementById('skip-wrap');
  var skipBtnEl    = document.getElementById('skip-btn');
  var blocks       = Array.from(document.querySelectorAll('#grid .block'));

  // Blocks invisible + no interaction during intro
  appEl.classList.add('intro-playing');
  blocks.forEach(function (b) { b.style.opacity = '0'; });

  var P1 = 'Quando o negócio cresce, o <span style="color:#26FF93;font-weight:400">IMPROVISO</span> para de funcionar.';
  var P2 = 'Do processo ao software. <span style="color:#26FF93;font-weight:400">CONSTRUÍDO</span> para o seu negócio.';

  var EASE_PHRASE = 'cubic-bezier(0.25,0.46,0.45,0.94)';
  var EASE_LOGO_IN = 'cubic-bezier(0.34,1.3,0.64,1)';
  var EASE_LOGO_OUT = 'cubic-bezier(0.4,0,0.2,1)';

  var skipped      = false;
  var skipResolvers = [];

  function safeWait(ms) {
    if (skipped) return Promise.resolve();
    return new Promise(function (resolve) {
      var tid = setTimeout(resolve, ms);
      skipResolvers.push(function () { clearTimeout(tid); resolve(); });
    });
  }

  // Phrase positioned with left:50%/top:50%; JS drives translate offsets
  function showPhrase(el, html, fromX, fromY) {
    el.innerHTML = html;
    el.style.transition = 'none';
    el.style.opacity    = '0';
    el.style.transform  = 'translate(calc(-50% + ' + fromX + 'px), calc(-50% + ' + fromY + 'px))';
    el.getBoundingClientRect();
    el.style.transition = 'transform 700ms ' + EASE_PHRASE + ', opacity 700ms ' + EASE_PHRASE;
    el.style.opacity    = '1';
    el.style.transform  = 'translate(-50%, -50%)';
  }

  function hidePhrase(el, toX, toY) {
    el.style.transition = 'transform 700ms ' + EASE_PHRASE + ', opacity 700ms ' + EASE_PHRASE;
    el.style.opacity    = '0';
    el.style.transform  = 'translate(calc(-50% + ' + toX + 'px), calc(-50% + ' + toY + 'px))';
  }

  // Called by both runIntro() and doSkip() — runs steps 6-8
  function doMorphAndFinish() {
    skipWrap.style.opacity       = '0';
    skipWrap.style.pointerEvents = 'none';

    var s        = getScale();
    var appRect  = appEl.getBoundingClientRect();
    var skipRect = skipBtnEl.getBoundingClientRect();
    var skipCX   = (skipRect.left + skipRect.width  / 2 - appRect.left) / s;
    var skipCY   = (skipRect.top  + skipRect.height / 2 - appRect.top)  / s;
    var morphSz  = 9;
    var completed = 0;

    var EASE_BLOCK = 'cubic-bezier(0.34,1.2,0.64,1)';

    blocks.forEach(function (block, i) {
      var bRect = block.getBoundingClientRect();
      var bX = (bRect.left - appRect.left) / s;
      var bY = (bRect.top  - appRect.top)  / s;
      var bW = bRect.width  / s;
      var bH = bRect.height / s;

      var morph = document.createElement('div');
      morph.style.cssText =
        'position:absolute;z-index:5;border-radius:7px;pointer-events:none;transition:none;' +
        'background:rgba(38,255,147,0.06);border:1px solid rgba(38,255,147,0.5);' +
        'left:' + (skipCX - morphSz / 2) + 'px;' +
        'top:'  + (skipCY - morphSz / 2) + 'px;' +
        'width:' + morphSz + 'px;height:' + morphSz + 'px;opacity:1;';
      appEl.appendChild(morph);
      morph.getBoundingClientRect(); // force reflow

      setTimeout(function () {
        morph.style.transition =
          'left 750ms '   + EASE_BLOCK + ',' +
          'top 750ms '    + EASE_BLOCK + ',' +
          'width 750ms '  + EASE_BLOCK + ',' +
          'height 750ms ' + EASE_BLOCK + ',' +
          'opacity 300ms ease 500ms';
        morph.style.left   = bX + 'px';
        morph.style.top    = bY + 'px';
        morph.style.width  = bW + 'px';
        morph.style.height = bH + 'px';
        morph.style.opacity = '0';

        // Block snaps visible as morph fades out
        setTimeout(function () {
          block.style.transition = 'none';
          block.style.opacity    = '1';
          morph.remove();
          completed++;
          if (completed === blocks.length) {
            // Step 7: pause, then step 8
            setTimeout(function () {
              appEl.classList.remove('intro-playing');
              logoPerm.style.opacity       = '1';
              logoPerm.style.pointerEvents = '';
            }, 1000);
          }
        }, 800);
      }, i * 55);
    });
  }

  function doSkip() {
    if (skipped) return;
    skipped = true;
    skipResolvers.forEach(function (r) { r(); });
    skipResolvers = [];

    introLogoEl.style.transition = 'none'; introLogoEl.style.opacity = '0';
    phraseA.style.transition     = 'none'; phraseA.style.opacity     = '0';
    phraseB.style.transition     = 'none'; phraseB.style.opacity     = '0';

    doMorphAndFinish();
  }

  skipWrap.addEventListener('click', doSkip);

  // ── Intro: sequence (steps 1-5) ───────────────────────────
  async function runIntro() {
    // Step 1 — logo in center, fade in → hold → fade out
    introLogoEl.style.opacity   = '0';
    introLogoEl.style.transform = 'translate(-50%, -50%)';
    introLogoEl.getBoundingClientRect();
    introLogoEl.style.transition = 'opacity 400ms ease';
    introLogoEl.style.opacity    = '1';
    await safeWait(1900); // 400ms fade-in + 1500ms hold
    if (skipped) return;

    // Step 2 — logo fades, phrase 1 enters simultaneously (from below)
    introLogoEl.style.opacity = '0';
    showPhrase(phraseA, P1, 0, 160);
    await safeWait(700 + 4500);
    if (skipped) return;

    // Step 3 — cross-transition: phrase 1 exits top, phrase 2 enters from right
    hidePhrase(phraseA, 0, -160);
    showPhrase(phraseB, P2, 200, 0);
    await safeWait(700 + 4500);
    if (skipped) return;

    // Step 4 — phrase 2 exits left, logo re-enters from below
    hidePhrase(phraseB, -200, 0);
    introLogoEl.style.transition = 'none';
    introLogoEl.style.opacity    = '0';
    introLogoEl.style.transform  = 'translate(-50%, calc(-50% + 140px))';
    introLogoEl.getBoundingClientRect();
    introLogoEl.style.transition = 'transform 700ms ' + EASE_LOGO_IN + ', opacity 700ms ease';
    introLogoEl.style.opacity    = '1';
    introLogoEl.style.transform  = 'translate(-50%, -50%)';
    await safeWait(700 + 2000);
    if (skipped) return;

    // Step 5 — logo exits toward top-left, fades mid-travel
    introLogoEl.style.transition = 'transform 600ms ' + EASE_LOGO_OUT + ', opacity 350ms ease';
    introLogoEl.style.transform  = 'translate(calc(-50% - 420px), calc(-50% - 260px))';
    introLogoEl.style.opacity    = '0';

    // Step 6 — morph starts simultaneously
    doMorphAndFinish();
  }

  runIntro();

  // ── Modal overlay ─────────────────────────────────────────
  var modalOverlay       = document.getElementById('modal-overlay');
  var modalClose         = document.getElementById('modal-close');
  var modalContent       = document.getElementById('modal-content');
  var gridEl             = document.getElementById('grid');
  var modalIsOpen        = false;
  var closingFromHistory = false;

  var MODAL_QUEM_SOMOS = '<div class="modal-header"><span class="modal-cat">EMPRESA</span><h2 class="modal-title">Quem somos</h2></div><div class="modal-body modal-two-col"><div class="modal-col"><span class="modal-col-label">A EMPRESA</span><p class="modal-col-statement">Tecnologia que se molda ao negócio,<span style="color:#26FF93"> não o negócio que se molda à tecnologia.</span></p><p class="modal-text">A empresa é nova. A especialidade, não.</p><p class="modal-text">Quase trinta anos de experiência em consultoria e gestão de processos aplicados a cada projeto, em <span style="color:#fff;font-weight:700">Bitrix24</span>, automação e softwares próprios para cada setor.</p><p class="modal-text modal-text-italic">ARKE, do grego arche: origem. O princípio sobre o qual tudo é construído.</p></div><div class="modal-col"><span class="modal-col-label">COMO TRABALHAMOS</span><p class="modal-col-statement">Diagnóstico antes de <span style="color:#26FF93">qualquer solução.</span></p><p class="modal-text">Entendemos o processo, o fluxo e o problema real antes de propor qualquer ferramenta.</p><p class="modal-text">Usamos o que o mercado oferece de melhor e adaptamos o que cada empresa precisa de único. <span style="color:#fff;font-weight:700">Sempre sob medida.</span></p><p class="modal-text">Cada entrega é documentada e transferida com clareza. O objetivo não é vender horas, é garantir que o processo funcione sem depender de nós.</p></div></div>';

  var MODAL_FALE_CONOSCO = '<div class="modal-header"><span class="modal-cat">CONTATO</span><h2 class="modal-title">Fale conosco</h2></div><div class="modal-body modal-two-col"><div class="modal-col"><div class="fc-channels"><div class="fc-ch-item"><div class="fc-ch-label">TELEFONE</div><div class="fc-ch-val">(00) 00000-0000</div></div><div class="fc-ch-item"><div class="fc-ch-label">WHATSAPP</div><div class="fc-ch-val">(00) 00000-0000</div></div><div class="fc-ch-item"><div class="fc-ch-label">INSTAGRAM</div><div class="fc-ch-val">@arkeflow</div></div><div class="fc-ch-item"><div class="fc-ch-label">LINKEDIN</div><div class="fc-ch-val">ARKEflow</div></div></div><p class="modal-text-italic">Fale direto com quem vai construir a solução.</p></div><div class="modal-col fc-form-col"><span class="modal-col-label">Agende uma conversa</span><div class="fc-row"><input class="fc-input" id="fc-nome" placeholder="Nome" autocomplete="off" /><input class="fc-input" id="fc-tel" placeholder="(00) 00000-0000" maxlength="15" autocomplete="off" /></div><div class="fc-row"><input class="fc-input fc-email" id="fc-email" placeholder="E-mail" type="email" autocomplete="off" /><input class="fc-input" id="fc-cnpj" placeholder="00.000.000/0000-00" maxlength="18" autocomplete="off" /></div><button class="fc-dt-btn" id="fc-dt-btn">Escolher data e horário →</button><div class="fc-pills-wrap"><div class="fc-pills-label">Produto de interesse</div><div class="fc-pills"><button type="button" class="fc-pill active">Consultoria Bitrix24</button><button type="button" class="fc-pill">ARKEvest</button><button type="button" class="fc-pill">PDV+</button><button type="button" class="fc-pill">LinkSis</button><button type="button" class="fc-pill">Outros</button></div></div><textarea class="fc-input fc-obs" placeholder="Observações (opcional)"></textarea><div class="fc-submit-row"><button type="button" class="fc-submit">Agendar →</button></div></div></div><div class="fc-picker-overlay" id="fc-picker-overlay"><div class="fc-picker"><div id="fc-cal-view"><div class="fc-picker-hdr"><button id="fc-prev">‹</button><span id="fc-month-label"></span><button id="fc-next">›</button></div><div class="fc-cal-dow"><span>DOM</span><span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span><span>SÁB</span></div><div class="fc-cal-grid" id="fc-cal-grid"></div></div><div id="fc-slot-view" style="display:none"><button class="fc-back-btn" id="fc-back-btn">← voltar</button><div class="fc-slot-date" id="fc-slot-date"></div><div class="fc-slots" id="fc-slots"></div><button class="fc-confirm-btn" id="fc-confirm-btn" style="display:none">Confirmar</button></div></div></div>';

  var MODAL_ARKE_SOFTWARES = '<div class="modal-header"><span class="modal-cat">SOFTWARES</span><div style="display:flex;align-items:center;justify-content:space-between;margin-top:calc(4px * var(--scale))"><h2 class="modal-title" id="ark-title" style="margin-top:0">ARKEvest</h2><span id="ark-counter" style="font-size:calc(11px * var(--scale));color:rgba(255,255,255,0.30);font-weight:400">1 / 3</span></div></div><div class="ark-cards-wrap" id="ark-cards-wrap"><div class="ark-card active" data-card="0"><div class="ark-cols"><div class="modal-col"><span class="modal-col-label">O sistema</span><p class="modal-col-statement">GESTÃO COMPLETA <span style="color:#D4A017">PARA QUEM VENDE MODA.</span></p><p class="modal-text">O <span style="color:#D4A017;font-weight:700">ARKEvest</span> é um ERP especializado no setor de vestuário e moda. Desenvolvido para varejistas e distribuidores que precisam de controle real de estoque com grades de cor e tamanho.</p><p class="modal-text">PDV integrado com emissão de cupom fiscal, entrada automática de NF-e e gestão completa de coleções.</p></div><div class="modal-col"><span class="modal-col-label">Diferenciais</span><p class="modal-col-statement">DO PEDIDO AO CAIXA. <span style="color:#D4A017">SEM PAPEL.</span></p><p class="modal-text">Controle de estoque por grade (cor × tamanho) com conferência automática na entrada de mercadoria.</p><p class="modal-text">Comissionamento de vendedores, metas por período e relatório de curva ABC do estoque.</p><p class="modal-text"><strong style="color:#fff">Emissão de NFC-e e NF-e</strong> integrada ao PDV, com transmissão offline e envio automático ao retomar conexão.</p></div></div><div class="ark-saiba-row"><button class="ark-saiba-btn">Saiba mais →</button></div></div><div class="ark-card" data-card="1"><div class="ark-cols"><div class="modal-col"><span class="modal-col-label">O sistema</span><p class="modal-col-statement">O ESSENCIAL PARA <span style="color:#38BDF8">VENDER BEM.</span></p><p class="modal-text">O PDV+ é a solução de ponto de venda para <span style="color:#38BDF8">MEI, microempresas e negócios do Simples Nacional</span>. Ágil, acessível e sem a complexidade de um ERP completo.</p><p class="modal-text">Disponível no celular (Android e iOS) e no computador (Windows). Vende mesmo <strong style="color:#fff">offline</strong> e emite a nota fiscal assim que a conexão for restabelecida.</p></div><div class="modal-col"><span class="modal-col-label">Diferenciais</span><p class="modal-col-statement">TUDO QUE SEU NEGÓCIO PRECISA <span style="color:#38BDF8">NO DIA A DIA.</span></p><p class="modal-text">Cadastro automático de produtos com foto e tributação. Mesas, comandas, <span style="color:#38BDF8">delivery integrado com iFood</span> e catálogo online próprio.</p><p class="modal-text"><strong style="color:#fff">Totem de autoatendimento</strong>, monitor de cozinha e app para entregadores.</p><p class="modal-text">Aceita <strong style="color:#fff">Cielo, Stone, Getnet, PagBank, Rede</strong> e mais. Relatórios de vendas, estoque e margem bruta.</p></div></div><div class="ark-saiba-row"><button class="ark-saiba-btn">Saiba mais →</button></div></div><div class="ark-card" data-card="2"><div class="ark-cols"><div class="modal-col"><span class="modal-col-label">O sistema</span><p class="modal-col-statement">AUTOMAÇÃO COMPLETA. SEM MÓDULOS, <span style="color:#FB923C">SEM LIMITES.</span></p><p class="modal-text">O LinkSis é um sistema ERP que atende <span style="color:#FB923C">qualquer segmento do comércio</span> — do varejo ao restaurante, do mercado à distribuidora. Uma única licença dá acesso a todos os recursos, sem cobranças extras por módulo.</p><p class="modal-text"><strong style="color:#fff">PDV com emissão fiscal completa</strong> (NFC-e, NF-e, SPED), controle financeiro, multilojas e integração com as principais plataformas de delivery.</p></div><div class="modal-col"><span class="modal-col-label">Diferenciais</span><p class="modal-col-statement">ECOSSISTEMA DE APLICATIVOS <span style="color:#FB923C">INTEGRADOS.</span></p><p class="modal-text">Aceita <span style="color:#FB923C">todas as bandeiras</span> via TEF integrado ao PDV — sem retipos no pinpad. Funciona com Cielo, Stone, Getnet, Rede, PagBank e mais.</p><p class="modal-text">Suporte a <strong style="color:#fff">POS Android</strong>: venda, emita nota e processe pagamento em um único aparelho de mão, sem computador.</p></div></div><div class="ark-saiba-row"><button class="ark-saiba-btn">Saiba mais →</button></div></div></div>';

  function openModal(blockEl) {
    if (modalIsOpen) return;
    modalIsOpen = true;
    resetAll();
    gridEl.classList.add('is-expanded-open');
    document.getElementById('modal-backdrop').classList.add('is-active');
    modalContent.innerHTML = '';
    var r = blockEl.dataset.r;
    var c = blockEl.dataset.c;
    if (r === '0' && c === '2') { modalContent.innerHTML = MODAL_ARKE_SOFTWARES; initArkeModal(); }
    if (r === '1' && c === '0') modalContent.innerHTML = MODAL_QUEM_SOMOS;
    if (r === '1' && c === '2') { modalContent.innerHTML = MODAL_FALE_CONOSCO; initFaleConosco(); }
    modalOverlay.style.transition = 'opacity 320ms ease, transform 320ms ease';
    modalOverlay.classList.add('is-open');
    history.pushState({ arkeModal: true }, '');
  }

  function closeModal(fromHistory) {
    if (!modalIsOpen) return;
    modalIsOpen = false;
    var arkPrev = document.getElementById('ark-prev-btn');
    var arkNext = document.getElementById('ark-next-btn');
    if (arkPrev) arkPrev.remove();
    if (arkNext) arkNext.remove();
    modalOverlay.style.transition = 'opacity 220ms ease, transform 220ms ease';
    modalOverlay.classList.remove('is-open');
    gridEl.classList.remove('is-expanded-open');
    document.getElementById('modal-backdrop').classList.remove('is-active');
    setTimeout(function () {
      modalOverlay.style.transition = '';
      modalContent.innerHTML = '';
    }, 220);
    if (!fromHistory) {
      closingFromHistory = true;
      history.back();
      setTimeout(function () { closingFromHistory = false; }, 100);
    }
  }

  // ── Fale conosco: init ───────────────────────────────────
  function initFaleConosco() {
    var telEl   = document.getElementById('fc-tel');
    var cnpjEl  = document.getElementById('fc-cnpj');
    var emailEl = document.getElementById('fc-email');
    var dtBtn   = document.getElementById('fc-dt-btn');
    var pickerOverlay = document.getElementById('fc-picker-overlay');
    var calView = document.getElementById('fc-cal-view');
    var slotView = document.getElementById('fc-slot-view');
    var monthLabel = document.getElementById('fc-month-label');
    var calGrid = document.getElementById('fc-cal-grid');
    var prevBtn = document.getElementById('fc-prev');
    var nextBtn = document.getElementById('fc-next');
    var slotDateEl = document.getElementById('fc-slot-date');
    var slotsEl = document.getElementById('fc-slots');
    var confirmBtn = document.getElementById('fc-confirm-btn');
    var backBtn = document.getElementById('fc-back-btn');

    var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    var SLOTS  = ['09h00','10h00','11h00','14h00','15h00','16h00','17h00'];

    var now = new Date();
    var curYear  = now.getFullYear();
    var curMonth = now.getMonth();
    var viewYear  = curYear;
    var viewMonth = curMonth;
    var selectedDate = null;
    var selectedSlot = null;

    // Phone mask
    telEl.addEventListener('input', function () {
      var d = this.value.replace(/\D/g, '').substring(0, 11);
      var v = '';
      if (d.length > 0) {
        v = '(' + d.substring(0, 2);
        if (d.length > 2) v += ') ' + d.substring(2, 7);
        if (d.length > 7) v += '-' + d.substring(7, 11);
      }
      this.value = v;
    });

    // CNPJ mask
    cnpjEl.addEventListener('input', function () {
      var d = this.value.replace(/\D/g, '').substring(0, 14);
      var v = '';
      if (d.length > 0) {
        v = d.substring(0, 2);
        if (d.length > 2)  v += '.' + d.substring(2, 5);
        if (d.length > 5)  v += '.' + d.substring(5, 8);
        if (d.length > 8)  v += '/' + d.substring(8, 12);
        if (d.length > 12) v += '-' + d.substring(12, 14);
      }
      this.value = v;
    });

    // Email validation
    emailEl.addEventListener('blur', function () {
      if (!this.value) { this.classList.remove('fc-input-ok', 'fc-input-error'); return; }
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value);
      this.classList.toggle('fc-input-ok',    ok);
      this.classList.toggle('fc-input-error', !ok);
    });
    emailEl.addEventListener('focus', function () {
      this.classList.remove('fc-input-ok', 'fc-input-error');
    });

    // Pills toggle
    document.querySelectorAll('.fc-pill').forEach(function (pill) {
      pill.addEventListener('click', function () {
        this.classList.toggle('active');
      });
    });

    // Calendar rendering
    function renderCal() {
      monthLabel.textContent = MONTHS[viewMonth] + ' ' + viewYear;
      calGrid.innerHTML = '';
      var firstDay    = new Date(viewYear, viewMonth, 1).getDay();
      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      var today = new Date(); today.setHours(0, 0, 0, 0);

      for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('div');
        empty.className = 'fc-cal-day empty';
        calGrid.appendChild(empty);
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var dayEl   = document.createElement('div');
        var dayDate = new Date(viewYear, viewMonth, d);
        dayDate.setHours(0, 0, 0, 0);
        dayEl.className = 'fc-cal-day' + (dayDate < today ? ' past' : '');
        dayEl.textContent = d;
        if (dayDate >= today) {
          (function (yr, mo, dy) {
            dayEl.addEventListener('click', function () {
              selectedDate = new Date(yr, mo, dy);
              showSlots();
            });
          })(viewYear, viewMonth, d);
        }
        calGrid.appendChild(dayEl);
      }
    }

    // Slot view
    function showSlots() {
      calView.style.display  = 'none';
      slotView.style.display = 'block';
      confirmBtn.style.display = 'none';
      selectedSlot = null;
      var dd = String(selectedDate.getDate()).padStart(2, '0');
      var mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      slotDateEl.textContent = dd + '/' + mm + '/' + selectedDate.getFullYear();
      slotsEl.innerHTML = '';
      SLOTS.forEach(function (slot) {
        var el = document.createElement('div');
        el.className = 'fc-slot';
        el.textContent = slot;
        el.addEventListener('click', function () {
          document.querySelectorAll('.fc-slot').forEach(function (s) { s.classList.remove('active'); });
          this.classList.add('active');
          selectedSlot = slot;
          confirmBtn.style.display = 'block';
        });
        slotsEl.appendChild(el);
      });
    }

    // Calendar nav
    prevBtn.addEventListener('click', function () {
      if (viewYear === curYear && viewMonth === curMonth) return;
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCal();
    });
    nextBtn.addEventListener('click', function () {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCal();
    });

    // Back to calendar
    backBtn.addEventListener('click', function () {
      slotView.style.display = 'none';
      calView.style.display  = 'block';
    });

    // Confirm selection
    confirmBtn.addEventListener('click', function () {
      pickerOverlay.classList.remove('open');
      var dd = String(selectedDate.getDate()).padStart(2, '0');
      var mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      var yyyy = selectedDate.getFullYear();
      dtBtn.textContent = '✓ ' + dd + '/' + mm + '/' + yyyy + ' às ' + selectedSlot;
      dtBtn.classList.add('fc-dt-btn--selected');
    });

    // Open picker
    dtBtn.addEventListener('click', function () {
      calView.style.display  = 'block';
      slotView.style.display = 'none';
      pickerOverlay.classList.add('open');
      renderCal();
    });

    // Close picker on overlay click
    pickerOverlay.addEventListener('click', function (e) {
      if (e.target === pickerOverlay) pickerOverlay.classList.remove('open');
    });

    renderCal();
  }

  // ── ARKE Softwares: modal carousel ──────────────────────
  function initArkeModal() {
    var cards     = Array.from(modalContent.querySelectorAll('.ark-card'));
    var titleEl   = document.getElementById('ark-title');
    var counterEl = document.getElementById('ark-counter');
    var current   = 0;
    var total     = cards.length;

    function updateHeader(idx) {
      counterEl.textContent = (idx + 1) + ' / ' + total;
      if (idx === 2) {
        var s = getScale();
        titleEl.innerHTML = '<img src="assets/img/linksis-logo.svg" style="height:' + Math.round(20 * s) + 'px;width:auto;border-radius:3px;opacity:0.85;vertical-align:middle">';
      } else {
        titleEl.textContent = idx === 0 ? 'ARKEvest' : 'PDV+';
      }
    }

    function goTo(idx) {
      cards[current].classList.remove('active');
      current = (idx + total) % total;
      cards[current].classList.add('active');
      updateHeader(current);
    }

    var prevBtn = document.createElement('button');
    prevBtn.id        = 'ark-prev-btn';
    prevBtn.className = 'ark-nav-btn';
    prevBtn.innerHTML = '&#8249;';
    prevBtn.style.left = '-14px';

    var nextBtn = document.createElement('button');
    nextBtn.id        = 'ark-next-btn';
    nextBtn.className = 'ark-nav-btn';
    nextBtn.innerHTML = '&#8250;';
    nextBtn.style.right = '-14px';

    modalOverlay.appendChild(prevBtn);
    modalOverlay.appendChild(nextBtn);

    setTimeout(function () {
      var headerEl = modalContent.querySelector('.modal-header');
      var headerH  = headerEl ? headerEl.offsetHeight : 60;
      var topPx    = headerH + (548 - headerH) / 2 - 14;
      prevBtn.style.top = topPx + 'px';
      nextBtn.style.top = topPx + 'px';
    }, 0);

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });
  }

  // Block click → open modal
  blocks.forEach(function (block) {
    block.addEventListener('click', function () {
      if (appEl.classList.contains('intro-playing')) return;
      openModal(this);
    });
  });

  // Close triggers
  modalClose.addEventListener('click', function () { closeModal(false); });

  modalOverlay.addEventListener('click', function (e) {
    if (e.target === modalOverlay) closeModal(false);
  });

  document.getElementById('modal-backdrop').addEventListener('click', function () {
    closeModal(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modalIsOpen) closeModal(false);
  });

  window.addEventListener('popstate', function () {
    if (closingFromHistory) { closingFromHistory = false; return; }
    if (modalIsOpen) closeModal(true);
  });

  // ── Block hover tilt ──────────────────────────────────────
  var isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  var activeBlock = null;
  var leaveTimer  = null;

  var BASE_TRANS =
    'transform 380ms cubic-bezier(0.15,0.85,0.3,1),' +
    'filter 380ms cubic-bezier(0.15,0.85,0.3,1),' +
    'opacity 380ms cubic-bezier(0.15,0.85,0.3,1)';
  var TILT_TRANS =
    'filter 380ms cubic-bezier(0.15,0.85,0.3,1),' +
    'opacity 380ms cubic-bezier(0.15,0.85,0.3,1)';

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
        b.style.transform   = 'translateX(' + cx + 'px) translateY(' + cy + 'px) translateZ(50px) scale(1.16)';
        b.style.filter      = 'brightness(1.1)';
        b.style.opacity     = '1';
        b.style.zIndex      = '10';
      } else {
        var br = parseInt(b.dataset.r, 10);
        var bc = parseInt(b.dataset.c, 10);
        b.classList.remove('is-active');
        b.style.transform   = 'translateX(' + (bc - ac) * 20 + 'px) translateY(' + (br - ar) * 16 + 'px) translateZ(-65px) scale(0.85)';
        b.style.filter      = 'brightness(0.48) saturate(0.6)';
        b.style.opacity     = '0.65';
        b.style.zIndex      = '';
      }
    });
  }

  function resetAll() {
    activeBlock = null;
    blocks.forEach(function (b) {
      b.style.transition  = BASE_TRANS;
      b.style.transform   = '';
      b.style.filter      = '';
      b.style.opacity     = '1';
      b.style.zIndex      = '';
      b.classList.remove('is-active');
    });
  }

  blocks.forEach(function (block) {
    block.addEventListener('mouseenter', function () {
      if (appEl.classList.contains('intro-playing')) return;
      activateBlock(this);
    });

    block.addEventListener('mousemove', function (e) {
      if (isTouch) return;
      if (appEl.classList.contains('intro-playing')) return;
      if (activeBlock !== this) return;
      var rect = this.getBoundingClientRect();
      var dx = (e.clientX - rect.left  - rect.width  / 2) / (rect.width  / 2);
      var dy = (e.clientY - rect.top   - rect.height / 2) / (rect.height / 2);
      var mc = parseInt(this.dataset.c, 10);
      var mr = parseInt(this.dataset.r, 10);
      var cx = mc === 0 ? 30 : mc === 2 ? -30 : 0;
      var cy = mr === 0 ? 25 : -25;
      this.style.transition = TILT_TRANS;
      this.style.transform  =
        'rotateX(' + (-dy * 6).toFixed(2) + 'deg)' +
        ' rotateY(' + (dx * 7).toFixed(2) + 'deg)' +
        ' translateX(' + cx + 'px) translateY(' + cy + 'px)' +
        ' translateZ(50px) scale(1.16)';
    });

    block.addEventListener('mouseleave', function () {
      if (activeBlock !== this) return;
      leaveTimer = setTimeout(resetAll, 12);
    });
  });

  // ── ARKE Softwares: closed block rotation ────────────────
  var arkBlock = document.querySelector('.block[data-r="0"][data-c="2"]');
  if (arkBlock) {
    var arkSlides  = Array.from(arkBlock.querySelectorAll('.ark-slide'));
    var arkDots    = Array.from(arkBlock.querySelectorAll('.ark-dot'));
    var arkCurr    = 0;
    var arkTimer   = null;

    function arkGoTo(idx) {
      arkSlides[arkCurr].classList.remove('active');
      arkDots[arkCurr].classList.remove('active');
      arkCurr = idx;
      arkSlides[arkCurr].classList.add('active');
      arkDots[arkCurr].classList.add('active');
    }

    function arkStartTimer() {
      arkTimer = setInterval(function () {
        arkGoTo((arkCurr + 1) % arkSlides.length);
      }, 7000);
    }

    arkDots.forEach(function (dot, i) {
      dot.addEventListener('click', function (e) {
        e.stopPropagation();
        clearInterval(arkTimer);
        arkGoTo(i);
        arkStartTimer();
      });
    });

    arkStartTimer();
  }

}());
