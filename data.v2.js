window.portfolioData = {
  hero: {
    specialization: "Distributed Systems & ML Infrastructure Engineer",
    tagline: "Building scalable inference infrastructure, GPU scheduling systems, and Kubernetes-native orchestration platforms.",
    subTagline: "Microsoft • Ex-Amazon",
    focus: [
      "LLM inference optimization",
      "GPU cluster scheduling",
      "Distributed systems",
      "ML systems research"
    ]
  },
  experience: [
    {
      company: "Microsoft R&D India",
      logo: `<svg viewBox="0 0 23 23" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><rect width="9.5" height="9.5" fill="#f25022" /><rect x="11.5" width="9.5" height="9.5" fill="#7fba00" /><rect y="11.5" width="9.5" height="9.5" fill="#01a4ef" /><rect x="11.5" y="11.5" width="9.5" height="9.5" fill="#ffb900" /></svg>`,
      role: "Software Engineer II",
      period: "2021 – Present · Hyderabad, India",
      bullets: [
        "Architected a <strong>distributed metadata platform</strong> (Service Tree Inventory) orchestrating live deployment truth across <strong>17,000+ microservices</strong> via Azure Service Bus and Cosmos DB.",
        "Implemented a <strong>Redis-based adaptive concurrency control system</strong> utilizing 95% optimistic and 5% pessimistic locking strategies, successfully eliminating cascading retry storms under cluster outages.",
        "Designed and engineered Azure-native <strong>BCDR (active-passive) recovery workflows</strong> with fully idempotent event pipelines, maintaining zero-data-loss RPO and sub-minute RTO failover.",
        "Built the <strong>ARM64 Windows Validation Provisioner</strong>, utilizing parallel worker nodes to reduce device-under-test build deployment times from 60+ down to 20 minutes.",
        "Automated critical OS telemetry validation using <strong>Windows OOBE RPA test executors</strong>, reducing post-release UI-related defects by ~40%.",
        "Developed a low-overhead <strong>Test-in-Production (TIP) Telemetry Framework</strong> using C++ runtime hooks, adopted across 10 engineering groups to detect live execution bugs."
      ],
      projectTitle: "Service Inventory & Metadata Orchestration Platform",
      projectStatus: "Production",
      projectDesc: "An event-driven enterprise metadata core designed to handle high burst traffic and maintain global state consistency across all Microsoft services. This served as the direct operational motivation for designing ServiceScope — creating a system to resolve implicit, runtime dependency chains without intrusive manual documentation.",
      metrics: [
        { target: 17, suffix: "K+", label: "microservices orchestrated" },
        { target: 70, suffix: "%", label: "deployment toil reduced" },
        { target: 99.99, suffix: "%", decimal: 2, label: "metadata availability SLA" }
      ],
      stack: ["C#", "Azure Service Bus", "Cosmos DB", "Redis", "Azure Functions", "C++", "Kusto / ADX"]
    },
    {
      company: "Amazon",
      logo: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><text x="12" y="14" font-family="sans-serif" font-weight="700" font-size="14" fill="currentColor" text-anchor="middle">a</text><path d="M4 16c4 3.5 12 3.5 16 0" stroke="#ff9900" stroke-width="1.8" stroke-linecap="round" fill="none" /><path d="M20 16l-2-1m2 1l-1 2" stroke="#ff9900" stroke-width="1.8" stroke-linecap="round" fill="none" /></svg>`,
      role: "Software Engineer — Test & Device Infrastructure",
      period: "2017 – 2023 · Chennai, India",
      bullets: [
        "Engineered a high-throughput Java-based <strong>device scheduling engine</strong> orchestrating 24/7 deterministic integration and stress test suites across <strong>50+ physical Alexa devices</strong>.",
        "Designed self-healing physical infrastructure resilience using ADB keepalive monitors, automated `adb reboot` recovery protocols, and instant failure backup routing.",
        "Eliminated non-deterministic hardware testing failures by introducing automated state-clearing cycles, isolated Linux network layers, and runtime device health metrics.",
        "Authored a unified monospaced <strong>ADB Log Triage & Diagnostic tool</strong> in Python, aggregating multi-device system crash dumps and saving 1,000+ developer debugging hours annually.",
        "Orchestrated cross-category firmware promotion scripts, automating multi-tenant release pipelines across diverse Alexa-enabled device architectures."
      ],
      projectTitle: "Alexa Device Orchestration Platform",
      projectStatus: "Production",
      projectDesc: "A distributed device-management fabric designed to assume hardware failure and orchestrate automated diagnostics under flaky network conditions. The system ensures continuous reliability metrics of physical devices without manual operator intervention.",
      metrics: [
        { target: 50, suffix: "+", label: "physical devices active 24/7" },
        { target: 98.4, suffix: "%", decimal: 1, label: "scheduler uptime" },
        { target: 1000, suffix: "+", label: "QA hours saved / yr" }
      ],
      stack: ["Java", "Python", "AWS (EC2, Lambda, DynamoDB)", "Docker", "Linux Shell", "CI/CD"]
    },
    {
      company: "OMG Labs",
      logo: `<svg viewBox="0 0 24 24" width="22" height="22" xmlns="http://www.w3.org/2000/svg"><circle cx="11.5" cy="11.5" r="5.5" stroke="currentColor" stroke-width="1.8" fill="none" /><path d="M 9.2 14.5 L 9.2 9 L 11.5 11.5 L 13.8 9 L 13.8 14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" /><path d="M 11.5 3 A 8.5 8.5 0 1 0 18.5 15 L 20 15 L 20 11.5 L 16.5 11.5" stroke="#0a8c43" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" /><path d="M 18 13.5 L 20 11.5 L 22 13.5" stroke="#0a8c43" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" /></svg>`,
      role: "Technical Lead",
      period: "2016 – 2017 · Chennai, India",
      bullets: [
        "Spearheaded customer acquisition through a subscription-based model, boosting customer traffic by 15–20% in key market segments.",
        "Led end-to-end project delivery — from strategy and design to technical implementation and deployment.",
        "Managed vendor relationships and integrated e-commerce tools such as site search and email marketing solutions, improving digital presence by 25–35%.",
        "Played a key role in achieving Amazon Launchpad selection, positioning OMG Labs among top emerging startups for international expansion.",
        "Coordinated across product, marketing, and tech teams to ensure agile execution and sustainable growth infrastructure."
      ],
      projectTitle: "OMG Labs E-Commerce Expansion & Subscription Orchestration",
      projectStatus: "Production",
      projectDesc: "An integrated subscriber management core and digital presence ecosystem. Oversaw end-to-end infrastructure, partner service APIs, and digital tooling integrations that qualified the firm for Amazon Launchpad.",
      metrics: [
        { target: 20, suffix: "%", prefix: "+", label: "customer traffic boost" },
        { target: 35, suffix: "%", prefix: "+", label: "digital presence growth" },
        { target: 100, suffix: "%", label: "Amazon Launchpad selection" }
      ],
      stack: ["Node.js", "React", "Stripe APIs", "AWS S3", "MongoDB", "Express", "Docker"]
    }
  ],
  projects: [
    {
      id: "clairvoyant",
      hasSim: "clairvoyant",
      name: "Clairvoyant — Predictive SJF Scheduler for LLM Inference",
      tagline: "Eliminates Head-of-Line Blocking in serial LLM backends via ML-driven Shortest-Job-First scheduling.",
      description: "Serial inference backends (Ollama, llama.cpp) dispatch requests FCFS — short requests queue behind long ones and P50 latency collapses under burst load. Clairvoyant is a Go HTTP sidecar proxy that predicts output token length in <strong>0.029ms</strong> using an ONNX-exported <strong>XGBoost model</strong>, reorders requests via a min-heap priority queue with starvation protection, and reduces short-request P50 latency by <strong>70–76%</strong> on RTX 4090 and <strong>68.1%</strong> on Apple M1. Validated across 7 public LLM datasets with <strong>62–96%</strong> ranking accuracy.",
      metrics: [
        "0.029ms prediction latency",
        "70–76% P50 reduction (RTX 4090)",
        "68.1% P50 reduction (Apple M1)",
        "62–96% ranking accuracy"
      ],
      links: [
        { label: "arXiv Paper", url: "https://arxiv.org/abs/2606.07248" },
        { label: "GitHub", url: "https://github.com/Aravind0403/clairvoyant-scheduler" },
        { label: "HuggingFace", url: "https://huggingface.co/Aravind0495/clairvoyant-scheduler" },
        { label: "Edge Pipeline", url: "https://github.com/Aravind0403/edge-llm-pipeline" },
        { label: "Blog Post", url: "https://aravind0403.github.io/runtime-gaps-create-blind-spots/" }
      ],
      tags: ["Go", "Python", "XGBoost", "ONNX Runtime", "vLLM", "OpenAI-compatible", "Kubernetes"],
      vllmPRs: "Open contributor to vLLM v1 core scheduler — PR #41952 (preemption ordering) · PR #44773 (per-request preemption histogram)"
    },
    {
      id: "aco",
      hasSim: "aco",
      name: "ACO — Adaptive Compute Orchestrator",
      tagline: "GPU Scheduling for Heterogeneous Clusters.",
      description: "Static cluster placement policies trigger massive fragmentation and compute underutilization on heterogeneous GPU arrays during highly dynamic, multi-tenant burst workloads. ACO combines <strong>ant-colony optimization</strong> metaheuristics with online <strong>LSTM predictors</strong> to forecast incoming queue burst times. Dynamic placement decisions are completed in <strong>&lt;8ms</strong> using two paths: a latency-critical <strong>Fast-Path</strong> (direct mathematical optimization) and a parallel <strong>Full-Colony solver</strong> that runs heuristic iterations under burst conditions.",
      metrics: [
        "<8ms P99 scheduling latency",
        "+28% GPU utilization vs First-Fit",
        "95%+ workload SLA adherence"
      ],
      links: [
        { label: "GitHub", url: "https://github.com/Aravind0403/ACO_Adaptive_Compute_Orchestrator" }
      ],
      tags: ["Python", "FastAPI", "PyTorch LSTM", "NumPy", "Asyncio", "Borg 2019 Traces", "Alibaba 2018 Traces"]
    },
    {
      id: "servicescope",
      hasSim: "servicescope",
      name: "ServiceScope",
      tagline: "Developer Infrastructure & Dependency Observability.",
      description: "Determining operational blast radius inside modular microservices requires heavy runtime tracing or invasive code configurations, leading to unmapped dynamic service calls. ServiceScope checks out a target source repository, parses code hierarchies via <strong>Abstract Syntax Tree (AST)</strong> walking (<strong>~190 files/sec</strong>), and isolates dynamic outbound HTTP endpoints. It utilizes a fully local, privacy-first <strong>LLM (gemma3:4b)</strong> running on Ollama to resolve dynamic variables, mapping full system dependency flows into <strong>PostgreSQL</strong> and <strong>Neo4j</strong> without modifying a single line of production code.",
      metrics: [
        "190/s AST source files parsed",
        "0 external network API calls",
        "95%+ dynamic route resolution confidence"
      ],
      links: [
        { label: "GitHub", url: "https://github.com/Aravind0403/ServiceScope-v2" }
      ],
      tags: ["Python", "FastAPI", "Celery", "Redis", "PostgreSQL", "Neo4j", "Ollama", "Docker Compose"]
    }
  ],
  researchInterests: [
    { title: "LLM inference scheduling", desc: "Developing pre-fill and decode phase schedulers that minimize tail latency and optimize chunked pre-fills." },
    { title: "Queue-aware serving systems", desc: "Constructing scheduling middleware that coordinates with vLLM/TGI batching logic to mitigate head-of-line bottlenecks." },
    { title: "GPU orchestration", desc: "Building Kubernetes-native custom controllers designed to route burst tasks onto heterogeneous GPU pools dynamically." },
    { title: "Multi-tenant inference isolation", desc: "Exploring hardware-level and orchestration-level isolation to guarantee compute SLAs for high-priority tenants." },
    { title: "Predictive workload scheduling", desc: "Leveraging online statistical models to forecast batch complexity and resize dynamic container bounds." },
    { title: "Kubernetes-native ML infrastructure", desc: "Engineering lightweight schedulers and custom controllers targeting cloud GPU fleets." }
  ],
  writing: [
    {
      icon: "📉",
      meta: "Substack · Distributed Systems",
      title: "Your Scheduler Is Lying to You (And Ants Fixed It)",
      desc: "An inside analysis of static placement failures under burst load—and why swarm-intelligence algorithms build resilient schedules.",
      url: "https://aravindsundaresan.substack.com/p/your-scheduler-is-lying-to-you-and"
    },
    {
      icon: "🔍",
      meta: "Substack · Static Analysis",
      title: "What Does Your Code Actually Call?",
      desc: "Walking AST compilation trees to map outbound HTTP requests—and why localized LLM parsing beats regex for dynamic endpoints.",
      url: "https://aravindsundaresan.substack.com/p/what-does-your-code-actually-call"
    },
    {
      icon: "📡",
      meta: "Substack · Infrastructure",
      title: "The $100 Billion Question That Started With 27 Numbers",
      desc: "On the operational costs of configuration and metadata drift in microservices, and designing self-healing environments.",
      url: "https://aravindsundaresan.substack.com/p/the-100-billion-question-that-started"
    },
    {
      icon: "✍️",
      meta: "Subscribe · Engineering at Scale",
      title: "All posts on Substack →",
      desc: "Distributed systems, infrastructure resilience, and ML systems. Practical designs, real-world failures.",
      url: "https://aravindsundaresan.substack.com"
    }
  ]
};
