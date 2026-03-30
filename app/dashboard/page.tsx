"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BarChart3,
  Camera,
  FileImage,
  LogOut,
  PencilLine,
  Receipt,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import { apiClient, type DashboardSummary } from "@/lib/api";

const COLORS = ["#0f766e", "#155e75", "#1d4ed8", "#7c3aed", "#b45309"];

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await apiClient.getDashboard();
        setSummary(data);
      } catch (error: unknown) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          axiosError?.response?.data?.message || "Failed to load dashboard",
        );
      } finally {
        setFetching(false);
      }
    };

    if (user) load();
  }, [user]);

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
          <p className="muted">Welcome back, {user.name}</p>
        </div>

        <div className="topbar-actions">
          <Link className="ghost-btn" href="/scan">
            <Receipt size={18} />
            Add receipt
          </Link>
          <button className="ghost-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      <section className="quick-actions">
        <Link href="/scan?mode=manual" className="action-card">
          <PencilLine size={20} />
          <div>
            <strong>Manual input</strong>
            <span>Enter transaction yourself</span>
          </div>
        </Link>

        <Link href="/scan?mode=upload" className="action-card">
          <FileImage size={20} />
          <div>
            <strong>Upload receipt</strong>
            <span>OCR auto-fills fields</span>
          </div>
        </Link>

        <Link href="/scan?mode=camera" className="action-card">
          <Camera size={20} />
          <div>
            <strong>Use camera</strong>
            <span>Take a picture in browser</span>
          </div>
        </Link>
      </section>

      {fetching ? (
        <div className="panel">
          <p className="muted">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <section className="stats-grid">
            <article className="stat-card">
              <span>Total spent</span>
              <strong>${Number(summary?.totalSpent || 0).toFixed(2)}</strong>
            </article>
            <article className="stat-card">
              <span>This month</span>
              <strong>${Number(summary?.monthlySpent || 0).toFixed(2)}</strong>
            </article>
            <article className="stat-card">
              <span>Receipts scanned</span>
              <strong>{summary?.receiptCount || 0}</strong>
            </article>
            <article className="stat-card">
              <span>Manual entries</span>
              <strong>{summary?.manualCount || 0}</strong>
            </article>
          </section>

          <section className="dashboard-grid">
            <article className="panel chart-panel">
              <div className="panel-head">
                <h2>Top categories</h2>
                <BarChart3 size={18} />
              </div>

              {summary?.topCategories?.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={summary.topCategories}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                    >
                      {summary.topCategories.map((_, index) => (
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
                <p className="muted">No category data yet.</p>
              )}
            </article>

            <article className="panel">
              <div className="panel-head">
                <h2>Recent transactions</h2>
              </div>

              <div className="tx-list">
                {summary?.recentTransactions?.length ? (
                  summary.recentTransactions.map((tx) => (
                    <div className="tx-item" key={tx.id}>
                      <div>
                        <strong>{tx.merchantName}</strong>
                        <p className="muted">
                          {tx.category} · {tx.source} · {tx.transactionDate}
                        </p>
                      </div>
                      <span>${Number(tx.totalAmount).toFixed(2)}</span>
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
