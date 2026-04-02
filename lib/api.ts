import axios from "axios";

export type AuthRequest = {
  phoneNumber: string;
  password: string;
  fullName?: string;
};

export type AuthResponse = {
  token: string;
  fullName: string;
  userId: number;
};

export type SpendingSummaryResponse = {
  totalSpent: string;
  totalTransactions: number;
  blockedTransactions: number;
  categoryBreakdown: Record<string, string>;
};

export type TransactionDTO = {
  merchantId?: string;
  recipientName: string;
  bankName: string;
  amount: number;
  currency: string;
  category:
    | "FOOD"
    | "SHOPPING"
    | "TRANSPORT"
    | "UTILITIES"
    | "HEALTH"
    | "EDUCATION"
    | "ENTERTAINMENT"
    | "TRANSFER"
    | "OTHER";
  riskLevel: "SAFE" | "WARNING" | "HIGH_RISK";
  paymentContext: "MERCHANT" | "WINGSHOP" | "P2P" | "BILLPAY";
  status: "VERIFIED" | "PAID" | "BLOCKED";
  note?: string;
};

export type Transaction = {
  id: number;
  recipientName: string;
  bankName: string;
  amount: number | string;
  currency: string;
  category: string;
  riskLevel: string;
  paymentContext: string;
  status: string;
  note?: string;
  createdAt: string;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "wingview_token";
const USER_KEY = "wingview_user";

let authRedirectInProgress = false;

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (
      responseData &&
      typeof responseData === "object" &&
      "message" in responseData
    ) {
      const message = (responseData as { message?: unknown }).message;
      if (typeof message === "string" && message.trim().length > 0) {
        return message;
      }
    }

    if (typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("wingview_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = String(error?.config?.url || "");
    const isAuthEndpoint =
      requestUrl.includes("/api/auth/login") ||
      requestUrl.includes("/api/auth/register");

    if (
      typeof window !== "undefined" &&
      !authRedirectInProgress &&
      !isAuthEndpoint &&
      status === 401
    ) {
      authRedirectInProgress = true;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      sessionStorage.setItem("wingview_auth_expired", "1");
      delete api.defaults.headers.common.Authorization;
      window.location.replace("/login");
    }

    return Promise.reject(error);
  }
);

export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function login(data: AuthRequest) {
  const response = await api.post<AuthResponse>("/api/auth/login", data);
  return response.data;
}

export async function register(data: AuthRequest) {
  const response = await api.post<AuthResponse>("/api/auth/register", data);
  return response.data;
}

export async function createTransaction(data: TransactionDTO) {
  const response = await api.post<Transaction>("/api/transactions", data);
  return response.data;
}

export async function getMyTransactions() {
  const response = await api.get<Transaction[]>("/api/transactions/me");
  return response.data;
}

export async function getSummary() {
  const response = await api.get<SpendingSummaryResponse>(
    "/api/transactions/summary"
  );
  return response.data;
}

// ── Saving Goals API ────────────────────────────────────────────────────────

export type SavingGoalResponse = {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  deadline: string | null;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED";
  currency: string;
  emoji: string;
  createdAt: string;
};

export type SavingGoalRequest = {
  title: string;
  targetAmount: number;
  deadline?: string;
  currency?: string;
  emoji?: string;
};

export type GoalProgressRequest = {
  amount: number;
};

export async function getMyGoals() {
  const response = await api.get<SavingGoalResponse[]>("/api/goals/me");
  return response.data;
}

export async function createGoal(data: SavingGoalRequest) {
  const response = await api.post<SavingGoalResponse>("/api/goals", data);
  return response.data;
}

export async function addGoalProgress(goalId: number, data: GoalProgressRequest) {
  const response = await api.patch<SavingGoalResponse>(
    `/api/goals/${goalId}/progress`,
    data
  );
  return response.data;
}

export async function deleteGoalApi(goalId: number) {
  await api.delete(`/api/goals/${goalId}`);
}

// ── Admin endpoints (ADMIN role only) ────────────────────────

export type AdminUser = {
  id: number;
  phoneNumber: string;
  fullName: string;
  role: string;
  createdAt: string;
};

export type PlatformStats = {
  totalUsers: number;
  totalTransactions: number;
  totalGoals: number;
};

export async function getAdminUsers() {
  const response = await api.get<AdminUser[]>("/api/admin/users");
  return response.data;
}

export async function getAdminStats() {
  const response = await api.get<PlatformStats>("/api/admin/stats");
  return response.data;
}