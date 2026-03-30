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

export const API_BASE_URL =
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