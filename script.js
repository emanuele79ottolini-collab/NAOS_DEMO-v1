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

  /* ---------- Schede (tab) accessibili ---------- */
  var tabs = Array.prototype.slice.call(doc.querySelectorAll('[role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      doc.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab); });
    tab.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') n = tabs[0];
      else if (e.key === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); selectTab(n, true); }
    });
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
