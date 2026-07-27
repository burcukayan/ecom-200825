import { auth0 } from "./lib/auth0";
import { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const authResponse = await auth0.middleware(request);

  return authResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
