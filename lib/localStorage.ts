export type CategoryBudget = {
  category: string;
  limit: number;
  currency: string;
};

const BUDGETS_KEY = (uid: number) => `wingview_budgets_${uid}`;

// Budgets

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

// Currency helpers

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
