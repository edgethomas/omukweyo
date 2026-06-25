# Omukweyo — Stand in line without standing there.

Full-stack monorepo implementing Omukweyo: a queueing & virtual ticketing SaaS for businesses that don't have a ticket system.

```
inline2/
├── apps/
│   ├── web/        # Vite + React 19 + TypeScript + Tailwind
│   └── api/        # Express + TypeScript + Zod + Socket.IO (mock queue engine, mock SMS, mock billing)
├── packages/
│   └── shared/     # Shared TS types (Ticket, Company, Branch, etc.)
├── package.json    # Workspace root
└── README.md
```

## Quick start

```bash
# install everything (root, web, api, shared)
npm install

# run both API (4000) and web (5173) together
npm run dev
```

Then open http://localhost:5173.

- Marketing site: `/`
- Live public company page: `/c/bank-windhoek`
- Live ticket demo: `/ticket` (auto-updates via WebSocket)
- Staff console: `/staff`
- Manager dashboard: `/dashboard`

## Stack

- **Frontend**: Vite, React 19, TypeScript, React Router, Tailwind CSS, Framer Motion, lucide-react, recharts, socket.io-client
- **Backend**: Node 22, Express 4, TypeScript, Zod, Socket.IO, in-memory store (swappable for Prisma + PostgreSQL)
- **Shared**: TypeScript types + enums (Ticket status, roles, etc.)

## What's in the MVP

- Real auth (mock JWT) for company, staff, and customer roles
- Real queue engine: ticket numbering, position calc, ETA, status transitions
- Real WebSocket events: ticket created, called, served, missed
- Mock SMS provider that logs to in-memory `Notification` records (visible in /dashboard)
- Mock billing: plan limits, SMS wallet, manual invoices
- Permission-based UI (button-level + backend-enforced)

## Production swap-ins

The architecture leaves clean extension points for: Prisma + PostgreSQL, real SMS providers (Twilio / Africa's Talking), real payment providers (DPO Pay / PayToday), the runner marketplace, and a custom-domain white-label mode.
