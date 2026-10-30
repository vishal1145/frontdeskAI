# FrontDesk AI - Full-Stack Monorepo

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Tailwind%20v3.4-teal.svg)
![Backend](https://img.shields.io/badge/Backend-Node%20%2B%20Vapi%20%2B%20Gemini-green.svg)
![Languages](https://img.shields.io/badge/Languages-Hinglish%20%7C%20English-orange.svg)

FrontDesk AI is an enterprise-grade Voice AI Receptionist and full-stack clinic automation system built for local doctors, dental practices, and hospitals in India. It handles inbound phone calls via GSM/SIP Call Forwarding, manages appointment scheduling, checks live availability, prevents double bookings, and sends instant WhatsApp confirmations.

---

## 📁 Clean Monorepo Architecture

```text
forntend_ai_desk/
│
├── 📁 backend/                        # Voice AI, Telephony & Webhook Engine
│   ├── 📁 src/                        # Core backend source (server, agent, tools, services)
│   ├── 📁 examples/                   # Webhook and multi-tenant test suites
│   ├── 📁 prompts/                    # Clinic identity and prompt configs
│   ├── .env                           # Secret API keys (Protected by .gitignore)
│   ├── package.json                   # Backend dependencies & scripts
│   ├── tsconfig.json                  # TypeScript compiler settings
│   └── VAPI_INTEGRATION.md            # Vapi Webhook API specifications
│
├── 📁 frontend/                       # Enterprise Luxury Light Theme Landing Page
│   ├── 📁 src/                        # React components, pages & styles
│   │   ├── 📁 components/             # Navbar, Footer
│   │   └── 📁 pages/                  # Home, About, Privacy, Terms, Support
│   ├── index.html                     # Light mode HTML root
│   ├── tailwind.config.js             # Design tokens & custom theme
│   ├── vite.config.js                 # Vite build bundler
│   └── package.json                   # Frontend dependencies
│
├── .gitignore                         # Strict Git secret shielding (.env never committed)
├── DESIGN.md                          # Design system manifesto & tokens
├── README.md                          # Project documentation
└── package.json                       # Root workspace runner
```

---

## 🚀 Quick Start Commands (From Root)

You can run both frontend and backend directly from the workspace root:

### 1. Run Frontend (React Dev Server)
```bash
npm run frontend:dev
```
*Opens at `http://localhost:5173/`*

### 2. Run Backend (Vapi Webhook Server)
```bash
npm run backend:start
```
*Listens at `http://localhost:3000/api/vapi/webhook`*

### 3. Run Backend Automated Test Suite
```bash
npm run backend:test
```
*Runs the full webhook compatibility, slot lock, and assistant config test suite.*

### 4. Build Frontend for Production
```bash
npm run frontend:build
```

---

## 🔒 Security & Git Best Practices
- **`.env` is NEVER pushed to Git**: Both root `.gitignore` and `backend/.gitignore` ensure all secrets (Gemini API keys, Supabase DB credentials, Vapi secrets) remain local.
- **HIPAA & DPDP Act 2023 Compliance**: Zero LLM training on caller audio, end-to-end encryption in transit (TLS 1.3) and at rest (AES-256).
