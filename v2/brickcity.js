/* ==========================================================================
   Parth Sethi, v2 portfolio — Brick City hero
   A real-time 3D scene (Three.js r128, global THREE build, no bundler):
   builder minifigures snap bricks into a small brick city while a crane
   swings overhead. On load the camera eases in, the city assembles with a
   snap, and the front builder waves at the viewer; then it settles into a
   gentle ambient loop with subtle mouse parallax.

   Progressive enhancement: if the visitor prefers reduced motion or WebGL
   is unavailable, we never load Three.js — the hero shows a static CSS
   poster and all the real content below is untouched.
   ========================================================================== */
(function () {
  "use strict";

  var canvas = document.getElementById("heroCanvas");
  var hero = document.querySelector(".hero");
  if (!canvas || !hero) return;

  var reduceMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hasWebGL() {
    try {
      var c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) {
      return false;
    }
  }

  /* Reduced motion or no WebGL → static poster, no library download. */
  if (reduceMotion || !hasWebGL()) {
    hero.classList.add("hero--poster");
    canvas.style.display = "none";
    return;
  }

  /* Load Three.js r128 (last UMD/global build) on demand. */
  var THREE_URL = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  var s = document.createElement("script");
  s.src = THREE_URL;
  s.async = true;
  s.onload = function () { if (window.THREE) init(); else fail(); };
  s.onerror = fail;
  document.head.appendChild(s);

  function fail() {
    hero.classList.add("hero--poster");
    canvas.style.display = "none";
  }

  /* ---------------------------------------------------------------------- */
  function init() {
    var THREE = window.THREE;

    /* Palette — playful brick colors with the site's cyan accent woven in. */
    var COL = {
      red: 0xe3392f,
      yellow: 0xf5b70a,
      blue: 0x2f77e3,
      cyan: 0x3ae7ff,
      white: 0xeef2f5,
      green: 0x3fae5a,
      orange: 0xf07b25,
      skin: 0xffd21e,
      hat: 0x3ae7ff,
      plate: 0x101418,
      dark: 0x0a0d10
    };

    var W = canvas.clientWidth || hero.clientWidth;
    var H = canvas.clientHeight || hero.clientHeight;

    var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x010204, 26, 60);

    var camera = new THREE.PerspectiveCamera(44, W / H, 0.1, 120);
    var camTarget = new THREE.Vector3(0, 3.6, 0);

    /* Camera intro path (eased in animate()). */
    var camStart = new THREE.Vector3(-6, 13, 23);
    var camEnd = new THREE.Vector3(1.2, 6.6, 16);
    camera.position.copy(camStart);
    camera.lookAt(camTarget);

    /* -- Lighting ---------------------------------------------------------- */
    var hemi = new THREE.HemisphereLight(0xbfe0ff, 0x20262e, 1.05);
    scene.add(hemi);

    var key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(9, 15, 10);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 60;
    key.shadow.camera.left = -20;
    key.shadow.camera.right = 20;
    key.shadow.camera.top = 20;
    key.shadow.camera.bottom = -20;
    key.shadow.bias = -0.0006;
    scene.add(key);

    /* Cyan accent rim light to tie the scene to the brand. */
    var rim = new THREE.PointLight(COL.cyan, 0.6, 40);
    rim.position.set(-8, 6, 6);
    scene.add(rim);

    var fillPurpleless = new THREE.DirectionalLight(0xbfe6ff, 0.25);
    fillPurpleless.position.set(-6, 5, -8);
    scene.add(fillPurpleless);

    /* -- Shared geometry / material helpers -------------------------------- */
    var studGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14);
    var matCache = {};
    function mat(color) {
      if (!matCache[color]) {
        matCache[color] = new THREE.MeshStandardMaterial({ color: color, roughness: 0.62, metalness: 0.04 });
      }
      return matCache[color];
    }

    var UNIT = 1;          // one stud footprint
    var BRICK_H = 1.15;    // full brick height

    /* A brick: box body + studs on top, as one Group. wStuds x dStuds. */
    function makeBrick(wStuds, dStuds, color, height) {
      var h = height || BRICK_H;
      var g = new THREE.Group();
      var body = new THREE.Mesh(new THREE.BoxGeometry(wStuds * UNIT, h, dStuds * UNIT), mat(color));
      body.castShadow = true;
      body.receiveShadow = true;
      g.add(body);
      for (var i = 0; i < wStuds; i++) {
        for (var j = 0; j < dStuds; j++) {
          var stud = new THREE.Mesh(studGeo, mat(color));
          stud.castShadow = true;
          stud.position.set(
            (i - (wStuds - 1) / 2) * UNIT,
            h / 2 + 0.1,
            (j - (dStuds - 1) / 2) * UNIT
          );
          g.add(stud);
        }
      }
      return g;
    }

    /* -- Baseplate with a studded grid (one InstancedMesh) ----------------- */
    var PLATE_W = 26, PLATE_D = 18;
    var plate = new THREE.Mesh(new THREE.BoxGeometry(PLATE_W, 1, PLATE_D), mat(COL.plate));
    plate.position.y = -0.5;
    plate.receiveShadow = true;
    scene.add(plate);

    (function plateStuds() {
      var cols = PLATE_W, rows = PLATE_D;
      var inst = new THREE.InstancedMesh(studGeo, mat(COL.dark), cols * rows);
      var m = new THREE.Matrix4();
      var n = 0;
      for (var x = 0; x < cols; x++) {
        for (var z = 0; z < rows; z++) {
          m.setPosition(x - PLATE_W / 2 + 0.5, 0.1, z - PLATE_D / 2 + 0.5);
          inst.setMatrixAt(n++, m);
        }
      }
      inst.receiveShadow = true;
      inst.instanceMatrix.needsUpdate = true;
      scene.add(inst);
    })();

    /* -- The city: buildings assembled from animated bricks ---------------- */
    var animatedBricks = []; // { mesh, from, to, delay }
    var buildDuration = 2.6; // seconds for the whole city to snap in
    var buildStart = 0.5;    // starts after the camera begins settling

    var buildingDefs = [
      { x: -8, z: -4, w: 2, d: 2, floors: 4, colors: [COL.red, COL.white] },
      { x: -4, z: -5.5, w: 2, d: 2, floors: 6, colors: [COL.blue, COL.white] },
      { x: 0, z: -4.5, w: 3, d: 2, floors: 3, colors: [COL.yellow, COL.orange] },
      { x: 4.5, z: -5.5, w: 2, d: 2, floors: 5, colors: [COL.cyan, COL.white] },
      { x: 8, z: -4, w: 2, d: 3, floors: 4, colors: [COL.green, COL.white] },
      { x: 2.5, z: -1.5, w: 2, d: 2, floors: 2, colors: [COL.red, COL.yellow] }
    ];

    var brickCount = 0;
    var brickCap = 90; // safety cap on animated bricks
    buildingDefs.forEach(function (b, bi) {
      for (var f = 0; f < b.floors && brickCount < brickCap; f++) {
        var color = b.colors[f % b.colors.length];
        var brick = makeBrick(b.w, b.d, color);
        var targetY = f * BRICK_H + BRICK_H / 2;
        brick.position.set(b.x, targetY, b.z);
        var from = new THREE.Vector3(
          b.x + (Math.random() - 0.5) * 6,
          targetY + 12 + Math.random() * 6,
          b.z + (Math.random() - 0.5) * 4
        );
        brick.visible = false;
        scene.add(brick);
        animatedBricks.push({
          mesh: brick,
          from: from,
          to: new THREE.Vector3(b.x, targetY, b.z),
          delay: buildStart + bi * 0.18 + f * 0.12 + Math.random() * 0.1
        });
        brickCount++;
      }
    });

    /* -- Minifigure builder ------------------------------------------------- */
    function makeMinifig(opts) {
      var g = new THREE.Group();
      var legCol = opts.legs, torsoCol = opts.torso, hatCol = opts.hat;

      var legs = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.72), mat(legCol));
      legs.position.y = 0.5; legs.castShadow = true; g.add(legs);
      var groove = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.0, 0.72), mat(COL.dark));
      groove.position.y = 0.5; g.add(groove);

      var hips = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.42, 0.72), mat(legCol));
      hips.position.y = 1.2; hips.castShadow = true; g.add(hips);

      var torso = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.05, 0.68), mat(torsoCol));
      torso.position.y = 1.95; torso.castShadow = true; g.add(torso);

      // Head
      var head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.6, 20), mat(COL.skin));
      head.position.y = 2.82; head.castShadow = true; g.add(head);
      var headStud = new THREE.Mesh(studGeo, mat(COL.skin));
      headStud.position.y = 3.18; g.add(headStud);
      // Eyes (face +Z, toward camera)
      var eyeGeo = new THREE.BoxGeometry(0.08, 0.1, 0.05);
      var le = new THREE.Mesh(eyeGeo, mat(COL.dark)); le.position.set(-0.15, 2.86, 0.42); g.add(le);
      var re = new THREE.Mesh(eyeGeo, mat(COL.dark)); re.position.set(0.15, 2.86, 0.42); g.add(re);
      var smile = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.05), mat(COL.dark));
      smile.position.set(0, 2.66, 0.42); g.add(smile);

      // Hard hat
      var hat = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.32, 20), mat(hatCol));
      hat.position.y = 3.2; hat.castShadow = true; g.add(hat);
      var brim = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.08, 20), mat(hatCol));
      brim.position.y = 3.06; g.add(brim);

      // Arms as shoulder-pivoted groups
      function makeArm(sign) {
        var pivot = new THREE.Group();
        pivot.position.set(sign * 0.66, 2.35, 0);
        var arm = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.95, 0.4), mat(torsoCol));
        arm.position.y = -0.42; arm.castShadow = true;
        var hand = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.22, 12), mat(COL.skin));
        hand.position.y = -0.92; hand.rotation.x = Math.PI / 2; arm.add(hand);
        pivot.add(arm);
        g.add(pivot);
        return pivot;
      }
      var rightArm = makeArm(1);
      var leftArm = makeArm(-1);
      // resting arm angle (slightly out)
      rightArm.rotation.z = 0.12;
      leftArm.rotation.z = -0.12;

      return { group: g, rightArm: rightArm, leftArm: leftArm };
    }

    var builders = [];

    // Front waver: forward and right of the text, facing the camera, slightly
    // larger so he's clearly the one greeting the visitor.
    var hero1 = makeMinifig({ legs: COL.blue, torso: COL.red, hat: COL.hat });
    hero1.group.position.set(2.2, 0, 6.5);
    hero1.group.scale.setScalar(1.15);
    hero1.group.rotation.y = -0.12; // faces the camera, a touch turned in
    scene.add(hero1.group);
    builders.push(hero1);

    // Two side builders, angled, "hammering".
    var b2 = makeMinifig({ legs: COL.dark, torso: COL.yellow, hat: COL.orange });
    b2.group.position.set(-5.5, 0, 3.5);
    b2.group.rotation.y = 0.8;
    scene.add(b2.group);
    builders.push(b2);

    var b3 = makeMinifig({ legs: COL.dark, torso: COL.green, hat: COL.hat });
    b3.group.position.set(6, 0, 3);
    b3.group.rotation.y = -0.9;
    scene.add(b3.group);
    builders.push(b3);

    /* -- Crane -------------------------------------------------------------- */
    var crane = new THREE.Group();
    crane.position.set(-10, 0, -6);
    var craneMat = mat(COL.yellow);
    var mast = new THREE.Mesh(new THREE.BoxGeometry(0.7, 14, 0.7), craneMat);
    mast.position.y = 7; mast.castShadow = true; crane.add(mast);
    // rotating top (jib)
    var jibPivot = new THREE.Group();
    jibPivot.position.y = 13.4;
    crane.add(jibPivot);
    var jib = new THREE.Mesh(new THREE.BoxGeometry(16, 0.5, 0.5), craneMat);
    jib.position.x = 5; jib.castShadow = true; jibPivot.add(jib);
    var counter = new THREE.Mesh(new THREE.BoxGeometry(3, 0.7, 0.7), mat(COL.dark));
    counter.position.x = -2.2; jibPivot.add(counter);
    // cable + hanging brick
    var cable = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 6, 6), mat(COL.dark));
    cable.position.set(11, -3, 0); jibPivot.add(cable);
    var hookBrick = makeBrick(2, 2, COL.cyan);
    hookBrick.position.set(11, -6.2, 0); jibPivot.add(hookBrick);
    scene.add(crane);

    /* -- Interaction: mouse parallax --------------------------------------- */
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    window.addEventListener("pointermove", function (e) {
      pointer.tx = (e.clientX / window.innerWidth - 0.5);
      pointer.ty = (e.clientY / window.innerHeight - 0.5);
    }, { passive: true });

    /* -- Resize ------------------------------------------------------------- */
    function resize() {
      var w = canvas.clientWidth || hero.clientWidth;
      var h = canvas.clientHeight || hero.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize);

    /* -- Visibility: pause when tab hidden --------------------------------- */
    var running = true;
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) { clock.getDelta(); loop(); }
    });

    /* -- Easing ------------------------------------------------------------- */
    function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function easeOutBack(t) {
      var c1 = 1.70158, c3 = c1 + 1;
      return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
    function clamp01(t) { return t < 0 ? 0 : t > 1 ? 1 : t; }

    /* -- Animation loop ----------------------------------------------------- */
    var clock = new THREE.Clock();
    var elapsed = 0;
    var camIntro = 2.3; // seconds
    var buildEnd = buildStart + buildDuration;

    function loop() {
      if (!running) return;
      var dt = clock.getDelta();
      elapsed += dt;
      var t = elapsed;

      /* Camera: intro ease, then settle with parallax. */
      var camT = easeInOut(clamp01(t / camIntro));
      var baseX = camStart.x + (camEnd.x - camStart.x) * camT;
      var baseY = camStart.y + (camEnd.y - camStart.y) * camT;
      var baseZ = camStart.z + (camEnd.z - camStart.z) * camT;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      camera.position.set(baseX + pointer.x * 3.2, baseY - pointer.y * 1.8, baseZ);
      camera.lookAt(camTarget);

      /* Bricks snap into place (staggered easeOutBack). */
      for (var i = 0; i < animatedBricks.length; i++) {
        var ab = animatedBricks[i];
        var local = clamp01((t - ab.delay) / 0.7);
        if (t < ab.delay) { ab.mesh.visible = false; continue; }
        ab.mesh.visible = true;
        var e = easeOutBack(local);
        ab.mesh.position.set(
          ab.from.x + (ab.to.x - ab.from.x) * e,
          ab.from.y + (ab.to.y - ab.from.y) * e,
          ab.from.z + (ab.to.z - ab.from.z) * e
        );
        // little settle spin that resolves to 0
        ab.mesh.rotation.y = (1 - local) * 0.5;
      }

      /* Builders: idle bob + hammering side arms. */
      for (var b = 0; b < builders.length; b++) {
        var bd = builders[b];
        bd.group.position.y = Math.sin(t * 1.6 + b) * 0.05;
      }
      // side builders hammer
      b2.rightArm.rotation.z = 0.12 + Math.abs(Math.sin(t * 5)) * 0.9;
      b3.leftArm.rotation.z = -0.12 - Math.abs(Math.sin(t * 5 + 1)) * 0.9;

      /* Front builder waves: during intro (after ~1.2s) and then every ~6s. */
      var introWave = (t > 1.2 && t < 5.0);
      var loopPhase = t % 6;
      var loopWave = (t > buildEnd && loopPhase < 2.0);
      if (introWave || loopWave) {
        var wt = introWave ? (t - 1.2) : loopPhase;
        // raise arm up-and-out to the side and oscillate a friendly wave
        hero1.rightArm.rotation.z = 1.9 + Math.sin(wt * 9) * 0.35;
        hero1.rightArm.rotation.x = -0.2;
      } else {
        hero1.rightArm.rotation.z += (0.12 - hero1.rightArm.rotation.z) * 0.1;
        hero1.rightArm.rotation.x += (0 - hero1.rightArm.rotation.x) * 0.1;
      }

      /* Crane: slow swing, gentle load bob. */
      jibPivot.rotation.y = -0.6 + Math.sin(t * 0.25) * 0.6;
      hookBrick.position.y = -6.2 + Math.sin(t * 0.9) * 0.15;

      renderer.render(scene, camera);
      requestAnimationFrame(loop);
    }

    resize();
    loop();
  }
})();
