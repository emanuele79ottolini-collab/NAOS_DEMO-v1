/* Studio Naòs – interazioni */
(function () {
  'use strict';
  var doc = document;

  /* Parte sempre dall'alto (dal video), salvo link diretti a una sezione */
  function toTop() {
    if (!location.hash) { window.scrollTo(0, 0); return; }
    var t = null;
    try { t = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch (e) { t = null; }
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  }
  window.addEventListener('load', function () { toTop(); setTimeout(toTop, 120); });
  window.addEventListener('pageshow', function (e) { if (e.persisted) toTop(); });
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
  // Audio del video: spento all'apertura, si accende solo su richiesta, con volume regolabile
  var sBox = document.getElementById('filmSound'), sBtn = document.getElementById('soundBtn');
  var sVol = document.getElementById('soundVol'), sLab = document.getElementById('soundLabel');
  function volGet() { try { var x = window.localStorage.getItem('naos-film-vol'); return x === null ? null : +x; } catch (e) { return null; } }
  function volSet(x) { try { window.localStorage.setItem('naos-film-vol', String(x)); } catch (e) { /* facoltativo */ } }
  function soundUI() {
    var on = !v.muted && v.volume > 0;
    sBtn.setAttribute('aria-pressed', String(on));
    sBtn.setAttribute('aria-label', on ? "Disattiva l'audio del video" : "Attiva l'audio del video");
    sLab.textContent = on ? 'Audio acceso' : 'Audio spento';
  }
  if (sBox && sBtn && sVol) {
    var saved = volGet();
    if (saved !== null && !isNaN(saved) && saved > 0) sVol.value = String(Math.min(100, saved));
    v.volume = (+sVol.value) / 100;
    v.muted = true;
    sBox.hidden = false;
    soundUI();
    sBtn.addEventListener('click', function () {
      if (v.muted || v.volume === 0) {
        if (+sVol.value === 0) sVol.value = '35';
        v.volume = (+sVol.value) / 100;
        v.muted = false;
        if (v.ended) v.currentTime = 0;
        if (v.paused) { var q = v.play(); if (q && q.catch) q.catch(function () {}); }
      } else { v.muted = true; }
      soundUI();
    });
    sVol.addEventListener('input', function () {
      var x = +sVol.value;
      volSet(x);
      v.volume = x / 100;
      v.muted = x === 0;
      soundUI();
    });
    v.addEventListener('volumechange', soundUI);
  }
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

/* Percorsi: schede disposte all'interno di un tamburo che gira lentamente, con i bordi che si curvano verso chi guarda */
(function () {
  'use strict';
  var track = document.getElementById('track');
  var wrap = document.getElementById('drumWrap');
  if (!track || !wrap) return;

  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip-f'));
  var prev = document.getElementById('trackPrev');
  var next = document.getElementById('trackNext');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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

  var stage, drum, cards = [], slots = [], total = 0, theta = 20, R = 800, CW = 280, GAP = 16, K = 0.07;
  var ang = 0, vel = 0, tween = null, dragging = false, hovering = false, focused = false, userPaused = false, inView = true;
  var SPEED = 0.0036;            // gradi al millisecondo (circa 3,6 gradi al secondo)
  var last = 0, raf = 0, moved = 0, lastScrollY = window.scrollY;
  var cur = [], pauseBtn;

  function pad(i) { return i < 10 ? '0' + i : '' + i; }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function norm(a) { return ((a + 180) % 360 + 360) % 360 - 180; }

  function sizes() {
    var w = wrap.clientWidth;
    CW = w < 520 ? 236 : 280;
    var h = CW === 280 ? 350 : 340;
    stage.style.setProperty('--cw', CW + 'px');
    stage.style.setProperty('--ch', h + 'px');
    R = (CW + GAP) / (2 * Math.sin((theta / 2) * Math.PI / 180));
    K = theta / (CW + GAP);
    cards.forEach(function (c, i) { c.style.transform = 'rotateY(' + (-i * theta) + 'deg) translateZ(' + (-R) + 'px)'; });
  }

  function cardHTML(it, i, real, n) {
    return '<div class="dcard" data-cat="' + it.cat + '"' + (real ? ' role="group" aria-roledescription="scheda" aria-label="Percorso ' + (i + 1) + ' di ' + n + '"' : ' aria-hidden="true"') + '>' +
      '<div class="pc-top">' + it.tags + '<span class="pc-num" aria-hidden="true">' + pad(i + 1) + '</span></div>' +
      '<h3>' + esc(it.title) + '</h3><p>' + esc(it.desc) + '</p>' +
      '<a class="pc-link" href="' + esc(it.href) + '" target="_blank" rel="noopener" aria-label="' + esc(it.aria) + '"' + (real ? '' : ' tabindex="-1"') + '>Chiedi informazioni</a></div>';
  }

  function build(list) {
    var n = list.length, reps = n >= 12 ? 1 : Math.ceil(12 / n);
    total = n * reps; theta = 360 / total;
    var html = '<div class="drum-stage" id="drumStage" tabindex="0" role="group" aria-roledescription="carosello" aria-label="Percorsi: trascina o usa le frecce per scorrere">' +
      '<div class="drum" id="drum">';
    for (var k = 0; k < total; k++) html += cardHTML(list[k % n], k % n, k < n, n);
    html += '</div></div><p class="drum-hint">Trascina, scorri o usa le frecce.<span class="hover-hint"> Passa sopra una scheda per fermare la rotazione.</span></p>';
    wrap.innerHTML = html;
    stage = document.getElementById('drumStage');
    drum = document.getElementById('drum');
    cards = Array.prototype.slice.call(drum.children);
    cur = cards.map(function () { return null; });
    ang = 0; vel = 0; tween = null;
    sizes();
    bind();
    render(true);
  }

  function render(force) {
    drum.style.transform = 'translateZ(' + R + 'px) rotateY(' + ang.toFixed(3) + 'deg)';
    for (var i = 0; i < total; i++) {
      var e = norm(-i * theta + ang), a = Math.abs(e);
      var vis = a <= 78;
      var op = vis ? Math.max(0.35, 1 - a / 130) : 0;
      var key = vis ? op.toFixed(2) : 'h';
      if (force || cur[i] !== key) {
        cur[i] = key;
        cards[i].style.visibility = vis ? 'visible' : 'hidden';
        cards[i].style.opacity = vis ? op.toFixed(2) : '0';
      }
    }
  }

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function turnTo(target) {
    if (reduce) { ang = target; vel = 0; render(); return; }
    tween = { from: ang, to: target, t0: performance.now(), dur: 700 };
    vel = 0;
  }
  function centerNear() { return Math.round(-ang / theta); }
  function step(dir) { turnTo(Math.round(ang / theta) * theta + dir * theta); }

  function paused() { return userPaused || hovering || focused || dragging || reduce; }

  function loop(t) {
    raf = 0;
    if (!inView) { last = 0; return; }
    var dt = last ? Math.min(50, t - last) : 16;
    last = t;
    if (tween) {
      var p = Math.min(1, (t - tween.t0) / tween.dur);
      ang = tween.from + (tween.to - tween.from) * ease(p);
      if (p >= 1) tween = null;
    } else if (!dragging) {
      if (Math.abs(vel) > 0.0004) { ang += vel * dt; vel *= Math.pow(0.94, dt / 16); } else vel = 0;
      if (!paused()) ang += SPEED * dt;
    }
    render();
    schedule();
  }
  function schedule() { if (!raf && inView) raf = requestAnimationFrame(loop); }

  function bind() {
    var sx = 0, lx = 0, lt = 0, down = false;
    stage.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down = true; moved = 0; sx = lx = e.clientX; lt = performance.now(); tween = null; vel = 0;
    });
    stage.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - lx, now = performance.now();
      moved += Math.abs(dx);
      if (moved > 6) {
        if (!dragging) { dragging = true; stage.classList.add('dragging'); try { stage.setPointerCapture(e.pointerId); } catch (x) {} }
        ang -= dx * K;
        vel = -(dx * K) / Math.max(8, now - lt);
        lx = e.clientX; lt = now;
        render(); schedule();
      }
    });
    var up = function () {
      if (!down) return;
      down = false;
      if (dragging) { dragging = false; stage.classList.remove('dragging'); }
      schedule();
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', up);
    stage.addEventListener('lostpointercapture', up);

    // Clic su una scheda laterale: la porta al centro
    stage.addEventListener('click', function (e) {
      if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; return; }
      var c = e.target.closest('.dcard');
      if (!c || e.target.closest('a')) return;
      var i = cards.indexOf(c), eff = norm(-i * theta + ang);
      if (Math.abs(eff) > theta / 2) turnTo(ang - eff);
    }, true);
    stage.addEventListener('dragstart', function (e) { e.preventDefault(); });

    // Mouse sopra la galleria: la rotazione si ferma
    stage.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hovering = true; });
    stage.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hovering = false; schedule(); } });

    // Focus da tastiera: la scheda raggiunta va al centro
    stage.addEventListener('focusin', function (e) {
      focused = true;
      var c = e.target.closest('.dcard');
      if (c) { var i = cards.indexOf(c), eff = norm(-i * theta + ang); if (Math.abs(eff) > 1) turnTo(ang - eff); }
    });
    stage.addEventListener('focusout', function () { focused = false; schedule(); });
    stage.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    });

    // Trackpad e rotella orizzontale
    stage.addEventListener('wheel', function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault(); tween = null; ang += e.deltaX * K; render(); schedule();
      }
    }, { passive: false });
  }

  // Scorrendo la pagina il tamburo ruota un poco
  window.addEventListener('scroll', function () {
    var y = window.scrollY, d = y - lastScrollY; lastScrollY = y;
    if (!inView || reduce || tween || dragging) return;
    ang += d * 0.045; render(); schedule();
  }, { passive: true });

  window.addEventListener('resize', function () { if (stage) { sizes(); render(true); } });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      inView = en[0].isIntersecting; if (inView) { last = 0; schedule(); }
    }, { rootMargin: '80px' }).observe(wrap);
  }

  // Comandi
  pauseBtn = document.createElement('button');
  pauseBtn.type = 'button'; pauseBtn.className = 'cal-btn cal-arrow'; pauseBtn.id = 'drumPause';
  function setPauseUI() {
    pauseBtn.setAttribute('aria-label', userPaused ? 'Riprendi la rotazione automatica' : 'Ferma la rotazione automatica');
    pauseBtn.innerHTML = userPaused
      ? '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.500v13a1 1 0 0 0 1.500.9l10.500-6.500a1 1 0 0 0 0-1.700L9.500 4.600A1 1 0 0 0 8 5.500Z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1.200" fill="currentColor"/><rect x="14" y="5" width="4" height="14" rx="1.200" fill="currentColor"/></svg>';
  }
  pauseBtn.addEventListener('click', function () { userPaused = !userPaused; setPauseUI(); schedule(); });
  setPauseUI();
  if (!reduce) prev.parentNode.insertBefore(pauseBtn, prev);

  prev.addEventListener('click', function () { if (stage) step(-1); });
  next.addEventListener('click', function () { if (stage) step(1); });
  prev.disabled = false; next.disabled = false;

  chips.forEach(function (ch) {
    ch.addEventListener('click', function () {
      chips.forEach(function (x) { x.setAttribute('aria-pressed', String(x === ch)); });
      var f = ch.getAttribute('data-filter');
      build(f === 'all' ? all : all.filter(function (x) { return x.cat === f; }));
      schedule();
    });
  });

  track.hidden = true;
  wrap.hidden = false;
  document.documentElement.classList.add('has-drum');
  build(all);
  schedule();
})();
