// main.js — Portfolio Interactions
// Theme, mobile nav, scroll-spy, reveal animations, animated counters.

(function () {
  'use strict';

  const THEME_KEY = 'portfolio-theme';

  // ─── THEME ───────────────────────────────────────────────────────────────────
  // NOTE: Initial theme is already applied via inline script in <head> to prevent FOUC.

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  function initTheme() {
    const saved     = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved ?? preferred);
  }

  function bindTheme() {
    const btn = document.getElementById('themeToggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next    = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ─── MOBILE NAV ──────────────────────────────────────────────────────────────

  function initMobileNav() {
    const sidebar  = document.getElementById('sidebar');
    const hamburger = document.getElementById('hamburger');
    const overlay  = document.getElementById('drawerOverlay');
    if (!sidebar || !hamburger) return;

    function open() {
      sidebar.classList.add('is-open');
      overlay?.classList.add('is-visible');
      hamburger.setAttribute('aria-expanded', 'true');
      hamburger.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function close() {
      sidebar.classList.remove('is-open');
      overlay?.classList.remove('is-visible');
      hamburger.setAttribute('aria-expanded', 'false');
      hamburger.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', () =>
      sidebar.classList.contains('is-open') ? close() : open()
    );

    overlay?.addEventListener('click', close);

    sidebar.querySelectorAll('.nav-link').forEach(a =>
      a.addEventListener('click', () => {
        if (window.innerWidth < 769) close();
      })
    );

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
    });
  }

  // ─── SCROLL-SPY ──────────────────────────────────────────────────────────────

  function initScrollSpy() {
    const sections = document.querySelectorAll('section[id]');
    const links    = document.querySelectorAll('.nav-link[data-section]');
    if (!sections.length || !links.length) return;

    const ratios = new Map();
    sections.forEach(s => ratios.set(s.id, 0));

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => ratios.set(e.target.id, e.intersectionRatio));
        let maxId = null, maxR = 0;
        ratios.forEach((r, id) => { if (r > maxR) { maxR = r; maxId = id; } });
        if (maxId) {
          links.forEach(a => a.classList.toggle('is-active', a.dataset.section === maxId));
        }
      },
      {
        threshold: [0, 0.1, 0.25, 0.4, 0.6],
        rootMargin: '-8% 0px -30% 0px',
      }
    );
    sections.forEach(s => obs.observe(s));
  }

  // ─── REVEAL ANIMATIONS ───────────────────────────────────────────────────────

  function initReveal() {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.07, rootMargin: '0px 0px -48px 0px' }
    );
    els.forEach(el => obs.observe(el));
  }

  // ─── ANIMATED COUNTERS ───────────────────────────────────────────────────────
  // Elements: <span class="counter" data-target="17" data-suffix="K+" data-prefix="" data-decimal="0">

  function animateCounter(el) {
    const target   = parseFloat(el.dataset.target  ?? '0');
    const suffix   = el.dataset.suffix  ?? '';
    const prefix   = el.dataset.prefix  ?? '';
    const decimals = parseInt(el.dataset.decimal ?? '0', 10);

    // No animation needed for zero — just render the final value immediately.
    if (target === 0) {
      el.textContent = prefix + (0).toFixed(decimals) + suffix;
      return;
    }

    const duration = 1500;
    const start    = performance.now();

    function tick(now) {
      const t = Math.min((now - start) / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const val   = target * eased;
      const formatted = val >= 1000
        ? val.toLocaleString('en-US', { maximumFractionDigits: decimals })
        : val.toFixed(decimals);
      el.textContent = prefix + formatted + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    const els = document.querySelectorAll('.counter');
    if (!els.length) return;

    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCounter(e.target);
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.6 }
    );
    els.forEach(el => obs.observe(el));
  }

  // ─── SMOOTH SCROLL OFFSET ────────────────────────────────────────────────────
  // On mobile, the sticky header is 56px tall — offset anchor scrolls.

  function initAnchorOffset() {
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const target = document.querySelector(a.getAttribute('href'));
        if (!target) return;
        // Only override on mobile where the header is visible
        if (window.innerWidth < 769) {
          e.preventDefault();
          const offset = 64;
          const top    = target.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ─── DYNAMIC RENDERING ───────────────────────────────────────────────────────

  function initHeroPills() {
    if (typeof window.portfolioData === 'undefined') return;
    const pills = document.querySelectorAll('.hero-roles .role-pill');
    const heroText = document.getElementById('hero-body-text');
    if (!pills.length || !heroText) return;

    let transitionInProgress = false;

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        // Prevent action if pill is already active or transitioning to avoid glitching/lagging
        if (pill.classList.contains('active') || transitionInProgress) return;

        const targetRole = pill.textContent.trim();
        const nextContent = window.portfolioData.hero[targetRole];
        if (!nextContent) return;

        // Mark active role
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        // Transition safety guard to lock interactivity during change
        transitionInProgress = true;
        
        // Micro-displacement combined with opacity fade-out
        heroText.style.opacity = '0';
        heroText.style.transform = 'translateY(6px)';

        const onTransitionEnd = (e) => {
          if (e.propertyName !== 'opacity') return;
          heroText.removeEventListener('transitionend', onTransitionEnd);

          // Update content
          heroText.innerHTML = nextContent;

          // Force reflow/layout tick to ensure browser records updated state before next transition
          void heroText.offsetHeight;

          // Animate back to original position and opacity
          heroText.style.opacity = '1';
          heroText.style.transform = 'translateY(0)';
          
          transitionInProgress = false;
        };

        heroText.addEventListener('transitionend', onTransitionEnd);
      });
    });

    // Make transitions smooth for both transform and opacity
    heroText.style.transition = 'opacity var(--dur) var(--ease), transform var(--dur) var(--ease)';
  }

  function renderExperience() {
    if (typeof window.portfolioData === 'undefined') return;
    const container = document.getElementById('experience-container');
    if (!container) return;

    let html = '';
    window.portfolioData.experience.forEach(exp => {
      const bulletsHtml = exp.bullets.map(b => `<li>${b}</li>`).join('');
      const metricsHtml = exp.metrics.map(m => `
        <div class="m-item">
          <span class="m-num counter" data-target="${m.target}" ${m.suffix ? `data-suffix="${m.suffix}"` : ''} ${m.prefix ? `data-prefix="${m.prefix}"` : ''} ${m.decimal ? `data-decimal="${m.decimal}"` : ''}>${m.prefix||''}${m.target}${m.suffix||''}</span>
          <span class="m-label">${m.label}</span>
        </div>
      `).join('');
      const stackHtml = exp.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');

      html += `
        <div class="exp-entry">
          <div class="exp-header">
            <div class="exp-logo" aria-hidden="true">${exp.logo}</div>
            <div>
              <h3>${exp.company}</h3>
            </div>
          </div>
          <div class="exp-role">${exp.role}</div>
          <div class="exp-period">${exp.period}</div>
          <ul class="exp-bullets">
            ${bulletsHtml}
          </ul>
          <div class="project-sub">
            <div class="project-sub-top">
              <span class="project-sub-title">${exp.projectTitle}</span>
              <span class="status-pill ${exp.projectStatus === 'Production' ? 'status-complete' : ''}">${exp.projectStatus}</span>
            </div>
            <p class="project-sub-desc">${exp.projectDesc}</p>
            <div class="metrics-row">
              ${metricsHtml}
            </div>
            <div class="stack-row">
              ${stackHtml}
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  function renderProjects() {
    if (typeof window.portfolioData === 'undefined') return;
    const container = document.getElementById('projects-container');
    if (!container) return;

    let html = '';
    window.portfolioData.projects.forEach(proj => {
      const pipelineHtml = proj.pipeline.map((step, i) => `
        <span class="pipe-step">${step}</span>
        ${i < proj.pipeline.length - 1 ? `<span class="pipe-arrow">→</span>` : ''}
      `).join('');

      const graphDemoHtml = proj.hasGraphDemo ? `
        <!-- ── LIVE GRAPH DEMO ──────────────────────── -->
        <div class="graph-demo" role="img" aria-label="Interactive ServiceScope dependency graph demo">
          <div class="graph-demo-header">
            <span class="graph-demo-label">// live demo — blast radius analysis</span>
            <span class="graph-demo-hint">Click any service node to see what breaks</span>
          </div>
          <canvas id="serviceGraph" aria-label="Microservice dependency graph — click a node to see blast radius"></canvas>
          <div class="graph-info-strip" id="graphInfoStrip">
            <span class="graph-info-text" id="graphInfoText">Select a service to run blast-radius analysis</span>
          </div>
          <div class="graph-legend" aria-label="Graph legend">
            <span class="legend-item">
              <span class="legend-dot selected" aria-hidden="true"></span>Selected service
            </span>
            <span class="legend-item">
              <span class="legend-dot blast" aria-hidden="true"></span>Downstream (breaks)
            </span>
            <span class="legend-item">
              <span class="legend-dot upstream" aria-hidden="true"></span>Upstream callers
            </span>
          </div>
        </div>
      ` : '';

      const bulletsHtml = proj.bullets.map(b => `<li>${b}</li>`).join('');
      
      const metricsHtml = proj.metrics.map(m => {
        if (m.raw) {
          return `
            <div class="m-item">
              <span class="m-num">${m.prefix||''}${m.target}${m.suffix||''}</span>
              <span class="m-label">${m.label}</span>
            </div>
          `;
        }
        return `
          <div class="m-item">
            <span class="m-num counter" data-target="${m.target}" ${m.suffix ? `data-suffix="${m.suffix}"` : ''} ${m.prefix ? `data-prefix="${m.prefix}"` : ''} ${m.decimal ? `data-decimal="${m.decimal}"` : ''}>${m.prefix||''}${m.target}${m.suffix||''}</span>
            <span class="m-label">${m.label}</span>
          </div>
        `;
      }).join('');

      const stackHtml = proj.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');
      
      const linksHtml = proj.links.map(l => `
        <a href="${l.url}" ${l.url !== '#' ? 'target="_blank" rel="noopener"' : ''} class="p-link ${l.muted ? 'muted' : ''}">${l.text}</a>
      `).join('');

      html += `
        <article class="project-card reveal" aria-labelledby="${proj.id}-heading">
          <div class="project-card-top">
            <h3 id="${proj.id}-heading">${proj.title}</h3>
            <span class="status-pill ${proj.statusClass}">${proj.status}</span>
          </div>
          <p class="project-card-desc">${proj.desc}</p>
          <div class="project-pipeline" aria-label="Processing pipeline">
            ${pipelineHtml}
          </div>
          ${graphDemoHtml}
          <ul class="project-bullets">
            ${bulletsHtml}
          </ul>
          <div class="metrics-row">
            ${metricsHtml}
          </div>
          <div class="stack-row stack-row--flush">
            ${stackHtml}
          </div>
          <div class="project-links">
            ${linksHtml}
          </div>
        </article>
      `;
    });
    container.innerHTML = html;
  }

  function renderResearch() {
    if (typeof window.portfolioData === 'undefined') return;
    const container = document.getElementById('research-container');
    if (!container) return;

    let html = '';
    window.portfolioData.research.forEach(res => {
      const bulletsHtml = res.bullets.map(b => `<li>${b}</li>`).join('');
      const stackHtml = res.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');

      html += `
        <article class="project-card reveal" aria-labelledby="${res.id}-heading">
          <div class="project-card-top">
            <h3 id="${res.id}-heading">${res.title}</h3>
            <span class="status-pill ${res.statusClass}">${res.status}</span>
          </div>
          <p class="project-card-desc">${res.desc}</p>
          <ul class="project-bullets">
            ${bulletsHtml}
          </ul>
          <div class="stack-row">
            ${stackHtml}
          </div>
        </article>
      `;
    });
    container.innerHTML = html;
  }

  function renderWriting() {
    if (typeof window.portfolioData === 'undefined') return;
    const container = document.getElementById('writing-container');
    if (!container) return;

    let html = '';
    window.portfolioData.writing.forEach(w => {
      html += `
        <a href="${w.url}" target="_blank" rel="noopener" class="writing-entry">
          <div class="w-icon" aria-hidden="true">${w.icon}</div>
          <div class="w-body">
            <div class="w-meta">${w.meta}</div>
            <div class="w-title">${w.title}</div>
            <div class="w-desc">${w.desc}</div>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
  }

  // ─── BOOT ────────────────────────────────────────────────────────────────────

  function boot() {
    initTheme();
    bindTheme();
    
    // Inject dynamic data before initializing observers
    initHeroPills();
    renderExperience();
    renderProjects();
    renderResearch();
    renderWriting();

    initMobileNav();
    initScrollSpy();
    initReveal();
    initCounters();
    initAnchorOffset();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
