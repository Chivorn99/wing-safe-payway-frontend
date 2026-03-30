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
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
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
  merchant?: {
    merchantId: string;
    merchantName: string;
  } | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message || fallback;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}