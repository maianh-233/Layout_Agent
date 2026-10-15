/* Sinh tự động bởi SRS & Prototype Builder — thư viện "không khí" (Level 2 / 3). Không sửa tay.
 * JS thuần, chạy được khi mở bằng file://, không phụ thuộc thư viện khác. Dùng chung với motion.js.
 * Chỉ cần gắn thuộc tính data-*:
 *
 *  Không khí (Level 2)
 *   data-particles="fireflies|dust|snow|petals|stars|rain"   canvas hạt phủ khối (khối cần class relative)
 *       data-particles-color="#FFC98B"  data-particles-density="1" (0.3 … 2)
 *   data-clouds="3"                  số lớp mây trôi ngang (mây vẽ bằng gradient mềm — trang trí, không giả ảnh)
 *       data-clouds-color="255,255,255"  data-clouds-band="0-55" (% chiều cao có mây)  data-clouds-speed="1"
 *   data-float="10"                  trôi lên xuống nhẹ (biên độ px); data-float-rotate="2" (độ)
 *   data-gradient-shift="18"         nền gradient (bg-gradient-to-*) chuyển động chậm, chu kỳ giây
 *
 *  Theo cuộn (Level 3)
 *   data-sky="#F6D8C8,#A9C6E8 | #FFB38A,#6A7BB5 | #1B2340,#0B1022"
 *       các chặng "màu trên,màu dưới" — nền gradient đổi dần theo tiến độ cuộn.
 *       Đặt trên <body> = theo cả trang; đặt trên khối = theo khối đi qua màn hình. Gán thêm --sky-t (0 → 1).
 *   data-layers  + con data-depth="0.3"   cảnh nhiều lớp: lớp có depth lớn trôi nhanh hơn (âm = ngược chiều).
 *       Lớp nên rộng hơn khung (-inset-y-[10%]) để không lộ mép. Điện thoại: biên độ giảm một nửa.
 *   data-scene="300"  (chiều cao %vh)    cảnh ghim: con đầu tiên tự sticky top-0 cao 100dvh,
 *       khối nhận --sp (0 → 1) theo tiến độ; con có data-step="0-0.33" nhận class is-active khi --sp trong khoảng.
 *
 *  An toàn: mỗi hiệu ứng chạy trong try/catch riêng — một khối lỗi không làm hỏng trang.
 *  Hiệu năng: canvas tối đa DPR 1.5, tự dừng khi khối ra khỏi màn hình hoặc tab bị ẩn, ít hạt hơn trên điện thoại.
 *  prefers-reduced-motion: vẽ một khung tĩnh (sao, đom đóm vẫn hiện), không trôi, cảnh ghim vẫn đổi bước theo cuộn.
 *  Gọi Atmos.refresh() sau khi chèn nội dung mới bằng JS.
 */
(function () {
  if (window.Atmos) return;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

  function safe(name, fn) {
    try { fn(); } catch (e) { if (window.console) console.warn('[atmos] ' + name + ' bỏ qua:', e && e.message); }
  }
  function num(v, d) { var n = parseFloat(v); return isNaN(n) ? d : n; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // Ngẫu nhiên có hạt giống: cùng một trang → cùng hình mây / sao (ảnh chụp QA ổn định)
  function rng(seed) {
    var s = seed >>> 0 || 1;
    return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
  }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619); return h; }
  function hexToRgb(c) {
    c = String(c || '').trim();
    if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(c)) return c.split(',').map(function (x) { return +x; });
    if (c[0] === '#') {
      if (c.length === 4) c = '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      var n = parseInt(c.slice(1, 7), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return null;
  }
  function mix(a, b, t) { return [0, 1, 2].map(function (i) { return Math.round(a[i] + (b[i] - a[i]) * t); }); }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  // ---------- CSS dùng chung ----------
  var css =
    '.atmos-canvas,.atmos-clouds{position:absolute;inset:0;pointer-events:none;z-index:0}' +
    '.atmos-clouds{overflow:hidden}' +
    '.atmos-cloud-row{position:absolute;left:0;width:200%;will-change:transform;animation:atmos-drift var(--dur,120s) linear infinite}' +
    '@keyframes atmos-drift{from{transform:translate3d(0,0,0)}to{transform:translate3d(-50%,0,0)}}' +
    '[data-float]{animation:atmos-float var(--fd,7s) ease-in-out var(--fdel,0s) infinite alternate}' +
    '@keyframes atmos-float{from{transform:translate3d(0,calc(var(--fa,10px) * -1),0) rotate(calc(var(--fr,0deg) * -1))}to{transform:translate3d(0,var(--fa,10px),0) rotate(var(--fr,0deg))}}' +
    '[data-gradient-shift]{background-size:300% 300%!important;animation:atmos-gs var(--gsd,18s) ease-in-out infinite alternate}' +
    '@keyframes atmos-gs{0%{background-position:0% 30%}100%{background-position:100% 70%}}' +
    '[data-scene]{position:relative}' +
    '[data-scene]>:first-child{position:sticky;top:0;height:100vh;height:100dvh;overflow:hidden}' +
    '[data-step]{transition:opacity .9s cubic-bezier(.33,1,.68,1),transform 1.1s cubic-bezier(.16,1,.3,1)}' +
    '[data-step]:not(.is-active){opacity:0;transform:translate3d(0,24px,0);pointer-events:none}' +
    '[data-layers]>[data-depth]{will-change:transform}' +
    '@media (prefers-reduced-motion:reduce){[data-float],[data-gradient-shift],.atmos-cloud-row{animation:none!important}[data-step]{transition:none}}';
  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  // ---------- Hạt (canvas) ----------
  var KINDS = {
    fireflies: { color: '255,214,140', per: 26000, max: 70, glow: true },
    dust: { color: '255,244,220', per: 14000, max: 120, glow: true },
    snow: { color: '255,255,255', per: 9000, max: 160 },
    petals: { color: '244,170,190', per: 30000, max: 45 },
    stars: { color: '255,255,255', per: 5000, max: 220 },
    rain: { color: '200,215,235', per: 7000, max: 160 },
  };
  var sprites = {};
  function glowSprite(color) {
    if (sprites[color]) return sprites[color];
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(' + color + ',1)'); gr.addColorStop(0.18, 'rgba(' + color + ',.85)');
    gr.addColorStop(0.45, 'rgba(' + color + ',.22)'); gr.addColorStop(1, 'rgba(' + color + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (sprites[color] = c);
  }

  var running = []; // hệ hạt đang thấy trên màn hình
  function particles(host) {
    var kind = host.getAttribute('data-particles') || 'dust';
    var cfg = KINDS[kind] || KINDS.dust;
    var col = hexToRgb(host.getAttribute('data-particles-color'));
    var color = col ? col.join(',') : cfg.color;
    var density = clamp(num(host.getAttribute('data-particles-density'), 1), 0.3, 2);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var cv = document.createElement('canvas');
    cv.className = 'atmos-canvas'; cv.setAttribute('aria-hidden', 'true');
    host.insertBefore(cv, host.firstChild);
    var ctx = cv.getContext('2d');
    var rand = rng(hash(kind + (host.id || '') + host.className));
    var W = 0, H = 0, list = [], t0 = performance.now();
    var sprite = cfg.glow ? glowSprite(color) : null;

    function spawn(p, initial) {
      p.x = rand() * W; p.y = initial ? rand() * H : (kind === 'dust' || kind === 'fireflies' ? H + 10 : -10);
      p.r = kind === 'stars' ? 0.4 + rand() * 1.3 : kind === 'fireflies' ? 3 + rand() * 4 : kind === 'dust' ? 1.2 + rand() * 2.4 : kind === 'petals' ? 4 + rand() * 4 : kind === 'rain' ? 10 + rand() * 14 : 1 + rand() * 2.5;
      p.vx = kind === 'rain' ? -1.2 : (rand() - 0.5) * (kind === 'fireflies' ? 0.35 : 0.25);
      p.vy = kind === 'snow' ? 0.35 + rand() * 0.6 : kind === 'petals' ? 0.5 + rand() * 0.6 : kind === 'rain' ? 9 + rand() * 5 : kind === 'dust' ? -(0.08 + rand() * 0.22) : kind === 'fireflies' ? -(0.05 + rand() * 0.2) : 0;
      p.ph = rand() * Math.PI * 2; p.sp = 0.6 + rand() * 1.4; p.rot = rand() * Math.PI; p.a = 0.35 + rand() * 0.65;
      return p;
    }
    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, r.width); H = Math.max(1, r.height);
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.round(Math.min(cfg.max, (W * H) / cfg.per) * density * (coarse ? 0.55 : 1));
      while (list.length < n) list.push(spawn({}, true));
      list.length = n;
    }
    function draw(now) {
      var t = (now - t0) / 1000;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < list.length; i++) {
        var p = list[i];
        if (!reduce) {
          p.x += p.vx + (kind === 'snow' || kind === 'petals' ? Math.sin(t * p.sp + p.ph) * 0.35 : kind === 'fireflies' ? Math.sin(t * 0.7 * p.sp + p.ph) * 0.25 : 0);
          p.y += p.vy + (kind === 'fireflies' ? Math.cos(t * 0.5 * p.sp + p.ph) * 0.2 : 0);
          if (p.y > H + 20 || p.y < -20 || p.x < -30 || p.x > W + 30) spawn(p, false);
        }
        var a = p.a;
        if (kind === 'stars') a *= 0.55 + 0.45 * Math.sin(t * p.sp * 1.6 + p.ph);
        else if (kind === 'fireflies') a *= 0.35 + 0.65 * Math.max(0, Math.sin(t * p.sp + p.ph));
        else if (kind === 'dust') a *= 0.5 + 0.5 * Math.sin(t * 0.8 * p.sp + p.ph);
        ctx.globalAlpha = clamp(a, 0, 1);
        if (sprite) { var s = p.r * 4; ctx.drawImage(sprite, p.x - s / 2, p.y - s / 2, s, s); }
        else if (kind === 'rain') {
          ctx.strokeStyle = 'rgba(' + color + ',.55)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + p.vx * 2, p.y + p.r); ctx.stroke();
        } else if (kind === 'petals') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot + t * 0.6 * p.sp);
          ctx.fillStyle = 'rgba(' + color + ',.9)'; ctx.beginPath(); ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        } else {
          ctx.fillStyle = 'rgba(' + color + ',1)'; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }
    var sys = { host: host, draw: draw, visible: false };
    resize();
    draw(performance.now());
    if ('ResizeObserver' in window) new ResizeObserver(function () { resize(); draw(performance.now()); }).observe(host);
    if (reduce) return;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        sys.visible = es[0].isIntersecting;
        var i = running.indexOf(sys);
        if (sys.visible && i < 0) running.push(sys);
        if (!sys.visible && i >= 0) running.splice(i, 1);
        loop();
      }, { rootMargin: '100px' }).observe(host);
    } else { running.push(sys); loop(); }
  }
  var looping = false;
  function loop() {
    if (looping || !running.length || document.hidden) return;
    looping = true;
    requestAnimationFrame(function tick(now) {
      if (!running.length || document.hidden) { looping = false; return; }
      for (var i = 0; i < running.length; i++) safe('particles', running[i].draw.bind(null, now));
      requestAnimationFrame(tick);
    });
  }
  document.addEventListener('visibilitychange', loop);

  // ---------- Mây ----------
  function clouds(host) {
    var layers = clamp(Math.round(num(host.getAttribute('data-clouds'), 3)), 1, 5);
    var color = (hexToRgb(host.getAttribute('data-clouds-color')) || [255, 255, 255]).join(',');
    var band = (host.getAttribute('data-clouds-band') || '0-60').split('-').map(Number);
    var speed = clamp(num(host.getAttribute('data-clouds-speed'), 1), 0.2, 4);
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
    var wrap = document.createElement('div');
    wrap.className = 'atmos-clouds'; wrap.setAttribute('aria-hidden', 'true');
    var rand = rng(hash('clouds' + (host.id || '') + host.className));
    var base = color.split(',').map(Number);
    var shade = mix(base, [176, 186, 222], 0.38).join(','); // mặt dưới đám mây hơi tím xám → có khối
    var ASPECT = 0.62; // cao / rộng của khung một đám mây

    // Một đám mây = khung tỉ lệ cố định chứa nhiều cụm tròn mềm (tọa độ theo % của chính khung → luôn "phồng",
    // không bị kéo dẹt khi màn hình rộng / hẹp)
    function cloudBg() {
      var g = [], lobes = 4 + Math.round(rand() * 3);
      for (var k = 0; k < lobes; k++) {
        // Mọi cụm nằm trọn trong khung (bán kính hiện ≈ 0.68 × rw) → không lộ cạnh thẳng
        var cx = 24 + (k / (lobes - 1)) * 52 + (rand() - 0.5) * 6;
        var mid = 1 - Math.abs(cx - 50) / 26;                    // cụm giữa to và cao hơn
        var rw = 13 + mid * 11 + rand() * 4, rh = rw / ASPECT;   // hình tròn theo px
        var cy = 66 - mid * 16 + (rand() - 0.5) * 6, a = (0.82 + rand() * 0.18).toFixed(2);
        g.push('radial-gradient(' + rw.toFixed(1) + '% ' + rh.toFixed(1) + '% at ' + cx.toFixed(1) + '% ' + cy.toFixed(1) + '%, rgba(' + color + ',' + a + ') 0%, rgba(' + color + ',' + (a * 0.9).toFixed(2) + ') 48%, rgba(' + color + ',0) 68%)');
      }
      // Đáy phẳng, tối hơn một chút
      g.push('radial-gradient(40% 22% at 50% 76%, rgba(' + shade + ',.55) 0%, rgba(' + shade + ',.25) 50%, rgba(' + shade + ',0) 75%)');
      return g.reverse().join(',');
    }

    for (var l = 0; l < layers; l++) {
      var near = layers > 1 ? l / (layers - 1) : 1; // lớp đầu xa nhất: nhỏ, mờ, chậm
      var row = document.createElement('div');
      row.className = 'atmos-cloud-row';
      row.style.top = band[0] + '%'; row.style.height = (band[1] - band[0]) + '%';
      row.style.opacity = (0.5 + 0.45 * near).toFixed(2);
      row.style.setProperty('--dur', Math.round((260 - near * 130) / speed) + 's');
      row.style.animationDelay = (-rand() * 120).toFixed(1) + 's';
      var count = 2 + Math.round(rand() * 2);
      for (var c = 0; c < count; c++) {
        var size = 9 + near * 13 + rand() * 9;                   // vw
        var x = (c + rand() * 0.7) / count * 50, y = (1 - near) * 10 + rand() * 55, bg = cloudBg();
        [0, 50].forEach(function (shift) {                       // bản sao giống hệt ở nửa sau → trôi liền mạch
          var cl = document.createElement('div');
          cl.style.cssText = 'position:absolute;left:' + (x + shift).toFixed(2) + '%;top:' + y.toFixed(1) + '%;' +
            'width:clamp(110px,' + size.toFixed(1) + 'vw,640px);aspect-ratio:' + (1 / ASPECT) + '/1;background:' + bg;
          row.appendChild(cl);
        });
      }
      wrap.appendChild(row);
    }
    host.insertBefore(wrap, host.firstChild);
  }

  // ---------- Trôi nhẹ, gradient chuyển động ----------
  function float(el) {
    var r = rng(hash(el.className + el.textContent.slice(0, 20)));
    el.style.setProperty('--fa', num(el.getAttribute('data-float'), 10) + 'px');
    el.style.setProperty('--fr', num(el.getAttribute('data-float-rotate'), 0) + 'deg');
    el.style.setProperty('--fd', (6 + r() * 4).toFixed(1) + 's');
    el.style.setProperty('--fdel', (-r() * 6).toFixed(1) + 's');
  }
  function gradientShift(el) { el.style.setProperty('--gsd', num(el.getAttribute('data-gradient-shift'), 18) + 's'); }

  // ---------- Theo cuộn: bầu trời, nhiều lớp, cảnh ghim ----------
  var skies = [], layerSets = [], scenes = [];
  function sky(el) {
    var stages = el.getAttribute('data-sky').split('|').map(function (s) {
      var p = s.split(',').map(function (x) { return hexToRgb(x.trim()); });
      return [p[0], p[1] || p[0]];
    }).filter(function (s) { return s[0]; });
    if (stages.length) skies.push({ el: el, stages: stages, page: el === document.body || el === document.documentElement });
  }
  function layers(el) { layerSets.push({ el: el, items: Array.prototype.slice.call(el.querySelectorAll('[data-depth]')) }); }
  function scene(el) {
    el.style.height = num(el.getAttribute('data-scene'), 300) + 'vh';
    scenes.push({ el: el, steps: Array.prototype.slice.call(el.querySelectorAll('[data-step]')).map(function (s) {
      var r = s.getAttribute('data-step').split('-').map(Number); return { el: s, a: r[0] || 0, b: isNaN(r[1]) ? 1 : r[1] };
    }) });
  }

  var ticking = false;
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }
  function frame() {
    ticking = false;
    var y = window.scrollY, vh = window.innerHeight, max = Math.max(1, document.documentElement.scrollHeight - vh);
    // Đọc hết rồi mới ghi để trình duyệt không phải tính lại bố cục nhiều lần
    var skyT = skies.map(function (s) {
      if (s.page) return y / max;
      var r = s.el.getBoundingClientRect(); return clamp((vh - r.top) / (vh + r.height), 0, 1);
    });
    var lr = layerSets.map(function (s) { return s.el.getBoundingClientRect(); });
    var sr = scenes.map(function (s) { return s.el.getBoundingClientRect(); });
    skies.forEach(function (s, i) {
      safe('sky', function () {
        var t = skyT[i], n = s.stages.length - 1, f = n ? t * n : 0, k = Math.min(Math.floor(f), Math.max(0, n - 1)), u = n ? f - k : 0;
        var a = s.stages[k], b = s.stages[Math.min(k + 1, n)];
        var top = mix(a[0], b[0], u), bot = mix(a[1], b[1], u);
        s.el.style.backgroundImage = 'linear-gradient(180deg,' + rgb(top) + ',' + rgb(bot) + ')';
        s.el.style.backgroundAttachment = s.page ? 'fixed' : '';
        s.el.style.setProperty('--sky-t', t.toFixed(4));
        s.el.style.setProperty('--sky-top', rgb(top));
        s.el.style.setProperty('--sky-bottom', rgb(bot));
      });
    });
    if (!reduce) layerSets.forEach(function (s, i) {
      safe('layers', function () {
        var r = lr[i];
        if (r.bottom < -100 || r.top > vh + 100) return;
        var off = (r.top + r.height / 2 - vh / 2) * (coarse ? 0.5 : 1);
        s.items.forEach(function (it) { it.style.transform = 'translate3d(0,' + (off * -num(it.getAttribute('data-depth'), 0.2)).toFixed(1) + 'px,0)'; });
      });
    });
    scenes.forEach(function (s, i) {
      safe('scene', function () {
        var r = sr[i], p = clamp(-r.top / Math.max(1, r.height - vh), 0, 1);
        s.el.style.setProperty('--sp', p.toFixed(4));
        s.steps.forEach(function (st) { st.el.classList.toggle('is-active', p >= st.a && (p < st.b || (st.b >= 1 && p >= 1))); });
      });
    });
  }

  // ---------- Khởi tạo ----------
  var HANDLERS = [
    ['data-particles', particles], ['data-clouds', clouds], ['data-float', float], ['data-gradient-shift', gradientShift],
    ['data-sky', sky], ['data-layers', layers], ['data-scene', scene],
  ];
  function refresh(root) {
    root = root || document;
    HANDLERS.forEach(function (h) {
      var list = Array.prototype.slice.call(root.querySelectorAll('[' + h[0] + ']'));
      if (root.nodeType === 1 && root.hasAttribute(h[0])) list.unshift(root);
      list.forEach(function (el) {
        var key = h[0];
        if (el['_atmos_' + key]) return;
        el['_atmos_' + key] = true;
        safe(key, function () { h[1](el); });
      });
    });
    onScroll();
  }
  function start() {
    refresh(document);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  window.Atmos = { refresh: refresh, reduce: reduce };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
