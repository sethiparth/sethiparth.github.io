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
OUT = BUILD.parent / "portfolio.html"

order = [
    "01-hero.html",
    "02-experience.html",
    "03-skills.html",
    "04-projects.html",
    "05-college.html",
    "06-visitors.html",
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
        --bg:#0a0e1a; --bg-elev:#111726; --bg-elev-2:#161d30; --border:#1f2a44;
        --text:#e6edf7; --text-dim:#9fb0cc; --text-faint:#8d9ab6;
        --accent:#22d3ee; --accent-2:#a78bfa; --accent-3:#34d399;
        --glow-cyan:0 0 24px rgba(34,211,238,.45); --glow-violet:0 0 24px rgba(167,139,250,.40);
        --grad:linear-gradient(135deg,#22d3ee 0%,#a78bfa 100%);
      }
      html{scroll-behavior:smooth;}
      @media (prefers-reduced-motion: reduce){ html{scroll-behavior:auto;} }
      body{background:var(--bg);color:var(--text);font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;line-height:1.6;overflow-x:hidden;}
      h1,h2,h3{letter-spacing:-.02em;font-weight:700;color:var(--text);}
      a{color:inherit;}
      ::selection{background:rgba(34,211,238,.3);}
      .eyebrow{font-family:'JetBrains Mono',monospace;text-transform:uppercase;letter-spacing:.2em;font-size:.72rem;color:var(--accent);display:flex;align-items:center;gap:.6rem;margin-bottom:1rem;}
      .eyebrow span{color:var(--text-faint);}
      .wrap{max-width:1100px;margin:0 auto;padding-left:1.5rem;padding-right:1.5rem;}
      @media (min-width:768px){ .wrap{padding-left:2rem;padding-right:2rem;} }
      section{scroll-margin-top:80px;}
      :focus-visible{outline:2px solid var(--accent);outline-offset:3px;border-radius:4px;}
      /* Sticky nav */
      .nav{position:sticky;top:0;z-index:50;backdrop-filter:blur(12px);background:rgba(10,14,26,.72);border-bottom:1px solid var(--border);}
      .nav a.navlink{font-size:.9rem;color:var(--text-dim);transition:color .2s;font-family:'JetBrains Mono',monospace;}
      .nav a.navlink:hover{color:var(--accent);}
      .brand{font-weight:800;background:var(--grad);-webkit-background-clip:text;background-clip:text;color:transparent;}
      footer{border-top:1px solid var(--border);color:var(--text-dim);}
      footer a:hover{color:var(--accent);}
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
    <link rel="canonical" href="https://sethiparth.github.io/portfolio.html" />

    <!-- Open Graph -->
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="Parth Sethi — Senior Software Engineer | Salesforce, ex-AWS" />
    <meta property="og:description" content="Senior Software Engineer at Salesforce, ex-AWS. Architected systems powering $1B+ revenue, 10x throughput gains, and five-nines availability." />
    <meta property="og:image" content="https://sethiparth.github.io/images/og-preview.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Parth Sethi — Senior Software Engineer" />
    <meta property="og:url" content="https://sethiparth.github.io/portfolio.html" />
    <meta property="og:site_name" content="Parth Sethi" />
    <meta property="og:locale" content="en_US" />

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Parth Sethi — Senior Software Engineer" />
    <meta name="twitter:description" content="Senior Software Engineer at Salesforce, ex-AWS. $1B+ revenue systems, 10x throughput, five-nines availability." />
    <meta name="twitter:image" content="https://sethiparth.github.io/images/og-preview.jpg" />

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
      "sameAs": ["https://github.com/sethiparth"],
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />

    <!-- Tailwind CDN -->
    <script src="https://cdn.tailwindcss.com"></script>

    <!-- Hoisted section CDN deps (Leaflet etc.) -->
    {hoist_block}

    <style>{TOKENS}</style>
</head>
<body>
  <nav class="nav" aria-label="Primary">
    <div class="wrap flex items-center justify-between h-16">
      <a href="#home" class="brand text-lg">Parth Sethi</a>
      <div class="hidden md:flex items-center gap-7">
        <a class="navlink" href="#experience">Experience</a>
        <a class="navlink" href="#skills">Skills</a>
        <a class="navlink" href="#projects">Projects</a>
        <a class="navlink" href="#college">Academic</a>
        <a class="navlink" href="https://github.com/sethiparth" target="_blank" rel="noopener" aria-label="GitHub profile">GitHub</a>
        <a class="navlink" href="mailto:sethiparth.ps@gmail.com" aria-label="Email Parth">Email</a>
      </div>
      <button id="navToggle" class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg" style="border:1px solid var(--border);color:var(--text-dim);" aria-label="Open menu" aria-expanded="false" aria-controls="mobileMenu">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
    <div id="mobileMenu" class="md:hidden hidden border-t" style="border-color:var(--border);background:rgba(10,14,26,.96);">
      <div class="wrap flex flex-col py-3">
        <a class="navlink py-2" href="#experience">Experience</a>
        <a class="navlink py-2" href="#skills">Skills</a>
        <a class="navlink py-2" href="#projects">Projects</a>
        <a class="navlink py-2" href="#college">Academic</a>
        <a class="navlink py-2" href="https://github.com/sethiparth" target="_blank" rel="noopener" aria-label="GitHub profile">GitHub</a>
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
  </script>
  <main>
"""

FOOTER = """
  </main>
  <footer>
    <div class="wrap py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
      <p>© <span id="yr"></span> Parth Sethi — Senior Software Engineer</p>
      <div class="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" style="font-family:'JetBrains Mono',monospace;">
        <a href="https://github.com/sethiparth" target="_blank" rel="noopener">GitHub</a>
        <a href="mailto:sethiparth.ps@gmail.com">sethiparth.ps@gmail.com</a>
        <a href="tel:+13527459455">+1 (352) 745-9455</a>
      </div>
    </div>
  </footer>
  <script>document.getElementById('yr').textContent = new Date().getFullYear();</script>
</body>
</html>
"""

html = HEAD + "\n".join(bodies) + FOOTER
OUT.write_text(html, encoding="utf-8")
print(f"Wrote {OUT} ({len(html.splitlines())} lines, {len(html)} bytes)")
print(f"Hoisted {len(hoisted)} CDN dep tag(s).")
