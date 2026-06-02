// graph.js — ServiceScope Blast Radius Demo
// Canvas-based force-directed dependency graph with interactive blast-radius highlighting.

(function () {
  'use strict';

  // ─── DATA ────────────────────────────────────────────────────────────────────

  const NODES_DEF = [
    { id: 'api-gateway',      label: 'api-gateway'  },
    { id: 'auth-service',     label: 'auth-svc'     },
    { id: 'user-service',     label: 'user-svc'     },
    { id: 'order-service',    label: 'order-svc'    },
    { id: 'payment-svc',      label: 'payment-svc'  },
    { id: 'inventory-svc',    label: 'inventory'    },
    { id: 'notification-svc', label: 'notify'       },
    { id: 'audit-log',        label: 'audit-log'    },
    { id: 'cache-svc',        label: 'cache'        },
    { id: 'search-svc',       label: 'search'       },
    { id: 'analytics-svc',    label: 'analytics'    },
    { id: 'config-svc',       label: 'config'       },
  ];

  // "from calls to" — directed dependency edge
  const EDGES_DEF = [
    { from: 'api-gateway',     to: 'auth-service'     },
    { from: 'api-gateway',     to: 'user-service'     },
    { from: 'api-gateway',     to: 'order-service'    },
    { from: 'api-gateway',     to: 'search-svc'       },
    { from: 'auth-service',    to: 'cache-svc'        },
    { from: 'auth-service',    to: 'audit-log'        },
    { from: 'user-service',    to: 'cache-svc'        },
    { from: 'user-service',    to: 'notification-svc' },
    { from: 'order-service',   to: 'payment-svc'      },
    { from: 'order-service',   to: 'inventory-svc'    },
    { from: 'order-service',   to: 'notification-svc' },
    { from: 'payment-svc',     to: 'audit-log'        },
    { from: 'payment-svc',     to: 'notification-svc' },
    { from: 'inventory-svc',   to: 'config-svc'       },
    { from: 'analytics-svc',   to: 'audit-log'        },
    { from: 'analytics-svc',   to: 'user-service'     },
    { from: 'search-svc',      to: 'cache-svc'        },
  ];

  // ─── PHYSICS CONSTANTS ───────────────────────────────────────────────────────

  const NODE_R     = 24;   // node radius px (logical)
  const SPRING_LEN = 110;  // edge rest length
  const SPRING_K   = 0.045;
  const REPEL_K    = 2600;
  const DAMPING    = 0.80;
  const CENTER_K   = 0.006;

  // ─── STATE ───────────────────────────────────────────────────────────────────

  let canvas, ctx, infoStrip, infoText;
  let nodes = [], edges = [];
  let selectedId = null;
  let hoveredId  = null;
  let blastSet   = new Set();
  let upstreamSet = new Set();
  let fwdAdj    = new Map(); // id → [id, ...]
  let revAdj    = new Map();
  let nodesById = new Map(); // id → node (O(1) lookup)
  let physicsFrames = 0;
  let needsRender   = true;
  let rafId = null;
  let scale = 1; // logical px per CSS px (for DPI)
  let logicalW = 0, logicalH = 0;

  // ─── INIT ────────────────────────────────────────────────────────────────────

  let initialized = false;
  function init() {
    if (initialized) return;
    initialized = true;
    canvas    = document.getElementById('serviceGraph');
    infoStrip = document.getElementById('graphInfoStrip');
    infoText  = document.getElementById('graphInfoText');
    if (!canvas) return;

    ctx = canvas.getContext('2d');
    buildAdjacency();
    sizeCanvas();
    spreadNodes();
    attachListeners();
    startObserver();
  }

  function sizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    logicalW = rect.width  || 660;
    logicalH = rect.height || 340;
    canvas.width  = logicalW * dpr;
    canvas.height = logicalH * dpr;
    ctx.scale(dpr, dpr);
    scale = dpr;
    needsRender = true;
  }

  function spreadNodes() {
    // Arrange in rough layers based on graph topology
    const layerAssign = {
      'api-gateway':     0,
      'analytics-svc':   0,
      'auth-service':    1,
      'user-service':    1,
      'order-service':   2,
      'search-svc':      1,
      'payment-svc':     3,
      'inventory-svc':   3,
      'notification-svc':3,
      'cache-svc':       2,
      'audit-log':       4,
      'config-svc':      4,
    };

    // Group by layer
    const layers = {};
    NODES_DEF.forEach(n => {
      const l = layerAssign[n.id] ?? 2;
      if (!layers[l]) layers[l] = [];
      layers[l].push(n.id);
    });

    nodes = NODES_DEF.map(def => ({
      ...def,
      x: logicalW / 2 + (Math.random() - 0.5) * 40,
      y: logicalH / 2 + (Math.random() - 0.5) * 40,
      vx: 0, vy: 0,
    }));
    nodesById = new Map(nodes.map(n => [n.id, n]));

    // Place by layer
    const numLayers = Math.max(...Object.keys(layers).map(Number)) + 1;
    Object.entries(layers).forEach(([layer, ids]) => {
      const l = Number(layer);
      const y = ((l + 0.5) / numLayers) * logicalH;
      ids.forEach((id, i) => {
        const x = ((i + 1) / (ids.length + 1)) * logicalW;
        const n = nodeById(id);
        if (n) { n.x = x; n.y = y; }
      });
    });
  }

  // ─── ADJACENCY ───────────────────────────────────────────────────────────────

  function buildAdjacency() {
    fwdAdj.clear(); revAdj.clear();
    NODES_DEF.forEach(n => { fwdAdj.set(n.id, []); revAdj.set(n.id, []); });
    EDGES_DEF.forEach(({ from, to }) => {
      fwdAdj.get(from)?.push(to);
      revAdj.get(to)?.push(from);
    });
    edges = EDGES_DEF.map(e => ({ ...e }));
  }

  function bfs(startId, adj) {
    const visited = new Set();
    const queue   = [...(adj.get(startId) ?? [])];
    while (queue.length) {
      const curr = queue.shift();
      if (visited.has(curr)) continue;
      visited.add(curr);
      adj.get(curr)?.forEach(n => { if (!visited.has(n)) queue.push(n); });
    }
    return visited;
  }

  // ─── PHYSICS ─────────────────────────────────────────────────────────────────

  function tickPhysics() {
    const cx = logicalW / 2, cy = logicalH / 2;
    nodes.forEach(n => { n.fx = 0; n.fy = 0; });

    // Repulsion
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const d2 = dx * dx + dy * dy + 0.5;
        const d  = Math.sqrt(d2);
        const f  = REPEL_K / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        nodes[i].fx -= fx; nodes[i].fy -= fy;
        nodes[j].fx += fx; nodes[j].fy += fy;
      }
    }

    // Springs
    edges.forEach(({ from, to }) => {
      const s = nodeById(from), t = nodeById(to);
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 1;
      const stretch = d - SPRING_LEN;
      const f  = SPRING_K * stretch;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      s.fx += fx; s.fy += fy;
      t.fx -= fx; t.fy -= fy;
    });

    // Centre gravity
    nodes.forEach(n => {
      n.fx += (cx - n.x) * CENTER_K;
      n.fy += (cy - n.y) * CENTER_K;
    });

    // Integrate
    nodes.forEach(n => {
      n.vx = (n.vx + n.fx) * DAMPING;
      n.vy = (n.vy + n.fy) * DAMPING;
      n.x  = Math.max(NODE_R + 8, Math.min(logicalW - NODE_R - 8, n.x + n.vx));
      n.y  = Math.max(NODE_R + 8, Math.min(logicalH - NODE_R - 8, n.y + n.vy));
    });
  }

  // ─── RENDER ──────────────────────────────────────────────────────────────────

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function drawArrow(x1, y1, x2, y2, color) {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const tx = x2 - Math.cos(angle) * (NODE_R + 3);
    const ty = y2 - Math.sin(angle) * (NODE_R + 3);
    const SZ = 6;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-SZ, SZ * 0.45);
    ctx.lineTo(-SZ, -SZ * 0.45);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function render() {
    ctx.clearRect(0, 0, logicalW, logicalH);

    const colEdge     = cssVar('--graph-edge');
    const colBlastE   = cssVar('--graph-edge-blast');
    const colUpstreamE= cssVar('--graph-edge-upstream');
    const colNode     = cssVar('--graph-node');
    const colNodeStr  = cssVar('--graph-node-stroke');
    const colHover    = cssVar('--graph-node-hover');
    const colBlast    = cssVar('--graph-blast');
    const colUpstream = cssVar('--graph-upstream');
    const colAccent   = cssVar('--accent');
    const colLabel    = cssVar('--graph-label');
    const colLabelSel = '#ffffff';

    // Draw edges
    edges.forEach(({ from, to }) => {
      const s = nodeById(from), t = nodeById(to);
      if (!s || !t) return;

      const isBlastPath    = selectedId && blastSet.has(to)    && (from === selectedId || blastSet.has(from));
      const isUpstreamPath = selectedId && upstreamSet.has(from) && (to === selectedId || upstreamSet.has(to));
      const color = isBlastPath ? colBlastE : isUpstreamPath ? colUpstreamE : colEdge;

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = color;
      ctx.lineWidth   = (isBlastPath || isUpstreamPath) ? 2.5 : 1.5;
      ctx.stroke();
      drawArrow(s.x, s.y, t.x, t.y, color);
    });

    // Draw nodes
    nodes.forEach(n => {
      const isSel      = n.id === selectedId;
      const isBlast    = blastSet.has(n.id);
      const isUpstream = upstreamSet.has(n.id);
      const isHov      = n.id === hoveredId;
      const hasSel     = selectedId !== null;

      let fill   = isHov ? colHover : colNode;
      let stroke = colNodeStr;
      let lw     = 1.5;
      let alpha  = (hasSel && !isSel && !isBlast && !isUpstream) ? 0.35 : 1;

      if (isSel)      { fill = colAccent;   stroke = colAccent;   lw = 2.5; alpha = 1; }
      else if (isBlast)    { fill = colBlast;    stroke = colBlast;    lw = 2;   alpha = 1; }
      else if (isUpstream) { fill = colUpstream; stroke = colUpstream; lw = 2;   alpha = 1; }

      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(n.x, n.y, NODE_R, 0, Math.PI * 2);
      ctx.fillStyle   = fill;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth   = lw;
      ctx.stroke();

      ctx.fillStyle    = (isSel || isBlast || isUpstream) ? colLabelSel : colLabel;
      ctx.font         = `500 9.5px var(--mono, monospace)`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(n.label, n.x, n.y);
      ctx.globalAlpha  = 1;
    });
  }

  // ─── INFO STRIP ──────────────────────────────────────────────────────────────

  function updateInfoStrip() {
    if (!infoText) return;
    if (!selectedId) {
      infoStrip?.classList.remove('has-selection');
      return;
    }
    const blast    = blastSet.size;
    const upstream = upstreamSet.size;
    infoText.innerHTML =
      `<strong>${selectedId}</strong> &mdash; ` +
      `<span class="info-blast">${blast} downstream service${blast !== 1 ? 's' : ''} affected</span>` +
      (upstream ? ` · <span class="info-upstream">${upstream} upstream caller${upstream !== 1 ? 's' : ''}</span>` : '');
    infoStrip?.classList.add('has-selection');
  }

  // ─── INTERACTION ─────────────────────────────────────────────────────────────

  function nodeById(id) {
    return nodesById.get(id) ?? null;
  }

  function hitTest(lx, ly) {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n  = nodes[i];
      const dx = lx - n.x, dy = ly - n.y;
      if (dx * dx + dy * dy <= NODE_R * NODE_R) return n;
    }
    return null;
  }

  function toLogical(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (logicalW / rect.width),
      y: (e.clientY - rect.top)  * (logicalH / rect.height),
    };
  }

  function select(id) {
    if (id === selectedId) {
      selectedId  = null;
      blastSet    = new Set();
      upstreamSet = new Set();
    } else {
      selectedId  = id;
      blastSet    = bfs(id, fwdAdj);
      upstreamSet = bfs(id, revAdj);
    }
    updateInfoStrip();
    physicsFrames = 15;
    needsRender   = true;
  }

  function attachListeners() {
    canvas.addEventListener('mousemove', e => {
      const { x, y } = toLogical(e);
      const hit = hitTest(x, y);
      const newId = hit ? hit.id : null;
      if (newId !== hoveredId) {
        hoveredId     = newId;
        canvas.style.cursor = newId ? 'pointer' : 'default';
        needsRender   = true;
      }
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredId   = null;
      canvas.style.cursor = 'default';
      needsRender = true;
    });

    canvas.addEventListener('click', e => {
      const { x, y } = toLogical(e);
      const hit = hitTest(x, y);
      if (hit) {
        select(hit.id);
      } else {
        selectedId  = null;
        blastSet    = new Set();
        upstreamSet = new Set();
        updateInfoStrip();
        needsRender = true;
      }
    });

    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      const t = e.changedTouches[0];
      canvas.dispatchEvent(new MouseEvent('click', { clientX: t.clientX, clientY: t.clientY }));
    }, { passive: false });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        sizeCanvas();
        // Don't re-randomize — let physics re-settle from current positions
        physicsFrames = 30;
      }, 120);
    });

    // Re-render when light/dark theme toggles
    new MutationObserver(() => { needsRender = true; })
      .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ─── ANIMATION LOOP ──────────────────────────────────────────────────────────

  function loop() {
    rafId = requestAnimationFrame(loop);
    if (physicsFrames > 0) {
      tickPhysics();
      physicsFrames--;
      needsRender = true;
    }
    if (needsRender) {
      render();
      needsRender = false;
    }
  }

  function startObserver() {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!rafId) loop();
      } else {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      }
    }, { threshold: 0.05 });
    obs.observe(canvas);
    physicsFrames = 140; // initial warm-up settle
  }

  // ─── ENTRY POINT ─────────────────────────────────────────────────────────────

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
