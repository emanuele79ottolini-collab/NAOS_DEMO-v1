/* Studio Naòs – interazioni */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header e menu ---------- */
  var header = doc.querySelector('.site-header');
  var menuBtn = doc.getElementById('menuBtn');
  var nav = doc.getElementById('nav');

  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    nav.classList.toggle('open', open);
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Voce di menu attiva */
  var links = Array.prototype.slice.call(nav.querySelectorAll('a'));
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (a) {
            if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
            else a.removeAttribute('aria-current');
          });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var s = doc.querySelector(a.getAttribute('href'));
      if (s) secObs.observe(s);
    });
  }

  /* ---------- Comparsa elementi ---------- */
  var revealEls = doc.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { obs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Parallasse leggero delle foto ---------- */
  var parallax = Array.prototype.slice.call(doc.querySelectorAll('[data-parallax] img'));
  if (parallax.length && !reduceMotion) {
    var ticking = false;
    var update = function () {
      var vh = window.innerHeight;
      parallax.forEach(function (img) {
        var r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 circa
        img.style.translate = '0 ' + (p * -18).toFixed(1) + 'px';
      });
      ticking = false;
    };
    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* Se una foto non si carica, resta il fondo morbido */
  doc.querySelectorAll('img').forEach(function (img) {
    img.addEventListener('error', function () { img.style.visibility = 'hidden'; });
  });

  /* ---------- Modulo appuntamento: link WhatsApp / email ---------- */
  var fName = doc.getElementById('f-name');
  var fWho = doc.getElementById('f-who');
  var fWhen = doc.getElementById('f-when');
  var fTel = doc.getElementById('f-tel');
  var sendWa = doc.getElementById('send-wa');
  var sendMail = doc.getElementById('send-mail');

  function buildMessage() {
    var parts = fWho.value.split('|');
    var name = fName.value.trim();
    var when = fWhen.value.trim();
    var tel = fTel.value.trim();
    var text = 'Buongiorno ' + parts[1] + ', vorrei fissare un appuntamento.';
    if (name) text += '\nMi chiamo ' + name + '.';
    if (when) text += '\nGiorno e orario richiesto: ' + when + '.';
    if (tel) text += '\nPotete richiamarmi al ' + tel + '.';
    text += '\nGrazie.';
    return { phone: parts[0], text: text };
  }
  function refreshLinks() {
    var m = buildMessage();
    sendWa.href = 'https://wa.me/' + m.phone + '?text=' + encodeURIComponent(m.text);
    sendMail.href = 'mailto:info@studionaos.it?subject=' + encodeURIComponent('Richiesta di appuntamento') +
      '&body=' + encodeURIComponent(m.text);
  }
  [fName, fWho, fWhen, fTel].forEach(function (el) {
    el.addEventListener('input', refreshLinks);
    el.addEventListener('change', refreshLinks);
  });
  doc.getElementById('booking').addEventListener('submit', function (e) { e.preventDefault(); });
  refreshLinks();
})();

/* Video di presentazione: parte da solo (muto), si ferma sull'ultimo fotogramma, ha un comando ben visibile */
(function () {
  'use strict';
  var v = document.getElementById('filmVideo');
  var b = document.getElementById('filmBtn');
  if (!v || !b) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var LABELS = { playing: 'Metti in pausa il video', paused: 'Riproduci il video', ended: 'Rivedi il video' };

  function set(state) { b.setAttribute('data-state', state); b.setAttribute('aria-label', LABELS[state]); }

  v.removeAttribute('controls');
  v.muted = true;
  b.hidden = false;
  set('paused');

  v.addEventListener('play', function () { set('playing'); });
  v.addEventListener('pause', function () { if (!v.ended) set('paused'); });
  v.addEventListener('ended', function () { set('ended'); });

  b.addEventListener('click', function () {
    if (v.ended) v.currentTime = 0;
    if (v.paused || v.ended) { var p = v.play(); if (p && p.catch) p.catch(function () { set('paused'); }); }
    else v.pause();
  });

  if (reduce) {
    // Niente movimento automatico: si mostra l'ultimo fotogramma, il video parte solo su richiesta
    var last = function () { if (isFinite(v.duration)) v.currentTime = Math.max(0, v.duration - 0.05); };
    if (v.readyState >= 1) last(); else v.addEventListener('loadedmetadata', last, { once: true });
  } else {
    var p = v.play();
    if (p && p.catch) p.catch(function () { set('paused'); });
  }
})();

/* Percorsi: galleria orizzontale con filtri, frecce, trascinamento e schede che si ingrandiscono al centro */
(function () {
  'use strict';
  var track = document.getElementById('track');
  if (!track) return;
  var cards = Array.prototype.slice.call(track.querySelectorAll('.pcard'));
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip-f'));
  var prev = document.getElementById('trackPrev');
  var next = document.getElementById('trackNext');
  var bar = document.getElementById('trackBar');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function visible() { return cards.filter(function (c) { return !c.hidden; }); }

  // Filtri con ingresso a cascata
  function applyFilter(f) {
    var n = 0;
    cards.forEach(function (c) {
      var show = f === 'all' || c.getAttribute('data-cat') === f;
      c.hidden = !show;
      if (show) { c.style.setProperty('--d', Math.min(n, 8)); n++; }
    });
    track.classList.remove('in'); void track.offsetWidth; track.classList.add('in');
    track.scrollTo({ left: 0, behavior: 'auto' });
    update();
  }
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === ch)); });
      applyFilter(ch.getAttribute('data-filter'));
    });
  });

  // Frecce
  function step(dir) {
    track.scrollBy({ left: dir * Math.max(280, track.clientWidth * 0.7), behavior: reduce ? 'auto' : 'smooth' });
  }
  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });

  // Trascinamento con il mouse
  var down = false, startX = 0, startL = 0, moved = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = 0; startX = e.clientX; startL = track.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
    if (moved > 5) { track.classList.add('dragging'); track.scrollLeft = startL - dx; }
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false;
    if (moved > 5) {
      // riallinea alla scheda più vicina
      var left = track.scrollLeft, best = null, bd = 1e9;
      visible().forEach(function (c) { var d = Math.abs(c.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft) - left); if (d < bd) { bd = d; best = c; } });
      track.classList.remove('dragging');
      if (best) track.scrollTo({ left: best.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: reduce ? 'auto' : 'smooth' });
    }
  });
  track.addEventListener('click', function (e) { if (moved > 5) { e.preventDefault(); e.stopPropagation(); moved = 0; } }, true);

  // Luce che segue il puntatore sulla scheda
  track.addEventListener('pointermove', function (e) {
    var art = e.target.closest && e.target.closest('.pcard article');
    if (!art) return;
    var r = art.getBoundingClientRect();
    art.style.setProperty('--mx', (e.clientX - r.left) + 'px');
    art.style.setProperty('--my', (e.clientY - r.top) + 'px');
  });

  // Avanzamento e scheda al centro leggermente più grande
  var ticking = false;
  function update() {
    ticking = false;
    var max = track.scrollWidth - track.clientWidth;
    var ratio = track.clientWidth / track.scrollWidth;
    bar.style.width = Math.max(12, ratio * 100) + '%';
    bar.style.transform = 'translateX(' + (max > 0 ? (track.scrollLeft / max) * ((1 / ratio) - 1) * 100 : 0) + '%)';
    prev.disabled = track.scrollLeft <= 4;
    next.disabled = track.scrollLeft >= max - 4;
    if (reduce) return;
    var mid = track.scrollLeft + track.clientWidth / 2;
    visible().forEach(function (c) {
      var cx = c.offsetLeft + c.offsetWidth / 2;
      var d = Math.min(1, Math.abs(cx - mid) / (track.clientWidth * 0.6));
      c.firstElementChild.style.setProperty('--s', (1 - d * 0.06).toFixed(3));
      c.style.opacity = (1 - d * 0.28).toFixed(3);
    });
  }
  track.addEventListener('scroll', function () { if (!ticking) { ticking = true; window.requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();
  setTimeout(update, 400);
})();
