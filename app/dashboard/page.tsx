"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTransactions, getSpendingSummary } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { ArrowLeft, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

const riskBadge = {
  SAFE: {
    label: "Safe",
    icon: ShieldCheck,
    className: "bg-green-100 text-green-700",
  },
  WARNING: {
    label: "Warning",
    icon: ShieldAlert,
    className: "bg-yellow-100 text-yellow-700",
  },
  HIGH_RISK: {
    label: "High Risk",
    icon: ShieldX,
    className: "bg-red-100 text-red-700",
  },
};

type RiskLevel = keyof typeof riskBadge;

type Transaction = {
  recipientName?: string | null;
  recipientBank?: string | null;
  category?: string | null;
  amount: number;
  riskLevel?: RiskLevel | null;
};

type SpendingSummary = {
  totalTransactions: number;
  suspiciousBlocked: number;
  byCategory?: Record<string, number>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SpendingSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    const fetchData = async () => {
      try {
        const [txRes, sumRes] = await Promise.all([
          getTransactions(user.userId),
          getSpendingSummary(user.userId),
        ]);
        setTransactions((txRes.data ?? []) as Transaction[]);
        setSummary(sumRes.data as SpendingSummary);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  const chartData: Array<{ name: string; value: number }> = summary?.byCategory
    ? Object.entries(summary.byCategory).map(([name, value]) => ({
        name,
        value,
      }))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/scan")}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <h1 className="font-semibold text-gray-800">Spending Dashboard</h1>
          <p className="text-xs text-gray-500">{user?.fullName}</p>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-800">
                {summary.totalTransactions}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-xs text-gray-500 mb-1">Suspicious Blocked</p>
              <p className="text-2xl font-bold text-red-500">
                {summary.suspiciousBlocked}
              </p>
            </div>
          </div>
        )}

        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-4">
              Spending by Category
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: ValueType | undefined) => {
                    const numericValue =
                      typeof value === "number" ? value : Number(value ?? 0);
                    return `$${(Number.isFinite(numericValue) ? numericValue : 0).toFixed(2)}`;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Transaction History */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4">
            Transaction History
          </h3>

          {loading ? (
            <p className="text-sm text-gray-400 text-center py-4">Loading...</p>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">
              No transactions yet
            </p>
          ) : (
            <ul className="space-y-3">
              {transactions.map((tx, i) => {
                const risk = tx.riskLevel ? riskBadge[tx.riskLevel] : undefined;
                const RiskIcon = risk?.icon;
                return (
                  <li
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                        <span className="text-xs font-bold text-blue-600">
                          {tx.recipientName?.[0] ?? "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {tx.recipientName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {tx.category} · {tx.recipientBank}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-800">
                        ${tx.amount}
                      </p>
                      {risk && RiskIcon && (
                        <span
                          className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${risk.className}`}
                        >
                          <RiskIcon size={10} />
                          {risk.label}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
