/* ==========================================================================
   Hero canvas: a small "distributed system" telemetry visual.
   Nodes = services, edges = links, moving dots = packets in flight.
   Cursor proximity brightens nearby nodes/edges (cyan), evoking a live
   message-flow surface (his 4M -> 40M emails/hour). Deliberately capped
   and paused when hidden/reduced-motion, so it stays cheap on any device.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("heroCanvas");
  if (!canvas || !canvas.getContext) return;

  var prefersReducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ctx = canvas.getContext("2d");
  var wrap = canvas.parentElement;

  var W = 0, H = 0, DPR = 1;
  var nodes = [];
  var packets = [];
  var mouse = { x: -9999, y: -9999, active: false };
  var running = false;
  var rafId = null;

  var ACCENT = "58, 231, 255";
  var MAX_NODES_DESKTOP = 42;
  var MAX_NODES_MOBILE = 22;
  var LINK_DIST_RATIO = 0.22; /* fraction of the shorter viewport side */
  var PROXIMITY_RADIUS = 160;

  function nodeCount() {
    return window.innerWidth < 720 ? MAX_NODES_MOBILE : MAX_NODES_DESKTOP;
  }

  function rand(min, max) { return min + Math.random() * (max - min); }

  function buildNodes() {
    var n = nodeCount();
    nodes = [];
    for (var i = 0; i < n; i++) {
      nodes.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: rand(-0.12, 0.12),
        vy: rand(-0.09, 0.09),
        r: rand(1.6, 3),
        pulse: Math.random() * Math.PI * 2,
        links: []
      });
    }
    computeLinks();
  }

  function computeLinks() {
    var maxDist = Math.min(W, H) * LINK_DIST_RATIO;
    for (var i = 0; i < nodes.length; i++) nodes[i].links = [];
    for (i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var a = nodes[i], b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        if (d < maxDist) {
          a.links.push(j);
          b.links.push(i);
        }
      }
    }
  }

  function maybeSpawnPacket() {
    if (packets.length > 26 || !nodes.length) return;
    if (Math.random() > 0.18) return;
    var from = Math.floor(Math.random() * nodes.length);
    var node = nodes[from];
    if (!node.links.length) return;
    var to = node.links[Math.floor(Math.random() * node.links.length)];
    packets.push({ from: from, to: to, t: 0, speed: rand(0.006, 0.016) });
  }

  function resize() {
    var rect = wrap.getBoundingClientRect();
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, rect.width);
    H = Math.max(1, rect.height);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildNodes();
  }

  function step() {
    ctx.clearRect(0, 0, W, H);

    /* drift + wrap */
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < -20) n.x = W + 20; else if (n.x > W + 20) n.x = -20;
      if (n.y < -20) n.y = H + 20; else if (n.y > H + 20) n.y = -20;
      n.pulse += 0.02;
    }

    /* edges */
    for (i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var k = 0; k < a.links.length; k++) {
        var j = a.links[k];
        if (j <= i) continue;
        var b = nodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var maxDist = Math.min(W, H) * LINK_DIST_RATIO;
        var baseAlpha = Math.max(0, 1 - dist / maxDist) * 0.16;

        var midx = (a.x + b.x) / 2, midy = (a.y + b.y) / 2;
        var md = mouse.active ? Math.hypot(mouse.x - midx, mouse.y - midy) : 9999;
        var boost = mouse.active ? Math.max(0, 1 - md / PROXIMITY_RADIUS) : 0;
        var alpha = Math.min(0.85, baseAlpha + boost * 0.55);

        ctx.strokeStyle = "rgba(" + ACCENT + ", " + alpha.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    /* nodes */
    for (i = 0; i < nodes.length; i++) {
      var nd = nodes[i];
      var dMouse = mouse.active ? Math.hypot(mouse.x - nd.x, mouse.y - nd.y) : 9999;
      var near = mouse.active ? Math.max(0, 1 - dMouse / PROXIMITY_RADIUS) : 0;
      var glow = 0.35 + Math.sin(nd.pulse) * 0.12 + near * 0.55;
      var radius = nd.r + near * 1.6;

      ctx.beginPath();
      ctx.fillStyle = "rgba(" + ACCENT + ", " + Math.min(1, glow).toFixed(3) + ")";
      ctx.arc(nd.x, nd.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (near > 0.25) {
        ctx.beginPath();
        ctx.strokeStyle = "rgba(" + ACCENT + ", " + (near * 0.4).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.arc(nd.x, nd.y, radius + 5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    /* packets */
    maybeSpawnPacket();
    for (i = packets.length - 1; i >= 0; i--) {
      var p = packets[i];
      p.t += p.speed;
      if (p.t >= 1 || !nodes[p.from] || !nodes[p.to]) { packets.splice(i, 1); continue; }
      var from = nodes[p.from], to = nodes[p.to];
      var px = from.x + (to.x - from.x) * p.t;
      var py = from.y + (to.y - from.y) * p.t;
      var fade = Math.sin(Math.PI * p.t);
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + ACCENT + ", " + (0.85 * fade).toFixed(3) + ")";
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    if (running) rafId = window.requestAnimationFrame(step);
  }

  function start() {
    if (running || prefersReducedMotion) return;
    running = true;
    rafId = window.requestAnimationFrame(step);
  }

  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  function drawStaticFrame() {
    /* Reduced-motion / no-JS fallback visual: one calm static frame. */
    ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i];
      for (var k = 0; k < a.links.length; k++) {
        var b = nodes[a.links[k]];
        ctx.strokeStyle = "rgba(" + ACCENT + ", 0.1)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + ACCENT + ", 0.4)";
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function onPointerMove(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }
  function onPointerLeave() { mouse.active = false; }

  var resizeTimer;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      if (prefersReducedMotion) drawStaticFrame();
    }, 150);
  }

  resize();

  if (prefersReducedMotion) {
    drawStaticFrame();
    return; /* no animation loop, no listeners: fully inert on reduced motion */
  }

  wrap.addEventListener("pointermove", onPointerMove, { passive: true });
  wrap.addEventListener("pointerleave", onPointerLeave, { passive: true });
  window.addEventListener("resize", onResize);

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) stop(); else start();
  });

  start();
})();
