"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useAuth } from "@/lib/AuthContext";
import NavBar from "@/app/components/NavBar";
import {
  getApiErrorMessage,
  getMyTransactions,
  getSummary,
  type SpendingSummaryResponse,
  type Transaction,
} from "@/lib/api";
import {
  getGoals,
  getBudgets,
  type SavingGoal,
  type CategoryBudget,
} from "@/lib/localStorage";

const CHART_COLORS = [
  "#10b981", "#8b5cf6", "#f59e0b",
  "#3b82f6", "#ef4444", "#06b6d4",
  "#ec4899", "#14b8a6", "#6b7280",
];

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍔", SHOPPING: "🛍️", TRANSPORT: "🚗", UTILITIES: "💡",
  HEALTH: "🏥", EDUCATION: "📚", ENTERTAINMENT: "🎮", TRANSFER: "💸", OTHER: "📌",
};

function getGreeting(): { text: string; emoji: string } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "🌅" };
  if (hour < 17) return { text: "Good afternoon", emoji: "☀️" };
  return { text: "Good evening", emoji: "🌙" };
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);
  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [budgetAlerts, setBudgetAlerts] = useState<string[]>([]);

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

        // Check budget alerts
        if (user) {
          const budgets: CategoryBudget[] = getBudgets(user.userId);
          const now = new Date();
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          const thisMonthTx = t.filter((tx) => {
            if (!tx.createdAt) return false;
            const d = new Date(tx.createdAt);
            return d >= monthStart && d <= monthEnd;
          });

          const alerts: string[] = [];
          budgets.forEach((b) => {
            const spent = thisMonthTx
              .filter((tx) => tx.category === b.category)
              .reduce((s, tx) => s + Number(tx.amount), 0);
            const pct = (spent / b.limit) * 100;
            if (pct >= 80) {
              const cat = b.category.charAt(0) + b.category.slice(1).toLowerCase();
              if (pct >= 100) {
                alerts.push(`${CATEGORY_EMOJI[b.category] || "📌"} ${cat} budget exceeded!`);
              } else {
                alerts.push(`${CATEGORY_EMOJI[b.category] || "📌"} ${cat} budget is ${pct.toFixed(0)}% used`);
              }
            }
          });
          setBudgetAlerts(alerts);
        }
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load dashboard"));
      } finally {
        setFetching(false);
      }
    };
    if (user) {
      load();
      setGoals(getGoals(user.userId));
    }
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
  const topGoals = goals.slice(0, 2);

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

        {/* Budget alerts */}
        {budgetAlerts.map((alert, i) => (
          <div className="budget-alert" key={i}>
            <span className="budget-alert-emoji">⚠️</span>
            {alert}
            <Link href="/insights" style={{ marginLeft: "auto", color: "#92400e", fontWeight: 600, fontSize: 13 }}>View →</Link>
          </div>
        ))}

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
              <Link href="/insights" className="action-card">
                <div className="action-icon">💡</div>
                <div>
                  <strong>View insights</strong>
                  <span>Smart analytics</span>
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

            {/* Goals snapshot */}
            {topGoals.length > 0 && (
              <article className="panel" style={{ marginBottom: 20 }}>
                <div className="panel-head">
                  <h2>🎯 Goals Progress</h2>
                  <Link href="/goals" className="ghost-btn" style={{ height: 36, fontSize: 13 }}>
                    All goals →
                  </Link>
                </div>
                <div className="dashboard-goals-snapshot">
                  {topGoals.map((goal) => {
                    const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
                    const circumference = 2 * Math.PI * 18;
                    const offset = circumference - (pct / 100) * circumference;
                    return (
                      <div className="goal-snapshot-card" key={goal.id}>
                        <div className="goal-snapshot-ring">
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            <circle cx="24" cy="24" r="18" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="4" />
                            <circle
                              cx="24" cy="24" r="18" fill="none"
                              stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                              strokeDasharray={circumference}
                              strokeDashoffset={offset}
                              transform="rotate(-90 24 24)"
                            />
                          </svg>
                          <div className="goal-snapshot-center">{goal.emoji}</div>
                        </div>
                        <div className="goal-snapshot-info">
                          <strong>{goal.name}</strong>
                          <span>{Math.round(pct)}% • ${goal.savedAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            )}

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
                          const amount = Number(Array.isArray(val) ? val[0] : (val ?? 0));
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
                          const amount = Number(Array.isArray(val) ? val[0] : (val ?? 0));
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