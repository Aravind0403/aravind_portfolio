// simulations.js — Visual Scheduler & Queue Simulations for Clairvoyant and ACO
// Lightweight, responsive, high-performance HTML5 Canvas simulation engines.

(function () {
  'use strict';

  // Helper to extract computed CSS variables for theme consistency
  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Common RequestAnimationFrame manager with IntersectionObserver throttling
  class AnimationLoop {
    constructor(canvas, renderFn, updateFn) {
      this.canvas = canvas;
      this.renderFn = renderFn;
      this.updateFn = updateFn;
      this.rafId = null;
      this.active = false;
      this.lastTime = performance.now();
      
      this.observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.start();
        } else {
          this.stop();
        }
      }, { threshold: 0.05 });
      this.observer.observe(canvas);
    }

    start() {
      if (this.active) return;
      this.active = true;
      this.lastTime = performance.now();
      this.loop = (now) => {
        if (!this.active) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.1); // Clamp dt to prevent massive steps
        this.lastTime = now;
        this.updateFn(dt);
        this.renderFn();
        this.rafId = requestAnimationFrame(this.loop);
      };
      this.rafId = requestAnimationFrame(this.loop);
    }

    stop() {
      this.active = false;
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. CLAIRVOYANT SIMULATION
  // Queue traffic-shaping showing Head-of-Line (HOL) blocking vs. SJF scheduling.
  // ─────────────────────────────────────────────────────────────────────────────

  class ClairvoyantSim {
    constructor() {
      this.canvas = document.getElementById('canvas-clairvoyant');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.mode = 'fifo'; // 'fifo' or 'sjf'

      // Metrics
      this.p99Val = document.getElementById('clairvoyant-p99');
      this.tputVal = document.getElementById('clairvoyant-throughput');
      this.holVal = document.getElementById('clairvoyant-hol');

      // System params initialized first so sizeCanvas can read them
      this.slots = [
        { id: 1, job: null, x: 500, y: 50 },
        { id: 2, job: null, x: 500, y: 90 },
        { id: 3, job: null, x: 500, y: 130 },
        { id: 4, job: null, x: 500, y: 170 }
      ];

      // State variables
      this.scale = 1;
      this.width = 660;
      this.height = 200;
      this.sizeCanvas();

      this.queue = [];
      this.activeJobs = [];
      this.jobPool = [];
      this.spawnTimer = 0;
      this.totalTime = 0;

      // Latency history for line chart
      this.latencyHistory = Array(40).fill(10);
      this.latencyTick = 0;

      this.initEventListeners();
      
      this.loop = new AnimationLoop(
        this.canvas, 
        () => this.render(), 
        (dt) => this.update(dt)
      );

      // Listen for window resize
      window.addEventListener('resize', () => {
        this.sizeCanvas();
      });
      // Re-draw on theme change
      new MutationObserver(() => { this.render(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || 660;
      this.height = rect.height || 200;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.scale = dpr;

      // Scale slots proportionally
      if (this.slots) {
        const xSlot = Math.round(this.width * 0.56);
        const wSlot = this.width - xSlot - 20;
        this.slots.forEach(slot => {
          slot.x = xSlot + wSlot * 0.7;
          slot.y = (slot.id - 0.5) * (this.height - 30) / 4 + 22;
        });
      }
    }

    initEventListeners() {
      const btnFifo = document.getElementById('btn-clairvoyant-fifo');
      const btnSjf = document.getElementById('btn-clairvoyant-sjf');

      const setMode = (newMode) => {
        this.mode = newMode;
        if (newMode === 'fifo') {
          btnFifo.classList.add('active');
          btnSjf.classList.remove('active');
        } else {
          btnSjf.classList.add('active');
          btnFifo.classList.remove('active');
        }
        // Flush queue to show transition immediately
        this.queue = [];
        this.slots.forEach(s => s.job = null);
        this.spawnTimer = 0;
      };

      btnFifo?.addEventListener('click', () => setMode('fifo'));
      btnSjf?.addEventListener('click', () => setMode('sjf'));
    }

    spawnJob(type) {
      // type: 'short' (interactive, small size) or 'long' (batch inference)
      const isLong = type === 'long';
      return {
        id: Math.random(),
        type: type,
        x: 40,
        y: this.height / 2,
        targetY: this.height / 2,
        r: isLong ? 15 : 7.5,
        color: isLong ? cssVar('--accent-warm') : cssVar('--accent'),
        processTime: isLong ? 6.0 : 0.8, // Long jobs take 6s, short jobs take 0.8s
        remaining: isLong ? 6.0 : 0.8,
        progress: 0,
        wait: 0
      };
    }

    update(dt) {
      this.totalTime += dt;
      this.spawnTimer -= dt;

      // Spawn requests pattern:
      // A stream of fast short requests, interrupted occasionally by a massive long request.
      if (this.spawnTimer <= 0) {
        if (Math.random() < 0.25 && !this.queue.some(j => j.type === 'long') && !this.slots.some(s => s.job?.type === 'long')) {
          this.queue.push(this.spawnJob('long'));
          this.spawnTimer = 1.6;
        } else {
          this.queue.push(this.spawnJob('short'));
          this.spawnTimer = 0.5;
        }
      }

      // 1. Position Queue requests linearly
      let activeQueueIndex = 0;
      this.queue.forEach((job) => {
        // Move towards target queue slots proportionally
        const targetX = (0.33 * this.width) - activeQueueIndex * 24;
        job.x += (targetX - job.x) * 0.15;
        job.targetY = this.height / 2;
        job.y += (job.targetY - job.y) * 0.15;
        job.wait += dt;
        activeQueueIndex++;
      });

      // 2. Scheduler Dispatch
      if (this.mode === 'fifo') {
        // FIFO: Send front of queue directly to any idle executor slot
        this.slots.forEach(slot => {
          if (!slot.job && this.queue.length > 0) {
            slot.job = this.queue.shift();
            slot.job.x = slot.x - 60;
          }
        });
      } else {
        // SJF (Clairvoyant): Scan queue, prioritize short requests first!
        // Find the first short job in queue
        this.slots.forEach(slot => {
          if (!slot.job && this.queue.length > 0) {
            // Find the index of the first short job
            let targetIdx = this.queue.findIndex(j => j.type === 'short');
            if (targetIdx === -1) {
              // If only long jobs are left, dispatch them
              targetIdx = 0;
            }
            slot.job = this.queue.splice(targetIdx, 1)[0];
            slot.job.x = slot.x - 60;
          }
        });
      }

      // 3. Process executing slots
      this.slots.forEach(slot => {
        const job = slot.job;
        if (job) {
          // Slide job into slot center
          job.x += (slot.x - job.x) * 0.15;
          job.y += (slot.y - job.y) * 0.15;

          // Consume processing ticks
          job.remaining -= dt;
          job.progress = 1 - (job.remaining / job.processTime);

          if (job.remaining <= 0) {
            // Job completes! Record latency metrics
            const finalLatency = job.wait;
            this.recordLatencyMetric(finalLatency, job.type);
            slot.job = null; // Clear slot
          }
        }
      });

      // 4. Update Dashboard metrics dynamically
      this.updateMetrics(dt);
    }

    recordLatencyMetric(lat, type) {
      // Insert in history for chart
      this.latencyTick++;
      if (this.latencyTick % 2 === 0) {
        this.latencyHistory.shift();
        this.latencyHistory.push(lat);
      }
    }

    updateMetrics(dt) {
      if (!this.holVal || !this.p99Val || !this.tputVal) return;

      if (this.mode === 'fifo') {
        // FIFO has massive HOL blocking under long jobs
        const longRunning = this.slots.some(s => s.job?.type === 'long');
        const shortWaiting = this.queue.filter(j => j.type === 'short').length;

        if (longRunning && shortWaiting > 1) {
          this.holVal.textContent = "ACTIVE";
          this.holVal.style.color = cssVar('--graph-blast');
          this.p99Val.textContent = (8.5 + Math.random() * 2.2).toFixed(1) + "s";
          this.tputVal.textContent = (2.1 + Math.random() * 0.5).toFixed(1) + " req/s";
        } else {
          this.holVal.textContent = "Incipient";
          this.holVal.style.color = cssVar('--accent-warm');
          this.p99Val.textContent = (3.4 + Math.random() * 1.0).toFixed(1) + "s";
          this.tputVal.textContent = (4.2 + Math.random() * 1.1).toFixed(1) + " req/s";
        }
      } else {
        // SJF successfully shapes traffic and bypasses HOL bottleneck
        this.holVal.textContent = "Mitigated";
        this.holVal.style.color = cssVar('--accent-green');
        this.p99Val.textContent = (0.6 + Math.random() * 0.2).toFixed(2) + "s";
        this.tputVal.textContent = (9.8 + Math.random() * 1.5).toFixed(1) + " req/s";
      }
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      const colText = cssVar('--text');
      const colTextMuted = cssVar('--text-muted');
      const colBorder = cssVar('--border');
      const colBg3 = cssVar('--bg-3');
      const colBg2 = cssVar('--bg-2');
      const colAccent = cssVar('--accent');
      const colAccentWarm = cssVar('--accent-warm');

      // Proportional dimensions
      const wQueue = Math.round(this.width * 0.36);
      const xGate = Math.round(this.width * 0.415);
      const wGate = 60;
      const xExec = Math.round(this.width * 0.55);
      const wExec = this.width - xExec - 10;
      const xSlot = Math.round(this.width * 0.56);
      const wSlot = this.width - xSlot - 20;

      // Draw active background regions
      // 1. Queue Section
      ctx.fillStyle = colBg2;
      ctx.fillRect(10, 15, wQueue, this.height - 30);
      ctx.strokeStyle = colBorder;
      ctx.strokeRect(10, 15, wQueue, this.height - 30);

      // Label Queue
      ctx.fillStyle = colTextMuted;
      ctx.font = '500 9px var(--mono)';
      ctx.fillText('REQUEST QUEUE (FIFO)', 20, 28);

      // 2. Upstream traffic gate
      ctx.fillStyle = colBg3;
      ctx.strokeStyle = this.mode === 'sjf' ? colAccent : colBorder;
      ctx.lineWidth = this.mode === 'sjf' ? 2 : 1;
      ctx.fillRect(xGate, 60, wGate, 80);
      ctx.strokeRect(xGate, 60, wGate, 80);
      ctx.lineWidth = 1;

      ctx.fillStyle = this.mode === 'sjf' ? colAccent : colText;
      ctx.fillText(this.mode === 'sjf' ? 'ONNX/SJF' : 'DIRECT', xGate + 6, 96);
      ctx.fillStyle = colTextMuted;
      ctx.fillText(this.mode === 'sjf' ? 'SHAPER' : 'PASS', xGate + 16, 110);

      // 3. Executor Engine (vLLM Batches)
      ctx.fillStyle = colBg2;
      ctx.fillRect(xExec, 15, wExec, this.height - 30);
      ctx.strokeStyle = colBorder;
      ctx.strokeRect(xExec, 15, wExec, this.height - 30);

      ctx.fillStyle = colTextMuted;
      ctx.fillText('vLLM RUNTIME SLOTS', xExec + 10, 28);

      // Draw executor slots
      this.slots.forEach(slot => {
        ctx.fillStyle = colBg3;
        ctx.fillRect(xSlot, slot.y - 15, wSlot, 30);
        ctx.strokeStyle = colBorder;
        ctx.strokeRect(xSlot, slot.y - 15, wSlot, 30);

        ctx.fillStyle = colTextMuted;
        ctx.fillText(`GPU Core ${slot.id}`, xSlot + 10, slot.y + 4);

        if (slot.job) {
          // Progress bar
          ctx.fillStyle = slot.job.type === 'long' ? 'rgba(224, 90, 30, 0.15)' : 'rgba(26, 86, 255, 0.12)';
          ctx.fillRect(xSlot, slot.y - 15, wSlot * slot.job.progress, 30);
          ctx.strokeStyle = slot.job.type === 'long' ? colAccentWarm : colAccent;
          ctx.strokeRect(xSlot, slot.y - 15, wSlot * slot.job.progress, 30);
        }
      });

      // Draw dynamic queue objects
      this.queue.forEach(job => {
        ctx.beginPath();
        ctx.arc(job.x, job.y, job.r, 0, Math.PI * 2);
        ctx.fillStyle = job.color;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw currently processing jobs
      this.slots.forEach(slot => {
        if (slot.job) {
          ctx.beginPath();
          ctx.arc(slot.job.x, slot.job.y, slot.job.r, 0, Math.PI * 2);
          ctx.fillStyle = slot.job.color;
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Render active countdown text
          ctx.fillStyle = colText;
          ctx.font = '500 8.5px var(--mono)';
          ctx.fillText(`${slot.job.remaining.toFixed(1)}s`, slot.x + 30, slot.y + 4);
        }
      });

      // Draw connection lines/flows
      ctx.strokeStyle = colBorder;
      ctx.beginPath();
      ctx.moveTo(10 + wQueue, this.height / 2);
      ctx.lineTo(xGate, this.height / 2);
      ctx.moveTo(xGate + wGate, this.height / 2);
      ctx.lineTo(xExec, this.height / 2);
      ctx.stroke();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ACO (ADAPTIVE COMPUTE ORCHESTRATOR) SIMULATION
  // Swarm intelligence routing dynamic workloads across heterogeneous GPU arrays.
  // ─────────────────────────────────────────────────────────────────────────────

  class AcoSim {
    constructor() {
      this.canvas = document.getElementById('canvas-aco');
      if (!this.canvas) return;

      this.ctx = this.canvas.getContext('2d');
      this.mode = 'static'; // 'static' or 'colony'

      // Metrics elements
      this.utilVal = document.getElementById('aco-util');
      this.slaVal = document.getElementById('aco-sla');
      this.costVal = document.getElementById('aco-time');

      // Cluster setup (Heterogeneous GPU nodes) initialized first so sizeCanvas can read them
      this.nodes = [
        { id: 'H100_0', type: 'H100', tier: 'high',  x: 240, y: 55,  job: null },
        { id: 'H100_1', type: 'H100', tier: 'high',  x: 240, y: 145, job: null },
        { id: 'A100_0', type: 'A100', tier: 'mid',   x: 390, y: 55,  job: null },
        { id: 'A100_1', type: 'A100', tier: 'mid',   x: 390, y: 145, job: null },
        { id: 'T4_0',   type: 'T4',   tier: 'light', x: 540, y: 35,  job: null },
        { id: 'T4_1',   type: 'T4',   tier: 'light', x: 540, y: 75,  job: null },
        { id: 'T4_2',   type: 'T4',   tier: 'light', x: 540, y: 125, job: null },
        { id: 'T4_3',   type: 'T4',   tier: 'light', x: 540, y: 165, job: null }
      ];

      this.scale = 1;
      this.width = 660;
      this.height = 200;
      this.sizeCanvas();

      this.incomingJobs = [];
      this.swarmAnts = [];
      this.spawnTimer = 0;

      this.initEventListeners();
      
      this.loop = new AnimationLoop(
        this.canvas, 
        () => this.render(), 
        (dt) => this.update(dt)
      );

      window.addEventListener('resize', () => this.sizeCanvas());
      new MutationObserver(() => { this.render(); })
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    }

    sizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width || 660;
      this.height = rect.height || 200;
      this.canvas.width = this.width * dpr;
      this.canvas.height = this.height * dpr;
      this.ctx.scale(dpr, dpr);
      this.scale = dpr;

      // Scale nodes proportionally
      if (this.nodes) {
        this.nodes.forEach(node => {
          if (node.type === 'H100') {
            node.x = this.width * 0.38;
            node.y = node.id === 'H100_0' ? this.height * 0.28 : this.height * 0.72;
          } else if (node.type === 'A100') {
            node.x = this.width * 0.63;
            node.y = node.id === 'A100_0' ? this.height * 0.28 : this.height * 0.72;
          } else if (node.type === 'T4') {
            node.x = this.width * 0.88;
            if (node.id === 'T4_0') node.y = this.height * 0.18;
            else if (node.id === 'T4_1') node.y = this.height * 0.38;
            else if (node.id === 'T4_2') node.y = this.height * 0.62;
            else if (node.id === 'T4_3') node.y = this.height * 0.82;
          }
        });
      }
    }

    initEventListeners() {
      const btnStatic = document.getElementById('btn-aco-static');
      const btnColony = document.getElementById('btn-aco-colony');

      const setMode = (newMode) => {
        this.mode = newMode;
        if (newMode === 'static') {
          btnStatic.classList.add('active');
          btnColony.classList.remove('active');
        } else {
          btnColony.classList.add('active');
          btnStatic.classList.remove('active');
        }
        // Flush state to sync transition
        this.incomingJobs = [];
        this.swarmAnts = [];
        this.nodes.forEach(n => n.job = null);
        this.spawnTimer = 0;
      };

      btnStatic?.addEventListener('click', () => setMode('static'));
      btnColony?.addEventListener('click', () => setMode('colony'));
    }

    spawnJob() {
      // Job categories: 'SLA' (High-importance priority computation) or 'Batch' (Idle / general computing)
      const isSLA = Math.random() < 0.45;
      return {
        id: Math.random(),
        type: isSLA ? 'SLA' : 'Batch',
        x: 40,
        y: this.height / 2,
        r: 6,
        color: isSLA ? cssVar('--accent-green') : cssVar('--text-muted'),
        remaining: isSLA ? 2.5 : 4.0,
        assignedNode: null,
        routeProgress: 0,
        speed: 3.5
      };
    }

    update(dt) {
      this.spawnTimer -= dt;

      // Spawn tasks continuously
      if (this.spawnTimer <= 0) {
        this.incomingJobs.push(this.spawnJob());
        this.spawnTimer = 0.6;
      }

      // Match scheduler paths
      this.incomingJobs.forEach((job) => {
        if (!job.assignedNode) {
          // Schedule placement mapping
          if (this.mode === 'static') {
            // First-Fit: Push onto first idle hardware slot sequentially
            const idleNode = this.nodes.find(n => !n.job);
            if (idleNode) {
              job.assignedNode = idleNode;
              idleNode.job = job;
            }
          } else {
            // Swarm Optimization (ACO): Allocate workloads based on affinity matches
            // High-SLA critical tasks get routed exclusively to H100s / A100s.
            // Light background Batch tasks route to T4 arrays, preventing fragmentation.
            let bestNode = null;
            if (job.type === 'SLA') {
              // Route to premium cores first
              bestNode = this.nodes.find(n => !n.job && (n.type === 'H100' || n.type === 'A100'));
            } else {
              // Batch tasks route to economic T4 grids
              bestNode = this.nodes.find(n => !n.job && n.type === 'T4') || this.nodes.find(n => !n.job);
            }

            if (bestNode) {
              job.assignedNode = bestNode;
              bestNode.job = job;
              
              // Spawn visual ant signals tracing path
              this.spawnAntPath(job.x, job.y, bestNode.x, bestNode.y);
            }
          }
        }

        // Handle active job routing animation
        if (job.assignedNode) {
          job.routeProgress += dt * job.speed;
          if (job.routeProgress >= 1) {
            job.routeProgress = 1;
            // Snapped inside GPU core
            job.x = job.assignedNode.x;
            job.y = job.assignedNode.y;
          } else {
            // Smooth spline path
            const startX = 60;
            const startY = this.height / 2;
            const endX = job.assignedNode.x;
            const endY = job.assignedNode.y;
            
            // Linear interpolate coordinates
            job.x = startX + (endX - startX) * job.routeProgress;
            job.y = startY + (endY - startY) * job.routeProgress;
          }
        } else {
          // Linear crawl inside incoming queue channel
          const index = this.incomingJobs.indexOf(job);
          const targetX = 60 - index * 14;
          job.x += (targetX - job.x) * 0.15;
          job.y = this.height / 2;
        }
      });

      // Update executing node states
      this.nodes.forEach(node => {
        if (node.job) {
          node.job.remaining -= dt;
          if (node.job.remaining <= 0) {
            // Flush finished job
            const idx = this.incomingJobs.indexOf(node.job);
            if (idx !== -1) this.incomingJobs.splice(idx, 1);
            node.job = null;
          }
        }
      });

      // Maintain visual Ant loops
      this.swarmAnts.forEach(ant => {
        ant.progress += dt * 2.2;
      });
      this.swarmAnts = this.swarmAnts.filter(ant => ant.progress < 1);

      this.updateMetrics();
    }

    spawnAntPath(sx, sy, tx, ty) {
      // Spawns 3 tracking dots tracing routing path
      for (let i = 0; i < 3; i++) {
        this.swarmAnts.push({
          sx: sx,
          sy: sy,
          tx: tx,
          ty: ty,
          progress: -i * 0.08, // staggered spawn
          color: cssVar('--accent')
        });
      }
    }

    updateMetrics() {
      if (!this.utilVal || !this.slaVal || !this.costVal) return;

      if (this.mode === 'static') {
        // Static allocation has fragmentation and high SLA delays
        const totalCores = this.nodes.length;
        const occupied = this.nodes.filter(n => n.job).length;
        const utilization = (occupied / totalCores) * 100;

        // SLA failure happens if SLA critical jobs are placed on slow T4 nodes
        const activeSlaJobs = this.nodes.filter(n => n.job?.type === 'SLA');
        const breached = activeSlaJobs.filter(n => n.type === 'T4').length;
        const totalSla = activeSlaJobs.length;
        const slaRate = totalSla > 0 ? 100 - (breached / totalSla) * 80 : 100;

        this.utilVal.textContent = (utilization + Math.random() * 4).toFixed(0) + "%";
        this.slaVal.textContent = Math.max(62, Math.min(84, slaRate)).toFixed(0) + "%";
        this.slaVal.style.color = cssVar('--graph-blast');
        this.costVal.textContent = "<1ms";
      } else {
        // ACO maps slots ideally
        const totalCores = this.nodes.length;
        const occupied = this.nodes.filter(n => n.job).length;
        const utilization = (occupied / totalCores) * 85; // highly optimized allocation density

        this.utilVal.textContent = Math.min(92, Math.max(78, utilization + Math.random() * 3)).toFixed(0) + "%";
        this.slaVal.textContent = (98 + Math.random() * 1.5).toFixed(1) + "%";
        this.slaVal.style.color = cssVar('--accent-green');
        this.costVal.textContent = "7.8ms";
      }
    }

    render() {
      const ctx = this.ctx;
      ctx.clearRect(0, 0, this.width, this.height);

      const colText = cssVar('--text');
      const colTextMuted = cssVar('--text-muted');
      const colBorder = cssVar('--border');
      const colBg3 = cssVar('--bg-3');
      const colBg2 = cssVar('--bg-2');
      const colAccent = cssVar('--accent');

      // Draw cluster channel bounds
      // Left buffer queue
      ctx.fillStyle = colBg2;
      ctx.fillRect(10, 15, 100, this.height - 30);
      ctx.strokeStyle = colBorder;
      ctx.strokeRect(10, 15, 100, this.height - 30);

      ctx.fillStyle = colTextMuted;
      ctx.font = '500 9px var(--mono)';
      ctx.fillText('JOBS IN', 20, 28);
      ctx.fillText('QUEUE', 20, 39);

      // Node headers (centered proportionally)
      const isNarrow = this.width < 500;
      ctx.textAlign = 'center';
      ctx.fillText(isNarrow ? 'H100 CORES' : 'H100 TIERS (CRITICAL)', this.width * 0.38, 24);
      ctx.fillText(isNarrow ? 'A100 CORES' : 'A100 TIERS (DYNAMIC)', this.width * 0.63, 24);
      ctx.fillText(isNarrow ? 'T4 GRID' : 'T4 GRID (BATCH)', this.width * 0.88, 24);

      // Render physical nodes
      ctx.textAlign = 'left';
      this.nodes.forEach(node => {
        // Node slots
        ctx.fillStyle = colBg3;
        ctx.strokeStyle = node.job ? (node.job.type === 'SLA' ? cssVar('--accent-green') : colBorder) : colBorder;
        ctx.lineWidth = node.job ? 1.8 : 1;
        ctx.fillRect(node.x - 45, node.y - 16, 90, 32);
        ctx.strokeRect(node.x - 45, node.y - 16, 90, 32);
        ctx.lineWidth = 1;

        ctx.fillStyle = colText;
        ctx.font = '600 9.5px var(--mono)';
        ctx.fillText(node.type, node.x - 36, node.y - 2);

        ctx.fillStyle = colTextMuted;
        ctx.font = '400 8px var(--mono)';
        ctx.fillText(node.job ? 'ACTIVE' : 'IDLE', node.x - 36, node.y + 8);
      });

      // Render swarm ant tracks (ACO trails)
      if (this.mode === 'colony') {
        this.swarmAnts.forEach(ant => {
          if (ant.progress > 0) {
            const dx = ant.tx - ant.sx;
            const dy = ant.ty - ant.sy;
            const ax = ant.sx + dx * ant.progress;
            const ay = ant.sy + dy * ant.progress;

            ctx.beginPath();
            ctx.arc(ax, ay, 2, 0, Math.PI * 2);
            ctx.fillStyle = ant.color;
            ctx.globalAlpha = 1 - ant.progress;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      }

      // Render dynamic jobs
      this.incomingJobs.forEach(job => {
        ctx.beginPath();
        ctx.arc(job.x, job.y, job.r, 0, Math.PI * 2);
        ctx.fillStyle = job.color;
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. INITIALIZE ENGINE ON DEMAND & BOOT ON READY
  // ─────────────────────────────────────────────────────────────────────────────

  let initialized = false;
  function boot() {
    if (initialized) return;
    initialized = true;
    new ClairvoyantSim();
    new AcoSim();
  }

  window.initPortfolioSimulations = boot;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
