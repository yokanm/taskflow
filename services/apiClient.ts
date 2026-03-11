
import { useAuthStore } from "@/store/auth.store";
import { Platform } from "react-native";

const NGROK_URL = 'https://unrepeatable-squarrose-leanna.ngrok-free.dev';
const LAN_IP = '';

function getBaseUrl(): string {
  if (NGROK_URL) return `${NGROK_URL}/api/v1`;
  if (LAN_IP)    return `http://${LAN_IP}:3000/api/v1`;
  return Platform.select({
    android: 'http://10.0.2.2:3000/api/v1',
    ios:     'http://localhost:3000/api/v1',
    web:     'http://192.168.32.107:3000/api/v1',
    default: 'http://localhost:3000/api/v1',
  })!;
}

export const BASE_URL = getBaseUrl();

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {

  const token = useAuthStore.getState().accessToken;

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
      Authorization: token ? `Bearer ${token}` : '',
      ...(options?.headers || {}),
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}