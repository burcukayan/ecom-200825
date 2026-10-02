import "server-only";
import { cache } from "react";
import { auth0, getSessionUser } from "@/lib/auth0";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

export type DbUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  address: string | null;
  role: "CUSTOMER" | "ADMIN";
};

export async function backendFetch(path: string, init: RequestInit = {}) {
  const { token } = await auth0.getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");

  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export const getDbUser = cache(async (): Promise<DbUser | null> => {
  const user = await getSessionUser();
  if (!user) return null;

  try {
    const res = await backendFetch("/v1/profile");
    if (!res.ok) return null;
    return (await res.json()) as DbUser;
  } catch (error) {
    console.error("Could not load profile from backend:", error);
    return null;
  }
});
