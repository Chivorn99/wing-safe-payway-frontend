"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "@/lib/AuthContext";
import {
  getApiErrorMessage,
  getMyTransactions,
  getSummary,
  type SpendingSummaryResponse,
  type Transaction,
} from "@/lib/api";

const CHART_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b",
  "#3b82f6", "#ef4444", "#06b6d4",
  "#ec4899", "#14b8a6", "#6b7280",
];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍔",
  SHOPPING: "🛍️",
  TRANSPORT: "🚗",
  UTILITIES: "💡",
  HEALTH: "🏥",
  EDUCATION: "📚",
  ENTERTAINMENT: "🎮",
  TRANSFER: "💸",
  OTHER: "📌",
};

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
}

function NavBar() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", icon: "📊", label: "Dashboard" },
    { href: "/scan", icon: "📸", label: "Add" },
    { href: "/transactions", icon: "📋", label: "History" },
    { href: "/profile", icon: "👤", label: "Profile" },
  ];

  return (
    <nav className="nav-bar">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`nav-item${pathname === link.href ? " active" : ""}`}
        >
          <span className="nav-item-icon">{link.icon}</span>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, t] = await Promise.all([getSummary(), getMyTransactions()]);
        setSummary(s);
        setTransactions(t);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load dashboard"));
      } finally {
        setFetching(false);
      }
    };
    if (user) load();
  }, [user]);

  const pieData = useMemo(() => {
    if (!summary?.categoryBreakdown) return [];
    return Object.entries(summary.categoryBreakdown).map(([name, value]) => ({
      name: `${CATEGORY_EMOJI[name] || "📌"} ${name.charAt(0) + name.slice(1).toLowerCase()}`,
      value: Number(value),
    }));
  }, [summary]);

  const barData = useMemo(() => {
    const monthly: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (!tx.createdAt) return;
      const month = new Date(tx.createdAt).toLocaleString("default", {
        month: "short",
        year: "2-digit",
      });
      monthly[month] = (monthly[month] || 0) + Number(tx.amount);
    });
    return Object.entries(monthly)
      .map(([month, total]) => ({ month, total }))
      .slice(-6);
  }, [transactions]);

  const recent = transactions.slice(0, 5);

  function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  if (loading || !user) return null;

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <div className="greeting-emoji">{greeting.emoji}</div>
            <h1>{greeting.text}, {user.fullName?.split(" ")[0]}</h1>
            <p className="muted">Here&apos;s your spending overview</p>
          </div>
        </header>

        {fetching ? (
          <section className="stats-grid">
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-stat" />
          </section>
        ) : (
          <>
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">💰</span>
                  Total spent
                </div>
                <div className="stat-value">
                  ${Number(summary?.totalSpent || 0).toFixed(2)}
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">📊</span>
                  Transactions
                </div>
                <div className="stat-value">
                  {summary?.totalTransactions || 0}
                </div>
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">🚫</span>
                  Blocked
                </div>
                <div className="stat-value" style={{ color: "#ef4444" }}>
                  {summary?.blockedTransactions || 0}
                </div>
              </article>
            </section>

            {/* Quick actions */}
            <section className="quick-actions">
              <Link href="/scan" className="action-card">
                <div className="action-icon">📸</div>
                <div>
                  <strong>Scan receipt</strong>
                  <span>Auto-fill from photo</span>
                </div>
              </Link>
              <Link href="/scan" className="action-card">
                <div className="action-icon">✏️</div>
                <div>
                  <strong>Manual entry</strong>
                  <span>Add transaction</span>
                </div>
              </Link>
              <Link href="/transactions" className="action-card">
                <div className="action-icon">📋</div>
                <div>
                  <strong>View history</strong>
                  <span>All transactions</span>
                </div>
              </Link>
            </section>

            <section className="dashboard-grid">
              {/* Bar chart */}
              <article className="panel">
                <div className="panel-head">
                  <h2>📈 Spending over time</h2>
                </div>

                {barData.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
                      <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                      <Tooltip
                        formatter={(val) => {
                          const amount = Number(
                            Array.isArray(val) ? val[0] : (val ?? 0)
                          );
                          return [`$${amount.toFixed(2)}`, "Spent"];
                        }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(16,185,129,0.12)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-emoji">📊</div>
                    <p>No spending data yet</p>
                  </div>
                )}
              </article>

              {/* Pie chart */}
              <article className="panel">
                <div className="panel-head">
                  <h2>🍩 By category</h2>
                </div>
                {pieData.length ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={82}
                        innerRadius={48}
                        strokeWidth={2}
                        stroke="#fff"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val) => {
                          const amount = Number(
                            Array.isArray(val) ? val[0] : (val ?? 0)
                          );
                          return [`$${amount.toFixed(2)}`, "Amount"];
                        }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid rgba(16,185,129,0.12)",
                          boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                          fontSize: 13,
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 12, lineHeight: "20px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-emoji">🍩</div>
                    <p>No category data yet</p>
                  </div>
                )}
              </article>
            </section>

            {/* Recent transactions */}
            <article className="panel" style={{ marginTop: 20 }}>
              <div className="panel-head">
                <h2>🕐 Recent transactions</h2>
                <Link href="/transactions" className="ghost-btn" style={{ height: 36, fontSize: 13 }}>
                  View all →
                </Link>
              </div>

              <div className="tx-list">
                {recent.length ? (
                  recent.map((tx) => (
                    <div className="tx-item" key={tx.id}>
                      <div className="tx-item-info">
                        <div className="tx-item-emoji">
                          {CATEGORY_EMOJI[tx.category] || "📌"}
                        </div>
                        <div>
                          <strong>{tx.recipientName}</strong>
                          <p className="muted">
                            {tx.category.charAt(0) + tx.category.slice(1).toLowerCase()} · {tx.createdAt ? timeAgo(tx.createdAt) : "—"}
                          </p>
                        </div>
                      </div>
                      <span className="tx-item-amount">
                        {tx.currency} {Number(tx.amount).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-emoji">📝</div>
                    <p>No transactions yet. Add your first one!</p>
                    <Link href="/scan" className="primary-btn">Add transaction</Link>
                  </div>
                )}
              </div>
            </article>
          </>
        )}
      </main>
    </>
  );
}