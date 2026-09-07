(function () {
  // Mobile menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  var mq = window.matchMedia('(max-width: 860px)');
  function sync() { if (mq.matches) { nav.hidden = true; btn.setAttribute('aria-expanded', 'false'); } else { nav.hidden = false; } }
  sync();
  mq.addEventListener ? mq.addEventListener('change', sync) : mq.addListener(sync);
  btn.addEventListener('click', function () {
    var open = nav.hidden;
    nav.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
  });
  nav.addEventListener('click', function (e) { if (e.target.tagName === 'A' && mq.matches) sync(); });

  // Watercolour wash behind the hero (wet-on-wet, drawn once)
  var c = document.querySelector('.hero .wash');
  if (c && c.getContext) {
    var hero = c.parentElement;
    function paint() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = hero.clientWidth, h = hero.clientHeight;
      c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
      var ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
      var wash = getComputedStyle(document.documentElement).getPropertyValue('--wash').trim() || '#f2b58a';
      var seed = 7;
      function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
      var dark = window.matchMedia('(prefers-color-scheme: dark)').matches && document.documentElement.getAttribute('data-theme') !== 'light';
      ctx.globalCompositeOperation = dark ? 'lighter' : 'multiply';
      for (var i = 0; i < 9; i++) {
        var x = w * (0.5 + rnd() * 0.55), y = h * (0.05 + rnd() * 0.9), r = Math.max(w, h) * (0.12 + rnd() * 0.22);
        var g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r);
        g.addColorStop(0, wash); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalAlpha = (dark ? 0.07 : 0.16) + rnd() * (dark ? 0.05 : 0.12);
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, r * (0.8 + rnd() * 0.5), r, rnd() * Math.PI, 0, Math.PI * 2); ctx.fill();
      }
      // Soften the canvas edges so the wash never ends in a hard line
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'destination-in';
      var v = ctx.createLinearGradient(0, 0, 0, h);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(0.15, 'rgba(0,0,0,1)'); v.addColorStop(0.75, 'rgba(0,0,0,1)'); v.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
      var hg = ctx.createLinearGradient(0, 0, w, 0);
      hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.35, 'rgba(0,0,0,1)'); hg.addColorStop(0.92, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = hg; ctx.fillRect(0, 0, w, h);
    }
    paint();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
    window.addEventListener('load', paint);
    var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(paint, 150); });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', paint);
  }

  // Gentle reveal for elements that start below the fold only
  if (window.IntersectionObserver && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var els = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.remove('pending'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) {
      if (el.getBoundingClientRect().top > window.innerHeight) { el.classList.add('pending'); io.observe(el); }
    });
  }
})();
