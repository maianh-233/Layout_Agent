/* Sinh tự động bởi SRS & Prototype Builder — thành phần tương tác cho landing page. Không sửa tay.
 * Nạp trong <head> (không defer) để style có trước khi trang hiện, tránh menu mobile nháy lên lúc tải.
 * JS thuần, chạy được khi mở bằng file://. Gắn thuộc tính data-* vào HTML; trạng thái bằng class is-open / is-active
 * (style bằng Tailwind: [&.is-active]:bg-primary-600 …). Màu nhấn: đặt --ui-accent trong :root (mặc định #111).
 *
 *  Điều hướng
 *   data-menu-toggle="#menu"            nút mở / đóng menu mobile; phần tử #menu có data-menu (trượt + mờ nền, khóa cuộn, Esc / bấm link để đóng)
 *   data-scrollspy                      trên <nav>: link a[href^="#"] của section đang xem có class is-active + aria-current
 *   data-back-to-top                    nút về đầu trang, tự hiện khi cuộn quá 600px
 *
 *  Nội dung
 *   data-tabs                           khối cha; nút [data-tab="x"], nội dung [data-tab-panel="x"]; [data-tab-indicator] = vạch trượt dưới tab đang chọn
 *   data-accordion="single|multi"       khối cha; mỗi mục [data-acc-item] (thêm data-open để mở sẵn) gồm [data-acc-trigger] + [data-acc-panel]
 *   data-switch="monthly"               khối cha (giá trị = trạng thái mặc định); nút [data-switch-to="yearly"]; phần tử [data-show-when="yearly"] chỉ hiện ở trạng thái đó
 *   data-filter-group                   khối cha; nút [data-filter="all|cat"], mục [data-category="cat1 cat2"]
 *   data-carousel (data-autoplay="5000") khối cha; [data-carousel-track] chứa các slide; [data-carousel-prev] [data-carousel-next] [data-carousel-dots]
 *   data-compare                        khung chứa đúng 2 ảnh: ảnh trước, ảnh sau — kéo thanh giữa để so sánh
 *   data-countdown="2026-12-31T20:00"   đếm ngược; con [data-cd="d|h|m|s"] nhận số
 *
 *  Lớp phủ
 *   data-lightbox="nhom"                trên <a href="ảnh lớn"> hoặc <img>; cùng nhóm thì có nút trước / sau, phím ← →, vuốt
 *   data-modal-open="id"                mở <dialog id="id"> (showModal); [data-modal-close] / bấm nền / Esc để đóng (có chuyển động); UI.closeModal(dialog)
 *   data-copy="0901 234 567"            bấm để sao chép, hiện thông báo
 *   UI.toast("Message", "success|error|info")
 *
 *  Form
 *   <form data-form="dat-lich">
 *     kiểm tra required / type=email / type=tel / minlength / pattern, báo lỗi theo <html lang> (en / vi / zh / ja) dưới từng trường,
 *     nút có trạng thái đang kiểm tra, lưu localStorage, hiện thông báo BẢN DEMO (không có backend nên không báo "đã gửi");
 *     có [data-form-success] trong form thì thay form bằng khối đó (nội dung khối phải nói rõ là bản demo).
 */
(function () {
  if (window.UI) return;
  var doc = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var EASE = 'cubic-bezier(.16,1,.3,1)';
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function once(el, key) {
    var k = 'ui' + key;
    if (el.dataset[k]) return false;
    el.dataset[k] = '1';
    return true;
  }

  var css =
    ':root{--ui-accent:#111}' +
    'html.ui-ready [data-menu]{transition:opacity .35s ' + EASE + ',transform .45s ' + EASE + ',visibility .45s}' +
    '[data-menu]:not(.is-open){opacity:0;visibility:hidden;transform:translateY(-12px);pointer-events:none}' +
    'html.ui-ready [data-menu] a,html.ui-ready [data-menu] button{transition:opacity .4s ' + EASE + ',transform .6s ' + EASE + ',color .3s,background-color .3s,border-color .3s}' +
    'html.ui-ready [data-menu].is-open a,html.ui-ready [data-menu].is-open button{transition-delay:var(--ui-d,0ms),var(--ui-d,0ms),0s,0s,0s}' +
    '[data-menu]:not(.is-open) a,[data-menu]:not(.is-open) button{opacity:0;transform:translateY(10px)}' +
    '.ui-scrim{position:fixed;inset:0;z-index:40;background:rgba(10,10,10,.45);backdrop-filter:blur(2px);opacity:0;transition:opacity .35s;pointer-events:none}' +
    '.ui-scrim.is-open{opacity:1;pointer-events:auto}' +
    'html.ui-lock{overflow:hidden}' +
    '[data-back-to-top]{transition:opacity .3s,transform .4s ' + EASE + '}' +
    '[data-back-to-top]:not(.is-visible){opacity:0;transform:translateY(16px);pointer-events:none}' +
    '[data-tabs]{position:relative}' +
    // Class Tailwind (flex, grid…) thắng thuộc tính hidden → ép ẩn
    '[data-tab-panel][hidden],[data-show-when][hidden],form[data-form] [hidden],.ui-lb button[hidden]{display:none!important}' +
    '[data-tab-panel].is-active{animation:ui-fade .45s ' + EASE + '}' +
    '[data-tab-indicator]{position:absolute;left:0;transition:transform .45s ' + EASE + ',width .45s ' + EASE + '}' +
    '@keyframes ui-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}' +
    '[data-acc-panel]{overflow:hidden;transition:height .45s ' + EASE + '}' +
    '[data-acc-item]:not(.is-open) [data-acc-panel]{height:0}' +
    '[data-acc-panel]>*{transition:opacity .4s ease,transform .5s ' + EASE + '}' +
    '[data-acc-item].is-open [data-acc-panel]>*{transition-delay:.08s}' +
    '[data-acc-item]:not(.is-open) [data-acc-panel]>*{opacity:0;transform:translateY(-6px)}' +
    '[data-acc-trigger]{cursor:pointer}' +
    '[data-acc-icon]{transition:transform .4s ' + EASE + '}[data-acc-item].is-open [data-acc-icon]{transform:rotate(45deg)}' +
    '[data-switch] [data-show-when]{animation:ui-fade .4s ' + EASE + '}' +
    '[data-category]{transition:opacity .35s,transform .45s ' + EASE + '}' +
    '[data-category].is-out{opacity:0;transform:scale(.96)}' +
    '[data-category].is-gone{display:none}' +
    '[data-carousel-track]{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;scrollbar-width:none;-webkit-overflow-scrolling:touch}' +
    '[data-carousel-track]::-webkit-scrollbar{display:none}' +
    '[data-carousel-track]>*{scroll-snap-align:start;flex-shrink:0}' +
    '[data-carousel-dots]{display:flex;gap:8px;align-items:center}' +
    '.ui-dot{width:8px;height:8px;border-radius:999px;background:currentColor;opacity:.3;transition:width .4s ' + EASE + ',opacity .3s;border:0;padding:0;cursor:pointer}' +
    '.ui-dot.is-active{width:28px;opacity:1}' +
    '[data-carousel-prev]:disabled,[data-carousel-next]:disabled{opacity:.35;cursor:default}' +
    '[data-compare]{position:relative;overflow:hidden;user-select:none;touch-action:pan-y}' +
    '[data-compare]>img{display:block;width:100%;height:100%;object-fit:cover}' +
    '[data-compare]>img:nth-of-type(2){position:absolute;inset:0;clip-path:inset(0 0 0 var(--pos,50%))}' +
    '.ui-compare-line{position:absolute;top:0;bottom:0;left:var(--pos,50%);width:2px;margin-left:-1px;background:#fff;box-shadow:0 0 0 1px rgba(0,0,0,.08);pointer-events:none}' +
    '.ui-compare-knob{position:absolute;top:50%;left:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:999px;background:#fff;box-shadow:0 6px 24px rgba(0,0,0,.25);display:grid;place-items:center;color:#111;font:600 14px/1 system-ui}' +
    '.ui-compare-range{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:ew-resize;margin:0}' +
    '.ui-compare-tag{position:absolute;top:12px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55);color:#fff;font:600 12px/1.4 system-ui;pointer-events:none}' +
    '.ui-lb{position:fixed;inset:0;z-index:9990;display:grid;place-items:center;background:rgba(8,8,8,.92);opacity:0;transition:opacity .3s}' +
    '.ui-lb.is-open{opacity:1}' +
    '.ui-lb img{max-width:min(92vw,1400px);max-height:82vh;object-fit:contain;border-radius:6px;transition:opacity .25s,transform .4s ' + EASE + '}' +
    '.ui-lb.is-loading img{opacity:0;transform:scale(.97)}' +
    '.ui-lb figcaption{margin-top:12px;color:#ddd;font:14px/1.5 system-ui;text-align:center}' +
    '.ui-lb button{position:absolute;width:48px;height:48px;border-radius:999px;border:0;background:rgba(255,255,255,.12);color:#fff;font:24px/1 system-ui;cursor:pointer;transition:background .2s}' +
    '.ui-lb button:hover{background:rgba(255,255,255,.24)}' +
    '.ui-lb-close{top:16px;right:16px}.ui-lb-prev{left:16px;top:50%;margin-top:-24px}.ui-lb-next{right:16px;top:50%;margin-top:-24px}' +
    '.ui-lb-count{position:absolute;top:28px;left:24px;color:#bbb;font:13px/1 system-ui}' +
    'dialog[data-ui-modal]{border:0;padding:0;max-width:min(92vw,560px);width:100%;border-radius:16px;box-shadow:0 30px 80px rgba(0,0,0,.3)}' +
    'dialog[data-ui-modal][open]{animation:ui-pop .5s ' + EASE + '}' +
    'dialog[data-ui-modal]::backdrop{background:rgba(10,10,10,.5);backdrop-filter:blur(3px)}' +
    'dialog[data-ui-modal][open]::backdrop{animation:ui-fade-in .4s ease}' +
    'dialog[data-ui-modal].is-closing{animation:ui-pop-out .26s cubic-bezier(.4,0,1,1) forwards}' +
    'dialog[data-ui-modal].is-closing::backdrop{animation:ui-fade-out .26s ease forwards}' +
    '@keyframes ui-pop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}' +
    '@keyframes ui-pop-out{to{opacity:0;transform:translateY(8px) scale(.98)}}' +
    '@keyframes ui-fade-in{from{opacity:0}}@keyframes ui-fade-out{to{opacity:0}}' +
    '.ui-toasts{position:fixed;z-index:9995;left:50%;bottom:24px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;pointer-events:none;width:max-content;max-width:92vw}' +
    '.ui-toast{pointer-events:auto;display:flex;gap:10px;align-items:center;padding:12px 18px;border-radius:12px;background:#111;color:#fff;font:500 14px/1.45 system-ui,sans-serif;box-shadow:0 12px 32px rgba(0,0,0,.25);animation:ui-toast .45s ' + EASE + '}' +
    '.ui-toast::before{content:"";width:8px;height:8px;border-radius:999px;background:#9ca3af;flex-shrink:0}' +
    '.ui-toast.success::before{background:#22c55e}.ui-toast.error::before{background:#ef4444}' +
    '.ui-toast.is-leaving{opacity:0;transform:translateY(8px);transition:opacity .3s,transform .3s ' + EASE + '}' +
    '@keyframes ui-toast{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}' +
    '.ui-error{margin-top:6px;color:#dc2626;font-size:13px;line-height:1.4;animation:ui-fade .3s}' +
    '[aria-invalid="true"]{border-color:#dc2626!important;box-shadow:0 0 0 3px rgba(220,38,38,.12)!important}' +
    '.ui-spin{display:inline-block;width:1em;height:1em;margin-right:8px;vertical-align:-2px;border:2px solid currentColor;border-right-color:transparent;border-radius:999px;animation:ui-spin .7s linear infinite}' +
    '@keyframes ui-spin{to{transform:rotate(360deg)}}' +
    '[data-form-success]{animation:ui-fade .5s ' + EASE + '}' +
    '@media (prefers-reduced-motion: reduce){[data-menu],[data-menu] a,[data-menu] button,[data-acc-panel],[data-acc-panel]>*,[data-category],.ui-lb,.ui-lb img{transition:none!important}' +
    '[data-tab-panel].is-active,dialog[data-ui-modal][open],dialog[data-ui-modal][open]::backdrop,.ui-toast{animation:none!important}}';

  var style = document.createElement('style');
  style.id = 'ui-css';
  style.textContent = css;
  (document.head || doc).appendChild(style);

  // ---------- Thông báo ----------
  var toastBox;
  function toast(msg, type) {
    if (!toastBox) {
      toastBox = document.createElement('div');
      toastBox.className = 'ui-toasts';
      toastBox.setAttribute('role', 'status');
      toastBox.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastBox);
    }
    var t = document.createElement('div');
    t.className = 'ui-toast ' + (type || 'info');
    t.textContent = msg;
    toastBox.appendChild(t);
    setTimeout(function () {
      t.classList.add('is-leaving');
      setTimeout(function () { t.remove(); }, 320);
    }, 3600);
  }

  // ---------- Khóa cuộn khi mở lớp phủ ----------
  var locks = 0;
  function lock(on) {
    locks = Math.max(0, locks + (on ? 1 : -1));
    doc.classList.toggle('ui-lock', locks > 0);
  }

  // ---------- Menu mobile ----------
  var scrim;
  function menuToggle(btn) {
    if (!once(btn, 'Menu')) return;
    var target = document.querySelector(btn.getAttribute('data-menu-toggle'));
    if (!target) return;
    target.setAttribute('data-menu', '');
    $$('a,button', target).forEach(function (el, i) { el.style.setProperty('--ui-d', Math.min(60 + i * 45, 420) + 'ms'); });
    btn.setAttribute('aria-expanded', 'false');
    if (target.id) btn.setAttribute('aria-controls', target.id);
    var set = function (open) {
      if (target.classList.contains('is-open') === open) return;
      target.classList.toggle('is-open', open);
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      if (!scrim) {
        scrim = document.createElement('div');
        scrim.className = 'ui-scrim';
        document.body.appendChild(scrim);
      }
      scrim.classList.toggle('is-open', open);
      scrim.onclick = function () { set(false); };
      lock(open);
    };
    btn.addEventListener('click', function () { set(!target.classList.contains('is-open')); });
    target.addEventListener('click', function (e) { if (e.target.closest('a')) set(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
    window.addEventListener('resize', function () { if (getComputedStyle(btn).display === 'none') set(false); });
  }

  // ---------- Scrollspy & về đầu trang ----------
  function scrollspy(nav) {
    if (!once(nav, 'Spy') || !('IntersectionObserver' in window)) return;
    var links = $$('a[href^="#"]', nav).filter(function (a) { return a.getAttribute('href').length > 1; });
    var map = {};
    links.forEach(function (a) {
      var s = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (s) (map[s.id] = map[s.id] || []).push(a);
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); a.removeAttribute('aria-current'); });
        (map[e.target.id] || []).forEach(function (a) { a.classList.add('is-active'); a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  var tops = [];
  function backToTop(btn) {
    if (!once(btn, 'Top')) return;
    tops.push(btn);
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    });
  }
  window.addEventListener('scroll', function () {
    var on = window.scrollY > 600;
    tops.forEach(function (b) { b.classList.toggle('is-visible', on); });
  }, { passive: true });

  // ---------- Tabs ----------
  function tabs(root) {
    if (!once(root, 'Tabs')) return;
    var btns = $$('[data-tab]', root).filter(function (b) { return b.closest('[data-tabs]') === root; });
    var panels = $$('[data-tab-panel]', root).filter(function (p) { return p.closest('[data-tabs]') === root; });
    var ind = root.querySelector('[data-tab-indicator]');
    if (!btns.length) return;
    var list = btns[0].parentElement;
    list.setAttribute('role', 'tablist');
    var select = function (key, focus) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-tab') === key;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        if (on && focus) b.focus();
        if (on && ind) {
          ind.style.width = b.offsetWidth + 'px';
          ind.style.transform = 'translateX(' + (b.offsetLeft) + 'px)';
        }
      });
      panels.forEach(function (p) {
        var on = p.getAttribute('data-tab-panel') === key;
        p.hidden = !on;
        p.classList.toggle('is-active', on);
      });
    };
    btns.forEach(function (b, i) {
      b.setAttribute('role', 'tab');
      b.addEventListener('click', function () { select(b.getAttribute('data-tab')); });
      b.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (d) select(btns[(i + d + btns.length) % btns.length].getAttribute('data-tab'), true);
      });
    });
    panels.forEach(function (p) { p.setAttribute('role', 'tabpanel'); });
    var first = btns.filter(function (b) { return b.classList.contains('is-active'); })[0] || btns[0];
    select(first.getAttribute('data-tab'));
    window.addEventListener('resize', function () {
      var cur = btns.filter(function (b) { return b.classList.contains('is-active'); })[0];
      if (cur) select(cur.getAttribute('data-tab'));
    });
  }

  // ---------- Accordion ----------
  function accordion(root) {
    if (!once(root, 'Acc')) return;
    var single = root.getAttribute('data-accordion') !== 'multi';
    var items = $$('[data-acc-item]', root);
    var set = function (item, open) {
      var panel = item.querySelector('[data-acc-panel]');
      var trig = item.querySelector('[data-acc-trigger]');
      if (!panel || item.classList.contains('is-open') === open) return;
      if (trig) trig.setAttribute('aria-expanded', String(open));
      if (open) {
        item.classList.add('is-open');
        panel.style.height = '0px';
        requestAnimationFrame(function () { panel.style.height = panel.scrollHeight + 'px'; });
      } else {
        panel.style.height = panel.scrollHeight + 'px';
        void panel.offsetHeight; // ghi nhận chiều cao px trước, nếu không trình duyệt nhảy thẳng từ auto về 0
        item.classList.remove('is-open');
        panel.style.height = '0px';
      }
    };
    items.forEach(function (item, i) {
      var trig = item.querySelector('[data-acc-trigger]');
      var panel = item.querySelector('[data-acc-panel]');
      if (!trig || !panel) return;
      if (!panel.id) panel.id = 'acc-' + Math.random().toString(36).slice(2, 8);
      trig.setAttribute('aria-controls', panel.id);
      trig.setAttribute('aria-expanded', 'false');
      if (trig.tagName !== 'BUTTON') { trig.setAttribute('role', 'button'); trig.tabIndex = 0; }
      panel.addEventListener('transitionend', function (e) {
        // Chỉ khi chính chiều cao của panel chạy xong (transition của nội dung bên trong cũng nổi bọt lên đây)
        if (e.target === panel && e.propertyName === 'height' && item.classList.contains('is-open')) panel.style.height = 'auto';
      });
      var toggle = function () {
        var open = !item.classList.contains('is-open');
        if (open && single) items.forEach(function (o) { if (o !== item) set(o, false); });
        set(item, open);
      };
      trig.addEventListener('click', toggle);
      trig.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && trig.tagName !== 'BUTTON') { e.preventDefault(); toggle(); } });
      if (item.hasAttribute('data-open')) {
        item.classList.add('is-open');
        trig.setAttribute('aria-expanded', 'true');
        panel.style.height = 'auto';
      }
    });
  }

  // ---------- Công tắc trạng thái (giá tháng / năm…) ----------
  function switcher(root) {
    if (!once(root, 'Switch')) return;
    var set = function (state) {
      root.setAttribute('data-state', state);
      $$('[data-switch-to]', root).forEach(function (b) {
        var on = b.getAttribute('data-switch-to') === state;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      $$('[data-show-when]', root).forEach(function (el) { el.hidden = el.getAttribute('data-show-when') !== state; });
    };
    $$('[data-switch-to]', root).forEach(function (b) {
      b.addEventListener('click', function () { set(b.getAttribute('data-switch-to')); });
    });
    set(root.getAttribute('data-switch') || ($$('[data-switch-to]', root)[0] || { getAttribute: function () { return ''; } }).getAttribute('data-switch-to'));
  }

  // ---------- Lọc lưới ----------
  function filterGroup(root) {
    if (!once(root, 'Filter')) return;
    var btns = $$('[data-filter]', root);
    var items = $$('[data-category]', root);
    var apply = function (cat) {
      btns.forEach(function (b) {
        var on = b.getAttribute('data-filter') === cat;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      items.forEach(function (it) {
        var show = cat === 'all' || (' ' + it.getAttribute('data-category') + ' ').indexOf(' ' + cat + ' ') >= 0;
        if (show) {
          it.classList.remove('is-gone');
          requestAnimationFrame(function () { it.classList.remove('is-out'); });
        } else {
          it.classList.add('is-out');
          setTimeout(function () { if (it.classList.contains('is-out')) it.classList.add('is-gone'); }, reduce ? 0 : 320);
        }
      });
    };
    btns.forEach(function (b) { b.addEventListener('click', function () { apply(b.getAttribute('data-filter')); }); });
    var first = btns.filter(function (b) { return b.classList.contains('is-active'); })[0] || btns[0];
    if (first) apply(first.getAttribute('data-filter'));
  }

  // ---------- Carousel ----------
  function carousel(root) {
    if (!once(root, 'Carousel')) return;
    var track = root.querySelector('[data-carousel-track]');
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    var prev = root.querySelector('[data-carousel-prev]');
    var next = root.querySelector('[data-carousel-next]');
    var dotsBox = root.querySelector('[data-carousel-dots]');
    track.setAttribute('tabindex', '0');
    track.setAttribute('aria-roledescription', 'carousel');
    var step = function () { return slides[1] ? slides[1].offsetLeft - slides[0].offsetLeft : track.clientWidth; };
    var pages = function () { return Math.max(1, Math.round((track.scrollWidth - track.clientWidth) / step()) + 1); };
    var index = function () { return Math.round(track.scrollLeft / step()); };
    var go = function (i) {
      var n = pages();
      if (i < 0) i = n - 1;
      if (i >= n) i = 0;
      track.scrollTo({ left: i * step(), behavior: reduce ? 'auto' : 'smooth' });
    };
    var dots = [];
    var buildDots = function () {
      if (!dotsBox) return;
      dotsBox.innerHTML = '';
      dots = [];
      for (var i = 0; i < pages(); i++) {
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'ui-dot';
        d.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        (function (k) { d.addEventListener('click', function () { go(k); }); })(i);
        dotsBox.appendChild(d);
        dots.push(d);
      }
    };
    var sync = function () {
      var i = index();
      var n = pages();
      dots.forEach(function (d, k) { d.classList.toggle('is-active', k === i); });
      if (!root.hasAttribute('data-autoplay')) {
        if (prev) prev.disabled = track.scrollLeft < 4;
        if (next) next.disabled = track.scrollLeft > track.scrollWidth - track.clientWidth - 4 || n <= 1;
      }
    };
    if (prev) prev.addEventListener('click', function () { go(index() - 1); });
    if (next) next.addEventListener('click', function () { go(index() + 1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index() + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index() - 1); }
    });
    var t;
    track.addEventListener('scroll', function () { clearTimeout(t); t = setTimeout(sync, 60); }, { passive: true });
    window.addEventListener('resize', function () { buildDots(); sync(); });
    buildDots();
    sync();
    var ms = parseInt(root.getAttribute('data-autoplay'), 10);
    if (ms && !reduce) {
      var paused = false;
      var visible = true;
      root.addEventListener('pointerenter', function () { paused = true; });
      root.addEventListener('pointerleave', function () { paused = false; });
      root.addEventListener('focusin', function () { paused = true; });
      root.addEventListener('focusout', function () { paused = false; });
      if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(root);
      setInterval(function () { if (!paused && visible && !document.hidden) go(index() + 1); }, Math.max(2500, ms));
    }
  }

  // ---------- So sánh trước / sau ----------
  function compare(root) {
    if (!once(root, 'Compare')) return;
    var imgs = $$(':scope > img', root);
    if (imgs.length < 2) return;
    var line = document.createElement('div');
    line.className = 'ui-compare-line';
    line.innerHTML = '<div class="ui-compare-knob" aria-hidden="true">⇆</div>';
    var range = document.createElement('input');
    range.type = 'range';
    range.min = '0';
    range.max = '100';
    range.value = '50';
    range.className = 'ui-compare-range';
    range.setAttribute('aria-label', 'Drag to compare before and after');
    var tags = [root.getAttribute('data-before') || 'Before', root.getAttribute('data-after') || 'After'];
    tags.forEach(function (label, i) {
      var t = document.createElement('span');
      t.className = 'ui-compare-tag';
      t.style[i ? 'right' : 'left'] = '12px';
      t.textContent = label;
      root.appendChild(t);
    });
    root.appendChild(line);
    root.appendChild(range);
    var set = function (v) { root.style.setProperty('--pos', v + '%'); };
    range.addEventListener('input', function () { set(range.value); });
    set(50);
  }

  // ---------- Đếm ngược ----------
  var countdowns = [];
  function countdown(el) {
    if (!once(el, 'Cd')) return;
    var end = new Date(el.getAttribute('data-countdown')).getTime();
    if (isNaN(end)) return;
    countdowns.push({ el: el, end: end });
  }
  function tickCountdowns() {
    var now = Date.now();
    countdowns.forEach(function (c) {
      var s = Math.max(0, Math.floor((c.end - now) / 1000));
      var v = { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
      $$('[data-cd]', c.el).forEach(function (n) {
        var k = n.getAttribute('data-cd');
        var txt = k === 'd' ? String(v.d) : String(v[k]).padStart(2, '0');
        if (n.textContent !== txt) n.textContent = txt;
      });
    });
  }
  setInterval(tickCountdowns, 1000);

  // ---------- Lightbox ----------
  var lb;
  function openLightbox(group, start) {
    var list = $$('[data-lightbox="' + group + '"]').map(function (el) {
      var img = el.tagName === 'IMG' ? el : el.querySelector('img');
      return {
        src: el.getAttribute('href') || el.getAttribute('data-src') || (img && (img.currentSrc || img.src)),
        cap: el.getAttribute('data-caption') || (img && img.alt) || '',
      };
    });
    var i = start;
    if (!lb) {
      lb = document.createElement('div');
      lb.className = 'ui-lb';
      lb.setAttribute('role', 'dialog');
      lb.setAttribute('aria-modal', 'true');
      lb.innerHTML = '<span class="ui-lb-count"></span><figure style="margin:0;display:grid;justify-items:center"><img alt=""><figcaption></figcaption></figure>' +
        '<button class="ui-lb-close" aria-label="Close">×</button><button class="ui-lb-prev" aria-label="Previous image">‹</button><button class="ui-lb-next" aria-label="Next image">›</button>';
    }
    var img = lb.querySelector('img');
    var cap = lb.querySelector('figcaption');
    var count = lb.querySelector('.ui-lb-count');
    var show = function (k) {
      i = (k + list.length) % list.length;
      lb.classList.add('is-loading');
      img.onload = function () { lb.classList.remove('is-loading'); };
      img.src = list[i].src;
      img.alt = list[i].cap;
      cap.textContent = list[i].cap;
      count.textContent = list.length > 1 ? (i + 1) + ' / ' + list.length : '';
      lb.querySelector('.ui-lb-prev').hidden = lb.querySelector('.ui-lb-next').hidden = list.length < 2;
    };
    var last = document.activeElement;
    var close = function () {
      lb.classList.remove('is-open');
      document.removeEventListener('keydown', key);
      setTimeout(function () { lb.remove(); }, 300);
      lock(false);
      if (last && last.focus) last.focus();
    };
    var key = function (e) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') show(i + 1);
      if (e.key === 'ArrowLeft') show(i - 1);
    };
    lb.onclick = function (e) {
      if (e.target === lb || e.target.closest('.ui-lb-close')) close();
      else if (e.target.closest('.ui-lb-prev')) show(i - 1);
      else if (e.target.closest('.ui-lb-next')) show(i + 1);
    };
    var x0 = null;
    lb.ontouchstart = function (e) { x0 = e.touches[0].clientX; };
    lb.ontouchend = function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
      x0 = null;
    };
    document.addEventListener('keydown', key);
    document.body.appendChild(lb);
    lock(true);
    show(i);
    requestAnimationFrame(function () { lb.classList.add('is-open'); lb.querySelector('.ui-lb-close').focus(); });
  }
  function lightbox(el) {
    if (!once(el, 'Lb')) return;
    el.style.cursor = 'zoom-in';
    if (el.tagName === 'IMG') { el.tabIndex = 0; el.setAttribute('role', 'button'); }
    var open = function (e) {
      e.preventDefault();
      var g = el.getAttribute('data-lightbox');
      openLightbox(g, $$('[data-lightbox="' + g + '"]').indexOf(el));
    };
    el.addEventListener('click', open);
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter') open(e); });
  }

  // ---------- Modal ----------
  function closeModal(d) {
    if (!d.open || d.classList.contains('is-closing')) return;
    if (reduce) { d.close(); return; }
    d.classList.add('is-closing');
    setTimeout(function () { d.classList.remove('is-closing'); if (d.open) d.close(); }, 260);
  }
  function modalOpen(btn) {
    if (!once(btn, 'Modal')) return;
    btn.addEventListener('click', function (e) {
      var d = document.getElementById(btn.getAttribute('data-modal-open'));
      if (!d) return;
      e.preventDefault();
      if (d.tagName === 'DIALOG' && d.showModal) {
        d.setAttribute('data-ui-modal', '');
        if (!d.dataset.uiBound) {
          d.dataset.uiBound = '1';
          d.addEventListener('click', function (ev) {
            if (ev.target === d || ev.target.closest('[data-modal-close]')) closeModal(d);
          });
          d.addEventListener('cancel', function (ev) { ev.preventDefault(); closeModal(d); });
          d.addEventListener('close', function () { lock(false); });
        }
        d.showModal();
        lock(true);
      }
    });
  }

  // ---------- Sao chép ----------
  function copy(el) {
    if (!once(el, 'Copy')) return;
    el.addEventListener('click', function (e) {
      e.preventDefault();
      var v = el.getAttribute('data-copy');
      var done = function () { toast('Copied: ' + v, 'success'); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(v).then(done, fallback);
      else fallback();
      function fallback() {
        var ta = document.createElement('textarea');
        ta.value = v;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { toast('Could not copy', 'error'); }
        ta.remove();
      }
    });
  }

  // ---------- Form ----------
  // Thông báo theo <html lang> (en / vi / zh / ja). Form chưa có backend → không báo "đã gửi thành công".
  var LANG = (document.documentElement.getAttribute('lang') || 'en').slice(0, 2).toLowerCase();
  var I18N = {
    en: {
      required: 'Please fill in this field', choose: 'Please select an option', email: 'Please enter a valid email (e.g. name@example.com)',
      tel: 'Please enter a valid phone number', min: function (n) { return 'At least ' + n + ' characters required'; },
      pattern: 'Invalid format', check: 'Please check this box', sending: 'Checking…',
      demo: 'Demo form: your details look good, but nothing was sent — this website is not connected to a server yet.',
    },
    vi: {
      required: 'Vui lòng nhập thông tin này', choose: 'Vui lòng chọn một mục', email: 'Email chưa đúng định dạng (ví dụ ten@gmail.com)',
      tel: 'Số điện thoại chưa đúng (10 số, bắt đầu bằng 0)', min: function (n) { return 'Cần ít nhất ' + n + ' ký tự'; },
      pattern: 'Định dạng chưa đúng', check: 'Vui lòng đánh dấu ô này', sending: 'Đang kiểm tra…',
      demo: 'Form bản demo: thông tin hợp lệ nhưng chưa được gửi đi — website chưa kết nối máy chủ.',
    },
    zh: {
      required: '请填写此项', choose: '请选择一项', email: '请输入有效的电子邮箱', tel: '请输入有效的电话号码',
      min: function (n) { return '至少需要 ' + n + ' 个字符'; }, pattern: '格式不正确', check: '请勾选此项', sending: '正在检查…',
      demo: '演示表单：信息格式正确，但尚未发送——本网站尚未连接服务器。',
    },
    ja: {
      required: 'この項目を入力してください', choose: '項目を選択してください', email: '有効なメールアドレスを入力してください', tel: '有効な電話番号を入力してください',
      min: function (n) { return n + '文字以上で入力してください'; }, pattern: '形式が正しくありません', check: 'チェックを入れてください', sending: '確認中…',
      demo: 'デモフォームです：入力内容は有効ですが、送信はされていません（サーバー未接続）。',
    },
  };
  var MSG = I18N[LANG] || I18N.en;
  function fieldError(f) {
    var v = (f.value || '').trim();
    if (f.type === 'checkbox') return f.required && !f.checked ? MSG.check : '';
    if (f.required && !v) return f.tagName === 'SELECT' ? MSG.choose : MSG.required;
    if (!v) return '';
    if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return MSG.email;
    var tel = v.replace(/[\s().-]/g, '');
    if (f.type === 'tel' && !(LANG === 'vi' ? /^(\+?84|0)(3|5|7|8|9)\d{8}$/ : /^\+?\d{7,15}$/).test(tel)) return MSG.tel;
    if (f.minLength > 0 && v.length < f.minLength) return MSG.min(f.minLength);
    if (f.pattern && !new RegExp('^(?:' + f.pattern + ')$').test(v)) return f.title || MSG.pattern;
    return '';
  }
  function showError(f, msg) {
    var holder = f.closest('label') && f.type !== 'checkbox' ? f.closest('label') : f.parentElement;
    var p = holder.querySelector(':scope > .ui-error');
    if (!msg) {
      f.removeAttribute('aria-invalid');
      if (p) p.remove();
      return;
    }
    f.setAttribute('aria-invalid', 'true');
    if (!p) {
      p = document.createElement('p');
      p.className = 'ui-error';
      p.id = (f.id || f.name || 'f') + '-err';
      holder.appendChild(p);
      f.setAttribute('aria-describedby', p.id);
    }
    p.textContent = msg;
  }
  function form(el) {
    if (!once(el, 'Form')) return;
    el.noValidate = true;
    var fields = function () { return $$('input:not([type=hidden]):not([type=submit]),select,textarea', el); };
    fields().forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value) showError(f, fieldError(f)); });
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid')) showError(f, fieldError(f)); });
    });
    el.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields().forEach(function (f) {
        var m = fieldError(f);
        showError(f, m);
        if (m && !bad) bad = f;
      });
      if (bad) { bad.focus(); return; }
      var btn = el.querySelector('[type=submit],button:not([type=button])');
      var label = btn && btn.innerHTML;
      if (btn) { btn.disabled = true; btn.innerHTML = '<span class="ui-spin"></span>' + MSG.sending; }
      setTimeout(function () {
        var data = {};
        fields().forEach(function (f) { if (f.name) data[f.name] = f.type === 'checkbox' ? f.checked : f.value; });
        data.createdAt = new Date().toISOString();
        try {
          var key = 'form:' + (el.getAttribute('data-form') || 'lien-he');
          var list = JSON.parse(localStorage.getItem(key) || '[]');
          list.push(data);
          localStorage.setItem(key, JSON.stringify(list));
        } catch (err) { /* bỏ qua: trình duyệt chặn lưu */ }
        if (btn) { btn.disabled = false; btn.innerHTML = label; }
        var ok = el.querySelector('[data-form-success]');
        if (ok) {
          Array.prototype.forEach.call(el.children, function (c) { if (c !== ok) c.hidden = true; });
          ok.hidden = false;
        } else el.reset();
        // Không có backend: báo rõ là bản demo (data-success chỉ dùng cho câu báo demo riêng của trang)
        toast(el.getAttribute('data-success') || MSG.demo, 'info');
        var d = el.closest('dialog');
        if (d && d.open) setTimeout(function () { closeModal(d); }, 1200);
      }, reduce ? 200 : 900);
    });
    var ok = el.querySelector('[data-form-success]');
    if (ok) ok.hidden = true;
  }

  // ---------- Khởi tạo ----------
  var MAP = [
    ['[data-menu-toggle]', menuToggle], ['[data-scrollspy]', scrollspy], ['[data-back-to-top]', backToTop],
    ['[data-tabs]', tabs], ['[data-accordion]', accordion], ['[data-switch]', switcher], ['[data-filter-group]', filterGroup],
    ['[data-carousel]', carousel], ['[data-compare]', compare], ['[data-countdown]', countdown],
    ['[data-lightbox]', lightbox], ['[data-modal-open]', modalOpen], ['[data-copy]', copy], ['form[data-form]', form],
  ];
  function refresh(root) {
    MAP.forEach(function (m) { $$(m[0], root).forEach(m[1]); });
    tickCountdowns();
  }
  function init() {
    refresh();
    requestAnimationFrame(function () { requestAnimationFrame(function () { doc.classList.add('ui-ready'); }); });
    if ('MutationObserver' in window) {
      var t;
      new MutationObserver(function () { clearTimeout(t); t = setTimeout(function () { refresh(); }, 50); })
        .observe(document.body, { childList: true, subtree: true });
    }
  }
  window.UI = { refresh: refresh, toast: toast, closeModal: closeModal };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
