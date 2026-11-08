/* Studio Naòs – interazioni e musica ambient generativa */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  root.classList.add('js');
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

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

  /* ---------- Musica ambient (mai in avvio automatico) ---------- */
  var AC = window.AudioContext || window.webkitAudioContext;
  var dock = doc.getElementById('music');
  if (!AC) return; // senza Web Audio i controlli restano nascosti
  dock.hidden = false;

  var toggle = doc.getElementById('musicToggle');
  var label = doc.getElementById('musicLabel');
  var vol = doc.getElementById('musicVol');
  var saved = store('naos-vol');
  if (saved !== null && saved !== undefined && !isNaN(+saved)) vol.value = String(Math.min(100, Math.max(0, +saved)));

  var ctx = null, master, reverbSend, playing = false, schedTimer = null, nextChordAt = 0, chordIdx = 0, suspendTimer = null;

  // volume 0-100 -> guadagno morbido e basso (massimo ~0.22)
  function gainFor(v) { var x = v / 100; return x * x * 0.22; }

  // Progressione: Do maj9 – La min9 – Fa maj7 – Sol sus (in Hz)
  var CHORDS = [
    [130.81, 164.81, 196.00, 246.94, 293.66],
    [110.00, 164.81, 196.00, 246.94, 329.63],
    [87.31, 130.81, 164.81, 196.00, 261.63],
    [98.00, 146.83, 196.00, 220.00, 293.66]
  ];
  var BELLS = [523.25, 587.33, 659.25, 783.99, 880.00];
  var CHORD_LEN = 14; // secondi

  function makeImpulse(c, seconds) {
    var rate = c.sampleRate, len = Math.floor(rate * seconds);
    var buf = c.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  function initAudio() {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    var comp = ctx.createDynamicsCompressor();
    master.connect(comp); comp.connect(ctx.destination);
    var conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 5);
    var wet = ctx.createGain(); wet.gain.value = 0.7;
    reverbSend = ctx.createGain(); reverbSend.gain.value = 1;
    reverbSend.connect(conv); conv.connect(wet); wet.connect(master);
    var dry = ctx.createGain(); dry.gain.value = 0.55;
    dry.connect(master);
    reverbSend._dry = dry;
  }

  function voice(freq, t, dur, peak) {
    var g = ctx.createGain();
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 1100; lp.Q.value = 0.3;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + 4);
    g.gain.setValueAtTime(peak, t + dur - 4.5);
    g.gain.linearRampToValueAtTime(0.0001, t + dur + 3);
    g.connect(lp); lp.connect(reverbSend); lp.connect(reverbSend._dry);
    [['sine', -5], ['triangle', 6]].forEach(function (cfg, k) {
      var o = ctx.createOscillator();
      o.type = cfg[0]; o.frequency.value = freq; o.detune.value = cfg[1];
      var og = ctx.createGain(); og.gain.value = k ? 0.35 : 1;
      o.connect(og); og.connect(g);
      o.start(t); o.stop(t + dur + 3.2);
    });
  }

  function bell(freq, t) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 5.5);
    o.connect(g); g.connect(reverbSend);
    o.start(t); o.stop(t + 5.7);
  }

  function scheduleChord(t) {
    var chord = CHORDS[chordIdx % CHORDS.length];
    chord.forEach(function (f, i) { voice(f, t + i * 0.25, CHORD_LEN, 0.05); });
    var n = 3 + Math.floor(Math.random() * 2);
    for (var i = 0; i < n; i++) {
      var at = t + 2 + Math.random() * (CHORD_LEN - 5);
      bell(BELLS[Math.floor(Math.random() * BELLS.length)], at);
    }
    chordIdx++;
  }

  function tick() {
    if (!playing) return;
    while (nextChordAt - ctx.currentTime < 6) {
      scheduleChord(nextChordAt);
      nextChordAt += CHORD_LEN - 3; // sovrapposizione morbida
    }
  }

  function ui(on) {
    toggle.setAttribute('aria-pressed', String(on));
    toggle.setAttribute('aria-label', on ? 'Metti in pausa la musica di sottofondo' : 'Attiva la musica di sottofondo');
    label.innerHTML = 'Musica <small>' + (on ? 'in riproduzione' : 'spenta') + '</small>';
    dock.classList.toggle('playing', on);
  }

  function start() {
    if (!ctx) initAudio();
    clearTimeout(suspendTimer);
    var p = ctx.resume();
    var go = function () {
      playing = true;
      nextChordAt = Math.max(nextChordAt, ctx.currentTime + 0.1);
      tick();
      clearInterval(schedTimer);
      schedTimer = setInterval(tick, 1000);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(gainFor(+vol.value), ctx.currentTime, 1.2);
      ui(true);
    };
    if (p && p.then) p.then(go); else go();
  }

  function stop() {
    playing = false;
    clearInterval(schedTimer);
    ui(false);
    if (!ctx) return;
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
    suspendTimer = setTimeout(function () { if (!playing) ctx.suspend(); }, 2200);
  }

  toggle.addEventListener('click', function () { playing ? stop() : start(); });

  vol.addEventListener('input', function () {
    store('naos-vol', vol.value);
    if (ctx && playing) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(gainFor(+vol.value), ctx.currentTime, 0.15);
    }
  });

  // Se la scheda torna visibile dopo la sospensione del sistema, riprende il contesto audio
  doc.addEventListener('visibilitychange', function () {
    if (!doc.hidden && playing && ctx && ctx.state === 'suspended') ctx.resume();
  });

  ui(false);
})();
