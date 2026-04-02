"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getMyTransactions, type Transaction } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PAID: "badge-paid",
  VERIFIED: "badge-verified",
  BLOCKED: "badge-blocked",
};

const STATUS_ICON: Record<string, string> = {
  PAID: "✅",
  VERIFIED: "🔒",
  BLOCKED: "⚠️",
};

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

export default function TransactionsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [fetching, setFetching] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyTransactions();
        setTransactions(data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        toast.error(error?.response?.data?.message || "Failed to load transactions");
      } finally {
        setFetching(false);
      }
    };
    if (user) load();
  }, [user]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        !search ||
        tx.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        tx.bankName.toLowerCase().includes(search.toLowerCase()) ||
        tx.note?.toLowerCase().includes(search.toLowerCase());

      const matchCategory =
        filterCategory === "ALL" || tx.category === filterCategory;

      const matchStatus =
        filterStatus === "ALL" || tx.status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [transactions, search, filterCategory, filterStatus]);

  if (loading || !user) return null;

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <Link href="/dashboard" className="back-link">
              ← Dashboard
            </Link>
            <h1>📋 Transactions</h1>
            <p className="muted">{transactions.length} total records</p>
          </div>
          <Link href="/scan" className="primary-btn">
            + Add transaction
          </Link>
        </header>

        <section className="filter-bar">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Search by name or bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="filter-select"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="ALL">All categories</option>
            {["FOOD","SHOPPING","TRANSPORT","UTILITIES","HEALTH","EDUCATION","ENTERTAINMENT","TRANSFER","OTHER"].map(
              (c) => <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0) + c.slice(1).toLowerCase()}</option>
            )}
          </select>

          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All status</option>
            <option value="PAID">✅ Paid</option>
            <option value="VERIFIED">🔒 Verified</option>
            <option value="BLOCKED">⚠️ Blocked</option>
          </select>
        </section>

        <section className="panel">
          {fetching ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="skeleton" style={{ height: 48 }} />
              <div className="skeleton" style={{ height: 48 }} />
              <div className="skeleton" style={{ height: 48 }} />
              <div className="skeleton" style={{ height: 48 }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-emoji">🔍</div>
              <p>No transactions found</p>
              <Link href="/scan" className="primary-btn">
                Add one now
              </Link>
            </div>
          ) : (
            <div className="tx-table">
              <div className="tx-table-head">
                <span>Recipient</span>
                <span>Bank</span>
                <span>Category</span>
                <span>Amount</span>
                <span>Status</span>
                <span>Date</span>
              </div>

              {filtered.map((tx) => (
                <div className="tx-row" key={tx.id}>
                  <span className="tx-name">
                    {CATEGORY_EMOJI[tx.category] || "📌"} {tx.recipientName}
                  </span>
                  <span className="muted">{tx.bankName}</span>
                  <span className="muted">
                    {tx.category.charAt(0) + tx.category.slice(1).toLowerCase()}
                  </span>
                  <span className="tx-amount">
                    {tx.currency} {Number(tx.amount).toFixed(2)}
                  </span>
                  <span>
                    <span className={`badge ${STATUS_COLORS[tx.status] ?? ""}`}>
                      {STATUS_ICON[tx.status] || ""} {tx.status}
                    </span>
                  </span>
                  <span className="muted tx-date">
                    {tx.createdAt
                      ? new Date(tx.createdAt).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}