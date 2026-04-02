# WingView — Frontend

A modern financial management web app built with Next.js. Track spending, scan receipts, set savings goals, and gain smart insights — all with a mobile-first Gen Z aesthetic.

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Vanilla CSS** (glassmorphism, gradients, micro-animations)
- **Axios** for API communication
- **React Hot Toast** for notifications
- **Chart.js** + **react-chartjs-2** for data visualization

## Features

- 🔐 **JWT Authentication** — Register, login, protected routes
- 📊 **Dashboard** — Real-time spending overview with charts
- 💳 **Transactions** — Add, search, filter, view history
- 🎯 **Savings Goals** — Create goals, track progress with ring charts
- 💡 **Insights & Budgets** — Category breakdown, weekly charts, smart tips
- 📸 **Receipt OCR** — Scan receipts to auto-fill transactions
- 👤 **Profile** — Change password, view account info
- 💰 **Dual Currency** — Full support for USD ($) and KHR (៛)
- 📱 **Mobile-First** — Responsive design tested on iPhone 14 (390×844)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8081
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Build for production

```bash
npm run build
npm start
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/register` | Create account |
| `/dashboard` | Spending overview + charts |
| `/transactions` | Transaction history + filters |
| `/goals` | Savings goals with progress rings |
| `/insights` | Analytics, budgets, category breakdown |
| `/scan` | Add transaction (manual / receipt upload / camera) |
| `/profile` | Account settings + change password |

## Project Structure

```
app/
├── components/      # NavBar, shared UI
├── dashboard/       # Dashboard page
├── goals/           # Savings goals page
├── insights/        # Insights & budgets page
├── login/           # Login page
├── register/        # Register page
├── scan/            # Add transaction page
├── transactions/    # Transaction list page
├── profile/         # Profile & settings page
├── globals.css      # Design system (1600+ lines)
└── layout.tsx       # Root layout + AuthProvider

lib/
├── api.ts           # Axios client + all API functions
├── AuthContext.tsx   # JWT auth context provider
└── localStorage.ts  # Budget helpers + currency formatting
```

## Demo Credentials

| Role | Phone | Password |
|------|-------|----------|
| User | `0961234567` | `123456` |
| Admin | `0960000000` | `admin123` |
