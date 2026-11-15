# Verdant Bowl — Diet Salad & Membership Application

A full-stack web application built with React (Vite), Tailwind CSS, Express.js, and Supabase PostgreSQL for a Diet Salad business featuring a monthly membership subscription system, custom salad builder with live nutrition & price calculation, nutrition consultation appointments, test-mode checkout, and separate Member and Admin dashboards.

---

## Folder Structure

```
.
├── .env.example
├── index.html
├── metadata.json
├── package.json
├── server.ts                         # Express + Vite server entrypoint (Port 3000)
├── tsconfig.json
├── vite.config.ts
├── supabase/
│   └── schema.sql                    # Supabase PostgreSQL tables & indexes
├── server/
│   ├── config/
│   │   └── supabase.ts               # Supabase client configured with Project URL & Publishable Key
│   ├── middleware/
│   │   └── auth.ts                   # Session token verification & role guards
│   ├── routes/
│   │   ├── appointments.ts           # /api/appointments (book & view consultations)
│   │   ├── auth.ts                   # /api/auth (register, login, me, profile)
│   │   ├── ingredients.ts            # /api/ingredients (list, admin CRUD)
│   │   ├── members.ts                # /api/members (admin list, add, soft delete)
│   │   ├── orders.ts                 # /api/orders (place order, my orders, admin status)
│   │   ├── payments.ts               # /api/payments (built-in test checkout & verification)
│   │   ├── plans.ts                  # /api/plans (list membership plans)
│   │   ├── salads.ts                 # /api/salads (menu + custom saved salads)
│   │   └── subscriptions.ts          # /api/subscriptions (auto-orders, pause/resume/cancel)
│   ├── utils/
│   │   ├── seedData.ts               # Idempotent seed helper
│   │   └── store.ts                  # Supabase PostgreSQL repository with local fallback
│   └── seed.ts                       # Standalone CLI database seed script
└── src/
    ├── App.tsx                       # React Router routes & role guards
    ├── index.css                     # Tailwind CSS v4 tokens & typography
    ├── main.tsx
    ├── lib/
    │   └── supabase.ts               # Browser Supabase client
    ├── components/
    │   ├── ConfirmModal.tsx
    │   ├── DashboardLayout.tsx
    │   ├── Footer.tsx
    │   ├── Navbar.tsx
    │   ├── ProtectedRoute.tsx
    │   ├── RazorpayModal.tsx
    │   └── SaladImage.tsx
    ├── context/
    │   ├── AuthContext.tsx
    │   └── CartContext.tsx
    ├── pages/
    │   ├── AdminDashboardPage.tsx
    │   ├── AppointmentsPage.tsx
    │   ├── CartPage.tsx
    │   ├── CheckoutPage.tsx
    │   ├── HomePage.tsx
    │   ├── LoginRegisterPage.tsx
    │   ├── ManageMembersPage.tsx
    │   ├── ManageMenuPage.tsx
    │   ├── ManageOrdersPage.tsx
    │   ├── MemberDashboardPage.tsx
    │   ├── MenuPage.tsx
    │   ├── MyOrdersPage.tsx
    │   ├── MySubscriptionPage.tsx
    │   ├── PlansPage.tsx
    │   └── SaladBuilderPage.tsx
    ├── services/
    │   └── api.ts                    # Axios instance with auth header interceptor
    └── types/
        └── index.ts
```

---

## Setup & Run Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Initialize Supabase Schema (Project `gecshzcbzetimjbqoudh`)**
   - Open your **Supabase Dashboard** → **SQL Editor**.
   - Paste and run `supabase/schema.sql` to create all 9 tables (`plans`, `users`, `salads`, `ingredients`, `custom_salads`, `subscriptions`, `orders`, `payments`, `appointments`).
   - Environment defaults are already configured for your Supabase Project URL (`https://gecshzcbzetimjbqoudh.supabase.co`) and Publishable Key (`sb_publishable_WGrlO6CrIG3a6woIQcB1hA__GdHKUG-`). You can optionally copy `.env.example` to `.env` if deploying externally.

3. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). The server automatically seeds sample plans, signature salads, builder ingredients, and demo accounts on startup.

---

## Demo Accounts

- **Admin Console**: `admin@verdantbowl.com` / `Admin@123`
- **Member Portal**: `ananya@verdantbowl.com` / `Member@123`
