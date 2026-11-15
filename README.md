# OPENRON — Kirana Store AI Business Assistant 🇮🇳

OPENRON is an AI-powered business management platform designed primarily for Indian small businesses, kirana stores, and local retailers. It enables shopkeepers to manage their daily business operations (Udhaar / Credit, Payments, Inventory Stock, and Sales Queries) using natural language voice and text in **Hindi, Hinglish, English**, and mixed Indian phrasing.

---

## 🏛️ Monorepo Architecture

The repository is organized as a high-performance pnpm + Turbo monorepo:

```
c:\Operon/
├── apps/
│   ├── api/                     # Node.js + Express + Prisma + Gemini API Backend
│   │   ├── prisma/              # Multi-tenant SQLite/PostgreSQL schema
│   │   ├── src/
│   │   │   ├── ai/              # Gemini integration, prompts, schemas, parsers
│   │   │   ├── controllers/     # Command, Auth, Customer, Product, Transaction
│   │   │   ├── middleware/      # Auth, Tenant, RateLimit, ErrorHandler
│   │   │   ├── routes/          # REST API endpoints
│   │   │   ├── services/        # Decoupled business logic & DB transactions
│   │   │   └── utils/           # Structured logging & helpers
│   │   └── test/                # Comprehensive Vitest test suite (15 scenarios)
│   └── web/                     # React + Vite + Tailwind Frontend
│       ├── src/
│       │   ├── components/      # CommandBox, ConfirmationModal, VoiceRecorder
│       │   ├── hooks/           # useAuth, useVoice, useStoreState
│       │   ├── lib/             # API client (api.ts) & utilities
│       │   └── pages/           # Dashboard, Customers, Stock, Reports
├── packages/
│   ├── shared/                  # Shared Zod schemas, TypeScript types, constants
│   ├── ui/                      # Shared React UI components (Button, Card, Input)
│   └── config/                  # ESLint and TypeScript configs
├── infra/
│   └── scripts/seed.ts          # Database seed script for Kirana store demo
├── .env.example                 # Example environment variables
├── pnpm-workspace.yaml          # Monorepo workspace configuration
└── turbo.json                   # Turborepo task pipeline
```

---

## 🤖 AI Command Parser Architecture

The AI Command Parser decouples **natural-language understanding** from **database transaction execution**:

1. **Natural Language Input**: Supports Hindi (`रमेश को 500 का उधार लगा दो`), Hinglish (`Ramesh ko 500 ka udhaar laga do`), English (`Add 500 credit to Ramesh`), and spoken colloquial numbers (`dhai sau`, `dedh sau`, `paanch sau`, `ek hazaar`).
2. **Entity & Action Extraction**: Extracts operation (`add_udhaar`, `record_payment`, `add_stock`, `remove_stock`, `query`, `needs_clarification`), customer names, normalized amounts in INR, quantities, and units (`kg`, `litre`, `piece`, `packet`).
3. **Safety & Ambiguity Guardrails**:
   - Never creates fictional customer or product IDs.
   - Detects customer ambiguity when multiple candidates match and requests clarification.
   - Blocks prompt injections and malicious system overrides.
   - Rejects negative amounts or multiple operations in a single command.
   - Strictly validates output using Zod discriminated unions.
4. **Human-in-the-Loop Confirmation**: All financial and stock mutations require shopkeeper confirmation before database writes.

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```bash
PORT=4000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="openron-production-grade-jwt-secret-key-32chars"
CORS_ORIGIN="http://localhost:5173"
```

---

## 🚀 Installation & Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Generate Prisma Client & Initialize Database
```bash
cd apps/api
pnpm prisma:push
```

### 3. Seed Sample Data (Optional)
```bash
pnpm --filter @openron/api exec tsx ../../infra/scripts/seed.ts
```

---

## 🧪 Running Tests

The test suite validates all 15 critical scenarios required by the specification:
```bash
pnpm --filter @openron/api test
```

---

## 💻 Running Development Servers

### Start Backend API:
```bash
pnpm --filter @openron/api dev
```
Backend runs at `http://localhost:4000`. Health check: `GET http://localhost:4000/health`.

### Start Frontend Web:
```bash
pnpm --filter @openron/web dev
```
Frontend runs at `http://localhost:5173`.
