import axios from "axios";

export type User = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type ReceiptLineItem = {
  name: string;
  quantity?: number;
  price?: number;
};

export type ReceiptDraft = {
  merchantName: string;
  totalAmount: number | "";
  transactionDate: string;
  category: string;
  note: string;
  paymentMethod: string;
  source: "manual" | "upload" | "camera";
  imageUrl?: string;
  lineItems?: ReceiptLineItem[];
};

export type DashboardSummary = {
  totalSpent: number;
  monthlySpent: number;
  receiptCount: number;
  manualCount: number;
  topCategories: { name: string; value: number }[];
  recentTransactions: {
    id: string;
    merchantName: string;
    totalAmount: number;
    transactionDate: string;
    category: string;
    source: string;
  }[];
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api",
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

export const apiClient = {
  async login(payload: { email: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: { name: string; email: string; password: string }) {
    const { data } = await api.post<AuthResponse>("/auth/register", payload);
    return data;
  },

  async getMe() {
    const { data } = await api.get<User>("/auth/me");
    return data;
  },

  async getDashboard() {
    const { data } = await api.get<DashboardSummary>("/dashboard/summary");
    return data;
  },

  async scanReceipt(file: File, source: "upload" | "camera") {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("source", source);

    const { data } = await api.post<ReceiptDraft>("/receipts/scan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return data;
  },

  async saveManualTransaction(payload: ReceiptDraft) {
    const { data } = await api.post("/transactions/manual", payload);
    return data;
  },

  async saveReceiptTransaction(payload: ReceiptDraft) {
    const { data } = await api.post("/transactions/from-receipt", payload);
    return data;
  },
};