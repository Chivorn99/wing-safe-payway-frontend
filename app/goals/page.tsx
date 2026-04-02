"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/AuthContext";
import NavBar from "@/app/components/NavBar";
import {
  getGoals,
  addGoal,
  deleteGoal,
  contributeToGoal,
  formatCurrency,
  CURRENCIES,
  type SavingGoal,
} from "@/lib/localStorage";

const GOAL_EMOJIS = ["🎯", "💰", "🏠", "🚗", "✈️", "📱", "💻", "🎓", "💍", "🏥", "👗", "🎮", "📚", "⚡"];

export default function GoalsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [goals, setGoals] = useState<SavingGoal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  // New goal form
  const [emoji, setEmoji] = useState("🎯");
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [deadline, setDeadline] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const refresh = useCallback(() => {
    if (user) setGoals(getGoals(user.userId));
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !targetAmount) return;

    addGoal(user.userId, {
      emoji,
      name,
      targetAmount: Number(targetAmount),
      currency,
      deadline: deadline || new Date(Date.now() + 90 * 86400000).toISOString(),
    });

    toast.success("Goal created! 🎯");
    setShowForm(false);
    setName("");
    setTargetAmount("");
    setDeadline("");
    setEmoji("🎯");
    refresh();
  };

  const handleContribute = (goalId: string) => {
    if (!user || !contributeAmount || Number(contributeAmount) <= 0) return;
    contributeToGoal(user.userId, goalId, Number(contributeAmount));
    toast.success("Contribution added! 💰");
    setContributeId(null);
    setContributeAmount("");
    refresh();
  };

  const handleDelete = (goalId: string) => {
    if (!user) return;
    deleteGoal(user.userId, goalId);
    toast.success("Goal removed");
    refresh();
  };

  const getProgress = (g: SavingGoal) => Math.min((g.savedAmount / g.targetAmount) * 100, 100);

  const getDaysLeft = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86400000));
  };

  if (loading || !user) return null;

  const totalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
  const totalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
  const completedGoals = goals.filter((g) => g.savedAmount >= g.targetAmount).length;

  return (
    <>
      <NavBar />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <h1>🎯 Savings Goals</h1>
            <p className="muted">Set goals, track progress, and celebrate wins.</p>
          </div>
          <button className="primary-btn" onClick={() => setShowForm(true)}>
            + New goal
          </button>
        </header>

        {/* Stats */}
        <section className="stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">🎯</span> Active Goals
            </div>
            <div className="stat-value">{goals.length}</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">💰</span> Total Saved
            </div>
            <div className="stat-value">${totalSaved.toFixed(2)}</div>
          </article>
          <article className="stat-card">
            <div className="stat-label">
              <span className="stat-label-icon">🏆</span> Completed
            </div>
            <div className="stat-value" style={{ color: "#10b981" }}>{completedGoals}</div>
          </article>
        </section>

        {/* Create form */}
        {showForm && (
          <section className="panel goal-form-panel" style={{ marginBottom: 24 }}>
            <div className="panel-head">
              <h2>✨ Create new goal</h2>
              <button className="ghost-btn" style={{ height: 36, fontSize: 13 }} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
            <form className="form-stack" onSubmit={handleCreate}>
              <div>
                <span style={{ fontSize: 13, fontWeight: 600, display: "block", marginBottom: 8 }}>Pick an emoji</span>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {GOAL_EMOJIS.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`mode-btn${emoji === e ? " active" : ""}`}
                      style={{ width: 44, height: 44, padding: 0, fontSize: 20, borderRadius: 12 }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
              <label className="field">
                <span>Goal name</span>
                <input type="text" placeholder="e.g. Emergency Fund" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <div className="field-row">
                <label className="field">
                  <span>Target amount</span>
                  <input type="number" step="0.01" placeholder="5000" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required />
                </label>
                <label className="field">
                  <span>Currency</span>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.symbol} {c.code} — {c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Deadline</span>
                <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </label>
              <button className="primary-btn" type="submit">🎯 Create goal</button>
            </form>
          </section>
        )}

        {/* Goals list */}
        {goals.length === 0 ? (
          <section className="panel">
            <div className="empty-state">
              <div className="empty-state-emoji">🎯</div>
              <p>No goals yet. Create your first savings goal!</p>
              <button className="primary-btn" onClick={() => setShowForm(true)}>+ Create goal</button>
            </div>
          </section>
        ) : (
          <section className="goals-grid">
            {goals.map((goal) => {
              const progress = getProgress(goal);
              const days = getDaysLeft(goal.deadline);
              const completed = progress >= 100;
              const circumference = 2 * Math.PI * 54;
              const offset = circumference - (progress / 100) * circumference;

              return (
                <article className={`panel goal-card${completed ? " goal-completed" : ""}`} key={goal.id}>
                  {completed && <div className="goal-badge">🎉 Complete!</div>}

                  <div className="goal-card-top">
                    <div className="goal-progress-ring">
                      <svg width="128" height="128" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="54" fill="none" stroke="rgba(16,185,129,0.1)" strokeWidth="8" />
                        <circle
                          cx="64" cy="64" r="54" fill="none"
                          stroke={completed ? "#10b981" : progress > 75 ? "#f59e0b" : "#10b981"}
                          strokeWidth="8" strokeLinecap="round"
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          transform="rotate(-90 64 64)"
                          style={{ transition: "stroke-dashoffset 0.6s ease" }}
                        />
                      </svg>
                      <div className="goal-progress-center">
                        <span className="goal-progress-emoji">{goal.emoji}</span>
                        <span className="goal-progress-pct">{Math.round(progress)}%</span>
                      </div>
                    </div>
                    <div className="goal-card-info">
                      <h3>{goal.name}</h3>
                      <p className="goal-amount">
                        <strong>{formatCurrency(goal.savedAmount, goal.currency)}</strong>
                        <span className="muted"> / {formatCurrency(goal.targetAmount, goal.currency)}</span>
                      </p>
                      {!completed && (
                        <p className="muted" style={{ fontSize: 13 }}>
                          {days > 0 ? `${days} days left` : "Deadline passed"}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="goal-card-actions">
                    {!completed && (
                      <>
                        {contributeId === goal.id ? (
                          <div style={{ display: "flex", gap: 8, flex: 1 }}>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Amount"
                              value={contributeAmount}
                              onChange={(e) => setContributeAmount(e.target.value)}
                              className="search-input"
                              style={{ flex: 1, height: 38 }}
                              autoFocus
                            />
                            <button className="primary-btn" style={{ height: 38, fontSize: 13 }} onClick={() => handleContribute(goal.id)}>
                              Add
                            </button>
                            <button className="ghost-btn" style={{ height: 38, fontSize: 13 }} onClick={() => { setContributeId(null); setContributeAmount(""); }}>
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button className="primary-btn" style={{ height: 38, fontSize: 13 }} onClick={() => setContributeId(goal.id)}>
                            💰 Add money
                          </button>
                        )}
                      </>
                    )}
                    <button className="ghost-btn" style={{ height: 38, fontSize: 13, color: "#ef4444", borderColor: "#fecaca" }} onClick={() => handleDelete(goal.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </main>
    </>
  );
}
