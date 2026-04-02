"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const FEATURES = [
  {
    emoji: "📸",
    title: "Scan Receipts",
    desc: "Snap a photo and auto-extract transaction details with OCR.",
  },
  {
    emoji: "💡",
    title: "Smart Insights",
    desc: "AI-powered spending analysis with actionable tips to save more.",
  },
  {
    emoji: "🎯",
    title: "Savings Goals",
    desc: "Set goals, track progress, and celebrate milestones along the way.",
  },
  {
    emoji: "📊",
    title: "Budget Limits",
    desc: "Set per-category budgets and get alerts before you overspend.",
  },
];

const STEPS = [
  { num: "01", emoji: "📝", title: "Add Transactions", desc: "Manually, by upload, or camera scan." },
  { num: "02", emoji: "📊", title: "Get Insights", desc: "See where your money goes, with smart tips." },
  { num: "03", emoji: "💰", title: "Save Smarter", desc: "Set goals and budgets to grow your savings." },
];

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  if (user) return null;

  return (
    <main className="landing">
      {/* ── Hero ────────────────────────────────── */}
      <section className="landing-hero">
        <div className="landing-hero-bg" />
        <div className="landing-hero-content">
          <div className="brand-badge">✨ WingView</div>
          <h1 className="landing-title">
            Take control of<br />
            <span className="landing-title-accent">your money</span>
          </h1>
          <p className="landing-subtitle">
            Track spending, scan receipts, set savings goals, and build smarter financial habits — all in one beautiful app.
          </p>
          <div className="landing-ctas">
            <Link href="/register" className="primary-btn" style={{ height: 52, padding: "0 32px", fontSize: 16 }}>
              Get started free →
            </Link>
            <Link href="/login" className="ghost-btn" style={{ height: 52, padding: "0 32px", fontSize: 16 }}>
              Sign in
            </Link>
          </div>

          <div className="landing-hero-stats">
            <div className="landing-hero-stat">
              <strong>100%</strong>
              <span>Free to use</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <strong>OCR</strong>
              <span>Receipt scanning</span>
            </div>
            <div className="landing-hero-stat-divider" />
            <div className="landing-hero-stat">
              <strong>KHR + USD</strong>
              <span>Multi-currency</span>
            </div>
          </div>
        </div>

        <div className="landing-hero-visual">
          <div className="landing-phone-mockup">
            <div className="landing-mockup-screen">
              <div className="landing-mockup-topbar">
                <span>📊</span>
                <strong>Dashboard</strong>
                <span>👤</span>
              </div>
              <div className="landing-mockup-greeting">
                <span>☀️</span> Good afternoon
              </div>
              <div className="landing-mockup-cards">
                <div className="landing-mockup-stat">
                  <span>💰 Spent</span>
                  <strong>$1,240</strong>
                </div>
                <div className="landing-mockup-stat">
                  <span>🎯 Saved</span>
                  <strong>$580</strong>
                </div>
              </div>
              <div className="landing-mockup-chart">
                <div className="landing-mockup-bar" style={{ height: "40%" }} />
                <div className="landing-mockup-bar" style={{ height: "65%" }} />
                <div className="landing-mockup-bar" style={{ height: "45%" }} />
                <div className="landing-mockup-bar" style={{ height: "80%" }} />
                <div className="landing-mockup-bar" style={{ height: "55%" }} />
                <div className="landing-mockup-bar" style={{ height: "70%" }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────── */}
      <section className="landing-section">
        <div className="landing-section-header">
          <span className="landing-section-badge">Features</span>
          <h2>Everything you need to manage money</h2>
          <p className="muted">Simple, powerful tools designed for the way you actually spend.</p>
        </div>

        <div className="landing-features-grid">
          {FEATURES.map((f) => (
            <div className="landing-feature-card" key={f.title}>
              <div className="landing-feature-emoji">{f.emoji}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────── */}
      <section className="landing-section landing-section-alt">
        <div className="landing-section-header">
          <span className="landing-section-badge">How it works</span>
          <h2>Three steps to smarter spending</h2>
        </div>

        <div className="landing-steps">
          {STEPS.map((s) => (
            <div className="landing-step" key={s.num}>
              <div className="landing-step-num">{s.num}</div>
              <div className="landing-step-emoji">{s.emoji}</div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="landing-section landing-cta-section">
        <div className="landing-cta-card">
          <div className="landing-cta-emoji">🚀</div>
          <h2>Ready to take control?</h2>
          <p>Join WingView today and start building better spending habits.</p>
          <Link href="/register" className="primary-btn" style={{ height: 52, padding: "0 32px", fontSize: 16 }}>
            Create free account →
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────── */}
      <footer className="landing-footer">
        <div className="brand-badge">✨ WingView</div>
        <p className="muted">Smart spending insights for everyone.</p>
        <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>© {new Date().getFullYear()} WingView. Built in Cambodia 🇰🇭</p>
      </footer>
    </main>
  );
}