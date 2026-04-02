// ---------------------------------------------------------------------------
// localStorage helpers — Goals & Budgets (per-user, keyed by userId)
// ---------------------------------------------------------------------------

export type SavingGoal = {
  id: string;
  emoji: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;           // "USD" | "KHR"
  deadline: string;           // ISO date string
  createdAt: string;
  contributions: { amount: number; date: string }[];
};

export type CategoryBudget = {
  category: string;
  limit: number;
  currency: string;
};

const GOALS_KEY = (uid: number) => `wingview_goals_${uid}`;
const BUDGETS_KEY = (uid: number) => `wingview_budgets_${uid}`;

// ── Goals ───────────────────────────────────────────────────────────────────

export function getGoals(userId: number): SavingGoal[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GOALS_KEY(userId));
    return raw ? (JSON.parse(raw) as SavingGoal[]) : [];
  } catch {
    return [];
  }
}

export function saveGoals(userId: number, goals: SavingGoal[]): void {
  localStorage.setItem(GOALS_KEY(userId), JSON.stringify(goals));
}

export function addGoal(userId: number, goal: Omit<SavingGoal, "id" | "createdAt" | "contributions" | "savedAmount">): SavingGoal {
  const goals = getGoals(userId);
  const newGoal: SavingGoal = {
    ...goal,
    id: `goal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    savedAmount: 0,
    createdAt: new Date().toISOString(),
    contributions: [],
  };
  goals.push(newGoal);
  saveGoals(userId, goals);
  return newGoal;
}

export function deleteGoal(userId: number, goalId: string): void {
  const goals = getGoals(userId).filter((g) => g.id !== goalId);
  saveGoals(userId, goals);
}

export function contributeToGoal(userId: number, goalId: string, amount: number): void {
  const goals = getGoals(userId);
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return;
  goal.savedAmount += amount;
  goal.contributions.push({ amount, date: new Date().toISOString() });
  saveGoals(userId, goals);
}

// ── Budgets ─────────────────────────────────────────────────────────────────

export function getBudgets(userId: number): CategoryBudget[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(BUDGETS_KEY(userId));
    return raw ? (JSON.parse(raw) as CategoryBudget[]) : [];
  } catch {
    return [];
  }
}

export function saveBudgets(userId: number, budgets: CategoryBudget[]): void {
  localStorage.setItem(BUDGETS_KEY(userId), JSON.stringify(budgets));
}

export function setBudget(userId: number, category: string, limit: number, currency: string): void {
  const budgets = getBudgets(userId);
  const existing = budgets.find((b) => b.category === category);
  if (existing) {
    existing.limit = limit;
    existing.currency = currency;
  } else {
    budgets.push({ category, limit, currency });
  }
  saveBudgets(userId, budgets);
}

export function removeBudget(userId: number, category: string): void {
  const budgets = getBudgets(userId).filter((b) => b.category !== category);
  saveBudgets(userId, budgets);
}

// ── Currency helpers ────────────────────────────────────────────────────────

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "KHR", symbol: "៛", name: "Cambodian Riel" },
] as const;

export function formatCurrency(amount: number, currency: string): string {
  const cur = CURRENCIES.find((c) => c.code === currency);
  if (currency === "KHR") {
    return `៛${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }
  return `${cur?.symbol || "$"}${amount.toFixed(2)}`;
}
