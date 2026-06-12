<div align="center">
  <br/>
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=flat-square&logo=supabase" alt="Supabase"/>
  <img src="https://img.shields.io/badge/LangGraph-Agents-purple?style=flat-square" alt="LangGraph"/>
  <img src="https://img.shields.io/badge/Framer%20Motion-Animations-cyan?style=flat-square&logo=framer" alt="Framer Motion"/>
  <img src="https://img.shields.io/badge/Tailwind%20CSS-v4-38bdf8?style=flat-square&logo=tailwindcss" alt="Tailwind CSS"/>
</div>

<br/>

<h1 align="center">
  ⚙️ MAN OF STEEL
</h1>

<p align="center">
  <strong>Predict. Explain. Prevent.</strong><br/>
  <em>AI-Powered Industrial Maintenance Intelligence Platform</em>
</p>

<p align="center">
  A next-generation, award-winning industrial maintenance platform that leverages <strong>multi-agent AI</strong>, 
  <strong>machine learning</strong>, and <strong>semantic knowledge retrieval</strong> to predict equipment failures, 
  diagnose root causes, and prevent costly downtime in steel manufacturing.
</p>

<br/>

---

## ✨ Features

| Page | Capabilities |
|------|-------------|
| **🎮 Mission Control** | Real-time plant health score, active alerts, critical assets, failure forecasts, AI insights, root cause intelligence, executive dashboard |
| **🔧 Asset Explorer** | Per-asset health monitoring, 72h sensor trends, maintenance history, ML failure prediction, interactive What-If simulator, risk assessment |
| **🤖 AI Copilot** | 4-agent LangGraph system (Planner → Knowledge → Prediction → Decision), root cause analysis, semantic citations, what-if analysis |
| **📊 Reports Center** | One-click generation of Incident, Maintenance & Executive reports with professional PDF export |
| **📚 Knowledge Vault** | 8 pre-seeded industrial documents, semantic search with similarity scoring, upload manuals/SOPs/incident reports |

<br/>

## 🎯 Why MAN OF STEEL Wins

- **Real multi-agent AI pipeline** — Not a single LLM call. Four specialized LangGraph agents collaborate: Planner, Knowledge (RAG), Prediction (XGBoost), Decision (LLM synthesis).
- **Works out of the box** — Fully functional with in-memory synthetic data. No API keys, no database, no setup required.
- **Production-grade architecture** — Complete type system, Supabase schema, API routes, PDF generation, ML pipeline.
- **Award-winning UI/UX** — HUD-inspired dark interface with particle effects, scan-line animations, glass morphism, staggered entrance animations, micro-interactions, and incident mode.
- **Optional extensibility** — Connect Supabase, OpenRouter, and train custom ML models when ready.

<br/>

## 🚀 Quick Start

```bash
cd man-of-steel
npm install
npm run dev
```

Open **http://localhost:3000** — works immediately with in-memory synthetic data.

> No Supabase, no OpenRouter, no database required. The app is fully self-contained.

<br/>

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router), TypeScript |
| **UI** | Tailwind CSS v4, shadcn/ui primitives, Framer Motion 12, Recharts, Lucide Icons |
| **AI Agents** | LangGraph (4-agent pipeline), LangChain, OpenRouter (optional) |
| **ML Engine** | XGBoost-style logistic regression + RUL estimation (TypeScript), Python training scripts |
| **RAG** | Local embedding engine + cosine similarity semantic search, Supabase pgvector (optional) |
| **Database** | In-memory data store (default), Supabase PostgreSQL (optional) |
| **PDF** | PDFKit for professional report generation |
| **Deploy** | Vercel, Netlify, Cloudflare Pages, or any Node.js host |

<br/>

## 🧠 Agent System Architecture

```
User Query
    │
    ▼
┌──────────┐
│ PLANNER  │── Determines investigation workflow
└────┬─────┘
     │
     ▼
┌───────────┐
│ KNOWLEDGE │── Semantic search across manuals, SOPs, incident reports
└─────┬─────┘
      │
      ▼
┌───────────┐
│PREDICTION │── XGBoost failure probability + RUL estimation
└─────┬─────┘
      │
      ▼
┌──────────┐
│ DECISION │── Synthesizes evidence → root cause, risk, actions, impact
└────┬─────┘
     │
     ▼
Response + Citations
```

| Agent | Role |
|-------|------|
| **Planner** | Determines investigation workflow based on query intent |
| **Knowledge** | Semantic search across 8 seeded documents with relevance scoring |
| **Prediction** | XGBoost-style model for failure probability and Remaining Useful Life |
| **Decision** | LLM or rule-based synthesis of root cause, risk level, actions, business impact |

> Falls back to rule-based intelligence when OpenRouter API key is not configured.

<br/>

## 📐 Project Structure

```
src/
├── app/                          # Pages + API routes
│   ├── page.tsx                  # Redirects to /mission-control
│   ├── layout.tsx                # Root layout with fonts + AppShell
│   ├── globals.css               # HUD theme, animations, utilities
│   ├── mission-control/          # Plant-wide dashboard
│   ├── asset-explorer/           # Per-asset diagnostics
│   ├── ai-copilot/               # Multi-agent chat interface
│   ├── reports/                  # Report generation center
│   ├── knowledge-vault/          # Semantic document search
│   └── api/                      # REST API routes
├── components/
│   ├── layout/                   # AppShell (sidebar, cmd pallette) + PageHeader
│   ├── mission-control/          # Dashboard component
│   ├── assets/                   # Asset explorer component
│   ├── copilot/                  # Chat interface
│   ├── reports/                  # Reports center
│   ├── knowledge/                # Knowledge vault
│   ├── shared/                   # HealthGauge, MetricCard, SensorChart, StatusBadge
│   └── ui/                       # Card, Button, Badge primitives
├── lib/
│   ├── agents/                   # LangGraph state, graph, LLM utility
│   ├── data/                     # Synthetic data store, generators, knowledge seeds
│   ├── ml/                       # ML model coefficients + prediction engine
│   ├── rag/                      # Embeddings + semantic search pipeline
│   ├── reports/                  # Report builder + PDF generation
│   └── supabase/                 # Client, server, admin Supabase clients
├── types/                        # Full TypeScript type system
supabase/migrations/               # Database schema
scripts/seed/                      # Supabase seed script
scripts/ml/                        # Python ML training pipeline
```

<br/>

## 🔌 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/mission-control` | GET | Plant dashboard data (health score, alerts, insights) |
| `/api/assets` | GET | All 10 assets with health and status |
| `/api/assets/[id]` | GET | Asset detail + sensors + prediction + alerts |
| `/api/copilot` | POST | Run 4-agent LangGraph workflow |
| `/api/knowledge` | GET/POST | List / upload documents |
| `/api/knowledge/search` | POST | Semantic search with similarity citations |
| `/api/reports` | GET/POST | List / generate reports (incident/maintenance/executive) |
| `/api/reports/[id]/pdf` | GET | Download professional PDF report |
| `/api/predict` | POST | ML prediction + what-if analysis |

<br/>

## 🔧 Machine Types (10 Assets)

| Machine | Count |
|---------|-------|
| Rolling Mill | 2 |
| Blast Furnace Fan | 2 |
| Hydraulic Pump | 2 |
| Conveyor | 2 |
| Overhead Crane | 2 |

<br/>

## ☁️ Deployment

```bash
# Deploy to Vercel (recommended)
npx vercel

# Or deploy to any Node.js host
npm run build
npm start
```

Works out of the box. Optional environment variables:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Supabase admin key (seeding) |
| `OPENROUTER_API_KEY` | No | Enables LLM-powered agent responses |
| `OPENROUTER_MODEL` | No | Model override (default: claude-3.5-sonnet) |

<br/>

## 📄 License

Hackathon demo — educational and evaluative use only.
