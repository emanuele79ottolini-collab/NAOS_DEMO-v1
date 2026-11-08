/* Studio Naòs – calendario di prenotazione dimostrativo (orari di esempio) */
(function () {
  'use strict';
  var root = document.getElementById('cal');
  if (!root) return;

  var gridEl = document.getElementById('calGrid');
  var daysEl = document.getElementById('calDays');
  var titleEl = document.getElementById('calTitle');
  var pickEl = document.getElementById('calPick');
  var prevBtn = document.getElementById('calPrev');
  var nextBtn = document.getElementById('calNext');
  var todayBtn = document.getElementById('calToday');
  var radios = root.querySelectorAll('input[name="cal-who"]');
  var fWho = document.getElementById('f-who');
  var fWhen = document.getElementById('f-when');

  var PROFS = {
    m: { name: 'Dott.ssa Mazzi', val: '393772609553|Dott.ssa Mazzi' },
    v: { name: 'Dott. Vighi', val: '393356822198|Dott. Vighi' }
  };
  var MAX_WEEKS = 6;            // settimane prenotabili in avanti
  var HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  var LUNCH = 13;
  var DAYS = 6;                 // lunedì – sabato

  var fmtDay = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  var fmtWd = new Intl.DateTimeFormat('it-IT', { weekday: 'short' });
  var fmtMon = new Intl.DateTimeFormat('it-IT', { month: 'long' });
  var fmtMonS = new Intl.DateTimeFormat('it-IT', { month: 'short' });

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  var today = startOfDay(new Date());
  var monday0 = addDays(today, -((today.getDay() + 6) % 7));
  var lastDay = addDays(today, MAX_WEEKS * 7);

  var state = { prof: 'm', week: 0, day: 0, sel: null };

  function bookable(d) { return d > today && d <= lastDay; }

  // Disponibilità finta ma stabile: dipende solo da psicologo, data e ora
  function hash(str) {
    var x = 2166136261;
    for (var i = 0; i < str.length; i++) { x ^= str.charCodeAt(i); x = Math.imul(x, 16777619); }
    return x >>> 0;
  }
  function daySlots(prof, d) {
    var dow = (d.getDay() + 6) % 7; // 0 = lunedì
    var out = {}, free = 0, busyList = [];
    HOURS.forEach(function (h) {
      if (h === LUNCH) { out[h] = 'lunch'; return; }
      if (dow === 5 && h > LUNCH) { out[h] = 'closed'; return; }
      var busy = hash(prof + iso(d) + h) % 100 < 42;
      out[h] = busy ? 'busy' : 'free';
      if (busy) busyList.push(h); else free++;
    });
    for (var i = 0; free < 3 && i < busyList.length; i++) { out[busyList[i]] = 'free'; free++; }
    return out;
  }

  function dayOf(wk, i) { return addDays(monday0, wk * 7 + i); }

  function firstBookableDay(wk) {
    for (var i = 0; i < DAYS; i++) if (bookable(dayOf(wk, i))) return i;
    return 0;
  }

  function slotLabel(prof, d, h) {
    return PROFS[prof].name + ' · ' + fmtDay.format(d) + ' alle ' + pad(h) + ':00';
  }

  function render() {
    var p = state.prof;
    var d0 = dayOf(state.week, 0), d5 = dayOf(state.week, 5);
    var title = d0.getMonth() === d5.getMonth()
      ? d0.getDate() + ' – ' + d5.getDate() + ' ' + fmtMon.format(d5) + ' ' + d5.getFullYear()
      : d0.getDate() + ' ' + fmtMonS.format(d0) + ' – ' + d5.getDate() + ' ' + fmtMonS.format(d5) + ' ' + d5.getFullYear();
    titleEl.textContent = title;
    prevBtn.disabled = state.week <= 0;
    nextBtn.disabled = state.week >= MAX_WEEKS - 1;
    root.setAttribute('data-prof', p);

    var html = '<div class="tl hd"></div>', chips = '', i, h;
    for (i = 0; i < DAYS; i++) {
      var d = dayOf(state.week, i), ok = bookable(d), isToday = +d === +today;
      html += '<div class="c hd onday-all' + (isToday ? ' today' : '') + '"><span class="wd">' + fmtWd.format(d).replace('.', '') +
        '</span><span class="dn">' + d.getDate() + '</span></div>';
      chips += '<button type="button" class="chip' + (i === state.day ? ' on' : '') + (isToday ? ' today' : '') + '" data-day="' + i + '"' +
        (ok ? '' : ' disabled') + ' aria-pressed="' + (i === state.day) + '"><span>' + fmtWd.format(d).replace('.', '') +
        '</span><b>' + d.getDate() + '</b></button>';
    }
    var cache = [];
    for (i = 0; i < DAYS; i++) cache.push(bookable(dayOf(state.week, i)) ? daySlots(p, dayOf(state.week, i)) : null);

    HOURS.forEach(function (hh) {
      html += '<div class="tl">' + pad(hh) + ':00</div>';
      for (var j = 0; j < DAYS; j++) {
        var dd = dayOf(state.week, j), slots = cache[j], on = j === state.day ? ' onday' : '';
        var st = slots ? slots[hh] : 'past';
        if (st === 'free') {
          var isSel = state.sel && state.sel.prof === p && state.sel.date === iso(dd) && state.sel.h === hh;
          html += '<div class="c' + on + '"><button type="button" class="slot' + (isSel ? ' sel' : '') + '" data-d="' + iso(dd) + '" data-h="' + hh +
            '" aria-pressed="' + !!isSel + '" aria-label="' + slotLabel(p, dd, hh) + (isSel ? ', scelto' : ', libero') + '">' +
            '<span class="t">' + pad(hh) + ':00</span><span class="s">' + (isSel ? 'Scelto' : 'Libero') + '</span></button></div>';
        } else if (st === 'busy') {
          html += '<div class="c' + on + '"><div class="ev"><span class="t">' + pad(hh) + ':00</span><span class="s">Occupato</span></div></div>';
        } else if (st === 'lunch') {
          html += '<div class="c closed' + on + '"><span class="cl">Pausa</span></div>';
        } else if (st === 'closed') {
          html += '<div class="c closed' + on + '"><span class="cl">Chiuso</span></div>';
        } else {
          html += '<div class="c closed past' + on + '"></div>';
        }
      }
    });
    gridEl.innerHTML = html;
    daysEl.innerHTML = chips;

    if (state.sel) {
      var sd = new Date(state.sel.date + 'T00:00:00');
      pickEl.innerHTML = '<div class="pick-txt"><span class="pick-dot ' + state.sel.prof + '"></span><div><b>' +
        cap(fmtDay.format(sd)) + ' alle ' + pad(state.sel.h) + ':00</b><span>' + PROFS[state.sel.prof].name + ' · colloquio</span></div></div>' +
        '<a class="btn btn-primary btn-small" href="#booking" id="calGo">Continua</a>';
    } else {
      pickEl.innerHTML = '<p class="pick-empty">Seleziona un orario libero per prenotare.</p>';
    }
  }

  function choose(dateStr, h) {
    state.sel = { prof: state.prof, date: dateStr, h: h };
    var d = new Date(dateStr + 'T00:00:00');
    if (fWho) { fWho.value = PROFS[state.prof].val; fWho.dispatchEvent(new Event('change', { bubbles: true })); }
    if (fWhen) { fWhen.value = fmtDay.format(d) + ' alle ' + pad(h) + ':00'; fWhen.dispatchEvent(new Event('input', { bubbles: true })); }
    render();
  }

  gridEl.addEventListener('click', function (e) {
    var b = e.target.closest('.slot');
    if (b) choose(b.getAttribute('data-d'), +b.getAttribute('data-h'));
  });
  daysEl.addEventListener('click', function (e) {
    var b = e.target.closest('.chip');
    if (b && !b.disabled) { state.day = +b.getAttribute('data-day'); render(); }
  });
  pickEl.addEventListener('click', function (e) {
    if (e.target.closest('#calGo')) {
      var n = document.getElementById('f-name');
      if (n) setTimeout(function () { n.focus({ preventScroll: true }); }, 400);
    }
  });
  prevBtn.addEventListener('click', function () { state.week = Math.max(0, state.week - 1); state.day = firstBookableDay(state.week); render(); });
  nextBtn.addEventListener('click', function () { state.week = Math.min(MAX_WEEKS - 1, state.week + 1); state.day = firstBookableDay(state.week); render(); });
  todayBtn.addEventListener('click', function () { state.week = 0; state.day = firstBookableDay(0); render(); });
  Array.prototype.forEach.call(radios, function (r) {
    r.addEventListener('change', function () { if (r.checked) { state.prof = r.value; render(); } });
  });
  // Se si cambia psicologo dal modulo, il calendario lo segue
  if (fWho) fWho.addEventListener('change', function () {
    var k = fWho.value === PROFS.v.val ? 'v' : fWho.value === PROFS.m.val && fWho.selectedIndex === 0 ? 'm' : null;
    if (k && k !== state.prof) {
      state.prof = k;
      Array.prototype.forEach.call(radios, function (r) { r.checked = r.value === k; });
      render();
    }
  });

  state.day = firstBookableDay(0);
  root.hidden = false;
  render();
})();
