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
import {
  getApiErrorMessage,
  getMyTransactions,
  getSummary,
  type SpendingSummaryResponse,
  type Transaction,
} from "@/lib/api";

const CHART_COLORS = [
  "#0f766e", "#2563eb", "#7c3aed",
  "#ea580c", "#16a34a", "#dc2626",
  "#0891b2", "#ca8a04", "#6b7280",
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);

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
      name,
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

  if (loading || !user) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <div className="brand-badge">WingView</div>
          <h1>Dashboard</h1>
          <p className="muted">Welcome back, {user.fullName}</p>
        </div>
        <div className="topbar-actions">
          <Link href="/scan" className="primary-btn">Add transaction</Link>
          <Link href="/transactions" className="ghost-btn">History</Link>
          <button className="ghost-btn" onClick={() => { logout(); router.replace("/login"); }}>
            Logout
          </button>
        </div>
      </header>

      {fetching ? (
        <div className="panel"><p className="muted">Loading...</p></div>
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <span>Total spent</span>
              <strong>${Number(summary?.totalSpent || 0).toFixed(2)}</strong>
            </article>
            <article className="stat-card">
              <span>Transactions</span>
              <strong>{summary?.totalTransactions || 0}</strong>
            </article>
            <article className="stat-card">
              <span>Blocked</span>
              <strong style={{ color: "#dc2626" }}>
                {summary?.blockedTransactions || 0}
              </strong>
            </article>
          </section>

          <section className="dashboard-grid">
            {/* Bar chart */}
            <article className="panel">
              <div className="panel-head">
                <h2>Spending over time</h2>
              </div>

              {barData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      formatter={(val) => {
                        const amount = Number(
                          Array.isArray(val) ? val[0] : (val ?? 0)
                        );
                        return [`$${amount.toFixed(2)}`, "Spent"];
                      }}
                      contentStyle={{ borderRadius: 8, border: "1px solid rgba(0,0,0,0.08)" }}
                    />
                    <Bar dataKey="total" fill="#0f766e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted">No data yet.</p>
              )}
            </article>

            {/* Pie chart */}
            <article className="panel">
              <div className="panel-head">
                <h2>By category</h2>
              </div>
              {pieData.length ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={80}
                      innerRadius={44}
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
                    />
                    <Legend
                      iconType="circle"
                      iconSize={10}
                      wrapperStyle={{ fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted">No category data yet.</p>
              )}
            </article>
          </section>

          {/* Recent transactions */}
          <article className="panel" style={{ marginTop: 20 }}>
            <div className="panel-head">
              <h2>Recent transactions</h2>
              <Link href="/transactions" className="ghost-btn" style={{ height: 34, fontSize: 13 }}>
                View all →
              </Link>
            </div>

            <div className="tx-list">
              {recent.length ? (
                recent.map((tx) => (
                  <div className="tx-item" key={tx.id}>
                    <div>
                      <strong>{tx.recipientName}</strong>
                      <p className="muted">
                        {tx.category} · {tx.bankName} · {tx.status}
                      </p>
                    </div>
                    <span>
                      {tx.currency} {Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="muted">No transactions yet.</p>
              )}
            </div>
          </article>
        </>
      )}
    </main>
  );
}