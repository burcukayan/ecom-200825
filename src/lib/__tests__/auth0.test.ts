import type { SessionData } from "@auth0/nextjs-auth0/types";

const mockGetSession = jest.fn();

jest.mock("@auth0/nextjs-auth0/server", () => ({
  Auth0Client: jest.fn().mockImplementation(() => ({
    getSession: (...args: unknown[]) => mockGetSession(...args),
  })),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { redirect } from "next/navigation";
import {
  ROLES_CLAIM,
  getAdmin,
  getRolesFromUser,
  getSessionUser,
  isAdmin,
  requireAdmin,
  requireUser,
  type Auth0SessionUser,
} from "@/lib/auth0";

const clientOptions = jest.mocked(Auth0Client).mock.calls[0]?.[0];

function makeUser(
  roles?: unknown,
  extra: Partial<Auth0SessionUser> = {},
): Auth0SessionUser {
  return {
    sub: "auth0|123",
    name: "Test User",
    email: "test@example.com",
    ...(roles !== undefined && { [ROLES_CLAIM]: roles }),
    ...extra,
  };
}

function mockSession(user: Auth0SessionUser | null) {
  mockGetSession.mockResolvedValue(user ? { user } : null);
}

describe("getRolesFromUser", () => {
  it("returns an empty array when there is no user", () => {
    expect(getRolesFromUser(null)).toEqual([]);
    expect(getRolesFromUser(undefined)).toEqual([]);
  });

  it("returns an empty array when the roles claim is missing", () => {
    expect(getRolesFromUser(makeUser())).toEqual([]);
  });

  it("returns the roles from the namespaced claim", () => {
    expect(getRolesFromUser(makeUser(["admin", "user"]))).toEqual([
      "admin",
      "user",
    ]);
  });

  it("ignores a non-namespaced roles claim", () => {
    expect(getRolesFromUser(makeUser(undefined, { roles: ["admin"] }))).toEqual(
      [],
    );
  });

  it("returns an empty array when the claim is not an array", () => {
    expect(getRolesFromUser(makeUser("admin"))).toEqual([]);
  });

  it("filters out non-string values", () => {
    expect(
      getRolesFromUser(makeUser(["admin", 1, null, { role: "x" }])),
    ).toEqual(["admin"]);
  });
});

describe("isAdmin", () => {
  it("is true for a user with the admin role", () => {
    expect(isAdmin(makeUser(["user", "admin"]))).toBe(true);
  });

  it("is false for a regular user", () => {
    expect(isAdmin(makeUser(["user"]))).toBe(false);
  });

  it("is false when there is no user", () => {
    expect(isAdmin(null)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isAdmin(makeUser(["Admin"]))).toBe(false);
  });
});

describe("getSessionUser", () => {
  it("returns the session user", async () => {
    const user = makeUser(["user"]);
    mockSession(user);
    await expect(getSessionUser()).resolves.toEqual(user);
  });

  it("returns null when there is no session", async () => {
    mockSession(null);
    await expect(getSessionUser()).resolves.toBeNull();
  });
});

describe("requireUser", () => {
  it("redirects to login when there is no session", async () => {
    mockSession(null);
    await expect(requireUser()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
    expect(redirect).toHaveBeenCalledWith("/auth/login");
  });

  it("returns the user when logged in", async () => {
    const user = makeUser(["user"]);
    mockSession(user);
    await expect(requireUser()).resolves.toEqual(user);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("requireAdmin", () => {
  it("redirects to login when there is no session", async () => {
    mockSession(null);
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/auth/login");
  });

  it("redirects to /forbidden for a non-admin user", async () => {
    mockSession(makeUser(["user"]));
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/forbidden");
    expect(redirect).toHaveBeenCalledWith("/forbidden");
  });

  it("redirects to /forbidden when the roles claim is missing", async () => {
    mockSession(makeUser());
    await expect(requireAdmin()).rejects.toThrow("NEXT_REDIRECT:/forbidden");
  });

  it("returns the user for an admin", async () => {
    const admin = makeUser(["admin"]);
    mockSession(admin);
    await expect(requireAdmin()).resolves.toEqual(admin);
    expect(redirect).not.toHaveBeenCalled();
  });
});

describe("getAdmin", () => {
  it("returns null without redirecting when there is no session", async () => {
    mockSession(null);
    await expect(getAdmin()).resolves.toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns null for a non-admin user", async () => {
    mockSession(makeUser(["user"]));
    await expect(getAdmin()).resolves.toBeNull();
  });

  it("returns the user for an admin", async () => {
    const admin = makeUser(["admin"]);
    mockSession(admin);
    await expect(getAdmin()).resolves.toEqual(admin);
  });
});

describe("Auth0Client configuration", () => {
  it("requests a refresh token and the profile scopes", () => {
    const scope = String(clientOptions?.authorizationParameters?.scope);
    expect(scope).toContain("openid");
    expect(scope).toContain("offline_access");
  });

  describe("beforeSessionSaved", () => {
    async function save(user: Record<string, unknown>) {
      const session = {
        user,
        tokenSet: {},
        internal: {},
      } as unknown as SessionData;
      return clientOptions!.beforeSessionSaved!(session, null);
    }

    it("keeps the roles claim and only the needed profile fields", async () => {
      const result = await save({
        sub: "auth0|123",
        name: "Test User",
        email: "test@example.com",
        email_verified: true,
        given_name: "Test",
        updated_at: "2026-01-01",
        [ROLES_CLAIM]: ["admin"],
      });

      expect(result.user).toEqual({
        sub: "auth0|123",
        name: "Test User",
        nickname: undefined,
        picture: undefined,
        email: "test@example.com",
        email_verified: true,
        [ROLES_CLAIM]: ["admin"],
      });
    });

    it("stores an empty roles array when the claim is missing or invalid", async () => {
      expect((await save({ sub: "a" })).user[ROLES_CLAIM]).toEqual([]);
      expect(
        (await save({ sub: "a", [ROLES_CLAIM]: "admin" })).user[ROLES_CLAIM],
      ).toEqual([]);
    });
  });
});
