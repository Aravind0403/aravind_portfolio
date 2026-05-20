window.portfolioData = {
  hero: {
    "Distributed Systems": "At Microsoft I ran a distributed validation platform across <strong>17,000+ microservices</strong> — reducing manual audit toil by 70%. At Amazon I built the device infrastructure running Alexa 24/7 across 50+ physical devices.<br><br><em>This still feels like day one. Harder problems. Larger scale. End-to-end.</em>",
    "Platform Infrastructure": "I build resilient platforms that assume hardware failure and self-heal around it. From Azure-native BCDR active-passive designs to orchestration schedulers managing physical 24/7 test fleets.<br><br><em>Infrastructure that thousands of engineers depend on without thinking about it.</em>",
    "AI-Native Tooling": "I design local, privacy-first AI tools that solve real infrastructure pain points. Tools like ServiceScope for LLM-based dependency mapping, and Clairvoyant Scheduler for predicting inference complexity.<br><br><em>Built for production reality — not demo conditions.</em>",
    "AI Research": "Head-of-Line blocking is the silent killer of LLM throughput—the traffic jam where a single word of autocomplete gets strangled by a 50-page summary.<br><br>While others throw more GPUs at the problem, I’m teaching the queue to think. By using XGBoost classifiers to rank request complexity before it hits the engine, I’m bringing deterministic SLAs to a non-deterministic world.<br><br><em>Think of it as VIP access for your compute: because the smartest models on earth shouldn't be stuck waiting in line. See you at MLsys 2027.</em>"
  },
  experience: [
    {
      company: "Microsoft R&D India",
      logo: "MS",
      role: "Software Engineer II",
      period: "Aug 2021 – Nov 2023 · Hyderabad, India",
      bullets: [
        "Built a <strong>distributed metadata platform</strong> keeping deployment truth accurate across 17,000+ services via Azure Functions and Service Bus.",
        "Implemented <strong>Redis-based adaptive concurrency control</strong> (95% optimistic / 5% pessimistic locking) to eliminate cascading retry storms.",
        "Designed Azure-native <strong>BCDR (active-passive)</strong> with idempotent event processing, two-tier RTO, and automated Cosmos DB failover.",
        "Built the <strong>ARM64 Windows Validation Pipeline</strong>, reducing environment setup from 60+ to 20 minutes with parallel provisioning.",
        "Automated 120-130 manual workflows via <strong>Windows OOBE RPA Validation</strong>, cutting UI-related defects by ~40% before release.",
        "Created a <strong>Test-in-Production (TIP) Telemetry Framework</strong> using C++ hooks, adopted by 7-10 teams to detect correctness bugs."
      ],
      projectTitle: "Metadata Platform — Service Tree System",
      projectStatus: "Production",
      projectDesc: "An event-driven Azure system maintaining ownership records across Microsoft's service inventory. Engineered to survive burst traffic with adaptive Redis rate limiting and near-zero RPO disaster recovery. <strong>This is the origin story of ServiceScope</strong> — built later to solve the implicit dependency problem.",
      metrics: [
        { target: 17, suffix: "K+", label: "microservices" },
        { target: 70, suffix: "%", label: "toil eliminated" },
        { target: 99.9, suffix: "%+", decimal: 1, label: "metadata consistency" }
      ],
      stack: ["C#", "Azure Service Bus", "Cosmos DB", "Redis", "Azure Functions", "Kusto / ADX"]
    },
    {
      company: "Amazon",
      logo: "AMZ",
      role: "Software Engineer — Test & Device Infrastructure",
      period: "Sep 2017 – Aug 2021 · Chennai, India",
      bullets: [
        "Built a custom Java scheduler on AWS running 24/7 deterministic integration validation across <strong>50+ physical Alexa devices</strong>.",
        "Engineered resilience with continuous health monitors, <code>adb reboot</code> recovery, and instant backup pool routing.",
        "Converted 40+ hardware-software test cases into deterministic suites by resetting device state and using Linux keepalives.",
        "Created a single-command <strong>ADB Log Diagnostic Tool</strong> that aggregated structured triage data, adopted by 7+ teams.",
        "Authored release automation scripts coordinating build artifact promotion and deployment sequencing across device categories."
      ],
      projectTitle: "Alexa Device Orchestration Platform",
      projectStatus: "Production",
      projectDesc: "A distributed scheduler managing device lifecycles and diagnostics for long-running <strong>physical test fleets</strong>. Because physical devices hang and drop network, we built a system that assumes hardware failure and self-heals around it.",
      metrics: [
        { target: 50, suffix: "+", label: "devices 24/7" },
        { target: 98, suffix: "%+", label: "platform uptime" },
        { target: 1, suffix: "K+", label: "QA hrs / yr saved" }
      ],
      stack: ["Java", "Python", "AWS (EC2, Lambda)", "Docker", "CI/CD"]
    }
  ],
  projects: [
    {
      id: "servicescope",
      title: "ServiceScope",
      status: "Complete · Open Source",
      statusClass: "status-complete",
      desc: "AI-native blast-radius analysis for Python microservices. It clones any GitHub repo, extracts HTTP calls using AST walking (~190 files/sec), and uses a <strong>local LLM (gemma3:4b)</strong> to resolve dynamic service names. The graph is stored in PostgreSQL + Neo4j, enabling teams to ask: <em>\"What breaks if I change this?\"</em><br><br>No service mesh. No code changes. <strong>Zero external API calls.</strong>",
      pipeline: ["GitHub URL", "git clone", "AST walk .py", "LLM inference (local)", "Dependency graph", "Chat interface"],
      bullets: [
        "AST detection of 3 patterns (requests, httpx, object sessions), extracting dynamic variables for LLM inference (~2.4 calls/sec).",
        "Multi-tenant JWT auth, retry-safe Celery workers (Redis broker), branch auto-fallback, and graceful Neo4j degradation.",
        "Tested to 2,886 files (django/django) with a <strong>0% inference failure rate</strong> on repos like nanochat and robusta.",
        "LLM confidence tiers: 0.95 (named constants) → 0.85 (semantic vars) → flagged false positives."
      ],
      metrics: [
        { target: 0, suffix: "%", label: "inference failures", raw: true },
        { target: 190, prefix: "~", label: "files/sec (AST)" },
        { target: 2886, suffix: "", label: "files tested" },
        { target: 0, raw: true, label: "external API calls" }
      ],
      stack: ["Python", "FastAPI", "Celery", "PostgreSQL", "Neo4j", "Ollama", "Redis", "Alembic", "Docker Compose"],
      links: [
        { text: "View on GitHub →", url: "https://github.com/Aravind0403/ServiceScope-v2" }
      ],
      hasGraphDemo: true
    },
    {
      id: "aco",
      title: "ACO — Adaptive Compute Orchestrator",
      status: "Complete · Open Source",
      statusClass: "status-complete",
      desc: "Predictive job scheduler for heterogeneous compute. Traditional schedulers react to load spikes — ACO predicts them. Three overlapping signals combined in <strong>&lt;10ms</strong>: pheromone (ACO learned history), heuristic (CostEngine), and intent (WorkloadIntentRouter — 6 strategy types).<br><br>Per-node LSTM predictors refit every 10 telemetry ticks on real Alibaba 2018 cluster trace data, hot-swappable at runtime.",
      pipeline: ["POST /jobs", "IntentRouter", "CostEngine", "ACO colony / fast path", "NodeAgent.execute()"],
      bullets: [
        "<strong>Fast path</strong>: latency-critical jobs → deterministic argmax(η) in &lt;1ms — zero variance for P99 SLAs",
        "<strong>Full colony</strong>: 20 ants × 5 iterations, early stop after 3 stagnant iterations — all in ≤8ms",
        "CostEngine composite: reliability × cost efficiency × SLA headroom × spike prediction factor",
        "LSTM cold-start handled — confidence grows from 0.5 (10 samples) to 1.0 (500 samples)",
        "202 tests passing (pytest-asyncio) — zero external dependencies at runtime"
      ],
      metrics: [
        { target: 10, prefix: "&lt;", suffix: "ms", label: "P99 latency" },
        { target: 28, prefix: "+", suffix: "%", label: "utilisation vs first-fit" },
        { target: 95, suffix: "%+", label: "SLA adherence" },
        { target: 202, suffix: "", label: "tests passing" }
      ],
      stack: ["Python", "FastAPI", "PyTorch LSTM", "NumPy ACO", "Asyncio", "Alibaba 2018 trace", "Borg 2019 trace", "pytest-asyncio"],
      links: [
        { text: "View on GitHub →", url: "https://github.com/Aravind0403/ACO_Adaptive_Compute_Orchestrator" }
      ],
      hasGraphDemo: false
    }
  ],
  research: [
    {
      id: "clairvoyant",
      title: "Clairvoyant Scheduler",
      status: "In Progress",
      statusClass: "status-research",
      desc: "Head-of-Line (HOL) blocking is the silent killer of LLM inference throughput. Long requests monopolise GPU batches — short requests wait, P99 collapses.<br><br>Clairvoyant prevents this by predicting output complexity (Short/Medium/Long) <em>before</em> execution using an <strong>XGBoost Classifier</strong> on lightweight linguistic features. Sitting upstream of vLLM, it enables Shortest-Job-First or priority bin-packing without modifying the core serving engine.",
      bullets: [
        "Extracts linguistic features (prompt length, coding keywords, instruction verbs) without invoking an LLM.",
        "Trained XGBoost model on the ShareGPT dataset with a balanced 2K samples per class to prevent skew.",
        "Integration phase targeting Vast.ai NVIDIA RTX 4090s with vLLM to benchmark P99 tail latency reduction for short requests.",
        "Negligible microsecond prediction overhead in the critical path using <code>mlogloss</code> objective ranking."
      ],
      stack: ["Go", "ONNX Runtime", "Python", "vLLM", "LLM Serving", "Traffic Shaping"]
    }
  ],
  writing: [
    {
      icon: "📉",
      meta: "Substack · Distributed Systems",
      title: "Your Scheduler Is Lying to You (And Ants Fixed It)",
      desc: "Why most schedulers fail under burst load — and how ant colony optimization builds something more resilient.",
      url: "https://aravindsundaresan.substack.com/p/your-scheduler-is-lying-to-you-and"
    },
    {
      icon: "🔍",
      meta: "Substack · Static Analysis",
      title: "What Does Your Code Actually Call?",
      desc: "Walking Python ASTs to find every outbound HTTP call — and why LLMs beat regex for resolving dynamic URLs at scale.",
      url: "https://aravindsundaresan.substack.com/p/what-does-your-code-actually-call"
    },
    {
      icon: "📡",
      meta: "Substack · Infrastructure",
      title: "The $100 Billion Question That Started With 27 Numbers",
      desc: "On the hidden cost of metadata drift at scale, and why self-healing systems beat runbooks.",
      url: "https://aravindsundaresan.substack.com/p/the-100-billion-question-that-started"
    },
    {
      icon: "✍️",
      meta: "Subscribe · Engineering at Scale",
      title: "All posts on Substack →",
      desc: "Distributed systems, infra failures, AI-native tooling. Real systems, real failures.",
      url: "https://aravindsundaresan.substack.com"
    }
  ]
};
