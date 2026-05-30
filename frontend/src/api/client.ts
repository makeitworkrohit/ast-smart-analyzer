/**
 * Central API client + auth/token storage.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios, { AxiosInstance } from "axios";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "ast.token";
const USER_KEY = "ast.user";

export const api: AxiosInstance = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function saveAuth(token: string, user: any) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearAuth() {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(USER_KEY);
}

export async function getStoredUser() {
  const raw = await AsyncStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function getStoredToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}
