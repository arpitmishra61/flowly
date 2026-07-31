"use client";

import axios from "axios";
import { API_URL } from "./api";

// Client-side helper that authenticates requests to apps/api with a
// short-lived JWT minted server-side (see app/api/internal-token/route.ts)
// from the caller's NextAuth session. apps/api verifies this token and
// derives the userId/email from it — it never trusts a client-supplied
// userId/email again.

let cachedToken: { value: string; expiresAt: number } | null = null;
let inflight: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  const res = await fetch("/api/internal-token");
  if (!res.ok) return null;
  const { token } = (await res.json()) as { token: string };
  return token;
}

async function getToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }
  if (!inflight) {
    inflight = fetchToken().finally(() => {
      inflight = null;
    });
  }
  const token = await inflight;
  if (token) {
    // Mint expiry is 5m server-side; refresh a little early.
    cachedToken = { value: token, expiresAt: Date.now() + 4 * 60 * 1000 };
  }
  return token;
}

export const apiClient = axios.create({ baseURL: API_URL });

apiClient.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = await getToken();
  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(`${API_URL}${path}`, { ...init, headers });
}
