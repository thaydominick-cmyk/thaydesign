/* Thay Dominick — interações da landing page */
(function () {
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* 1. Entrada dos elementos durante a rolagem (uma vez por elemento) */
  var targets = document.querySelectorAll('.anim, .anim-stagger, .anim-scale');
  if (reduce || !hasIO) {
    targets.forEach(function (el) { el.classList.add('show'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('show');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* 2. Sequência do processo (25% visível) */
  var process = document.querySelector('.process');
  if (process) {
    if (reduce || !hasIO) {
      process.classList.add('in-view');
    } else {
      var po = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            po.unobserve(entry.target);
          }
        });
      }, { threshold: 0.25 });
      po.observe(process);
    }
  }

  /* 3. Botões de WhatsApp: os links ficam direto no HTML (sem JavaScript) */

  /* 4. FAQ com abertura suave e teclado */
  document.querySelectorAll('.faq-q').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.faq-item');
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      item.classList.toggle('open', !open);
    });
  });

  /* 5. Imagens de projeto: espaço reservado se o arquivo faltar */
  document.querySelectorAll('.project-media img').forEach(function (img) {
    function empty() { img.parentElement.classList.add('is-empty'); }
    if (img.complete && img.naturalWidth === 0) empty();
    img.addEventListener('error', empty);
  });

})();

/* Linha vertical do processo no celular: termina no último círculo */
(function () {
  var flow = document.querySelector('.process-flow');
  if (!flow) return;
  function fit() {
    var last = flow.lastElementChild;
    flow.style.setProperty('--line-end', Math.max(26, last.offsetHeight - 26) + 'px');
  }
  fit();
  window.addEventListener('resize', fit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
})();

/* Faixa de conceitos em movimento contínuo (letreiro) */
(function () {
  var marquee = document.querySelector('.marquee');
  if (!marquee) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; // movimento reduzido: faixa estática, sem animação

  var track = marquee.querySelector('.marquee-track');
  var row = track.querySelector('.concepts-row');
  var SPEED = 55; // pixels por segundo

  function build() {
    track.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });
    marquee.classList.add('is-running');
    var w = row.getBoundingClientRect().width;
    if (!w) return;
    // cópias suficientes para cobrir a largura + uma volta completa, sem buracos
    var copies = Math.ceil(marquee.offsetWidth / w) + 1;
    for (var i = 0; i < copies; i++) {
      var clone = row.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('data-clone', '');
      track.appendChild(clone);
    }
    track.style.setProperty('--shift', -w + 'px');
    track.style.setProperty('--dur', (w / SPEED) + 's');
  }

  var t;
  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(build, 150); });
})();

/* Carrossel de clientes: bolinhas (mostram e levam ao card) e setas (computador) */
(function () {
  var grid = document.querySelector('.projects-grid');
  if (!grid) return;
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.project'));
  if (cards.length < 2) return;

  // Com movimento liberado, as capas passam sozinhas em loop, como a faixa de conceitos.
  // Com "reduzir movimento" ligado, fica o carrossel manual com bolinhas e setas.
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduce) { autoScroll(grid, cards); return; }

  function startOf(card) {
    return card.offsetLeft - grid.offsetLeft - parseFloat(getComputedStyle(grid).paddingLeft);
  }
  function maxScroll() { return grid.scrollWidth - grid.clientWidth; }
  function go(left) { grid.scrollTo({ left: Math.max(0, Math.min(left, maxScroll())), behavior: 'smooth' }); }

  function arrow(cls, label) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'arrow-dot projects-arrow ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<svg aria-hidden="true"><use href="#i-arrow"/></svg>';
    return b;
  }

  var nav = document.createElement('div');
  nav.className = 'projects-nav';
  var prev = arrow('prev', 'Projetos anteriores');
  var next = arrow('next', 'Próximos projetos');
  var dots = document.createElement('div');
  dots.className = 'projects-dots';
  cards.forEach(function (card, i) {
    var b = document.createElement('button');
    b.type = 'button';
    var name = card.querySelector('h3');
    b.setAttribute('aria-label', 'Ver projeto ' + (name ? name.textContent : i + 1));
    b.addEventListener('click', function () { go(startOf(card)); });
    dots.appendChild(b);
  });
  nav.appendChild(prev); nav.appendChild(dots); nav.appendChild(next);
  grid.after(nav);

  var current = 0;
  var buttons = dots.querySelectorAll('button');
  function update() {
    var left = grid.scrollLeft, best = 0, bestDist = Infinity;
    cards.forEach(function (card, i) {
      var d = Math.abs(startOf(card) - left);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    var atEnd = left >= maxScroll() - 2;
    if (atEnd) best = cards.length - 1; // chegou ao fim
    current = best;
    buttons.forEach(function (b, i) { b.setAttribute('aria-current', i === best ? 'true' : 'false'); });
    prev.disabled = left <= 2;
    next.disabled = atEnd;
  }
  // setas: andam um card por vez
  prev.addEventListener('click', function () { go(startOf(cards[Math.max(0, current - 1)])); });
  next.addEventListener('click', function () { go(startOf(cards[Math.min(cards.length - 1, current + 1)])); });

  var raf;
  grid.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  window.addEventListener('resize', update);
  update();
})();

/* Capas dos clientes passando sozinhas, em loop contínuo.
   Para quando o mouse está em cima, quando alguém toca/arrasta ou navega pelo teclado,
   e volta a andar sozinha logo depois. */
function autoScroll(grid, cards) {
  var SPEED = 40;          // pixels por segundo
  var RESUME_AFTER = 2500; // ms parada depois de um toque/arrasto
  grid.classList.add('is-auto');

  // cópias dos cards para o loop não ter fim (escondidas de leitores de tela e do teclado)
  var loopWidth = 0;
  function build() {
    grid.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });
    var gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    var first = cards[0].offsetLeft;
    var last = cards[cards.length - 1];
    loopWidth = last.offsetLeft + last.offsetWidth + gap - first;
    var copies = Math.ceil(grid.clientWidth / loopWidth) + 1;
    for (var c = 0; c < copies; c++) {
      cards.forEach(function (card) {
        var clone = card.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('tabindex', '-1');
        clone.setAttribute('data-clone', '');
        grid.appendChild(clone);
      });
    }
  }

  var pos = 0, last = 0, hover = false, focus = false, held = false, visible = true, timer;
  function paused() { return hover || focus || held || !visible; }

  function frame(now) {
    var dt = last ? Math.min(now - last, 100) / 1000 : 0;
    last = now;
    if (!paused() && loopWidth) {
      pos += SPEED * dt;
      if (pos >= loopWidth) pos -= loopWidth;
      grid.scrollLeft = pos;
    }
    requestAnimationFrame(frame);
  }

  // quando a pessoa mexe, a posição dela vira o novo ponto de partida
  function sync() {
    pos = grid.scrollLeft;
    if (loopWidth && pos >= loopWidth) { pos -= loopWidth; grid.scrollLeft = pos; }
  }
  function hold() { held = true; clearTimeout(timer); }
  function release() {
    clearTimeout(timer);
    timer = setTimeout(function () { sync(); held = false; }, RESUME_AFTER);
  }

  grid.addEventListener('mouseenter', function () { hover = true; });
  grid.addEventListener('mouseleave', function () { sync(); hover = false; });
  grid.addEventListener('focusin', function () { focus = true; });
  grid.addEventListener('focusout', function () { sync(); focus = false; });
  grid.addEventListener('touchstart', hold, { passive: true });
  grid.addEventListener('touchend', release, { passive: true });
  grid.addEventListener('wheel', function () { hold(); release(); }, { passive: true });
  grid.addEventListener('scroll', function () { if (paused()) sync(); }, { passive: true });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
    }).observe(grid);
  }

  var rt;
  build();
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { build(); sync(); }, 150); });
  requestAnimationFrame(frame);
}
