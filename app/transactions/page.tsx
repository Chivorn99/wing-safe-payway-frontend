"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import { getMyTransactions, type Transaction } from "@/lib/api";

const STATUS_COLORS: Record<string, string> = {
  PAID: "badge-paid",
  VERIFIED: "badge-verified",
  BLOCKED: "badge-blocked",
};

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
    <main className="app-shell">
      <header className="topbar">
        <div>
          <Link href="/dashboard" className="back-link">
            ← Dashboard
          </Link>
          <h1>Transactions</h1>
          <p className="muted">{transactions.length} total records</p>
        </div>
        <Link href="/scan" className="primary-btn">
          Add transaction
        </Link>
      </header>

      <section className="filter-bar">
        <input
          type="text"
          className="search-input"
          placeholder="Search by name or bank..."
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
            (c) => <option key={c} value={c}>{c}</option>
          )}
        </select>

        <select
          className="filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="ALL">All status</option>
          <option value="PAID">PAID</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="BLOCKED">BLOCKED</option>
        </select>
      </section>

      <section className="panel">
        {fetching ? (
          <p className="muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No transactions found.</p>
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
                <span className="tx-name">{tx.recipientName}</span>
                <span className="muted">{tx.bankName}</span>
                <span className="muted">{tx.category}</span>
                <span className="tx-amount">
                  {tx.currency} {Number(tx.amount).toFixed(2)}
                </span>
                <span>
                  <span className={`badge ${STATUS_COLORS[tx.status] ?? ""}`}>
                    {tx.status}
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
  );
}