import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const register = (fullName: string, phoneNumber: string, password: string) =>
  api.post(`/api/auth/register?fullName=${encodeURIComponent(fullName)}`, {
    phoneNumber,
    password,
  });

export const login = (phoneNumber: string, password: string) =>
  api.post('/api/auth/login', { phoneNumber, password });

// QR
export const verifyQR = (data: {
  merchantId: string;
  displayedName: string;
  bankName: string;
  amount: number;
  currency: string;
  qrType: string;
}) => api.post('/api/qr/verify', data);

// Transactions
export const saveTransaction = (data: object) =>
  api.post('/api/transactions', data);

export const getTransactions = (userId: number) =>
  api.get(`/api/transactions/user/${userId}`);

export const getSpendingSummary = (userId: number) =>
  api.get(`/api/transactions/user/${userId}/summary`);

export default api;