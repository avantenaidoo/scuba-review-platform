# Scuba Equipment Review Platform

A commercial scuba equipment review platform where divers can explore equipment, compare products, read reviews and share their own experiences.

The platform is designed to help divers make informed equipment decisions through detailed product information, structured specifications and community-driven reviews.

This is **not an online shop**. The platform does not sell scuba equipment or process equipment orders. Its commercial model is based on annual paid memberships.

## Project Status

**Currently in development.**

### Implemented
- Next.js application scaffold.
- Supabase project configuration and local development environment.
- Initial PostgreSQL database schema and migrations.
- Supabase authentication integration.
- User registration, sign-in and sign-out.
- Initial authentication unit, component and end-to-end tests.
- Vitest and Playwright testing infrastructure.
- Cloudflare Workers deployment configuration through OpenNext.
- Local Cloudflare Worker preview configuration.

### Planned
- Public homepage and application layout.
- Administrator dashboard and catalogue management.
- Brand, equipment category and product management.
- Product specifications and image uploads.
- Equipment browsing, searching and comparisons.
- Annual membership payments through Paystack.
- Member-only equipment reviews.
- Review submission and management.
- Progressive Web App functionality.
- Production deployment through Cloudflare Workers.

## Technology Stack

| Area | Technology |
|---|---|
| Frontend framework | Next.js (App Router) |
| UI library | React |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |
| Payments | Paystack (planned) |
| Unit and component testing | Vitest, React Testing Library |
| End-to-end testing | Playwright |
| Database security testing | pgTAP (planned) |
| Deployment | Cloudflare Workers via OpenNext (configured; production deployment pending) |

## Equipment Coverage

The platform will cover the main categories of scuba diving equipment, including:

- Masks and snorkels
- Fins and boots
- Exposure protection
- Buoyancy compensators
- Regulators and alternate air sources
- Instrumentation and dive computers
- Underwater lights
- Cameras and accessories
- Bags and equipment accessories
- Cylinder-related accessories

Scuba cylinders themselves are excluded.

## Membership Model

The planned membership model is:

- Annual membership: **R80**
- Membership duration: 12 months.
- Payment provider: Paystack hosted checkout.
- No automatic recurring billing.
- No storage of members' payment card details.

An active membership will provide access to member-only platform functionality, including equipment reviews.

## Getting Started

### Prerequisites

Install the following:

- Node.js 24 or later.
- npm.
- Git.
- Docker Desktop.
- Supabase CLI.

### Installation

Clone the repository:

```bash
git clone https://github.com/avantenaidoo/scuba-review-platform.git
```

Navigate into the project:

```bash
cd scuba-review-platform
```

Install dependencies:

```bash
npm install
```

### Environment Variables

Create a `.env.local` file in the project root.

Configure the local Supabase connection:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_supabase_anon_key
```

Use the local credentials provided by the Supabase CLI. Never commit environment files or expose secret keys.

### Start Supabase Locally

Start the local Supabase development environment:

```bash
npx supabase start
```

Apply database migrations:

```bash
npx supabase migration up
```

The local Supabase services include:

- API: http://127.0.0.1:54321
- Studio: http://127.0.0.1:54323
- PostgreSQL: localhost:54322

### Run the Application

Start the Next.js development server:

```bash
npm run dev
```

Open:

http://localhost:3000

## Database

The application uses Supabase PostgreSQL.

The initial database schema includes:

- `profiles`
- `user_roles`
- `membership_plans`
- `memberships`
- `brands`
- `categories`
- `products`
- `product_specifications`
- `product_images`
- `audit_logs`

Database migrations are maintained in:

```text
supabase/migrations/
```

Row Level Security (RLS) policies protect application data. Access to member-only functionality is controlled through membership status and database permissions.

## Testing

The project uses several testing tools to verify application behaviour and security.

### Unit and Component Tests

Run all Vitest tests:

```bash
npm run test:run
```

Run Vitest in watch mode:

```bash
npm run test
```

Generate test coverage:

```bash
npm run test:coverage
```

### End-to-End Tests

Run Playwright tests:

```bash
npm run test:e2e
```

Run Playwright in interactive UI mode:

```bash
npm run test:e2e:ui
```

### Code Quality

Run ESLint:

```bash
npm run lint
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

### Database Checks

Run the Supabase database linter:

```bash
npx supabase db lint --local
```

## Project Structure

```text
scuba-review-platform/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   │   └── auth/
│   └── lib/
│       └── supabase/
├── supabase/
│   └── migrations/
├── tests/
│   ├── unit/
│   ├── components/
│   ├── integration/
│   └── e2e/
├── .env.local
├── package.json
├── playwright.config.ts
└── vitest.config.mts
```

## Security

Security is an important part of the platform.

The application uses:

- Supabase Authentication.
- PostgreSQL Row Level Security.
- Role-based access control.
- Membership-based access restrictions.
- Private Supabase Storage buckets.
- Server-side handling of sensitive operations.
- Environment variables for configuration and credentials.

Security policies and access restrictions will be tested as the application develops.

## Repository

GitHub: https://github.com/avantenaidoo/scuba-review-platform