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
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {
      console.warn('localStorage is blocked or unavailable:', e);
    }
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
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        console.warn('localStorage is blocked or unavailable:', e);
      }
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

  function initHeroTerminal() {
    const body = document.getElementById('term-body');
    if (!body) return;

    const lines = [
      { text: "$ clairvoyant --optimize --engine=vllm", type: "cmd" },
      { text: "[INFO] Initializing XGBoost prompt complexity classifier...", type: "info" },
      { text: "[INFO] Loading pre-trained model (ShareGPT balanced corpus)...", type: "info" },
      { text: "[SUCCESS] XGBoost model loaded. Accuracy: 94.2%. Overhead: <1.2ms.", type: "success" },
      { text: "[INFO] Hooking upstream serving queue at localhost:8000...", type: "info" },
      { text: "[INFO] Serving active queue: Shortest-Job-First (SJF) active.", type: "info" },
      { text: "[SUCCESS] Serving active queue. HOL blocking mitigated.", type: "success" },
      { text: "[METRIC] P99 short-job latency reduced by 34.2%.", type: "warn" },
      { text: "[METRIC] Compute cluster efficiency improved: +28.4%.", type: "warn" },
      { text: "$ aco --balance --cluster=heterogeneous", type: "cmd" },
      { text: "[INFO] Querying active GPU cluster topology: 2x H100, 2x A100, 4x T4.", type: "info" },
      { text: "[INFO] Online fit completed in 7.8ms. SLA adherence: 98.2%.", type: "success" }
    ];

    let currentLine = 0;
    let charIndex = 0;
    let curElem = null;

    function type() {
      // Check if element is still in DOM (prevents background memory leak if navigated away)
      if (!document.getElementById('term-body')) return;

      if (currentLine >= lines.length) {
        setTimeout(() => {
          body.innerHTML = '';
          currentLine = 0;
          charIndex = 0;
          type();
        }, 4000);
        return;
      }

      const lineData = lines[currentLine];
      
      if (charIndex === 0) {
        curElem = document.createElement('div');
        curElem.className = `term-line ${lineData.type}`;
        body.appendChild(curElem);
        body.scrollTop = body.scrollHeight;
      }

      if (charIndex < lineData.text.length) {
        curElem.textContent += lineData.text[charIndex];
        charIndex++;
        setTimeout(type, lineData.type === 'cmd' ? 40 : 12);
      } else {
        currentLine++;
        charIndex = 0;
        setTimeout(type, 750);
      }
    }

    type();
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
        <div class="exp-entry experience-split">
          <div class="exp-left">
            <div class="exp-header">
              <div class="exp-logo" aria-hidden="true">${exp.logo}</div>
              <div>
                <h3 style="font-family: var(--display); font-weight: 700; font-size: 19px;">${exp.company}</h3>
              </div>
            </div>
            <div class="exp-role">${exp.role}</div>
            <div class="exp-period">${exp.period}</div>
            <ul class="exp-bullets">
              ${bulletsHtml}
            </ul>
          </div>
          <div class="exp-right">
            <div class="project-sub">
              <div class="project-sub-top">
                <span class="project-sub-title" style="font-family: var(--display); font-weight: 600; font-size: 14.5px;">${exp.projectTitle}</span>
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
      const focusHtml = proj.focus.map(f => `
        <span class="project-focus-item">${f}</span>
      `).join('');

      // Render simulator canvas placeholder
      let simWidgetHtml = '';
      if (proj.hasSim === 'clairvoyant') {
        simWidgetHtml = `
          <div class="sys-simulation" id="sim-clairvoyant" role="img" aria-label="Clairvoyant Scheduling Simulation">
            <div class="sim-header">
              <span class="sim-label">// SYSTEM SIMULATION — QUEUE TRAFFIC SHAPING</span>
              <span class="sim-hint">Toggle scheduler mode to optimize P99 latencies</span>
            </div>
            <div class="sim-workspace">
              <div class="sim-controls">
                <button class="sim-btn active" id="btn-clairvoyant-fifo" data-mode="fifo">FIFO (vLLM Default)</button>
                <button class="sim-btn" id="btn-clairvoyant-sjf" data-mode="sjf">Clairvoyant (XGBoost SJF)</button>
              </div>
              <div class="sim-visuals">
                <canvas id="canvas-clairvoyant"></canvas>
              </div>
              <div class="sim-dashboard">
                <div class="dash-metric">
                  <span class="dash-val" id="clairvoyant-p99">0.0s</span>
                   <span class="dash-lbl">P99 Latency</span>
                </div>
                <div class="dash-metric">
                  <span class="dash-val" id="clairvoyant-throughput">0 req/s</span>
                   <span class="dash-lbl">Throughput</span>
                </div>
                <div class="dash-metric">
                  <span class="dash-val" id="clairvoyant-hol">Active</span>
                   <span class="dash-lbl">HOL Blocking</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (proj.hasSim === 'aco') {
        simWidgetHtml = `
          <div class="sys-simulation" id="sim-aco" role="img" aria-label="ACO Cluster Scheduler Simulation">
            <div class="sim-header">
              <span class="sim-label">// SYSTEM SIMULATION — HETEROGENEOUS GPU SCHEDULER</span>
              <span class="sim-hint">Toggle placement algorithm to balance cluster loads</span>
            </div>
            <div class="sim-workspace">
              <div class="sim-controls">
                <button class="sim-btn active" id="btn-aco-static" data-mode="static">First-Fit (Static)</button>
                <button class="sim-btn" id="btn-aco-colony" data-mode="colony">ACO Orchestrator</button>
              </div>
              <div class="sim-visuals">
                <canvas id="canvas-aco"></canvas>
              </div>
              <div class="sim-dashboard">
                <div class="dash-metric">
                  <span class="dash-val" id="aco-util">0%</span>
                  <span class="dash-lbl">GPU Utilization</span>
                </div>
                <div class="dash-metric">
                  <span class="dash-val" id="aco-sla">100%</span>
                  <span class="dash-lbl">SLA Adherence</span>
                </div>
                <div class="dash-metric">
                  <span class="dash-val" id="aco-time"><1ms</span>
                  <span class="dash-lbl">Scheduling Cost</span>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (proj.hasSim === 'servicescope') {
        simWidgetHtml = `
          <div class="graph-demo" role="img" aria-label="Interactive ServiceScope dependency graph demo">
            <div class="graph-demo-header">
              <span class="graph-demo-label">// live dependency graph — blast radius resolver</span>
              <span class="graph-demo-hint">Click any service node to analyze dynamic callers</span>
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
                <span class="legend-dot blast" aria-hidden="true"></span>Downstream blast radius
               </span>
              <span class="legend-item">
                <span class="legend-dot upstream" aria-hidden="true"></span>Upstream callers
               </span>
            </div>
          </div>
        `;
      }

      const bulletsHtml = proj.bullets.map(b => `<li>${b}</li>`).join('');
      
      const metricsHtml = proj.metrics.map(m => {
        const prefix = m.prefix || '';
        const suffix = m.suffix || '';
        const decimal = m.decimal !== undefined ? m.decimal : 0;
        return `
          <div class="m-item">
            <span class="m-num counter" data-target="${m.target}" data-suffix="${suffix}" data-prefix="${prefix}" data-decimal="${decimal}">
              ${prefix}${m.target}${suffix}
            </span>
            <span class="m-label">${m.label}</span>
          </div>
        `;
      }).join('');

      const stackHtml = proj.stack.map(s => `<span class="stack-tag">${s}</span>`).join('');
      
      const linksHtml = proj.links.map(l => `
        <a href="${l.url}" target="_blank" rel="noopener" class="p-link">${l.text}</a>
      `).join('');

      html += `
        <article class="project-card reveal" aria-labelledby="${proj.id}-heading">
          <!-- Top Info Section -->
          <div class="project-card-header">
            <div class="project-card-top">
              <h3 id="${proj.id}-heading" style="font-family: var(--display); font-weight: 700; font-size: 21px; margin-bottom: 2px;">${proj.title}</h3>
              <span class="status-pill ${proj.statusClass}">${proj.status}</span>
            </div>
            <div class="project-subtitle">${proj.subtitle}</div>

            <div class="project-problem">
              <span class="project-problem-label">Core Systems Bottleneck</span>
              <p class="project-problem-text">"${proj.problem}"</p>
            </div>
          </div>
          
          <!-- Full-Width Simulator / Canvas Section -->
          <div class="project-card-sim">
            ${simWidgetHtml}
          </div>

          <!-- Bottom Two-Column Details Grid -->
          <div class="project-details-grid">
            <!-- Left Column: Specs -->
            <div class="project-details-left">
              <div class="project-focus" aria-label="Project focus areas">
                ${focusHtml}
              </div>
              <p class="project-card-desc">${proj.desc}</p>
              <ul class="project-bullets">
                ${bulletsHtml}
              </ul>
            </div>

            <!-- Right Column: Stats & Stack & Links -->
            <div class="project-details-right">
              <div class="metrics-row">
                ${metricsHtml}
              </div>
              <div class="stack-row stack-row--flush">
                ${stackHtml}
              </div>
              <div class="project-links">
                ${linksHtml}
              </div>
            </div>
          </div>
        </article>
      `;
    });
    container.innerHTML = html;
  }

  function renderResearchInterests() {
    if (typeof window.portfolioData === 'undefined') return;
    const container = document.getElementById('research-interests-container');
    if (!container) return;

    let html = '';
    window.portfolioData.researchInterests.forEach(interest => {
      html += `
        <div class="research-card-item">
          <div class="research-card-title">${interest.title}</div>
          <div class="research-card-desc">${interest.desc}</div>
        </div>
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
            <div class="w-title" style="font-family: var(--display); font-weight: 600; font-size: 14.5px;">${w.title}</div>
            <div class="w-desc">${w.desc}</div>
          </div>
        </a>
      `;
    });
    container.innerHTML = html;
  }

  let initialized = false;
  function boot() {
    if (initialized) return;
    initialized = true;
    initTheme();
    bindTheme();
    
    // Inject dynamic data before initializing observers
    initHeroTerminal();
    renderExperience();
    renderProjects();
    renderResearchInterests();
    renderWriting();

    initMobileNav();
    initScrollSpy();
    initReveal();
    initCounters();
    initAnchorOffset();

    // Boot simulator engines after rendering canvases
    if (typeof window.initPortfolioSimulations === 'function') {
      window.initPortfolioSimulations();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
