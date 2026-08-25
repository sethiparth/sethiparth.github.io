/* ==========================================================================
   Parth Sethi, v2 portfolio
   Nav, count-up stats, scroll reveals, and the scroll-pinned experience
   timeline. Every enhancement here is progressive: the DOM already shows
   correct final content (real numbers, all copy, all chapters expanded in
   the static flow), and JS only layers motion on top when it's safe to.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
     Mobile nav toggle
     --------------------------------------------------------------------- */
  (function navToggle() {
    var btn = document.getElementById("navToggle");
    var menu = document.getElementById("navMobile");
    if (!btn || !menu) return;
    btn.addEventListener("click", function () {
      var open = menu.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  })();

  /* ---------------------------------------------------------------------
     Count-up stats. The HTML already contains the real final value; this
     only replaces it with an animated version once the tile scrolls into
     view. If IntersectionObserver or rAF are unavailable, the real value
     set at build time simply stays put; it never shows a "0" state.
     --------------------------------------------------------------------- */
  (function countUp() {
    var nodes = document.querySelectorAll("[data-count-target]");
    if (!nodes.length) return;

    function format(el, value) {
      var decimals = parseInt(el.getAttribute("data-count-decimals") || "0", 10);
      var prefix = el.getAttribute("data-count-prefix") || "";
      var suffix = el.getAttribute("data-count-suffix") || "";
      return prefix + value.toFixed(decimals) + suffix;
    }

    function animate(el) {
      var target = parseFloat(el.getAttribute("data-count-target"));
      if (reduceMotion || isNaN(target)) { el.textContent = format(el, target); return; }
      var duration = 1300;
      var start = null;
      function tick(ts) {
        if (start === null) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = format(el, target * eased);
        if (progress < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    }

    if (!("IntersectionObserver" in window)) return; /* real value already in markup */

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animate(entry.target); io.unobserve(entry.target); }
      });
    }, { threshold: 0.5 });

    nodes.forEach(function (el) { io.observe(el); });
  })();

  /* ---------------------------------------------------------------------
     Generic reveal-on-scroll for cards (.reveal). Adds a class enabling
     the CSS transition; degrades to fully visible with no JS or on
     reduced motion (see .js-reveal gate in CSS).
     --------------------------------------------------------------------- */
  (function reveals() {
    var items = document.querySelectorAll(".reveal");
    if (!items.length || reduceMotion || !("IntersectionObserver" in window)) return;
    document.documentElement.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var delay = parseInt(entry.target.getAttribute("data-reveal-delay") || "0", 10);
          setTimeout(function () { entry.target.classList.add("is-visible"); }, delay);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });

    /* Safety net: if the observer ever fails to fire (odd layout, background
       tab throttling, restored bfcache), never leave content stranded at
       opacity:0. Force everything visible after a few seconds. */
    setTimeout(function () {
      items.forEach(function (el) {
        if (!el.classList.contains("is-visible")) {
          el.classList.add("is-visible");
          io.unobserve(el);
        }
      });
    }, 3000);
  })();

  /* ---------------------------------------------------------------------
     Academic archive accordion (native <details>, JS only rotates the
     chevron via a class; the disclosure itself works with zero JS).
     --------------------------------------------------------------------- */
  (function archive() {
    var items = document.querySelectorAll(".archive-item");
    items.forEach(function (el) {
      el.addEventListener("toggle", function () {
        el.classList.toggle("is-open", el.open);
      });
    });
  })();

  /* ---------------------------------------------------------------------
     Experience timeline: scroll-pinned crossfade on desktop via GSAP +
     ScrollTrigger. Below 900px, on reduced motion, or if GSAP failed to
     load from the CDN, the section simply stays in its default static
     flow (defined in CSS) with every chapter fully visible and stacked.
     --------------------------------------------------------------------- */
  /* Inject the GSAP + ScrollTrigger bundles on demand, in order. Only called
     when the pinned timeline will actually run, so mobile and reduced-motion
     visitors never download the library. If either CDN request fails, the
     callback still runs and setupPin() bails to the static CSS fallback. */
  function loadGsap(done) {
    if (window.gsap && window.ScrollTrigger) { done(); return; }
    var base = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/";
    function inject(src, next) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = next;
      s.onerror = next;
      document.head.appendChild(s);
    }
    inject(base + "gsap.min.js", function () {
      inject(base + "ScrollTrigger.min.js", done);
    });
  }

  (function timeline() {
    var stage = document.querySelector("[data-timeline]");
    if (!stage) return;

    var chapters = Array.prototype.slice.call(stage.querySelectorAll(".chapter"));
    var nodes = Array.prototype.slice.call(stage.querySelectorAll(".timeline-node"));
    var fill = stage.querySelector("[data-rail-fill]");
    if (!chapters.length) return;

    var wideEnough = window.matchMedia("(min-width: 900px)").matches;
    if (!wideEnough || reduceMotion) return; /* static CSS fallback renders correctly */

    loadGsap(function setupPin() {
    if (!(window.gsap && window.ScrollTrigger)) return; /* CDN failed: keep static fallback */

    window.gsap.registerPlugin(window.ScrollTrigger);
    stage.classList.add("timeline-pinned");

    chapters.forEach(function (ch, i) {
      ch.style.opacity = i === 0 ? "1" : "0";
      ch.style.transform = i === 0 ? "translateY(0)" : "translateY(24px)";
      ch.style.pointerEvents = i === 0 ? "auto" : "none";
    });
    if (nodes[0]) nodes[0].classList.add("is-active");

    var trigger = window.ScrollTrigger.create({
      trigger: stage,
      start: "top top+=60",
      end: "+=" + Math.round(window.innerHeight * chapters.length * 0.9),
      pin: true,
      pinSpacing: true,
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        var n = chapters.length;
        var raw = p * (n - 1);

        chapters.forEach(function (ch, i) {
          var d = Math.abs(raw - i);
          var f = Math.max(0, 1 - d);
          ch.style.opacity = f.toFixed(3);
          ch.style.transform = "translateY(" + ((1 - f) * 24).toFixed(1) + "px)";
          ch.style.pointerEvents = f > 0.5 ? "auto" : "none";
        });

        var activeIdx = Math.round(raw);
        nodes.forEach(function (nd, i) { nd.classList.toggle("is-active", i === activeIdx); });

        if (fill) fill.style.height = (p * 100).toFixed(2) + "%";
      }
    });

    window.addEventListener("resize", function () {
      if (window.ScrollTrigger) window.ScrollTrigger.refresh();
    });

    /* Re-check on orientation/viewport crossing the 900px breakpoint isn't
       handled live (a reload covers it); this keeps the pin math simple
       and avoids fighting ScrollTrigger mid-scroll. */
    });
  })();
})();
