"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import {
  getAdminUsers,
  getAdminStats,
  AdminUser,
  PlatformStats,
} from "@/lib/api";

function decodeJwtRole(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.role || null;
  } catch {
    return null;
  }
}

export default function AdminPage() {
  const { token, loading: authLoading } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!token) {
      router.push("/login");
      return;
    }

    const role = decodeJwtRole(token);
    if (role !== "ADMIN") {
      setError("Access denied. You must be logged in as an Admin.");
      setPageLoading(false);
      return;
    }

    async function load() {
      try {
        const [u, s] = await Promise.all([getAdminUsers(), getAdminStats()]);
        setUsers(u);
        setStats(s);
      } catch {
        setError("Failed to load admin data. Please try again.");
      } finally {
        setPageLoading(false);
      }
    }
    load();
  }, [token, authLoading, router]);

  if (pageLoading) {
    return (
      <div className="app-shell">
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div className="spinner" />
          <p style={{ marginTop: 16, color: "var(--muted)" }}>Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-shell">
        <div className="card" style={{ textAlign: "center", padding: 48 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: "var(--danger)", marginBottom: 8 }}>Access Denied</h2>
          <p style={{ color: "var(--muted)" }}>{error}</p>
          <button
            className="primary-btn"
            style={{ marginTop: 24 }}
            onClick={() => router.push("/dashboard")}
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header style={{ marginBottom: 28 }}>
        <h1 className="page-title">
          <span className="page-title-icon">🛡️</span> Admin Dashboard
        </h1>
        <p className="page-subtitle">Platform overview — admin access only</p>
      </header>

      {/* Stats Cards */}
      {stats && (
        <section className="stats-grid goals-stats-grid" style={{ marginBottom: 28 }}>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">👥</span> Total Users
            </div>
            <div className="stat-value">{stats.totalUsers}</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">💳</span> Total Transactions
            </div>
            <div className="stat-value">{stats.totalTransactions}</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">🎯</span> Total Goals
            </div>
            <div className="stat-value">{stats.totalGoals}</div>
          </article>
        </section>
      )}

      {/* Users Table */}
      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--line)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-heading)" }}>
            👥 Registered Users
          </h2>
          <span
            style={{
              background: "var(--primary-light)",
              color: "var(--primary)",
              padding: "4px 12px",
              borderRadius: "var(--radius-full)",
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {users.length} users
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 14,
            }}
          >
            <thead>
              <tr
                style={{
                  background: "var(--bg-subtle)",
                  textAlign: "left",
                }}
              >
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ID
                </th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Name
                </th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Phone
                </th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Role
                </th>
                <th style={{ padding: "12px 16px", fontWeight: 600, color: "var(--muted)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Joined
                </th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr
                  key={user.id}
                  style={{
                    borderTop: "1px solid var(--line)",
                    background: i % 2 === 0 ? "transparent" : "var(--bg-subtle)",
                    transition: "var(--transition)",
                  }}
                >
                  <td style={{ padding: "14px 16px", color: "var(--faint)", fontWeight: 500 }}>
                    #{user.id}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600, color: "var(--text-heading)" }}>
                    {user.fullName}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--text)", fontFamily: "monospace" }}>
                    {user.phoneNumber}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        background:
                          user.role === "ADMIN"
                            ? "linear-gradient(135deg, #f59e0b, #f97316)"
                            : "var(--primary-light)",
                        color:
                          user.role === "ADMIN" ? "#fff" : "var(--primary)",
                      }}
                    >
                      {user.role === "ADMIN" ? "🔑 " : ""}
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--muted)", fontSize: 13 }}>
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Security notice */}
      <div
        className="card"
        style={{
          marginTop: 20,
          background: "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(249,115,22,0.05))",
          border: "1px solid rgba(245,158,11,0.2)",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "16px 20px",
        }}
      >
        <span style={{ fontSize: 20 }}>🛡️</span>
        <p style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.5 }}>
          <strong>Role-based access:</strong> This page is protected by{" "}
          <code style={{ background: "var(--surface)", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
            @PreAuthorize(&quot;hasRole(&apos;ADMIN&apos;)&quot;)
          </code>{" "}
          — only users with the <strong>ADMIN</strong> role in their JWT token can access these endpoints.
        </p>
      </div>
    </div>
  );
}
