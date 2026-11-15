(function () {
  'use strict';
  var doc = document, root = doc.documentElement;
  function $(s, r) { return (r || doc).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || doc).querySelectorAll(s)); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function trim(s) { return String(s).trim(); }
  function safeUrl(u) {
    u = trim(u || '');
    if (/^https?:\/\//i.test(u) || /^mailto:/i.test(u)) return u;
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(u)) return 'mailto:' + u;
    if (/^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(u)) return 'https://' + u;
    return '';
  }
  function showUrl(u) { return u.replace(/^mailto:/i, '').replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''); }

  /* The page's own source, read before anything changes, so a save can rebuild the document. */
  var CSS_SRC = $('#app-css').textContent;
  var JS_SRC = $('#app-js').textContent;
  var DOC_TITLE = doc.title;

  function norm(d) {
    d = d || {};
    d.profile = d.profile || {};
    ['facts', 'stats', 'experience', 'projects', 'wins', 'education', 'credentials', 'skills', 'links'].forEach(function (k) {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    if (d.winsCount == null) d.winsCount = '';
    return d;
  }
  var saved = norm(JSON.parse($('#site-data').textContent));
  var data = clone(saved);

  var RM = false;
  try { RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  root.classList.add('js');
  if (RM) root.classList.add('rm');

  /* ---------- site markup ---------- */
  function head(lines, label) {
    return '<h2 class="big fit rise"' + (label ? ' aria-label="' + esc(label) + '"' : '') + '>' + lines.map(function (t) {
      return '<span class="ln"><span class="fl">' + esc(t) + '</span></span>';
    }).join('') + '</h2>';
  }
  function chips(list) {
    list = (list || []).filter(Boolean);
    return list.length ? '<div class="chips">' + list.map(function (c) { return '<span class="chip">' + esc(c) + '</span>'; }).join('') + '</div>' : '';
  }
  function kickerHTML(k) {
    k = trim(k || ''); if (!k) return '';
    var parts = k.split(/\s*×\s*/).filter(Boolean);
    return '<p class="kicker"><span class="sr">' + esc(k) + '</span>' + parts.map(function (t, i) {
      return (i ? '<span class="kx" aria-hidden="true">×</span>' : '') + '<span class="kw' + (i ? ' acc' : '') + '" aria-hidden="true" data-t="' + esc(t) + '">' + esc(t) + '</span>';
    }).join('') + '</p>';
  }
  /* The title resolves out of random glyphs once, on load. */
  function scramble() {
    if (RM) return;
    var els = $$('.kw'), G = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789', t0 = performance.now(), total = 0;
    els.forEach(function (e) { total += (e.getAttribute('data-t') || '').length; });
    function step(now) {
      var k = clamp((now - t0 - 300) / 1300, 0, 1), done = Math.floor(k * total), seen = 0;
      els.forEach(function (e) {
        var t = e.getAttribute('data-t') || '', out = '';
        for (var i = 0; i < t.length; i++, seen++) {
          var ch = t.charAt(i);
          out += (k >= 1 || seen < done || ch === ' ') ? ch : G.charAt(Math.floor(Math.random() * G.length));
        }
        e.textContent = out;
      });
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function sayHTML(t) {
    var words = [], cur = '', curEm = false, em = false, s = String(t || '');
    for (var i = 0; i < s.length; i++) {
      var ch = s.charAt(i);
      if (ch === '*') { em = !em; continue; }
      if (/\s/.test(ch)) { if (cur) { words.push([cur, curEm]); cur = ''; curEm = false; } continue; }
      cur += ch; if (em) curEm = true;
    }
    if (cur) words.push([cur, curEm]);
    return words.map(function (w) { return '<span class="w' + (w[1] ? ' em' : '') + '">' + esc(w[0]) + '</span>'; }).join(' ');
  }
  function siteHTML(d) {
    var p = d.profile, nm = trim(p.name || ''), sp = nm.indexOf(' ');
    var l1 = sp > 0 ? nm.slice(0, sp) : nm, l2 = sp > 0 ? nm.slice(sp + 1) : '';
    var h = '<main id="top">';

    h += '<section class="hero" data-key="hero"><div class="pin"><div class="hero-intro">' + kickerHTML(p.kicker) +
      (p.role ? '<p class="role">' + esc(p.role) + '</p>' : '') +
      (p.status ? '<p class="status"><i></i><span>' + esc(p.status) + '</span></p>' : '') + '</div>' +
      '<h1 class="name fit" data-fit="fill" aria-label="' + esc(nm) + '"><span class="ln l1"><span class="fl">' + esc(l1) + '</span></span>' +
      (l2 ? '<span class="ln l2"><span class="fl">' + esc(l2) + '</span></span>' : '') + '</h1>' +
      '<div class="hero-foot"><span>' + esc(p.location || '') + '</span><span class="cue">Scroll</span></div></div></section>';

    if (trim(p.manifesto || '')) {
      h += '<section class="manifesto" data-key="man"><div class="pin"><p class="say">' + sayHTML(p.manifesto) + '</p></div></section>';
    }

    if (d.stats.length) {
      var sn = d.stats.length, cols = sn <= 4 ? sn : (sn % 3 === 0 ? 3 : sn % 4 === 0 ? 4 : 3);
      h += '<section class="stats" id="numbers" data-key="stats"><p class="eyebrow rv">By the numbers</p><div class="nums" style="--cols:' + cols + '">' +
        d.stats.map(function (s, i) {
          return '<div class="num rv" style="--d:' + ((i % cols) * 0.07).toFixed(2) + 's"><b class="fit" data-v="' + esc(s.value) + '"><span class="fl">' + esc(s.value) + '</span></b><span class="lab">' + esc(s.label) + '</span></div>';
        }).join('') + '</div></section>';
    }

    var paras = String(p.about || '').split(/\n\s*\n/).map(trim).filter(Boolean);
    if (paras.length || d.facts.length) {
      h += '<section class="about-sec" id="about" data-key="about"><div class="about-head"><p class="eyebrow rv">About me</p>' + head(['In', 'person']) + '</div><div class="about-body">' +
        paras.map(function (t, i) { return '<p class="rv' + (i === 0 ? ' lead' : '') + '">' + esc(t) + '</p>'; }).join('') +
        (d.facts.length ? '<dl class="facts rv">' + d.facts.map(function (f) {
          return '<div><dt>' + esc(f.label) + '</dt><dd>' + esc(f.value) + '</dd></div>';
        }).join('') + '</dl>' : '') + '</div></section>';
    }

    if (d.experience.length) {
      h += '<section class="work" id="work" data-key="work"><div class="work-head"><p class="eyebrow rv">Experience</p>' + head(['On the', 'clock']) + '</div><div class="roles">' +
        d.experience.map(function (x) {
          var org = [x.company ? '<b>' + esc(x.company) + '</b>' : '', esc(x.place || '')].filter(Boolean).join(' · ');
          return '<article class="role-card rv"><div class="when">' + esc(x.dates || '') + '</div><div><h3>' + esc(x.role || '') + '</h3>' +
            (org ? '<p class="org">' + org + '</p>' : '') +
            (x.note ? '<p class="note">' + esc(x.note) + '</p>' : '') +
            ((x.bullets || []).length ? '<ul>' + x.bullets.map(function (b) { return '<li>' + esc(b) + '</li>'; }).join('') + '</ul>' : '') +
            chips(x.stack) + '</div></article>';
        }).join('') + '</div></section>';
    }

    if (d.projects.length) {
      h += '<section class="builds" id="projects" data-key="builds"><div class="pin"><div class="builds-head"><div><p class="eyebrow">Projects and hackathons</p>' +
        head(['Off the clock']) + '</div><div class="meter" aria-hidden="true"><i></i></div></div><div class="track">' +
        d.projects.map(function (x) {
          var url = safeUrl(x.link);
          return '<article class="card">' + (x.kind ? '<p class="kind">' + esc(x.kind) + '</p>' : '') + '<h3>' + esc(x.name || '') + '</h3>' +
            (x.blurb ? '<p class="blurb">' + esc(x.blurb) + '</p>' : '') +
            (x.award ? '<p class="award">' + esc(x.award) + '</p>' : '') +
            chips(x.stack) +
            (url ? '<a class="go" href="' + esc(url) + '" target="_blank" rel="noopener">Open ' + esc(showUrl(url).split('/')[0]) + '</a>' : '') + '</article>';
        }).join('') + '</div></div></section>';
    }

    if (d.wins.length || trim(d.winsCount)) {
      var wc = trim(d.winsCount);
      h += '<section class="wins" id="wins" data-key="wins"><p class="wins-num" aria-hidden="true">' + esc(wc) + '</p><div><p class="eyebrow rv">Hackathons</p>' +
        head(['Hackathon', 'wins'], (wc ? wc + ' ' : '') + 'hackathon wins') +
        d.wins.map(function (w) {
          var sub = [esc(w.event || ''), w.project ? '<em>' + esc(w.project) + '</em>' : ''].filter(Boolean).join(' · ');
          return '<div class="win rv"><b>' + esc(w.title || '') + '</b>' + (sub ? '<span>' + sub + '</span>' : '') + '</div>';
        }).join('') + '</div></section>';
    }

    if (d.education.length || d.credentials.length || d.skills.length) {
      h += '<section class="paper" id="credentials" data-key="paper"><div><p class="eyebrow rv">Education and credentials</p>' + head(['On', 'paper']) + '</div><div class="paper-grid">';
      if (d.education.length) {
        h += '<div class="col rv"><h3>Education</h3>' + d.education.map(function (e) {
          return '<div class="item"><b>' + esc(e.school || '') + '</b>' + (e.degree ? '<span class="sub">' + esc(e.degree) + '</span>' : '') +
            (e.dates ? '<span class="when">' + esc(e.dates) + '</span>' : '') + (e.detail ? '<p>' + esc(e.detail) + '</p>' : '') + '</div>';
        }).join('') + '</div>';
      }
      if (d.credentials.length) {
        h += '<div class="col rv" style="--d:.08s"><h3>Publications and certifications</h3>' + d.credentials.map(function (c) {
          return '<div class="item"><b>' + esc(c.title || '') + '</b>' + (c.detail ? '<p>' + esc(c.detail) + '</p>' : '') + '</div>';
        }).join('') + '</div>';
      }
      if (d.skills.length) {
        h += '<div class="col rv" style="--d:.16s"><h3>Skills</h3>' + d.skills.map(function (s) {
          return '<div class="skill"><b>' + esc(s.group || '') + '</b>' + chips(s.items) + '</div>';
        }).join('') + '</div>';
      }
      h += '</div></section>';
    }

    var links = d.links.map(function (l) { return { label: l.label, url: safeUrl(l.url) }; }).filter(function (l) { return l.url && trim(l.label || ''); });
    h += '<section class="contact" id="contact" data-key="contact">' + head(["Let's", 'build']) +
      (p.contactLine ? '<p class="contact-line rv">' + esc(p.contactLine) + '</p>' : '') +
      (links.length ? '<div class="links rv">' + links.map(function (l) {
        return '<a href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(l.label) + '<span>' + esc(showUrl(l.url)) + '</span></a>';
      }).join('') + '</div>' : '') + '</section>';

    h += '</main><footer class="foot"><span>© ' + new Date().getFullYear() + ' ' + esc(nm) + '</span><span>' + esc(p.location || '') + '</span></footer>';
    return h;
  }

  /* ---------- static chrome: nav, editor shell, toast ---------- */
  function mount() {
    var bar = doc.createElement('div'); bar.className = 'bar'; bar.setAttribute('aria-hidden', 'true'); bar.innerHTML = '<i></i>';
    var nav = doc.createElement('header'); nav.className = 'nav';
    nav.innerHTML = '<a class="mark" href="#top"><span id="mk"></span><small id="mk-name"></small></a>' +
      '<nav aria-label="Sections"><a href="#about">About</a><a href="#work">Work</a><a href="#projects">Projects</a><a href="#wins">Wins</a><a href="#credentials">Credentials</a><a class="keep" href="#contact">Contact</a></nav>' +
      '<button class="btn" id="edit-btn" type="button" hidden>Edit site</button>';
    var ed = doc.createElement('aside'); ed.id = 'editor'; ed.setAttribute('aria-label', 'Site editor');
    ed.innerHTML = '<div class="ed-top"><div><h2>Edit your site</h2><p>Changes preview live. Visitors see them after you publish.</p></div><button class="btn sm" id="ed-close" type="button">Close</button></div>' +
      '<div class="ed-tabs" role="tablist" id="ed-tabs"></div><div class="ed-body" id="ed-body"></div>' +
      '<div class="ed-foot"><span class="ed-status" id="ed-status" role="status"></span><button class="btn" id="ed-discard" type="button">Discard</button><button class="btn primary" id="ed-save" type="button">Publish changes</button></div>';
    var toast = doc.createElement('div'); toast.id = 'toast'; toast.setAttribute('role', 'status');
    doc.body.appendChild(bar); doc.body.appendChild(nav); doc.body.appendChild(ed); doc.body.appendChild(toast);

    doc.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var t = doc.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
    });
  }
  var toastTimer = 0;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.classList.remove('show'); }, 3600);
  }

  /* ---------- layout, fitting, scroll scrubbing ---------- */
  var E = {}, L = { keys: [], bDist: 0, bH: false, docH: 1 }, vw = 0, vh = 0, io = null, litCount = -1, gl = null;

  function fitAll() {
    $$('.fit').forEach(function (el) {
      el.style.fontSize = '';
      var fls = $$('.fl', el); if (!fls.length) return;
      var cs = parseFloat(getComputedStyle(el).fontSize), w = 0;
      fls.forEach(function (f) { w = Math.max(w, f.offsetWidth); });
      var avail = el.clientWidth; if (!w || !avail) return;
      var size = cs;
      if (el.getAttribute('data-fit') === 'fill') size = Math.min(cs * avail / w, window.innerHeight * 0.29 / 0.84);
      else if (w > avail) size = cs * avail / w;
      if (Math.abs(size - cs) > 0.5) el.style.fontSize = (Math.floor(size * 100) / 100) + 'px';
    });
  }
  function layout() {
    vw = window.innerWidth; vh = window.innerHeight;
    root.style.setProperty('--vh', (vh / 100) + 'px');
    var b = E.builds;
    if (b) {
      var wantH = !RM && vw >= 960 && vh >= 720;
      b.classList.toggle('h', wantH); b.style.height = '';
      if (wantH) {
        fitAll();
        var over = false;
        $$('.card', b).forEach(function (c) { if (c.scrollHeight > c.clientHeight + 2) over = true; });
        if (over) { b.classList.remove('h'); wantH = false; }
        else { L.bDist = Math.max(0, E.track.scrollWidth - vw); b.style.height = (vh + L.bDist) + 'px'; }
      }
      if (!wantH) { E.track.style.transform = ''; L.bDist = 0; }
      L.bH = wantH;
    }
    fitAll();
    var y0 = window.scrollY || 0;
    function box(el) { if (!el) return null; var r = el.getBoundingClientRect(); return { top: r.top + y0, h: r.height }; }
    L.hero = box(E.hero); L.man = box(E.man); L.b = box(E.builds);
    L.keys = E.keys.map(function (el) {
      var r = box(el), m = Math.min(vh * 0.42, r.h * 0.36);
      return { name: el.getAttribute('data-key'), hs: r.top + m, he: r.top + r.h - m };
    });
    L.docH = Math.max(1, root.scrollHeight - vh);
    if (gl) gl.resize();
  }
  function countUp(el) {
    var b = $('b', el); if (!b) return;
    var out = $('.fl', b) || b;
    var v = b.getAttribute('data-v') || '', m = /^(\D*)(\d[\d,]*\.?\d*)(.*)$/.exec(v);
    if (!m) return;
    var target = parseFloat(m[2].replace(/,/g, '')), dec = (m[2].split('.')[1] || '').length, t0 = performance.now(), dur = 1500;
    function step(now) {
      var k = clamp((now - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      out.textContent = k >= 1 ? v : m[1] + (target * e).toFixed(dec) + m[3];
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function observe(instant) {
    if (io) { io.disconnect(); io = null; }
    var els = $$('.rv,.rise');
    if (instant || RM || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('in'); io.unobserve(en.target);
        if (en.target.classList.contains('num')) countUp(en.target);
      });
    }, { rootMargin: '0px 0px -7% 0px', threshold: 0.05 });
    els.forEach(function (e) { io.observe(e); });
  }
  function renderSite(instant) {
    $('#app').innerHTML = siteHTML(data);
    E.hero = $('.hero'); E.man = $('.manifesto'); E.words = $$('.w'); E.builds = $('.builds'); E.track = $('.track');
    E.meter = $('.builds .meter i'); E.keys = $$('[data-key]'); E.bar = $('.bar i'); E.nav = $('.nav');
    litCount = -1;
    var nm = trim(data.profile.name || '');
    $('#mk').textContent = nm.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 3).toUpperCase();
    $('#mk-name').textContent = nm;
    layout();
    observe(instant);
    if (gl) { gl.refresh(trim(data.winsCount) || '*', nm, false); gl.keysChanged(); }
  }
  function setP(el, p) {
    var v = p.toFixed(4);
    if (el && el.__p !== v) { el.__p = v; el.style.setProperty('--p', v); }
  }
  function scrub(sy) {
    if (L.hero) setP(E.hero, clamp(sy / Math.max(1, L.hero.h - vh), 0, 1));
    if (L.man && E.words.length) {
      var p = clamp((sy - L.man.top) / Math.max(1, L.man.h - vh), 0, 1);
      var n = Math.round(clamp(p * 1.18, 0, 1) * E.words.length);
      if (n !== litCount) { litCount = n; for (var i = 0; i < E.words.length; i++) E.words[i].classList.toggle('on', i < n); }
    }
    if (L.bH && L.b) {
      var q = clamp((sy - L.b.top) / Math.max(1, L.b.h - vh), 0, 1);
      E.track.style.transform = 'translate3d(' + (-q * L.bDist).toFixed(1) + 'px,0,0)';
      if (E.meter) E.meter.style.transform = 'scaleX(' + q.toFixed(4) + ')';
    }
  }

  /* ---------- 3D particle form ---------- */
  var FONT = '"Big Shoulders Display","Big Shoulders","Arial Narrow",Impact,sans-serif';
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function Sh(N) { this.p = new Float32Array(N * 3); this.t = new Float32Array(N); this.n = 0; this.N = N; }
  Sh.prototype.put = function (x, y, z, t) {
    if (this.n >= this.N) return;
    var i = this.n * 3; this.p[i] = x; this.p[i + 1] = y; this.p[i + 2] = z; this.t[this.n] = t || 0; this.n++;
  };
  Sh.prototype.fill = function (R) {
    var filled = this.n;
    while (this.n < this.N && filled > 0) {
      var k = Math.floor(R() * filled), i = k * 3;
      this.put(this.p[i] + (R() - 0.5) * 0.02, this.p[i + 1] + (R() - 0.5) * 0.02, this.p[i + 2] + (R() - 0.5) * 0.02, this.t[k]);
    }
    return this;
  };
  function rrPoint(u, hw, hh, r) {
    var sx = 2 * (hw - r), sy = 2 * (hh - r), arc = Math.PI * r / 2, d = u * (2 * sx + 2 * sy + 4 * arc), a;
    if (d < sx) return [-hw + r + d, hh];
    d -= sx; if (d < arc) { a = Math.PI / 2 - d / r; return [hw - r + Math.cos(a) * r, hh - r + Math.sin(a) * r]; }
    d -= arc; if (d < sy) return [hw, hh - r - d];
    d -= sy; if (d < arc) { a = -d / r; return [hw - r + Math.cos(a) * r, -hh + r + Math.sin(a) * r]; }
    d -= arc; if (d < sx) return [hw - r - d, -hh];
    d -= sx; if (d < arc) { a = -Math.PI / 2 - d / r; return [-hw + r + Math.cos(a) * r, -hh + r + Math.sin(a) * r]; }
    d -= arc; if (d < sy) return [-hw, -hh + r + d];
    d -= sy; a = Math.PI - d / r; return [-hw + r + Math.cos(a) * r, hh - r + Math.sin(a) * r];
  }
  function shapeGlobe(N) {
    var R = rng(11), s = new Sh(N), n1 = Math.floor(N * 0.74), n2 = Math.floor(N * 0.14), r = 1.5, ga = Math.PI * (3 - Math.sqrt(5)), i;
    for (i = 0; i < n1; i++) {
      var y = 1 - 2 * (i + 0.5) / n1, rad = Math.sqrt(1 - y * y), th = ga * i;
      s.put(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r, R() < 0.06 ? 1 : 0);
    }
    function ring(n, rr, tx, tz) {
      for (var j = 0; j < n; j++) {
        var a = R() * Math.PI * 2, x = Math.cos(a) * rr, yy = (R() - 0.5) * 0.03, z = Math.sin(a) * rr;
        var y1 = yy * Math.cos(tx) - z * Math.sin(tx), z1 = yy * Math.sin(tx) + z * Math.cos(tx);
        var x2 = x * Math.cos(tz) - y1 * Math.sin(tz), y2 = x * Math.sin(tz) + y1 * Math.cos(tz);
        s.put(x2, y2, z1, 1);
      }
    }
    ring(n2, 2.0, 0.5, 0.25); ring(N - n1 - n2, 2.32, -0.35, -0.5);
    return s.fill(R);
  }
  function shapeCard(N, name) {
    /* ISO ID-1 card proportions, 85.6 x 53.98 mm; the holder's initials and name are drawn on it */
    var R = rng(23), s = new Sh(N), hw = 1.685, hh = 1.0625, r = 0.2, i, pt, zf = 0.035, k;
    function side() { return R() < 0.5 ? zf : -zf; }
    for (i = 0; i < N * 0.26; i++) { pt = rrPoint(R(), hw, hh, r); s.put(pt[0], pt[1], side() + (R() - 0.5) * 0.01, 0); }
    for (i = 0; i < N * 0.13; i++) {
      var x = (R() * 2 - 1) * hw, y = (R() * 2 - 1) * hh, ax = Math.abs(x) - (hw - r), ay = Math.abs(y) - (hh - r);
      if (ax > 0 && ay > 0 && ax * ax + ay * ay > r * r) continue;
      s.put(x, y, side(), 0);
    }
    for (i = 0; i < N * 0.12; i++) {
      var cx = -1.27 + R() * 0.56, cy = 0.02 + R() * 0.42;
      if (R() < 0.45) { if (R() < 0.5) cx = -1.27 + Math.floor(R() * 4) * 0.56 / 3; else cy = 0.02 + Math.floor(R() * 4) * 0.42 / 3; }
      s.put(cx, cy, 0.06, 1);
    }
    for (i = 0; i < N * 0.17; i++) {
      var g = Math.floor(R() * 4), dgt = Math.floor(R() * 4);
      s.put(-1.27 + g * 0.72 + dgt * 0.145 + R() * 0.09, -0.42 + R() * 0.17, 0.06, 0);
    }
    for (i = 0; i < N * 0.05; i++) {
      var rad = 0.1 + Math.floor(R() * 3) * 0.075, a = (R() - 0.5) * 1.3;
      s.put(-0.5 + Math.cos(a) * rad, 0.23 + Math.sin(a) * rad, 0.06, 1);
    }
    var nm = trim(name || ''), ini = nm.split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 3).toUpperCase();
    var ti = ini ? sampleText(ini, '900 SIZEpx ' + FONT) : null;
    if (ti) {
      var si = Math.min(0.46 / ti.h, 1.1 / ti.w), ox = 1.32 - ti.w * si / 2;
      for (i = 0; i < N * 0.12; i++) {
        k = Math.floor(R() * ti.pts.length / 2) * 2;
        s.put(ox + (ti.pts[k] + R() - ti.cx) * si, 0.58 - (ti.pts[k + 1] + R() - ti.cy) * si, 0.06, 1);
      }
    }
    var tn = nm ? sampleText(nm.toUpperCase(), '600 SIZEpx "IBM Plex Mono",ui-monospace,Menlo,Consolas,monospace') : null;
    if (tn) {
      var sc2 = Math.min(0.17 / tn.h, 2.2 / tn.w), nx = -1.27 + tn.w * sc2 / 2;
      for (i = 0; i < N * 0.14; i++) {
        k = Math.floor(R() * tn.pts.length / 2) * 2;
        s.put(nx + (tn.pts[k] + R() - tn.cx) * sc2, -0.76 - (tn.pts[k + 1] + R() - tn.cy) * sc2, 0.06, 0);
      }
    } else {
      for (i = 0; i < N * 0.08; i++) s.put(-1.27 + R() * 1.1, -0.8 + R() * 0.05, 0.06, 0);
    }
    return s.fill(R);
  }
  function shapeGraph(N) {
    var R = rng(37), s = new Sh(N), nodes = [{ x: 0, y: 0, z: 0, r: 0.3, t: 1 }], edges = [], i, k;
    for (k = 0; k < 6; k++) {
      var a = k * Math.PI / 3 + (R() - 0.5) * 0.4;
      nodes.push({ x: Math.cos(a) * 1.35, y: (R() - 0.5) * 1.1, z: Math.sin(a) * 1.35, r: 0.15, t: 0 });
      edges.push([0, k + 1]);
    }
    for (k = 0; k < 6; k++) edges.push([k + 1, (k + 1) % 6 + 1]);
    for (k = 0; k < 10; k++) {
      var b = k * Math.PI / 5 + (R() - 0.5) * 0.3, nd = { x: Math.cos(b) * 2.35, y: (R() - 0.5) * 1.9, z: Math.sin(b) * 2.35, r: 0.09, t: k % 3 === 0 ? 1 : 0 };
      var best = 1, bd = 1e9;
      for (i = 1; i <= 6; i++) {
        var dd = Math.pow(nodes[i].x - nd.x, 2) + Math.pow(nodes[i].y - nd.y, 2) + Math.pow(nodes[i].z - nd.z, 2);
        if (dd < bd) { bd = dd; best = i; }
      }
      nodes.push(nd); edges.push([best, nodes.length - 1]);
    }
    var nw = 0; nodes.forEach(function (n) { nw += n.r * n.r; });
    var nN = Math.floor(N * 0.44);
    nodes.forEach(function (n) {
      var c = Math.floor(nN * n.r * n.r / nw);
      for (var j = 0; j < c; j++) {
        var u = R() * 2 - 1, th = R() * Math.PI * 2, q = Math.sqrt(1 - u * u);
        s.put(n.x + Math.cos(th) * q * n.r, n.y + u * n.r, n.z + Math.sin(th) * q * n.r, n.t);
      }
    });
    var lens = edges.map(function (e) {
      var A = nodes[e[0]], B = nodes[e[1]];
      return Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2) + Math.pow(A.z - B.z, 2));
    }), tot = lens.reduce(function (x, y) { return x + y; }, 0), eN = N - s.n;
    edges.forEach(function (e, ei) {
      var A = nodes[e[0]], B = nodes[e[1]], c = Math.floor(eN * lens[ei] / tot);
      for (var j = 0; j < c; j++) {
        var f = R();
        s.put(A.x + (B.x - A.x) * f + (R() - 0.5) * 0.02, A.y + (B.y - A.y) * f + (R() - 0.5) * 0.02, A.z + (B.z - A.z) * f + (R() - 0.5) * 0.02, 0);
      }
    });
    return s.fill(R);
  }
  function sampleText(str, font) {
    var c = doc.createElement('canvas'), W = 900, H = 300;
    c.width = W; c.height = H;
    var x = c.getContext('2d'); if (!x) return null;
    var size = 240;
    x.font = font.replace('SIZE', size);
    var mw = x.measureText(str).width;
    if (mw > W * 0.94) { size = size * W * 0.94 / mw; x.font = font.replace('SIZE', size); }
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#fff';
    x.fillText(str, W / 2, H / 2);
    var img;
    try { img = x.getImageData(0, 0, W, H).data; } catch (e) { return null; }
    var pts = [], x0 = W, x1 = 0, y0 = H, y1 = 0, px, py;
    for (py = 0; py < H; py++) for (px = 0; px < W; px++) {
      if (img[(py * W + px) * 4 + 3] > 120) {
        pts.push(px, py);
        if (px < x0) x0 = px; if (px > x1) x1 = px; if (py < y0) y0 = py; if (py > y1) y1 = py;
      }
    }
    if (pts.length < 20) return null;
    return { pts: pts, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) };
  }
  function shapeText(N, str) {
    var R = rng(41), s = new Sh(N), t = sampleText(str, '900 SIZEpx ' + FONT);
    if (!t) return shapeGlobe(N);
    var sc = Math.min(3.1 / t.h, 3.4 / t.w);
    for (var i = 0; i < N; i++) {
      var k = Math.floor(R() * t.pts.length / 2) * 2;
      s.put((t.pts[k] + R() - t.cx) * sc, -(t.pts[k + 1] + R() - t.cy) * sc, (R() - 0.5) * 0.34, R() < 0.74 ? 1 : 0);
    }
    return s;
  }
  /* A working clock: the hands are rewritten from the viewer's local time. */
  function setClock(s, d) {
    var R = rng(73), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = (d.getHours() % 12) + min / 60;
    var n = s.N - s.hand0, nh = Math.floor(n * 0.36), nmn = Math.floor(n * 0.42), idx = s.hand0;
    function hand(count, a, len, wid, tail, z, t) {
      var sn = Math.sin(a), cs = Math.cos(a);
      for (var j = 0; j < count; j++) {
        var r = -tail + R() * (len + tail), w = (R() - 0.5) * wid, i = idx * 3;
        s.p[i] = sn * r + cs * w; s.p[i + 1] = cs * r - sn * w; s.p[i + 2] = z + (R() - 0.5) * 0.03; s.t[idx] = t; idx++;
      }
    }
    hand(nh, hr / 12 * Math.PI * 2, 0.78, 0.1, 0.12, 0.1, 0);
    hand(nmn, min / 60 * Math.PI * 2, 1.2, 0.065, 0.14, 0.14, 0);
    hand(n - nh - nmn, sec / 60 * Math.PI * 2, 1.32, 0.022, 0.25, 0.18, 1);
  }
  function shapeClock(N) {
    var R = rng(71), s = new Sh(N), i, a;
    for (i = 0; i < N * 0.3; i++) {
      a = R() * Math.PI * 2; var rr = R() < 0.6 ? 1.62 : 1.52;
      s.put(Math.sin(a) * rr, Math.cos(a) * rr, (R() - 0.5) * 0.26, 0);
    }
    for (i = 0; i < N * 0.27; i++) {
      var k = R() < 0.6 ? Math.floor(R() * 12) * 5 : Math.floor(R() * 60), big = k % 5 === 0;
      a = k / 60 * Math.PI * 2;
      var rad = 1.4 - R() * (big ? 0.26 : 0.09), w = (R() - 0.5) * (big ? 0.07 : 0.02);
      s.put(Math.sin(a) * rad + Math.cos(a) * w, Math.cos(a) * rad - Math.sin(a) * w, 0.02, k % 15 === 0 ? 1 : 0);
    }
    for (i = 0; i < N * 0.03; i++) { a = R() * Math.PI * 2; var q = Math.sqrt(R()) * 0.08; s.put(Math.cos(a) * q, Math.sin(a) * q, 0.2, 1); }
    s.hand0 = s.n; s.n = N;
    setClock(s, new Date());
    return s;
  }
  /* Globe with the stops so far: Vellore, Pune, Santa Clara, New York. */
  function shapeRoutes(N) {
    var R = rng(83), s = new Sh(N), r = 1.5, ga = Math.PI * (3 - Math.sqrt(5)), n1 = Math.floor(N * 0.58), i;
    for (i = 0; i < n1; i++) {
      var y = 1 - 2 * (i + 0.5) / n1, q = Math.sqrt(1 - y * y), th = ga * i;
      s.put(Math.cos(th) * q * r, y * r, Math.sin(th) * q * r, 0);
    }
    var cities = [[12.92, 79.13], [18.52, 73.86], [37.35, -121.96], [40.71, -74.01]].map(function (c) {
      var la = c[0] * Math.PI / 180, lo = c[1] * Math.PI / 180;
      return [Math.cos(la) * Math.cos(lo), Math.sin(la), -Math.cos(la) * Math.sin(lo)];
    });
    cities.forEach(function (c) {
      for (var j = 0; j < N * 0.03; j++) {
        var vx = c[0] + (R() - 0.5) * 0.12, vy = c[1] + (R() - 0.5) * 0.12, vz = c[2] + (R() - 0.5) * 0.12, l = Math.sqrt(vx * vx + vy * vy + vz * vz), rr = r * (1.01 + R() * 0.06);
        s.put(vx / l * rr, vy / l * rr, vz / l * rr, 1);
      }
    });
    var legs = [[0, 1], [1, 2], [2, 3]], om = legs.map(function (g) {
      var A = cities[g[0]], B = cities[g[1]];
      return Math.acos(clamp(A[0] * B[0] + A[1] * B[1] + A[2] * B[2], -1, 1));
    }), tot = om.reduce(function (x, v) { return x + v + 0.15; }, 0), left = N - s.n;
    legs.forEach(function (g, gi) {
      var A = cities[g[0]], B = cities[g[1]], O = om[gi], so = Math.sin(O) || 1, cnt = Math.floor(left * (O + 0.15) / tot);
      for (var j = 0; j < cnt; j++) {
        var t = R(), ka = Math.sin((1 - t) * O) / so, kb = Math.sin(t * O) / so, lift = r * (1.02 + (0.05 + 0.2 * Math.min(1, O / 1.5)) * Math.sin(Math.PI * t));
        s.put((A[0] * ka + B[0] * kb) * lift + (R() - 0.5) * 0.02, (A[1] * ka + B[1] * kb) * lift + (R() - 0.5) * 0.02, (A[2] * ka + B[2] * kb) * lift + (R() - 0.5) * 0.02, 1);
      }
    });
    return s.fill(R);
  }
  function shapeSheets(N) {
    var R = rng(53), s = new Sh(N), hw = 0.95, hh = 1.25, per = Math.floor(N / 3);
    for (var k = 0; k < 3; k++) {
      var z = (k - 1) * 0.55, dx = (k - 1) * 0.3, dy = (1 - k) * 0.17, ro = (k - 1) * 0.1, cs = Math.cos(ro), sn = Math.sin(ro);
      var lines = []; for (var j = 0; j < 11; j++) lines.push(j === 0 ? 0.62 : 0.45 + R() * 0.55);
      for (var i = 0; i < per; i++) {
        var x, y, t = 0;
        if (R() < 0.36) { var pt = rrPoint(R(), hw, hh, 0.06); x = pt[0]; y = pt[1]; }
        else {
          var li = Math.floor(R() * 11);
          x = -hw + 0.22 + R() * (2 * hw - 0.44) * lines[li];
          y = hh - 0.36 - li * 0.2 + (R() - 0.5) * (li === 0 ? 0.09 : 0.035);
          if (li === 0 && k === 2) t = 1;
        }
        s.put(x * cs - y * sn + dx, x * sn + y * cs + dy, z, t);
      }
    }
    return s.fill(R);
  }
  function shapeWave(N) {
    var R = rng(67), s = new Sh(N), rows = 44;
    for (var i = 0; i < N; i++) {
      var z = -3.6 + Math.floor(R() * rows) / rows * 5.6, x = (R() * 2 - 1) * 5.6;
      var y = 0.32 * Math.sin(x * 1.1 + z * 0.6) + 0.22 * Math.cos(z * 1.6 - x * 0.4);
      s.put(x, y, z, y > 0.3 && R() < 0.8 ? 1 : 0);
    }
    return s;
  }

  var KEY = {
    hero: { shape: 'globe', x: 0.44, y: 0.14, s: 1, o: 1, spin: 0.14, tilt: 0.32, roll: -0.18, mx: 0, my: 0.36, ms: 0.7, mo: 0.9 },
    man: { shape: 'card', x: 0, y: 0, s: 1.2, o: 0.26, sway: 0.5, tilt: -0.18, roll: 0.1, mx: 0, my: 0, ms: 0.68, mo: 0.24 },
    stats: { shape: 'card', x: 0.34, y: -0.08, s: 1.05, o: 0.12, sway: 0.6, tilt: -0.2, roll: -0.08, mx: 0, my: 0, ms: 0.64, mo: 0.1 },
    about: { shape: 'routes', x: -0.56, y: -0.42, s: 0.6, o: 0.9, spin: 0.2, tilt: 0.5, roll: 0, mx: 0, my: 0, ms: 0.62, mo: 0.1 },
    work: { shape: 'clock', x: -0.56, y: -0.44, s: 0.6, o: 0.9, sway: 0.45, tilt: -0.12, roll: 0, mx: 0, my: 0, ms: 0.6, mo: 0.1 },
    builds: { shape: 'graph', x: 0.05, y: -0.05, s: 1.1, o: 0.3, spin: 0.07, tilt: 0.35, roll: 0, mx: 0, my: 0, ms: 0.6, mo: 0.17 },
    wins: { shape: 'seven', x: -0.5, y: 0, s: 1.05, o: 1, sway: 0.32, tilt: 0, roll: 0, mx: 0, my: 0.3, ms: 0.6, mo: 0 },
    paper: { shape: 'sheets', x: 0.56, y: 0.34, s: 0.62, o: 0.55, sway: 0.4, tilt: -0.12, roll: 0.06, mx: 0, my: 0, ms: 0.6, mo: 0.12 },
    contact: { shape: 'wave', x: 0, y: 0.36, s: 1, o: 0.6, sway: 0.1, tilt: 0.42, roll: 0, mx: 0, my: 0.42, ms: 0.62, mo: 0.5 }
  };

  function initGL() {
    var T = window.THREE, canvas = $('#gl'), renderer;
    if (!T || !canvas) return null;
    try { renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false, powerPreference: 'high-performance' }); }
    catch (e) { return null; }
    var N = Math.min(window.innerWidth, window.innerHeight) < 700 ? 7000 : 15000;
    var scene = new T.Scene(), cam = new T.PerspectiveCamera(40, 1, 0.1, 60); cam.position.z = 6;
    var geo = new T.BufferGeometry();
    function attr(name, size) {
      var a = new T.BufferAttribute(new Float32Array(N * size), size);
      a.setUsage(T.DynamicDrawUsage); geo.setAttribute(name, a); return a;
    }
    attr('position', 3);
    var aA = attr('aA', 3), aB = attr('aB', 3), aTA = attr('aTA', 1), aTB = attr('aTB', 1), aR = attr('aR', 4);
    var R = rng(5); for (var i = 0; i < N * 4; i++) aR.array[i] = R();
    var uni = {
      uMix: { value: 0 }, uTime: { value: 0 }, uSize: { value: 0.041 }, uH: { value: 1 }, uSwirl: { value: 1 },
      uRA: { value: new T.Matrix3() }, uRB: { value: new T.Matrix3() }, uOA: { value: new T.Vector3() }, uOB: { value: new T.Vector3() },
      uSA: { value: 1 }, uSB: { value: 1 }, uC1: { value: new T.Color(0xc4d4ff) }, uC2: { value: new T.Color(0xff5a36) }, uOpacity: { value: 1 }
    };
    var mat = new T.ShaderMaterial({
      uniforms: uni, transparent: true, depthTest: false, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: [
        'attribute vec3 aA; attribute vec3 aB; attribute float aTA; attribute float aTB; attribute vec4 aR;',
        'uniform float uMix; uniform float uTime; uniform float uSize; uniform float uH; uniform float uSwirl;',
        'uniform mat3 uRA; uniform mat3 uRB; uniform vec3 uOA; uniform vec3 uOB; uniform float uSA; uniform float uSB;',
        'varying float vT; varying float vK;',
        'void main(){',
        '  float st = 0.55;',
        '  float m = clamp(uMix*(1.0+st) - aR.x*st, 0.0, 1.0);',
        '  m = m*m*(3.0-2.0*m);',
        '  vec3 a = uRA*(aA*uSA) + uOA;',
        '  vec3 b = uRB*(aB*uSB) + uOB;',
        '  vec3 p = mix(a, b, m);',
        '  vec3 dir = normalize(vec3(aR.y-0.5, aR.z-0.5, aR.w-0.5) + 0.0001);',
        '  p += dir * sin(m*3.14159265) * uSwirl * (0.35 + aR.x);',
        '  p += 0.016*vec3(sin(uTime*0.9+aR.y*40.0), cos(uTime*0.7+aR.z*40.0), sin(uTime*0.8+aR.w*40.0));',
        '  vec4 mv = modelViewMatrix*vec4(p, 1.0);',
        '  gl_Position = projectionMatrix*mv;',
        '  float sc = clamp(mix(uSA, uSB, m), 0.3, 1.0);',
        '  gl_PointSize = uSize*(0.5+aR.w*1.1)*uH/(-mv.z)*sqrt(sc);',
        '  vK = sc;',
        '  vT = mix(aTA, aTB, m);',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uC1; uniform vec3 uC2; uniform float uOpacity; varying float vT; varying float vK;',
        'void main(){',
        '  float d = length(gl_PointCoord - 0.5);',
        '  float al = smoothstep(0.5, 0.04, d);',
        '  gl_FragColor = vec4(mix(uC1, uC2, vT), al*al*uOpacity*0.82*vK);',
        '}'
      ].join('\n')
    });
    var pts = new T.Points(geo, mat); pts.frustumCulled = false; scene.add(pts);

    var shapes = { globe: shapeGlobe(N), card: null, graph: shapeGraph(N), sheets: shapeSheets(N), wave: shapeWave(N), clock: shapeClock(N), routes: shapeRoutes(N), seven: null };
    var text = null, cardName = null, clockT = -1, pair = -2, sm = 0, started = false, ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    var eul = new T.Euler(), m4 = new T.Matrix4(), halfH = Math.tan(20 * Math.PI / 180) * 6;

    function refresh(count, name, force) {
      if (force || count !== text || !shapes.seven) { text = count; shapes.seven = shapeText(N, count); pair = -2; }
      if (force || name !== cardName || !shapes.card) { cardName = name; shapes.card = shapeCard(N, name); pair = -2; }
    }
    function cfg(name) {
      var k = KEY[name] || KEY.hero;
      if (vw < 820) return { shape: k.shape, x: k.mx, y: k.my, s: k.ms, o: k.mo, spin: k.spin, sway: k.sway, tilt: k.tilt, roll: k.roll };
      return k;
    }
    function rot(c, t, target) {
      var ay = (c.spin ? t * c.spin : Math.sin(t * 0.45) * (c.sway || 0)) + ptr.x * 0.22;
      eul.set((c.tilt || 0) + ptr.y * 0.14, ay, c.roll || 0, 'ZXY');
      m4.makeRotationFromEuler(eul); target.setFromMatrix4(m4);
    }
    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      cam.aspect = w / h; cam.updateProjectionMatrix();
      uni.uH.value = renderer.domElement.height;
    }
    function frame(t, dt, sy) {
      var keys = L.keys; if (!keys.length) return;
      var last = keys.length - 1, yc = sy + vh / 2, target = last;
      for (var k = 0; k <= last; k++) {
        if (yc <= keys[k].he || k === last) {
          target = k;
          if (yc < keys[k].hs && k > 0) target = k - 1 + clamp((yc - keys[k - 1].he) / Math.max(1, keys[k].hs - keys[k - 1].he), 0, 1);
          break;
        }
      }
      if (!started || RM) { sm = target; started = true; } else sm += (target - sm) * (1 - Math.exp(-dt * 7));
      if (Math.abs(target - sm) < 0.0005) sm = target;
      var i = clamp(Math.floor(sm), 0, last), f = i >= last ? 0 : sm - i, j = Math.min(i + 1, last);
      var ca = cfg(keys[i].name), cb = cfg(keys[j].name);
      if (!RM && (ca.shape === 'clock' || cb.shape === 'clock') && Math.abs(t - clockT) > 0.1) { clockT = t; setClock(shapes.clock, new Date()); pair = -2; }
      if (pair !== i) {
        pair = i;
        var A = shapes[ca.shape] || shapes.globe, B = shapes[cb.shape] || shapes.globe;
        aA.array.set(A.p); aTA.array.set(A.t); aB.array.set(B.p); aTB.array.set(B.t);
        aA.needsUpdate = aTA.needsUpdate = aB.needsUpdate = aTB.needsUpdate = true;
      }
      ptr.x += (ptr.tx - ptr.x) * 0.06; ptr.y += (ptr.ty - ptr.y) * 0.06;
      var halfW = halfH * cam.aspect, adj = vw < 820 ? 1 : clamp(cam.aspect / 1.6, 0.6, 1), tt = RM ? 0 : t;
      rot(ca, tt, uni.uRA.value); rot(cb, tt, uni.uRB.value);
      uni.uOA.value.set(ca.x * halfW, ca.y * halfH, 0); uni.uOB.value.set(cb.x * halfW, cb.y * halfH, 0);
      uni.uSA.value = ca.s * adj; uni.uSB.value = cb.s * adj;
      uni.uMix.value = f; uni.uTime.value = tt;
      uni.uSwirl.value = ca.shape === cb.shape ? 0 : 1;
      uni.uOpacity.value = ca.o + (cb.o - ca.o) * f;
      renderer.render(scene, cam);
    }
    window.addEventListener('pointermove', function (e) {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2; ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    resize();
    return { frame: frame, resize: resize, refresh: refresh, keysChanged: function () { pair = -2; } };
  }

  /* ---------- editor ---------- */
  var SCHEMA = [
    { key: 'profile', label: 'Profile', go: 'top', fields: [
      { k: 'name', label: 'Full name' },
      { k: 'kicker', label: 'Title line', hint: 'Put × between two parts to highlight the second one.' },
      { k: 'role', label: 'Intro sentence', type: 'area' },
      { k: 'status', label: 'Status badge', hint: 'Shown with a dot at the top. Leave empty to hide it.' },
      { k: 'location', label: 'Location' },
      { k: 'manifesto', label: 'Opening statement', type: 'area', hint: 'Wrap words in *asterisks* to highlight them.' },
      { k: 'contactLine', label: 'Contact line', type: 'area' }
    ] },
    { key: 'facts', label: 'About', go: 'about', list: true, add: 'Add a quick fact', blank: { label: '', value: '' },
      extra: [{ k: 'about', in: 'profile', label: 'About me', type: 'area', rows: '12', hint: 'Leave a blank line between paragraphs. The first paragraph is shown large.' }],
      title: function (x) { return [x.label, x.value].filter(Boolean).join(' · '); },
      fields: [{ k: 'label', label: 'Label' }, { k: 'value', label: 'Value' }] },
    { key: 'stats', label: 'Numbers', go: 'numbers', list: true, add: 'Add a number', blank: { value: '', label: '' },
      title: function (x) { return [x.value, x.label].filter(Boolean).join(' · '); },
      fields: [{ k: 'value', label: 'Number' }, { k: 'label', label: 'What it counts' }] },
    { key: 'experience', label: 'Experience', go: 'work', list: true, top: true, add: 'Add a role',
      blank: { role: '', company: '', place: '', dates: '', note: '', bullets: [], stack: [] },
      title: function (x) { return [x.role, x.company].filter(Boolean).join(' · '); },
      fields: [
        { k: 'role', label: 'Job title' }, { k: 'company', label: 'Company' }, { k: 'place', label: 'Location' }, { k: 'dates', label: 'Dates' },
        { k: 'note', label: 'One-line summary', type: 'area' },
        { k: 'bullets', label: 'Bullet points', type: 'lines', hint: 'One per line.' },
        { k: 'stack', label: 'Tags', type: 'csv', hint: 'Separate with commas.' }
      ] },
    { key: 'projects', label: 'Projects', go: 'projects', list: true, top: true, add: 'Add a project',
      blank: { name: '', kind: '', blurb: '', award: '', stack: [], link: '' },
      title: function (x) { return x.name; },
      fields: [
        { k: 'name', label: 'Project name' }, { k: 'kind', label: 'Label', hint: 'For example: Hackathon, Side project, Chrome extension.' },
        { k: 'blurb', label: 'Description', type: 'area', hint: 'Two or three sentences fit best.' },
        { k: 'award', label: 'Award', hint: 'Leave empty if none.' },
        { k: 'stack', label: 'Tech tags', type: 'csv', hint: 'Separate with commas.' },
        { k: 'link', label: 'Link', type: 'url' }
      ] },
    { key: 'wins', label: 'Wins', go: 'wins', list: true, add: 'Add a win', blank: { title: '', event: '', project: '' },
      extra: [{ k: 'winsCount', label: 'Total wins', hint: 'The big number drawn in 3D.' }],
      title: function (x) { return x.title; },
      fields: [{ k: 'title', label: 'Prize' }, { k: 'event', label: 'Event' }, { k: 'project', label: 'Project' }] },
    { key: 'education', label: 'Education', go: 'credentials', list: true, add: 'Add a school', blank: { school: '', degree: '', dates: '', detail: '' },
      title: function (x) { return x.school; },
      fields: [{ k: 'school', label: 'School' }, { k: 'degree', label: 'Degree' }, { k: 'dates', label: 'Dates' }, { k: 'detail', label: 'Details', type: 'area' }] },
    { key: 'credentials', label: 'Publications & certs', go: 'credentials', list: true, add: 'Add a publication or certification', blank: { title: '', detail: '' },
      title: function (x) { return x.title; },
      fields: [{ k: 'title', label: 'Title' }, { k: 'detail', label: 'Publisher, issuer or date' }] },
    { key: 'skills', label: 'Skills', go: 'credentials', list: true, add: 'Add a skill group', blank: { group: '', items: [] },
      title: function (x) { return x.group; },
      fields: [{ k: 'group', label: 'Group name' }, { k: 'items', label: 'Skills', type: 'csv', hint: 'Separate with commas.' }] },
    { key: 'links', label: 'Links', go: 'contact', list: true, add: 'Add a link', blank: { label: '', url: '' },
      note: 'Links with an empty address stay hidden on the site.',
      title: function (x) { return x.label; },
      fields: [{ k: 'label', label: 'Label' }, { k: 'url', label: 'Web address or email', type: 'url' }] }
  ];
  var artifact = null, busy = false, curTab = 'profile', openIdx = -1, previewTimer = 0;

  function el(tag, attrs, kids) {
    var e = doc.createElement(tag), k;
    for (k in (attrs || {})) {
      if (k === 'text') e.textContent = attrs[k]; else if (k === 'class') e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    }
    (kids || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  function isDirty() { return JSON.stringify(data) !== JSON.stringify(saved); }
  function setStatus(msg, warn) { var s = $('#ed-status'); s.textContent = msg; s.classList.toggle('warn', !!warn); }
  function updateStatus() {
    var d = isDirty();
    setStatus(busy ? 'Publishing…' : d ? 'Unpublished changes' : 'Everything is published', d && !busy);
    $('#ed-save').disabled = busy || !d; $('#ed-discard').disabled = busy || !d;
    $('#edit-btn').classList.toggle('dirty', d);
  }
  function changed() {
    updateStatus();
    clearTimeout(previewTimer); previewTimer = setTimeout(function () { renderSite(true); }, 260);
  }
  function fieldEl(obj, f, idBase, after) {
    var id = idBase + '-' + f.k, val = obj[f.k], inp;
    if (f.type === 'area' || f.type === 'lines') {
      inp = el('textarea', { id: id, rows: f.rows || (f.type === 'lines' ? '6' : '3') });
      inp.value = f.type === 'lines' ? (val || []).join('\n') : (val || '');
    } else {
      inp = el('input', { id: id, type: 'text', autocomplete: 'off' });
      inp.value = f.type === 'csv' ? (val || []).join(', ') : (val || '');
    }
    inp.addEventListener('input', function () {
      var v = inp.value;
      if (f.type === 'lines') obj[f.k] = v.split('\n').map(trim).filter(Boolean);
      else if (f.type === 'csv') obj[f.k] = v.split(',').map(trim).filter(Boolean);
      else obj[f.k] = v;
      if (after) after();
      changed();
    });
    return el('div', { class: 'ed-f' }, [el('label', { for: id, text: f.label }), inp, f.hint ? el('p', { class: 'ed-hint', text: f.hint }) : null]);
  }
  function drawTab() {
    var sec = SCHEMA.filter(function (s) { return s.key === curTab; })[0], body = $('#ed-body');
    body.textContent = '';
    $$('#ed-tabs button').forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-k') === curTab ? 'true' : 'false'); });
    if (!sec.list) {
      sec.fields.forEach(function (f) { body.appendChild(fieldEl(data[sec.key], f, 'ed-' + sec.key)); });
      return;
    }
    (sec.extra || []).forEach(function (f) { body.appendChild(fieldEl(f.in ? data[f.in] : data, f, 'ed-' + sec.key + '-x')); });
    if (sec.note) body.appendChild(el('p', { class: 'ed-hint', text: sec.note }));
    var arr = data[sec.key];
    var add = el('button', { class: 'btn', type: 'button', text: '+ ' + sec.add });
    add.addEventListener('click', function () {
      var it = clone(sec.blank);
      if (sec.top) { arr.unshift(it); openIdx = 0; } else { arr.push(it); openIdx = arr.length - 1; }
      drawTab(); changed();
      var first = $('#ed-body details[open] input'); if (first) first.focus();
    });
    if (sec.top) body.appendChild(el('div', { class: 'ed-row' }, [add]));
    arr.forEach(function (it, i) {
      var sum = el('summary', { text: sec.title(it) || 'New entry' });
      var inner = el('div', { class: 'ed-item-body' });
      sec.fields.forEach(function (f) {
        inner.appendChild(fieldEl(it, f, 'ed-' + sec.key + '-' + i, function () { sum.textContent = sec.title(it) || 'New entry'; }));
      });
      var up = el('button', { class: 'btn sm', type: 'button', text: 'Move up' }), dn = el('button', { class: 'btn sm', type: 'button', text: 'Move down' }),
        del = el('button', { class: 'btn sm danger', type: 'button', text: 'Delete' });
      up.disabled = i === 0; dn.disabled = i === arr.length - 1;
      up.addEventListener('click', function () { arr.splice(i - 1, 0, arr.splice(i, 1)[0]); openIdx = i - 1; drawTab(); changed(); });
      dn.addEventListener('click', function () { arr.splice(i + 1, 0, arr.splice(i, 1)[0]); openIdx = i + 1; drawTab(); changed(); });
      del.addEventListener('click', function () {
        if (del.getAttribute('data-arm') !== '1') {
          del.setAttribute('data-arm', '1'); del.textContent = 'Click again to delete';
          setTimeout(function () { del.removeAttribute('data-arm'); del.textContent = 'Delete'; }, 3000);
          return;
        }
        arr.splice(i, 1); openIdx = -1; drawTab(); changed();
      });
      inner.appendChild(el('div', { class: 'ed-row' }, [up, dn, del]));
      var det = el('details', { class: 'ed-item' }, [sum, inner]);
      if (i === openIdx) det.open = true;
      det.addEventListener('toggle', function () { if (det.open) openIdx = i; else if (openIdx === i) openIdx = -1; });
      body.appendChild(det);
    });
    if (!sec.top) body.appendChild(el('div', { class: 'ed-row' }, [add]));
  }
  function initEditor() {
    var tabs = $('#ed-tabs');
    SCHEMA.forEach(function (s) {
      var b = el('button', { type: 'button', role: 'tab', 'data-k': s.key, text: s.label });
      b.addEventListener('click', function () {
        curTab = s.key; openIdx = -1; drawTab();
        var t = doc.getElementById(s.go); if (t) t.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
      tabs.appendChild(b);
    });
    $('#edit-btn').addEventListener('click', function () {
      var ed = $('#editor'), open = !ed.classList.contains('open');
      ed.classList.toggle('open', open);
      if (open) { drawTab(); updateStatus(); }
    });
    $('#ed-close').addEventListener('click', function () { $('#editor').classList.remove('open'); });
    doc.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#editor').classList.remove('open'); });
    $('#ed-discard').addEventListener('click', function () {
      data = clone(saved); openIdx = -1; drawTab(); updateStatus(); renderSite(true); toast('Changes discarded.');
    });
    $('#ed-save').addEventListener('click', function () {
      if (!artifact || busy || !isDirty()) return;
      busy = true; updateStatus();
      var snapshot = clone(data);
      var html = buildDocument({ title: DOC_TITLE, css: CSS_SRC, js: JS_SRC, data: snapshot });
      Promise.resolve().then(function () { return artifact.publish(html); }).then(function () {
        saved = snapshot; busy = false;
        try { sessionStorage.setItem('site-published', '1'); } catch (e) {}
        updateStatus(); toast('Published. Visitors now see your changes.');
      }).catch(function (err) {
        busy = false; updateStatus();
        var c = String((err && (err.code || err.message)) || err);
        setStatus(/conflict/i.test(c) ? 'A newer version was saved elsewhere. Reload the page, then edit again.'
          : /not_granted|not_writer/i.test(c) ? 'You do not have permission to edit this page.'
          : 'Could not publish: ' + c, true);
      });
    });
  }
  function initOwner() {
    var c = window.claude;
    if (!c || typeof c.use !== 'function') return;
    Promise.all([c.use('artifact'), c.use('user')]).then(function (r) {
      artifact = r[0]; var user = r[1];
      if (!artifact) return;
      var asked = /^#edit$/i.test(window.location.hash || '');
      return Promise.resolve(user && user.canEdit ? user.canEdit() : false).then(function (can) {
        if (can) return true;
        return Promise.resolve(user && user.isOwner ? user.isOwner() : false);
      }).then(function (can) {
        if (can || asked) $('#edit-btn').hidden = false;
      });
    }).catch(function () {});
  }

  /* ---------- boot ---------- */
  mount();
  initEditor();
  gl = initGL();
  if (!gl) root.classList.add('no-gl');
  renderSite(false);
  scramble();
  initOwner();
  try {
    if (sessionStorage.getItem('site-published')) { sessionStorage.removeItem('site-published'); toast('Published. Visitors now see your changes.'); }
  } catch (e) {}

  var relayout = 0;
  function queueLayout() { clearTimeout(relayout); relayout = setTimeout(layout, 120); }
  window.addEventListener('resize', queueLayout);
  window.addEventListener('load', layout);
  if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(function () {
    layout();
    if (gl) gl.refresh(trim(data.winsCount) || '*', trim(data.profile.name || ''), true);
  });

  if (!RM && window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    $('#app').addEventListener('pointermove', function (e) {
      var c = e.target.closest ? e.target.closest('.card') : null; if (!c) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.setProperty('--rx', ((0.5 - y) * 7).toFixed(2) + 'deg'); c.style.setProperty('--ry', ((x - 0.5) * 9).toFixed(2) + 'deg');
      c.style.setProperty('--gx', (x * 100).toFixed(1) + '%'); c.style.setProperty('--gy', (y * 100).toFixed(1) + '%');
    });
    $('#app').addEventListener('pointerout', function (e) {
      var c = e.target.closest ? e.target.closest('.card') : null;
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
    });
  }

  var sy = window.scrollY || 0, lastT = 0;
  function tick(now) {
    requestAnimationFrame(tick);
    if (doc.hidden) return;
    var t = now / 1000, dt = Math.min(0.05, Math.max(0.001, t - lastT)); lastT = t;
    var y = window.scrollY || root.scrollTop || 0;
    sy += (y - sy) * (RM ? 1 : 1 - Math.exp(-dt * 10));
    if (Math.abs(y - sy) < 0.05) sy = y;
    if (!RM) scrub(sy);
    if (E.bar) E.bar.style.transform = 'scaleX(' + clamp(sy / L.docH, 0, 1).toFixed(4) + ')';
    if (E.nav) E.nav.classList.toggle('scrolled', sy > vh * 0.7);
    if (gl) gl.frame(t, dt, sy);
  }
  requestAnimationFrame(tick);

  if (window.location.hash && !/^#edit$/i.test(window.location.hash)) {
    var target = doc.getElementById(window.location.hash.slice(1));
    if (target) setTimeout(function () { target.scrollIntoView(); }, 60);
  }
})();
