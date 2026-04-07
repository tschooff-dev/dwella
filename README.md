# Dwella

A modern property management platform for landlords and tenants.

## Stack

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + React Router
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: Clerk (placeholder — configure with your keys)
- **Payments**: Stripe Connect (placeholder — configure with your keys)

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

## Setup

### 1. Install dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

### 2. Configure environment variables

**Backend** — copy and fill in `backend/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dwella"
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PORT=3001
```

**Frontend** — copy and fill in `frontend/.env`:
```
VITE_API_URL=http://localhost:3001
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 3. Set up the database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start development servers

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Demo Navigation

After seeding, use these routes to explore:

| Path | View |
|------|------|
| `/landlord/dashboard` | Landlord dashboard with metrics |
| `/landlord/properties` | Properties & units list |
| `/landlord/tenants` | Tenant directory |
| `/landlord/leases` | Active leases |
| `/landlord/payments` | Payment ledger |
| `/landlord/screening` | AI applicant screening |
| `/tenant/portal` | Tenant self-service portal |

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/properties` | List all properties |
| POST | `/api/properties` | Create a property |
| GET | `/api/properties/:id` | Get property with units |
| GET | `/api/units` | List all units |
| GET | `/api/units/:id` | Get unit detail |
| GET | `/api/tenants` | List all tenants |
| GET | `/api/tenants/:id` | Get tenant detail |
| GET | `/api/payments` | List payments |
| POST | `/api/payments` | Record a payment |
| GET | `/api/applications` | List applications |
| PATCH | `/api/applications/:id` | Update application status |

## Project Structure

```
dwella/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma       # Data models
│   │   └── seed.ts             # Demo data
│   └── src/
│       ├── index.ts            # Express server entry
│       ├── lib/
│       │   ├── prisma.ts       # Prisma client singleton
│       │   └── stripe.ts       # Stripe client placeholder
│       ├── middleware/
│       │   └── auth.ts         # Clerk auth middleware placeholder
│       └── routes/
│           ├── applications.ts
│           ├── payments.ts
│           ├── properties.ts
│           ├── tenants.ts
│           └── units.ts
└── frontend/
    └── src/
        ├── App.tsx             # Router configuration
        ├── types/index.ts      # Shared TypeScript types
        ├── components/
        │   ├── ui/             # Shared design system components
        │   └── landlord/       # Landlord-specific components
        ├── layouts/
        │   ├── LandlordLayout.tsx
        │   └── TenantLayout.tsx
        └── pages/
            ├── landlord/       # Landlord pages
            └── tenant/         # Tenant pages
```
