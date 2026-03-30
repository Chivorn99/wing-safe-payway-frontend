"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import {
  createTransaction,
  getApiErrorMessage,
  type TransactionDTO,
} from "@/lib/api";

const initialForm: TransactionDTO = {
  merchantId: "",
  recipientName: "",
  bankName: "",
  amount: 0,
  currency: "USD",
  category: "OTHER",
  riskLevel: "LOW",
  paymentContext: "MERCHANT",
  status: "PAID",
  note: "",
};

export default function ScanPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<TransactionDTO>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await createTransaction({
        ...form,
        merchantId: form.merchantId?.trim() || undefined,
      });
      toast.success("Transaction saved");
      router.push("/dashboard");
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Failed to save transaction"));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return null;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <button className="back-link-btn" onClick={() => router.push("/dashboard")}>
            ← Back
          </button>
          <h1>Manual transaction</h1>
          <p className="muted">
            OCR upload comes next. For now, save transactions manually to match backend.
          </p>
        </div>
      </header>

      <section className="panel form-panel">
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field-row">
            <label className="field">
              <span>Recipient name</span>
              <input
                type="text"
                value={form.recipientName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, recipientName: e.target.value }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Bank name</span>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, bankName: e.target.value }))
                }
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Amount</span>
              <input
                type="number"
                step="0.01"
                value={form.amount}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amount: Number(e.target.value),
                  }))
                }
                required
              />
            </label>

            <label className="field">
              <span>Currency</span>
              <input
                type="text"
                value={form.currency}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))
                }
                required
              />
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Category</span>
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    category: e.target.value as TransactionDTO["category"],
                  }))
                }
              >
                <option value="FOOD">FOOD</option>
                <option value="SHOPPING">SHOPPING</option>
                <option value="TRANSPORT">TRANSPORT</option>
                <option value="UTILITIES">UTILITIES</option>
                <option value="HEALTH">HEALTH</option>
                <option value="EDUCATION">EDUCATION</option>
                <option value="ENTERTAINMENT">ENTERTAINMENT</option>
                <option value="TRANSFER">TRANSFER</option>
                <option value="OTHER">OTHER</option>
              </select>
            </label>

            <label className="field">
              <span>Payment context</span>
              <select
                value={form.paymentContext}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    paymentContext: e.target.value as TransactionDTO["paymentContext"],
                  }))
                }
              >
                <option value="MERCHANT">MERCHANT</option>
                <option value="WINGSHOP">WINGSHOP</option>
                <option value="P2P">P2P</option>
                <option value="BILLPAY">BILLPAY</option>
              </select>
            </label>
          </div>

          <div className="field-row">
            <label className="field">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as TransactionDTO["status"],
                  }))
                }
              >
                <option value="PAID">PAID</option>
                <option value="VERIFIED">VERIFIED</option>
                <option value="BLOCKED">BLOCKED</option>
              </select>
            </label>

            <label className="field">
              <span>Risk level</span>
              <select
                value={form.riskLevel}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    riskLevel: e.target.value as TransactionDTO["riskLevel"],
                  }))
                }
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </label>
          </div>

          <label className="field">
            <span>Merchant ID (optional)</span>
            <input
              type="text"
              value={form.merchantId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, merchantId: e.target.value }))
              }
            />
          </label>

          <label className="field">
            <span>Note</span>
            <textarea
              rows={4}
              value={form.note}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, note: e.target.value }))
              }
            />
          </label>

          <button className="primary-btn" type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save transaction"}
          </button>
        </form>
      </section>
    </main>
  );
}