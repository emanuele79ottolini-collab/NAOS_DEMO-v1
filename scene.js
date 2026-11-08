/* Studio Naòs – intro animata guidata dallo scorrimento: il tempio del naòs */
(function () {
  'use strict';
  var scene = document.getElementById('scena');
  var stage = document.getElementById('stage');
  var art = document.getElementById('art');
  if (!scene || !stage || !art) return;

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('has-scene');
  if (reduce) document.documentElement.classList.add('scene-static');

  var $ = function (id) { return document.getElementById(id); };
  var world = $('world'), sun = $('sun'), hills = $('hills'), temple = $('temple'), spill = $('spill');
  var mistBack = $('mistBack'), mistFront = $('mistFront'), glow = $('glow');
  var bird = $('bird'), hint = $('sceneHint'), cap = $('sceneCap');
  var letters = Array.prototype.slice.call(document.querySelectorAll('#wm .wl'));
  var bodyIn = bird.querySelector('.bird-in');

  var CX = 500, CY = 552; // punto verso cui entra la camera (la porta del naòs)
  var HEADER = 60;

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(p, a, b) { return clamp((p - a) / (b - a), 0, 1); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* La viewBox segue le proporzioni dello schermo: il tempio resta sempre intero e centrato */
  function fit() {
    var w = stage.clientWidth || 1, h = stage.clientHeight || 1, a = w / h;
    var MINW = 780, MINH = 760, W, H, y0;
    if (a >= MINW / MINH) { H = MINH; W = H * a; y0 = 0; }
    else { W = MINW; H = W / a; y0 = 400 - H / 2; } // su schermi stretti il tempio sta al centro dell'area visibile
    art.setAttribute('viewBox', (500 - W / 2).toFixed(1) + ' ' + y0.toFixed(1) + ' ' + W.toFixed(1) + ' ' + H.toFixed(1));
  }

  // Volo: curva di Bézier quadratica dalla nebbia al vertice del frontone
  var P0 = [-150, 560], P1 = [430, 10], P2 = [500, 196];
  function bez(t) {
    var u = 1 - t;
    return [u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1]];
  }
  function bezTangent(t) {
    var u = 1 - t;
    return [2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1])];
  }

  var landed = null;
  function render(p) {
    // 1. Nebbia che si dirada, sole che sale, tempio che emerge
    var t1 = smooth(seg(p, 0, 0.4));
    mistFront.style.opacity = (1 - 0.88 * t1).toFixed(3);
    mistBack.style.opacity = lerp(0.95, 0.35, t1).toFixed(3);
    mistBack.setAttribute('transform', 'translate(' + (-p * 70).toFixed(1) + ' 0)');
    sun.setAttribute('cy', lerp(470, 330, t1).toFixed(1));
    sun.style.opacity = lerp(0.35, 1, t1).toFixed(3);
    hills.setAttribute('transform', 'translate(0 ' + lerp(14, 0, t1).toFixed(1) + ')');
    var tt = smooth(seg(p, 0, 0.3));
    temple.style.opacity = lerp(0.22, 1, tt).toFixed(3);
    temple.setAttribute('transform', 'translate(0 ' + lerp(18, 0, tt).toFixed(1) + ')');

    // 2. La scritta NAÒS sale da dietro il tetto, lettera dopo lettera
    letters.forEach(function (l, i) {
      var a = 0.1 + i * 0.055, t = smooth(seg(p, a, a + 0.3));
      l.setAttribute('transform', 'translate(0 ' + ((1 - t) * 340).toFixed(1) + ')');
      l.style.opacity = t.toFixed(3);
    });

    // 3. L'uccello vola e si posa
    var tb = seg(p, 0.16, 0.64), te = smooth(tb);
    var pos = bez(te), tan = bezTangent(te);
    var ang = Math.atan2(tan[1], tan[0]) * 180 / Math.PI;
    ang = clamp(ang, -30, 30) * (1 - smooth(seg(tb, 0.8, 1)));
    var sc = lerp(2.1, 2.5, smooth(seg(tb, 0, 1)));
    bird.setAttribute('transform', 'translate(' + pos[0].toFixed(1) + ' ' + pos[1].toFixed(1) + ') rotate(' + (ang * 0.7).toFixed(1) + ') scale(' + sc.toFixed(2) + ')');
    bird.style.opacity = seg(p, 0.12, 0.2).toFixed(3);
    var isLanded = tb >= 1;
    if (isLanded !== landed) { landed = isLanded; bird.classList.toggle('landed', isLanded); }

    // 4. La camera entra nel naòs: la luce riempie lo schermo
    var tc = smooth(seg(p, 0.62, 0.97));
    var s = 1 + 3.8 * tc;
    world.setAttribute('transform', 'translate(' + CX + ' ' + CY + ') scale(' + s.toFixed(3) + ') translate(' + (-CX) + ' ' + (-CY) + ')');
    spill.style.opacity = lerp(0.3, 1, smooth(seg(p, 0.3, 0.7))).toFixed(3);
    glow.setAttribute('r', (2200 * smooth(seg(p, 0.8, 0.99))).toFixed(1));

    // 5. Testi
    hint.style.opacity = (1 - seg(p, 0, 0.05)).toFixed(3);
    var tcap = smooth(seg(p, 0.88, 1));
    cap.style.opacity = tcap.toFixed(3);
    cap.style.transform = 'translateY(' + ((1 - tcap) * 16).toFixed(1) + 'px)';
  }

  function progress() {
    var r = scene.getBoundingClientRect();
    var h = (getComputedStyle(document.documentElement).getPropertyValue('--header-h') || '60').trim();
    var top = parseFloat(h) || HEADER;
    var span = scene.offsetHeight - stage.offsetHeight;
    if (span <= 0) return 0;
    return clamp((top - r.top) / span, 0, 1);
  }

  fit();
  window.addEventListener('resize', function () { fit(); update(); });

  if (reduce) {
    // Immagine ferma: tempio completo, scritta alzata, uccello posato
    render(0.62);
    cap.style.opacity = '0';
    world.setAttribute('transform', '');
    return;
  }

  var ticking = false;
  function update() { ticking = false; render(progress()); }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
  }, { passive: true });
  update();
})();
