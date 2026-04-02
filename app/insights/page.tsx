"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/lib/AuthContext";
import NavBar from "@/app/components/NavBar";
import { getMyTransactions, getApiErrorMessage, type Transaction } from "@/lib/api";
import {
  getBudgets,
  setBudget,
  removeBudget,
  formatCurrency,
  CURRENCIES,
  type CategoryBudget,
} from "@/lib/localStorage";

const CATEGORY_EMOJI: Record<string, string> = {
  FOOD: "🍔", SHOPPING: "🛍️", TRANSPORT: "🚗", UTILITIES: "💡",
  HEALTH: "🏥", EDUCATION: "📚", ENTERTAINMENT: "🎮", TRANSFER: "💸", OTHER: "📌",
};

const ALL_CATEGORIES = ["FOOD", "SHOPPING", "TRANSPORT", "UTILITIES", "HEALTH", "EDUCATION", "ENTERTAINMENT", "TRANSFER", "OTHER"];

type Tab = "insights" | "budgets";

function getMonthRange(offset: number = 0) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59);
  return { start, end };
}

function getWeekDays() {
  const days = [];
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function InsightsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgetsState] = useState<CategoryBudget[]>([]);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<Tab>("insights");

  // Budget form
  const [budgetCategory, setBudgetCategory] = useState("FOOD");
  const [budgetLimit, setBudgetLimit] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getMyTransactions();
        setTransactions(data);
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Failed to load data"));
      } finally {
        setFetching(false);
      }
    };
    if (user) {
      load();
      setBudgetsState(getBudgets(user.userId));
    }
  }, [user]);

  // ── Computed insights ──────────────────────────────────────────────────

  const thisMonth = useMemo(() => {
    const { start, end } = getMonthRange(0);
    return transactions.filter((tx) => {
      if (!tx.createdAt) return false;
      const d = new Date(tx.createdAt);
      return d >= start && d <= end;
    });
  }, [transactions]);

  const lastMonth = useMemo(() => {
    const { start, end } = getMonthRange(-1);
    return transactions.filter((tx) => {
      if (!tx.createdAt) return false;
      const d = new Date(tx.createdAt);
      return d >= start && d <= end;
    });
  }, [transactions]);

  const thisMonthTotal = useMemo(() => thisMonth.reduce((s, t) => s + Number(t.amount), 0), [thisMonth]);
  const lastMonthTotal = useMemo(() => lastMonth.reduce((s, t) => s + Number(t.amount), 0), [lastMonth]);

  const monthChange = useMemo(() => {
    if (lastMonthTotal === 0) return null;
    return ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
  }, [thisMonthTotal, lastMonthTotal]);

  const categorySpend = useMemo(() => {
    const map: Record<string, number> = {};
    thisMonth.forEach((tx) => {
      map[tx.category] = (map[tx.category] || 0) + Number(tx.amount);
    });
    return Object.entries(map)
      .map(([cat, amt]) => ({ category: cat, amount: amt }))
      .sort((a, b) => b.amount - a.amount);
  }, [thisMonth]);

  const topCategory = categorySpend[0] || null;

  const dailyAverage = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    return dayOfMonth > 0 ? thisMonthTotal / dayOfMonth : 0;
  }, [thisMonthTotal]);

  const weeklyData = useMemo(() => {
    const days = getWeekDays();
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, i) => {
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const total = transactions
        .filter((tx) => {
          if (!tx.createdAt) return false;
          const d = new Date(tx.createdAt);
          return d >= dayStart && d <= dayEnd;
        })
        .reduce((s, t) => s + Number(t.amount), 0);

      return { day: dayNames[i], total };
    });
  }, [transactions]);

  // Spending score
  const spendingScore = useMemo(() => {
    if (budgets.length === 0 || thisMonth.length === 0) return null;
    let underBudget = 0;
    budgets.forEach((b) => {
      const spent = categorySpend.find((c) => c.category === b.category)?.amount || 0;
      if (spent <= b.limit) underBudget++;
    });
    const ratio = underBudget / budgets.length;
    if (ratio >= 0.9) return { grade: "A", color: "#10b981", msg: "Excellent! You're well within your budgets." };
    if (ratio >= 0.7) return { grade: "B", color: "#34d399", msg: "Good job! Most categories are on track." };
    if (ratio >= 0.5) return { grade: "C", color: "#f59e0b", msg: "Watch out — some categories need attention." };
    if (ratio >= 0.3) return { grade: "D", color: "#f97316", msg: "Several categories are over budget." };
    return { grade: "F", color: "#ef4444", msg: "Most budgets exceeded. Time to reassess!" };
  }, [budgets, categorySpend, thisMonth]);

  // Smart tips
  const tips = useMemo(() => {
    const t: { emoji: string; text: string }[] = [];
    if (topCategory) {
      const pct = thisMonthTotal > 0 ? ((topCategory.amount / thisMonthTotal) * 100).toFixed(0) : 0;
      t.push({
        emoji: CATEGORY_EMOJI[topCategory.category] || "📌",
        text: `Your biggest expense is ${topCategory.category.charAt(0) + topCategory.category.slice(1).toLowerCase()} — ${pct}% of total spending.`,
      });
      const savings20 = topCategory.amount * 0.2;
      if (savings20 > 1) {
        t.push({
          emoji: "💡",
          text: `Reducing ${topCategory.category.charAt(0) + topCategory.category.slice(1).toLowerCase()} by 20% would save $${savings20.toFixed(2)}/month.`,
        });
      }
    }
    if (monthChange !== null) {
      if (monthChange > 10) {
        t.push({ emoji: "📈", text: `Spending is up ${monthChange.toFixed(0)}% vs last month. Check where the increase is coming from.` });
      } else if (monthChange < -10) {
        t.push({ emoji: "🎉", text: `Great job! Spending is down ${Math.abs(monthChange).toFixed(0)}% vs last month.` });
      }
    }
    if (dailyAverage > 0) {
      t.push({ emoji: "📅", text: `You're averaging $${dailyAverage.toFixed(2)}/day this month.` });
    }
    if (t.length === 0) {
      t.push({ emoji: "📝", text: "Add more transactions to unlock personalized insights!" });
    }
    return t;
  }, [topCategory, monthChange, dailyAverage, thisMonthTotal]);

  // ── Budget handlers ────────────────────────────────────────────────────

  const handleSetBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !budgetLimit || Number(budgetLimit) <= 0) return;
    setBudget(user.userId, budgetCategory, Number(budgetLimit), budgetCurrency);
    setBudgetsState(getBudgets(user.userId));
    setBudgetLimit("");
    toast.success("Budget set! 📊");
  };

  const handleRemoveBudget = (category: string) => {
    if (!user) return;
    removeBudget(user.userId, category);
    setBudgetsState(getBudgets(user.userId));
    toast.success("Budget removed");
  };

  if (loading || !user) return null;

  const daysLeftInMonth = (() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return end.getDate() - now.getDate();
  })();

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <h1>💡 Insights & Budgets</h1>
            <p className="muted">Smart spending analysis and budget tracking</p>
          </div>
        </header>

        {/* Tab switcher */}
        <div className="mode-switch" style={{ marginBottom: 24 }}>
          <button className={`mode-btn${tab === "insights" ? " active" : ""}`} onClick={() => setTab("insights")}>
            💡 Insights
          </button>
          <button className={`mode-btn${tab === "budgets" ? " active" : ""}`} onClick={() => setTab("budgets")}>
            📊 Budgets
          </button>
        </div>

        {fetching ? (
          <div style={{ display: "grid", gap: 16 }}>
            <div className="skeleton skeleton-stat" />
            <div className="skeleton skeleton-panel" />
          </div>
        ) : tab === "insights" ? (
          <>
            {/* Spending overview */}
            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">💰</span> This Month
                </div>
                <div className="stat-value">${thisMonthTotal.toFixed(2)}</div>
                {monthChange !== null && (
                  <div className={`stat-trend ${monthChange >= 0 ? "up" : "down"}`}>
                    {monthChange >= 0 ? "↑" : "↓"} {Math.abs(monthChange).toFixed(0)}% vs last month
                  </div>
                )}
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">📅</span> Daily Average
                </div>
                <div className="stat-value">${dailyAverage.toFixed(2)}</div>
              </article>
              <article className="stat-card">
                <div className="stat-label">
                  <span className="stat-label-icon">🏆</span> Top Category
                </div>
                <div className="stat-value" style={{ fontSize: 22 }}>
                  {topCategory ? `${CATEGORY_EMOJI[topCategory.category] || ""} ${topCategory.category.charAt(0) + topCategory.category.slice(1).toLowerCase()}` : "—"}
                </div>
              </article>
            </section>

            {/* Spending score */}
            {spendingScore && (
              <article className="panel insight-score" style={{ marginBottom: 20, textAlign: "center", padding: 32 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: spendingScore.color, lineHeight: 1 }}>
                  {spendingScore.grade}
                </div>
                <p style={{ marginTop: 8, fontSize: 14, fontWeight: 500, color: spendingScore.color }}>Monthly Spending Score</p>
                <p className="muted" style={{ marginTop: 4 }}>{spendingScore.msg}</p>
              </article>
            )}

            {/* Weekly chart */}
            <article className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-head">
                <h2>📊 This Week</h2>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} />
                  <Tooltip
                    formatter={(val) => [`$${Number(Array.isArray(val) ? val[0] : val ?? 0).toFixed(2)}`, "Spent"]}
                    contentStyle={{ borderRadius: 12, border: "1px solid rgba(16,185,129,0.12)", fontSize: 13 }}
                  />
                  <Bar dataKey="total" fill="url(#insightBarGrad)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="insightBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#6ee7b7" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </article>

            {/* Smart tips */}
            <article className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-head">
                <h2>💡 Smart Tips</h2>
              </div>
              <div className="insights-tip-list">
                {tips.map((tip, i) => (
                  <div className="insight-tip" key={i}>
                    <span className="insight-tip-emoji">{tip.emoji}</span>
                    <p>{tip.text}</p>
                  </div>
                ))}
              </div>
            </article>

            {/* Category breakdown */}
            <article className="panel">
              <div className="panel-head">
                <h2>📂 Category Breakdown</h2>
              </div>
              {categorySpend.length === 0 ? (
                <p className="muted">No spending data this month.</p>
              ) : (
                <div className="category-bars">
                  {categorySpend.map((cat) => {
                    const pct = thisMonthTotal > 0 ? (cat.amount / thisMonthTotal) * 100 : 0;
                    return (
                      <div className="category-bar-row" key={cat.category}>
                        <div className="category-bar-label">
                          <span>{CATEGORY_EMOJI[cat.category] || "📌"} {cat.category.charAt(0) + cat.category.slice(1).toLowerCase()}</span>
                          <span className="muted">${cat.amount.toFixed(2)} ({pct.toFixed(0)}%)</span>
                        </div>
                        <div className="category-bar-track">
                          <div className="category-bar-fill" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </article>
          </>
        ) : (
          /* ── Budgets tab ──────────────────────────────────────────────── */
          <>
            {/* Set budget form */}
            <article className="panel" style={{ marginBottom: 20 }}>
              <div className="panel-head">
                <h2>➕ Set a Budget</h2>
              </div>
              <form className="form-stack" onSubmit={handleSetBudget} style={{ marginTop: 0 }}>
                <div className="field-row" style={{ gridTemplateColumns: "1fr 1fr 1fr auto" }}>
                  <label className="field">
                    <span>Category</span>
                    <select value={budgetCategory} onChange={(e) => setBudgetCategory(e.target.value)}>
                      {ALL_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c.charAt(0) + c.slice(1).toLowerCase()}</option>
                      ))}
                    </select>
                  </label>
                  <label className="field">
                    <span>Monthly limit</span>
                    <input type="number" step="0.01" placeholder="300" value={budgetLimit} onChange={(e) => setBudgetLimit(e.target.value)} required />
                  </label>
                  <label className="field">
                    <span>Currency</span>
                    <select value={budgetCurrency} onChange={(e) => setBudgetCurrency(e.target.value)}>
                      {CURRENCIES.map((c) => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                      ))}
                    </select>
                  </label>
                  <button className="primary-btn" type="submit" style={{ alignSelf: "flex-end", height: 46 }}>
                    Set
                  </button>
                </div>
              </form>
            </article>

            {/* Budget list */}
            {budgets.length === 0 ? (
              <article className="panel">
                <div className="empty-state">
                  <div className="empty-state-emoji">📊</div>
                  <p>No budgets set yet. Add one above to start tracking!</p>
                </div>
              </article>
            ) : (
              <section className="budget-list">
                {budgets.map((b) => {
                  const spent = categorySpend.find((c) => c.category === b.category)?.amount || 0;
                  const pct = Math.min((spent / b.limit) * 100, 100);
                  const remaining = Math.max(b.limit - spent, 0);
                  const isOver = spent > b.limit;
                  const isWarning = pct >= 80 && !isOver;

                  return (
                    <article className={`panel budget-card${isOver ? " budget-over" : isWarning ? " budget-warn" : ""}`} key={b.category}>
                      <div className="budget-card-header">
                        <div>
                          <h3>
                            {CATEGORY_EMOJI[b.category] || "📌"}{" "}
                            {b.category.charAt(0) + b.category.slice(1).toLowerCase()}
                          </h3>
                          <p className="muted" style={{ fontSize: 13 }}>
                            {formatCurrency(spent, b.currency)} of {formatCurrency(b.limit, b.currency)} used
                          </p>
                        </div>
                        <button
                          className="ghost-btn"
                          style={{ height: 32, fontSize: 12, color: "#ef4444", borderColor: "#fecaca" }}
                          onClick={() => handleRemoveBudget(b.category)}
                        >
                          Remove
                        </button>
                      </div>

                      <div className="budget-progress-track">
                        <div
                          className={`budget-progress-fill${isOver ? " over" : isWarning ? " warn" : ""}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="budget-card-footer">
                        <span className={isOver ? "budget-amount-over" : ""}>
                          {isOver
                            ? `⚠️ Over by ${formatCurrency(spent - b.limit, b.currency)}`
                            : `${formatCurrency(remaining, b.currency)} remaining`}
                        </span>
                        <span className="muted">{daysLeftInMonth} days left</span>
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </>
        )}
      </main>
    </>
  );
}
