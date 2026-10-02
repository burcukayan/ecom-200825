import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import { cache } from "react";

const NAMESPACE = process.env.AUTH0_NAMESPACE ?? "https://ecom-200825.com/";
export const ROLES_CLAIM = `${NAMESPACE}roles`;

export const auth0 = new Auth0Client({
  authorizationParameters: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: "openid profile email offline_access",
  },
  async beforeSessionSaved(session) {
    const { sub, name, nickname, picture, email, email_verified } =
      session.user;
    const roles = session.user[ROLES_CLAIM];
    return {
      ...session,
      user: {
        sub,
        name,
        nickname,
        picture,
        email,
        email_verified,
        [ROLES_CLAIM]: Array.isArray(roles) ? roles : [],
      },
    };
  },
});

export enum AppRole {
  USER = "user",
  ADMIN = "admin",
}

export type Auth0SessionUser = {
  sub: string;
  name?: string;
  nickname?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;
  [key: string]: unknown;
};

export function getRolesFromUser(
  user: Auth0SessionUser | null | undefined,
): string[] {
  const value = user?.[ROLES_CLAIM];
  return Array.isArray(value)
    ? value.filter((v): v is string => typeof v === "string")
    : [];
}

export function isAdmin(user: Auth0SessionUser | null | undefined): boolean {
  return getRolesFromUser(user).includes(AppRole.ADMIN);
}

export const getSessionUser = cache(
  async (): Promise<Auth0SessionUser | null> => {
    const session = await auth0.getSession();
    return (session?.user as Auth0SessionUser | undefined) ?? null;
  },
);

export async function requireUser(): Promise<Auth0SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/auth/login");
  return user;
}

export async function requireAdmin(): Promise<Auth0SessionUser> {
  const user = await requireUser();
  if (!isAdmin(user)) redirect("/forbidden");
  return user;
}

export async function getAdmin(): Promise<Auth0SessionUser | null> {
  const user = await getSessionUser();
  return isAdmin(user) ? user : null;
}
