#!/usr/bin/env python3
"""Assemble section fragments into a single cohesive portfolio.html.

- Injects global <head>: Tailwind CDN, Google Fonts, :root design tokens,
  research-driven meta tags + JSON-LD Person schema.
- Hoists Leaflet CDN <link>/<script> tags out of the visitors fragment into <head> (deduped).
- Wraps sections in semantic <main>, adds sticky gradient nav + footer.
"""
import re
import pathlib

BUILD = pathlib.Path(__file__).resolve().parent
SECTIONS = BUILD / "sections"
OUT = BUILD.parent / "index.html"

order = [
    "01-hero.html",
    "02-experience.html",
    "03-skills.html",
    "04-projects.html",
    "05-college.html",
]

# Collect fragment bodies, hoisting any Leaflet/heat CDN <link>/<script src> tags.
hoisted = []
seen_hoist = set()
bodies = []

HOIST_PAT = re.compile(
    r'<(?:link[^>]*?(?:leaflet|cartocdn)[^>]*?>|script[^>]*?src=["\'][^"\']*(?:leaflet)[^"\']*["\'][^>]*?></script>)',
    re.IGNORECASE,
)

for name in order:
    text = (SECTIONS / name).read_text(encoding="utf-8")
    for m in HOIST_PAT.findall(text):
        key = re.sub(r"\s+", " ", m).strip()
        if key not in seen_hoist:
            seen_hoist.add(key)
            hoisted.append(m)
    text = HOIST_PAT.sub("", text)
    bodies.append(f"\n<!-- ===== {name} ===== -->\n{text.strip()}\n")

hoist_block = "\n    ".join(hoisted)

TOKENS = """
      :root{
        /* Woodland surfaces — bright, warm, happy (palette pulled from the lizard gif) */
        --bg:#f6f1e4; --bg-elev:#fffdf6; --bg-elev-2:#ece5d1; --border:#d8cdb0;
        /* Warm bark-brown ink */
        /* --text-faint darkened from #8a8368 → #6b6549 so it clears WCAG AA 4.5:1
           on all cream surfaces (incl. the darker --bg-elev-2 tag chips). */
        --text:#2d2a20; --text-dim:#5c5744; --text-faint:#6b6549;
        /* Nature accents: jade lizard green, moss yellow-green, wood amber, honey gold */
        --accent:#2f9e78; --accent-2:#7a9a2e; --accent-3:#b07d47; --gold:#d3a44f;
        /* Darker jade for SMALL text on cream — bright --accent (#2f9e78) only
           hits ~3.3:1 there and fails WCAG AA; --accent-ink clears 4.5:1 on all
           cream surfaces. Use --accent for borders/large text, --accent-ink for
           small labels (eyebrows, tags, dates). */
        --accent-ink:#1f6e54;
        --glow-cyan:0 0 22px rgba(47,158,120,.28); --glow-violet:0 0 22px rgba(122,154,46,.26);
        --grad:linear-gradient(135deg,#2f9e78 0%,#7a9a2e 100%);
        /* Deep bark behind bright surfaces */
        --wood:#5a3f22; --wood-2:#6b4f2e;
        --parch-line:rgba(45,42,32,.08);
      }
      html{scroll-behavior:smooth;}
      @media (prefers-reduced-motion: reduce){ html{scroll-behavior:auto;} }
      body{
        background:var(--bg);color:var(--text);
        font-family:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
        font-size:1.02rem;-webkit-font-smoothing:antialiased;line-height:1.65;overflow-x:hidden;
        background-image:
          radial-gradient(120% 80% at 50% -10%, rgba(255,255,246,.7), transparent 60%),
          radial-gradient(90% 70% at 85% 8%, rgba(47,158,120,.10), transparent 55%),
          radial-gradient(90% 70% at 10% 20%, rgba(122,154,46,.10), transparent 55%),
          radial-gradient(140% 120% at 50% 120%, rgba(176,125,71,.14), transparent 55%);
        background-attachment:fixed;
      }
      h1,h2,h3{font-family:'Fraunces','Georgia',serif;letter-spacing:-.01em;font-weight:600;color:var(--text);}
      a{color:inherit;}
      ::selection{background:rgba(47,158,120,.22);}
      .eyebrow{font-family:'Inter',sans-serif;text-transform:uppercase;letter-spacing:.18em;font-size:.72rem;color:var(--accent-ink);display:flex;align-items:center;gap:.6rem;margin-bottom:1rem;font-weight:700;}
      .eyebrow span{color:var(--text-faint);}
      .wrap{max-width:1100px;margin:0 auto;padding-left:1.5rem;padding-right:1.5rem;}
      @media (min-width:768px){ .wrap{padding-left:2rem;padding-right:2rem;} }
      section{scroll-margin-top:80px;}
      :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px;}
      /* Sticky nav — bright cream bar with a green underline */
      .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(8px);background:rgba(246,241,228,.86);border-bottom:1px solid var(--border);box-shadow:0 1px 0 rgba(47,158,120,.25);}
      .nav a.navlink{font-size:.82rem;color:var(--text-dim);transition:color .2s;font-family:'Inter',sans-serif;font-weight:600;letter-spacing:.02em;}
      .nav a.navlink:hover{color:var(--accent);}
      .brand{font-family:'Fraunces',serif;font-weight:700;letter-spacing:-.01em;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
      /* Brand hands off from the centered hero name via a scroll-linked
         transform: the big name shrinks and glides into this top-left slot as
         you scroll, crossfading into the real (sticky) brand. JS drives it. */
      /* navBrand mirrors the hero name EXACTLY (same text, font, solid colour)
         so the morph lands seamlessly — no text/colour change at the corner. */
      #navBrand{font-family:'Fraunces',serif;font-weight:700;letter-spacing:-.01em;color:var(--text);background:none;-webkit-text-fill-color:currentColor;opacity:0;pointer-events:none;transform-origin:left center;white-space:nowrap;}
      #navBrand .hero-name-alias{font-style:italic;font-weight:500;color:var(--accent);letter-spacing:0;}
      #navBrand.is-visible{opacity:1;pointer-events:auto;}   /* reduced-motion fallback */
      .hero-name{will-change:transform,opacity;transform-origin:center center;}
      .hero-scholar{will-change:transform,opacity;}
      @media (prefers-reduced-motion: reduce){ #navBrand{transition:opacity .3s ease;} .hero-name,.hero-scholar{will-change:auto;} }
      footer{border-top:1px solid var(--border);color:var(--text-dim);background:linear-gradient(180deg,transparent,rgba(122,154,46,.10));}
      footer a:hover{color:var(--accent);}
      /* Skip link: visually hidden until focused, then pinned top-left so keyboard
         users can jump straight past the nav to the main content. */
      .skip-link{position:absolute;left:-999px;top:0;z-index:100;background:var(--bg-elev);color:var(--accent);border:1px solid var(--accent);border-radius:0 0 .5rem 0;padding:.6rem 1rem;font-family:'Inter',sans-serif;font-weight:600;}
      .skip-link:focus{left:0;}
      #main:focus{outline:none;}
"""

HEAD = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Parth Sethi — Senior Software Engineer | Salesforce, ex-AWS</title>
    <meta name="description" content="Parth Sethi is a Senior Software Engineer (SMTS) at Salesforce and ex-AWS SDE. Architected systems powering $1B+ annual revenue, 10x email throughput, and five-nines availability. Java, gRPC, AWS, distributed systems." />
    <meta name="keywords" content="Parth Sethi, Senior Software Engineer, Staff Engineer, Salesforce, AWS, Software Development Engineer, Java, gRPC, distributed systems, DynamoDB, backend engineer" />
    <meta name="author" content="Parth Sethi" />
    <link rel="canonical" href="https://sethiparth.github.io/" />

    <!-- Open Graph -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="Parth Sethi — Senior Software Engineer | Salesforce, ex-AWS" />
    <meta property="og:description" content="Senior Software Engineer at Salesforce, ex-AWS. Architected systems powering $1B+ revenue, 10x throughput gains, and five-nines availability." />
    <meta property="og:image" content="https://sethiparth.github.io/images/portrait/parth.jpg" />
    <meta property="og:image:width" content="1000" />
    <meta property="og:image:height" content="1500" />
    <meta property="og:image:alt" content="Parth Sethi — Senior Software Engineer" />
    <meta property="og:url" content="https://sethiparth.github.io/" />
    <meta property="og:site_name" content="Parth Sethi" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Parth Sethi — Senior Software Engineer" />
    <meta name="twitter:description" content="Senior Software Engineer at Salesforce, ex-AWS. $1B+ revenue systems, 10x throughput, five-nines availability." />
    <meta name="twitter:image" content="https://sethiparth.github.io/images/portrait/parth.jpg" />

    <!-- JSON-LD Person schema (AI/search legibility) -->
    <script type="application/ld+json">
    {{
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "Parth Sethi",
      "alternateName": "Seth",
      "jobTitle": "Senior Software Engineer (SMTS)",
      "url": "https://sethiparth.github.io/",
      "email": "mailto:sethiparth.ps@gmail.com",
      "telephone": "+1-352-745-9455",
      "sameAs": ["https://www.linkedin.com/in/parth-sethi-a24753b7/"],
      "worksFor": {{ "@type": "Organization", "name": "Salesforce" }},
      "alumniOf": [
        {{ "@type": "CollegeOrUniversity", "name": "University of Florida" }},
        {{ "@type": "CollegeOrUniversity", "name": "Jaypee University of Information & Technology" }}
      ],
      "description": "Senior Software Engineer (SMTS) at Salesforce and ex-AWS SDE. Architected high-performance distributed systems powering $1B+ in annual revenue, 10x throughput improvements, and five-nines availability.",
      "knowsAbout": ["Java","C++","SQL","NoSQL","gRPC","Distributed Systems","AWS DynamoDB","AWS Lambda","AWS EC2","System Architecture","Performance Optimization","High Availability Systems"]
    }}
    </script>

    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;0,9..144,700;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Hoisted section CDN deps (if any) -->
    {hoist_block}

    <style>{TOKENS}</style>
</head>
<body>
  <a href="#main" class="skip-link">Skip to content</a>
  <nav class="nav" aria-label="Primary">
    <div class="wrap flex items-center justify-between h-16">
      <a href="#home" id="navBrand" class="brand text-lg">Parth Sethi <span class="hero-name-alias">(Seth)</span></a>
      <div class="hidden md:flex items-center gap-7">
        <a class="navlink" href="#experience">Experience</a>
        <a class="navlink" href="#skills">Skills</a>
        <a class="navlink" href="#projects">Projects</a>
        <a class="navlink" href="#college">Academic</a>
        <a class="navlink" href="https://www.linkedin.com/in/parth-sethi-a24753b7/" target="_blank" rel="noopener">LinkedIn</a>
        <a class="navlink" href="tel:+13527459455" aria-label="Call Parth">Phone</a>
        <a class="navlink" href="mailto:sethiparth.ps@gmail.com" aria-label="Email Parth">Email</a>
      </div>
      <button id="navToggle" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg" style="border:1px solid var(--border);color:var(--text-dim);" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
    <div id="mobileMenu" class="md:hidden hidden border-t" style="border-color:var(--border);background:rgba(231,211,168,.98);">
      <div class="wrap flex flex-col py-3">
        <a class="navlink py-2" href="#experience">Experience</a>
        <a class="navlink py-2" href="#skills">Skills</a>
        <a class="navlink py-2" href="#projects">Projects</a>
        <a class="navlink py-2" href="#college">Academic</a>
        <a class="navlink py-2" href="https://www.linkedin.com/in/parth-sethi-a24753b7/" target="_blank" rel="noopener">LinkedIn</a>
        <a class="navlink py-2" href="tel:+13527459455" aria-label="Call Parth">Phone</a>
        <a class="navlink py-2" href="mailto:sethiparth.ps@gmail.com" aria-label="Email Parth">Email</a>
      </div>
    </div>
  </nav>
  <script>
    (function(){{
      var btn=document.getElementById('navToggle'), menu=document.getElementById('mobileMenu');
      if(!btn||!menu) return;
      function closeMenu(){{ menu.classList.add('hidden'); btn.setAttribute('aria-expanded','false'); btn.setAttribute('aria-label','Open menu'); }}
      btn.addEventListener('click', function(){{
        var open=menu.classList.toggle('hidden')===false;
        btn.setAttribute('aria-expanded', String(open));
        btn.setAttribute('aria-label', open?'Close menu':'Open menu');
      }});
      menu.querySelectorAll('a').forEach(function(a){{ a.addEventListener('click', closeMenu); }});
    }})();

    /* Scroll-linked name handoff: the big centered hero name shrinks and glides
       up into the top-left nav slot as you scroll, crossfading into the real
       (sticky) brand — a hand-rolled shared-element transition. Deferred to
       DOMContentLoaded because this script runs before <main>. */
    function initBrandHandoff(){{
      var brand=document.getElementById('navBrand');
      var heroName=document.querySelector('.hero-name');
      var scholar=document.querySelector('.hero-scholar');
      if(!brand||!heroName) return;

      var reduceMotion=window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      /* Reduced motion: skip the scroll morph, keep a simple binary reveal. */
      if(reduceMotion){{
        if('IntersectionObserver' in window){{
          var io=new IntersectionObserver(function(entries){{
            entries.forEach(function(e){{ brand.classList.toggle('is-visible', !e.isIntersecting); }});
          }}, {{ rootMargin: '-56px 0px 0px 0px', threshold: 0 }});
          io.observe(heroName);
        }} else {{ brand.classList.add('is-visible'); }}
        return;
      }}

      function clamp(v,lo,hi){{ return v<lo?lo:(v>hi?hi:v); }}

      /* Base geometry, measured transform-free so the math never feeds back on
         itself. Recomputed on resize. */
      var docTop, nameCenterX, nameH, brandCX, brandCY, targetScale, travel;
      function measure(){{
        heroName.style.transform='none';
        heroName.style.opacity='';
        var n=heroName.getBoundingClientRect();
        var b=brand.getBoundingClientRect();
        docTop=n.top+window.pageYOffset;
        nameCenterX=n.left+n.width/2;
        nameH=n.height||1;
        brandCX=b.left+b.width/2;
        brandCY=b.top+b.height/2;                 /* sticky nav → fixed in viewport */
        targetScale=Math.max(0.18, b.height/nameH);
        travel=(docTop+nameH/2)-brandCY;          /* scroll needed for centers to meet */
      }}

      function update(){{
        ticking=false;
        if(travel<=0) return;
        var p=clamp(window.pageYOffset/travel, 0, 1);
        var naturalCenterY=(docTop+nameH/2)-window.pageYOffset;
        var s=1+(targetScale-1)*p;
        var tx=(brandCX-nameCenterX)*p;
        var ty=(brandCY-naturalCenterY)*p;
        heroName.style.transform='translate('+tx+'px,'+ty+'px) scale('+s+')';
        heroName.style.opacity=String(1-clamp((p-0.72)/0.24, 0, 1));   /* fade out late */
        heroName.style.pointerEvents=p>0.1?'none':'';
        brand.style.opacity=String(clamp((p-0.78)/0.22, 0, 1));         /* fade in to meet it */
        brand.style.pointerEvents=p>0.9?'auto':'none';
        /* Gif rides up with the name but shrinks + fades out early, so it's gone
           long before the name reaches the corner (no overlap with the nav). */
        if(scholar){{
          var gp=clamp(p/0.45, 0, 1);
          scholar.style.transform='translateY('+(-40*gp)+'px) scale('+(1-0.55*gp)+')';
          scholar.style.opacity=String(1-gp);
        }}
      }}

      var ticking=false;
      function onScroll(){{ if(!ticking){{ ticking=true; requestAnimationFrame(update); }} }}
      var resizeTimer;
      function onResize(){{ clearTimeout(resizeTimer); resizeTimer=setTimeout(function(){{ measure(); update(); }}, 150); }}

      measure();
      update();
      window.addEventListener('scroll', onScroll, {{ passive:true }});
      window.addEventListener('resize', onResize);
      /* The hero name uses a web font (Fraunces); if it swaps in after this
         first measure, nameH/docTop/travel are stale and the shrink misses the
         nav brand. Re-measure once fonts are ready and on full load. */
      if(document.fonts && document.fonts.ready){{ document.fonts.ready.then(function(){{ measure(); update(); }}); }}
      window.addEventListener('load', function(){{ measure(); update(); }});
    }}
    if(document.readyState==='loading'){{ document.addEventListener('DOMContentLoaded', initBrandHandoff); }}
    else {{ initBrandHandoff(); }}
  </script>
  <main id="main" tabindex="-1">
"""

FOOTER = """
  </main>
  <footer>
    <div class="wrap" style="padding-top:3.5rem;padding-bottom:1rem;text-align:center;">
      <figure class="bye-critter" aria-label="A little lizard waving goodbye">
        <div class="bye-cameo">
          <div class="bye-bubble" aria-hidden="true"><span>Bye!</span></div>
          <div class="bye-medallion">
            <img src="images/gif/bye.gif" alt="A happy little lizard saying goodbye" width="498" height="462" loading="lazy" />
          </div>
        </div>
        <figcaption>Thanks for stopping by &mdash; let's build something</figcaption>
      </figure>
    </div>
    <div class="wrap py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm" style="border-top:1px solid var(--border);">
      <p>© <span id="yr"></span> Parth Sethi — Senior Software Engineer</p>
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" style="font-family:'Inter',sans-serif;font-weight:600;letter-spacing:.01em;">
        <a href="https://www.linkedin.com/in/parth-sethi-a24753b7/" target="_blank" rel="noopener">LinkedIn</a>
        <a href="mailto:sethiparth.ps@gmail.com">sethiparth.ps@gmail.com</a>
        <a href="tel:+13527459455">+1 (352) 745-9455</a>
      </div>
    </div>
  </footer>
  <style>
    .bye-critter{position:relative;display:inline-flex;flex-direction:column;align-items:center;margin:0 auto;}
    /* Cameo wraps ONLY the bubble + circle (like .hero-scholar) so the bubble's
       %-offsets are measured against the circle height, not the taller figure. */
    .bye-cameo{position:relative;width:clamp(120px,20vw,160px);}
    .bye-medallion{position:relative;width:100%;aspect-ratio:1/1;border-radius:50%;overflow:hidden;background:#243b2f;border:5px solid var(--accent);box-shadow:0 0 0 3px #fffdf6,0 0 0 8px rgba(47,158,120,.3),0 12px 28px rgba(45,42,32,.22);animation:bye-bob 4.5s ease-in-out infinite;}
    .bye-medallion img{width:100%;height:100%;object-fit:cover;display:block;transform:scale(1.02);}
    .bye-bubble{position:absolute;top:-8%;right:-14%;z-index:3;background:#fffdf6;border:2px solid var(--accent);color:var(--accent);font-family:'Fraunces',serif;font-weight:700;font-size:1rem;letter-spacing:.01em;padding:.35rem .8rem;border-radius:.9rem;box-shadow:0 6px 18px rgba(45,42,32,.14);}
    .bye-bubble::after{content:'';position:absolute;left:14px;bottom:-9px;border:8px solid transparent;border-top-color:#fffdf6;filter:drop-shadow(0 2px 0 var(--accent));}
    .bye-critter figcaption{margin-top:1rem;font-family:'Fraunces',serif;font-style:italic;letter-spacing:0;font-size:1rem;color:var(--text-dim);}
    @keyframes bye-bob{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
    @media (prefers-reduced-motion: reduce){ .bye-medallion{animation:none;} }
  </style>
  <script>document.getElementById('yr').textContent = new Date().getFullYear();</script>
</body>
</html>
"""

html = HEAD + "\n".join(bodies) + FOOTER
OUT.write_text(html, encoding="utf-8")
print(f"Wrote {OUT} ({len(html.splitlines())} lines, {len(html)} bytes)")
print(f"Hoisted {len(hoisted)} CDN dep tag(s).")
