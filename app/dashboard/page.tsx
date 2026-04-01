"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import {
  getApiErrorMessage,
  getMyTransactions,
  getSummary,
  type SpendingSummaryResponse,
  type Transaction,
} from "@/lib/api";

const COLORS = [
  "#0f766e",
  "#2563eb",
  "#7c3aed",
  "#ea580c",
  "#16a34a",
  "#dc2626",
  "#0891b2",
  "#ca8a04",
  "#6b7280",
];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const [summaryData, txData] = await Promise.all([
          getSummary(),
          getMyTransactions(),
        ]);
        setSummary(summaryData);
        setTransactions(txData);
      } catch (error: unknown) {
        toast.error(getApiErrorMessage(error, "Failed to load dashboard"));
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

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

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
          <Link href="/scan" className="primary-link-btn">
            Add transaction
          </Link>
          <button className="ghost-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="quick-actions">
        <Link href="/scan?mode=manual" className="action-card">
          <div className="icon">✏️</div>
          <div>
            <strong>Manual</strong>
            <span>Enter transaction</span>
          </div>
        </Link>
        <Link href="/scan?mode=upload" className="action-card">
          <div className="icon">📎</div>
          <div>
            <strong>Upload receipt</strong>
            <span>OCR auto-fill</span>
          </div>
        </Link>
        <Link href="/scan?mode=camera" className="action-card">
          <div className="icon">📷</div>
          <div>
            <strong>Camera</strong>
            <span>Capture receipt</span>
          </div>
        </Link>
      </section>

      {fetching ? (
        <section className="panel">
          <p className="muted">Loading dashboard...</p>
        </section>
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <span>Total spent</span>
              <strong>${Number(summary?.totalSpent || 0).toFixed(2)}</strong>
            </article>

            <article className="stat-card">
              <span>Total transactions</span>
              <strong>{summary?.totalTransactions || 0}</strong>
            </article>

            <article className="stat-card">
              <span>Blocked transactions</span>
              <strong>{summary?.blockedTransactions || 0}</strong>
            </article>
          </section>

          <div style={{ marginBottom: "16px" }}>
            <Link href="/transactions" className="ghost-btn">
              View all transactions →
            </Link>
          </div>

          <section className="dashboard-grid">
            <article className="panel">
              <div className="panel-head">
                <h2>Category breakdown</h2>
              </div>

              {pieData.length ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={95}
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="muted">No spending data yet.</p>
              )}
            </article>

            <article className="panel">
              <div className="panel-head">
                <h2>Recent transactions</h2>
              </div>

              <div className="tx-list">
                {transactions.length ? (
                  transactions.slice(0, 8).map((tx) => (
                    <div className="tx-item" key={tx.id}>
                      <div>
                        <strong>{tx.recipientName}</strong>
                        <p>
                          {tx.category} · {tx.bankName}{" "}
                          <span
                            className={`badge badge-${tx.status.toLowerCase()}`}
                          >
                            {tx.status}
                          </span>
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
          </section>
        </>
      )}
    </main>
  );
}