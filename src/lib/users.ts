import "server-only";
import { backendFetch } from "@/lib/backend";

export type AdminUser = {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string | null;
  picture: string | null;
  address: string | null;
  role: "CUSTOMER" | "ADMIN";
  createdAt: string;
  orderCount: number;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await backendFetch("/v1/admin/users");
  if (!res.ok) throw new Error(`Could not load users (status ${res.status})`);
  return (await res.json()) as AdminUser[];
}
