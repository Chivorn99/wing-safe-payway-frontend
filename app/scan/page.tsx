"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { verifyQR, saveTransaction } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  LogOut,
  BarChart2,
} from "lucide-react";

interface QRResult {
  recipientName: string;
  bankName: string;
  amount: number;
  qrType: string;
  riskLevel: "SAFE" | "WARNING" | "HIGH_RISK";
  category: string;
  warnings: string[];
  passedChecks: string[];
  message: string;
}

const riskConfig = {
  SAFE: {
    icon: ShieldCheck,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    badge: "bg-green-100 text-green-700",
    label: "Safe to Pay",
  },
  WARNING: {
    icon: ShieldAlert,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-700",
    label: "Proceed with Caution",
  },
  HIGH_RISK: {
    icon: ShieldX,
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-200",
    badge: "bg-red-100 text-red-700",
    label: "High Risk",
  },
};

export default function ScanPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    merchantId: "",
    displayedName: "",
    bankName: "",
    amount: "",
    currency: "USD",
    qrType: "MERCHANT",
  });

  const [result, setResult] = useState<QRResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await verifyQR({
        ...form,
        amount: parseFloat(form.amount),
      });
      setResult(res.data);
    } catch {
      toast.error("Failed to verify QR. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      await saveTransaction({
        userId: user.userId,
        recipientName: result.recipientName,
        recipientBank: result.bankName,
        amount: form.amount,
        currency: form.currency,
        riskLevel: result.riskLevel,
        category: result.category,
        proceeded: true,
      });
      toast.success("Payment recorded successfully!");
      setResult(null);
      setForm({
        merchantId: "",
        displayedName: "",
        bankName: "",
        amount: "",
        currency: "USD",
        qrType: "MERCHANT",
      });
    } catch {
      toast.error("Failed to save transaction.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const config = result ? riskConfig[result.riskLevel] : null;
  const RiskIcon = config?.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">W</span>
          </div>
          <span className="font-semibold text-gray-800">Wing SafePay</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{user?.fullName}</span>
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BarChart2 size={18} className="text-gray-600" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut size={18} className="text-gray-600" />
          </button>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* QR Input Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">Check QR Payment</h2>

          <form onSubmit={handleVerify} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Merchant ID
                </label>
                <input
                  value={form.merchantId}
                  onChange={(e) =>
                    setForm({ ...form, merchantId: e.target.value })
                  }
                  placeholder="KHQR001"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  QR Type
                </label>
                <select
                  value={form.qrType}
                  onChange={(e) => setForm({ ...form, qrType: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MERCHANT">Merchant</option>
                  <option value="PERSONAL">Personal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Recipient Name
              </label>
              <input
                value={form.displayedName}
                onChange={(e) =>
                  setForm({ ...form, displayedName: e.target.value })
                }
                placeholder="Brown Coffee"
                required
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Bank
                </label>
                <input
                  value={form.bankName}
                  onChange={(e) =>
                    setForm({ ...form, bankName: e.target.value })
                  }
                  placeholder="ABA Bank"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Amount (USD)
                </label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="5.00"
                  required
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? "Checking..." : "Verify QR"}
            </button>
          </form>
        </div>

        {/* Result Card */}
        {result && config && RiskIcon && (
          <div
            className={`bg-white rounded-2xl border shadow-sm p-5 ${config.border}`}
          >
            {/* Risk Header */}
            <div
              className={`flex items-center gap-3 p-3 rounded-xl mb-4 ${config.bg}`}
            >
              <RiskIcon size={28} className={config.color} />
              <div>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badge}`}
                >
                  {config.label}
                </span>
                <p className="text-sm text-gray-700 mt-1">{result.message}</p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Recipient</span>
                <span className="font-medium text-gray-800">
                  {result.recipientName}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bank</span>
                <span className="font-medium text-gray-800">
                  {result.bankName || "—"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Amount</span>
                <span className="font-medium text-gray-800">
                  ${result.amount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Category</span>
                <span className="font-medium text-gray-800">
                  {result.category}
                </span>
              </div>
            </div>

            {/* Passed Checks */}
            {result.passedChecks.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Passed Checks
                </p>
                <ul className="space-y-1">
                  {result.passedChecks.map((check, i) => (
                    <li
                      key={i}
                      className="text-xs text-green-700 flex items-center gap-1"
                    >
                      <span>✓</span> {check}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {result.warnings.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Warnings
                </p>
                <ul className="space-y-1">
                  {result.warnings.map((w, i) => (
                    <li
                      key={i}
                      className="text-xs text-red-600 flex items-center gap-1"
                    >
                      <span>⚠</span> {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setResult(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {result.riskLevel !== "HIGH_RISK" && (
                <button
                  onClick={handleProceed}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold transition-colors"
                >
                  {saving ? "Saving..." : "Proceed & Pay"}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
