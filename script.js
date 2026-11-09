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

/* Percorsi: libro da sfogliare, una pagina alla volta con effetto di pagina che si gira */
(function () {
  'use strict';
  var track = document.getElementById('track');
  var wrap = document.getElementById('bookWrap');
  if (!track || !wrap) return;

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip-f'));
  var prev = document.getElementById('trackPrev');
  var next = document.getElementById('trackNext');
  var bar = document.getElementById('trackBar');

  var ICONS = {
    conf: '<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10h32a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H22l-9 7v-7H8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Z"/><path d="M14 19h20M14 26h12"/></svg>',
    grup: '<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="17" cy="17" r="6"/><circle cx="33" cy="20" r="5"/><path d="M5 38c0-7 5-12 12-12s12 5 12 12M30 27c6 0 11 4 12 11"/></svg>',
    cors: '<svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M24 12c-4-3-9-4-16-4v28c7 0 12 1 16 4 4-3 9-4 16-4V8c-7 0-12 1-16 4Z"/><path d="M24 12v28"/></svg>'
  };
  var CAPTION = {
    conf: 'Serate aperte a tutti',
    grup: 'Si lavora insieme, in piccolo gruppo',
    cors: 'Percorsi strutturati, anche online'
  };

  // Dati letti dall'elenco già presente in pagina (resta come alternativa senza JavaScript)
  var all = Array.prototype.slice.call(track.querySelectorAll('.pcard')).map(function (li) {
    var a = li.querySelector('.pc-link');
    return {
      cat: li.getAttribute('data-cat'),
      tags: li.querySelector('.pc-top').innerHTML.replace(/<span class="pc-num"[^>]*>.*?<\/span>/, ''),
      title: li.querySelector('h3').textContent,
      desc: li.querySelector('p').textContent,
      href: a.getAttribute('href'),
      aria: a.getAttribute('aria-label')
    };
  });
  if (!all.length) return;

  var items = [], sheets = [], idx = 0, n = 0, book, live, count;

  function pad(i) { return i < 10 ? '0' + i : '' + i; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  function decoPage(i) {
    var it = items[i];
    return '<div class="page left deco" data-cat="' + it.cat + '" aria-hidden="true">' +
      '<div class="deco-ico">' + ICONS[it.cat] + '</div>' +
      '<div class="deco-num">' + pad(i + 1) + '</div>' +
      '<div class="deco-of">di ' + n + '</div>' +
      '<p class="deco-cat">' + CAPTION[it.cat] + '</p></div>';
  }

  function textPage(i) {
    var it = items[i];
    return '<div class="page right text" data-cat="' + it.cat + '">' +
      '<div class="pc-top">' + it.tags + '<span class="pc-num" aria-hidden="true">' + pad(i + 1) + '</span></div>' +
      '<h3>' + esc(it.title) + '</h3>' +
      '<p>' + esc(it.desc) + '</p>' +
      '<a class="pc-link" href="' + esc(it.href) + '" target="_blank" rel="noopener" aria-label="' + esc(it.aria) + '">Chiedi informazioni</a></div>';
  }

  function build(list) {
    items = list; n = list.length; idx = 0;
    var html = '<div class="book" id="book" tabindex="0" role="group" aria-roledescription="libro da sfogliare" aria-label="Percorsi, usa le frecce per sfogliare">' +
      '<div class="book-edge" aria-hidden="true"></div>' +
      '<div class="leftbase">' + decoPage(0) + '</div>';
    for (var i = 0; i < n; i++) {
      html += '<div class="sheet" data-i="' + i + '"><div class="face front">' + textPage(i) + '</div>' +
        '<div class="face back">' + (i + 1 < n ? decoPage(i + 1) : '') + '</div></div>';
    }
    html += '</div><div class="book-meta"><span class="book-count" id="bookCount"></span>' +
      '<span class="book-hint">Sfoglia con le frecce o trascina la pagina</span></div>' +
      '<p class="sr" id="bookLive" aria-live="polite"></p>';
    wrap.innerHTML = html;
    book = document.getElementById('book');
    count = document.getElementById('bookCount');
    live = document.getElementById('bookLive');
    sheets = Array.prototype.slice.call(book.querySelectorAll('.sheet'));
    sheets.forEach(function (s, i) { s.style.zIndex = n - i; s.inert = i !== 0; });
    if (sheets[0]) sheets[0].classList.add('current');
    bindDrag();
    render(false);
  }

  function render(announce) {
    sheets.forEach(function (s, i) {
      var flipped = i < idx;
      var was = s.classList.contains('flipped');
      if (flipped !== was) {
        s.classList.add('turning');
        (function (el) { setTimeout(function () { el.classList.remove('turning'); }, 950); })(s);
        s.classList.toggle('flipped', flipped);
      }
      s.style.zIndex = flipped ? n + i + 1 : n - i;
      s.classList.toggle('current', i === idx);
      s.inert = i !== idx;
    });
    count.textContent = pad(idx + 1) + ' / ' + pad(n);
    prev.disabled = idx <= 0;
    next.disabled = idx >= n - 1;
    bar.style.width = ((idx + 1) / n * 100) + '%';
    if (announce) live.textContent = 'Percorso ' + (idx + 1) + ' di ' + n + ': ' + items[idx].title;
  }

  function go(k, announce) {
    k = Math.max(0, Math.min(n - 1, k));
    if (k === idx) return;
    idx = k;
    render(announce !== false);
  }

  prev.addEventListener('click', function () { go(idx - 1); });
  next.addEventListener('click', function () { go(idx + 1); });

  // Filtri
  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === ch)); });
      var f = ch.getAttribute('data-filter');
      build(f === 'all' ? all : all.filter(function (x) { return x.cat === f; }));
    });
  });

  // Tastiera, trascinamento e tocco
  wrap.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(idx + 1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); go(idx - 1); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(n - 1); }
  });

  var sx = null, sy = 0, moved = false;
  function bindDrag() {
    book.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      sx = e.clientX; sy = e.clientY; moved = false;
    });
    book.addEventListener('pointermove', function (e) {
      if (sx === null) return;
      if (Math.abs(e.clientX - sx) > 12) moved = true;
    });
    var end = function (e) {
      if (sx === null) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      sx = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.2) { go(dx < 0 ? idx + 1 : idx - 1); }
    };
    book.addEventListener('pointerup', end);
    book.addEventListener('pointercancel', function () { sx = null; });
    book.addEventListener('click', function (e) { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
    book.addEventListener('dragstart', function (e) { e.preventDefault(); });
  }

  // Attivazione: il libro sostituisce l'elenco a scorrimento
  track.hidden = true;
  wrap.hidden = false;
  document.documentElement.classList.add('has-book');
  build(all);
})();
