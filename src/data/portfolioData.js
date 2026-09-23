// Cloud Rail Portfolio Data
export const portfolioData = {
  author: {
    name: "Alex Morgan",
    tagline: "Creative Developer & 3D Interactive Systems Architect",
    avatar: "🚂",
    bio: "Passionate engineer blending WebGL visuals, real-time physics, and resilient full-stack systems. Designing digital journeys with depth, atmosphere, and silky-smooth motion.",
    location: "Global / Remote",
    status: "Available for select opportunities & creative collaborations",
    metrics: [
      { label: "YEARS EXP.", value: "4+" },
      { label: "PROJECTS SHIPPED", value: "28+" },
      { label: "SMOOTH STREAK", value: "100%" },
      { label: "PERFORMANCE", value: "60 FPS" }
    ]
  },
  
  about: {
    title: "The Craft Behind The Ride",
    lead: "Building interactive worlds where code meets tactile beauty.",
    paragraphs: [
      "I specialize in bridging the gap between imaginative creative design and high-performance software engineering. From custom WebGL rendering pipelines to resilient distributed backends, I bring ideas to life with precision.",
      "Just like laying wooden railway tracks across scenic archipelagos, every detail in software matters: layout harmony, micro-interactions, responsive pacing, and clean, maintainable architecture."
    ],
    highlights: [
      { title: "Creative WebGL & 3D", desc: "Interactive procedural worlds, shaders, physics, and smooth camera choreographies." },
      { title: "Modern Full-Stack", desc: "High-throughput React/Next.js frontends powered by Node.js, Python, and cloud services." },
      { title: "Fluid Interaction", desc: "Smooth scroll dynamics, haptic micro-gestures, and accessible interface engineering." }
    ]
  },

  projects: [
    {
      id: "cloud-rail",
      title: "Cloud Rail 3D Journey",
      category: "Creative WebGL / Procedural Engine",
      badge: "Flagship",
      description: "A real-time playable 3D miniature tram world set in a floating Mediterranean archipelago. Features Catmull-Rom spline physics, day/night lighting, procedural foliage, synthesized audio, and seamless scroll driving.",
      tags: ["Three.js", "WebGL", "Web Audio API", "TypeScript", "Physics"],
      stats: "60 FPS • 0 External 3D Models • Procedural Assets",
      demoUrl: "#",
      githubUrl: "https://github.com"
    },
    {
      id: "nexus-ai",
      title: "Nexus AI Copilot",
      category: "Autonomous Systems & Tool Orchestration",
      badge: "Production",
      description: "An enterprise agent orchestration platform connecting language models to real-world developer tools, automated test suites, CI/CD runtimes, and local environments.",
      tags: ["React", "Python", "FastAPI", "WebSockets", "Docker"],
      stats: "10k+ Daily Executions • Sub-100ms Latency",
      demoUrl: "#",
      githubUrl: "https://github.com"
    },
    {
      id: "aura-commerce",
      title: "Aura Headless Commerce",
      category: "Ultra-Fast E-Commerce Architecture",
      badge: "Commercial",
      description: "A headless digital storefront engineered for sub-50ms page transitions, real-time inventory streaming, and frictionless multi-currency Stripe checkout.",
      tags: ["Next.js", "TypeScript", "GraphQL", "Tailwind CSS", "Stripe"],
      stats: "99+ Lighthouse Score • 42% Conversion Uplift",
      demoUrl: "#",
      githubUrl: "https://github.com"
    },
    {
      id: "hyperflow-telemetry",
      title: "HyperFlow Realtime Telemetry",
      category: "High-Frequency Data Visualization",
      badge: "Open Source",
      description: "WebSocket-driven telemetry analytics suite capable of streaming and visualizing 100,000+ data points per second with custom GPU shaders and Canvas rendering.",
      tags: ["React", "Go", "WebSockets", "D3.js", "Canvas2D"],
      stats: "Zero Frame Drops • 100k pts/sec",
      demoUrl: "#",
      githubUrl: "https://github.com"
    }
  ],

  skills: [
    {
      category: "Frontend & Creative",
      icon: "i-leaf",
      items: ["Three.js / WebGL", "React & Next.js", "TypeScript", "Tailwind CSS", "Canvas & Shaders", "Web Audio API", "GSAP / Motion"]
    },
    {
      category: "Backend & Systems",
      icon: "i-tool",
      items: ["Node.js & Express", "Python & FastAPI", "PostgreSQL & SQLite", "Redis Caching", "GraphQL & REST", "WebSockets", "Docker & Cloudflare"]
    },
    {
      category: "Architecture & Craft",
      icon: "i-bag",
      items: ["Interactive UX/UI", "Design Systems", "Performance Tuning", "Procedural Generation", "Accessibility (a11y)", "Git & CI/CD Pipelines"]
    }
  ],

  experience: [
    {
      role: "Lead Creative Technologist",
      company: "Horizon Digital Labs",
      period: "2024 — Present",
      location: "San Francisco / Remote",
      desc: "Architecting interactive 3D web experiences, WebGL microsites, and next-generation design systems for forward-thinking clients worldwide."
    },
    {
      role: "Senior Full-Stack Engineer",
      company: "Velocity Cloud Systems",
      period: "2022 — 2024",
      location: "London / Remote",
      desc: "Engineered scalable microservices, real-time data streaming backends, and high-performance React web applications handling millions of requests."
    },
    {
      role: "Frontend Developer",
      company: "PixelForge Interactive",
      period: "2021 — 2022",
      location: "Remote",
      desc: "Crafted award-winning responsive web applications, animated interactive stories, and accessible component libraries."
    }
  ],

  contact: {
    heading: "Let's Build Something Scenic Together",
    subheading: "Whether you have an ambitious interactive project in mind, need 3D/WebGL expertise, or just want to chat about the rails.",
    email: "hello@cloudrail.dev",
    socials: [
      { name: "GitHub", url: "https://github.com", icon: "github" },
      { name: "LinkedIn", url: "https://linkedin.com", icon: "linkedin" },
      { name: "Twitter / X", url: "https://x.com", icon: "twitter" },
      { name: "Telegram", url: "https://telegram.org", icon: "telegram" }
    ],
    note: "All messages are personally answered. No rush, just good work."
  }
};
