"use client";

import Link from "next/link";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "./ui/navigation-menu";
import { Button } from "./ui/button";
import { type Auth0SessionUser } from "@/lib/auth0";
import { ModeToggle } from "@/components/mode-toggle";

export default function NavBarUI({ user }: { user: Auth0SessionUser | null }) {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <div className="font-bold text-xl tracking-tight">
        <Link href="/">E-Commerce</Link>
      </div>

      <NavigationMenu>
        <NavigationMenuList className="flex gap-2">
          <NavigationMenuItem>
            <Link href="/" className={navigationMenuTriggerStyle()}>
              Home
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href="/products" className={navigationMenuTriggerStyle()}>
              Products
            </Link>
          </NavigationMenuItem>

          {user ? (
            <NavigationMenuItem>
              <Link href="/profile" className={navigationMenuTriggerStyle()}>
                My Profile
              </Link>
            </NavigationMenuItem>
          ) : null}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center gap-4">
        <ModeToggle />
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              Hello, {user.name}
            </span>
            <Button asChild variant="secondary">
              <a href="/auth/logout">Log Out</a>
            </Button>
          </div>
        ) : (
          <Button asChild variant="default">
            <a href="/auth/login">Log In / Sign Up</a>
          </Button>
        )}
      </div>
    </header>
  );
}
