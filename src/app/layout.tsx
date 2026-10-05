import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { cn } from "@/lib/utils";
import { CartProvider } from "@/context/cart-context";
import { getSessionUser } from "@/lib/auth0";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Ecommerce Store",
    template: "%s | Ecommerce Store",
  },
  description: "Browse products, manage your account, and shop online.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getSessionUser();
  const userId = user?.sub ?? "guest";

  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <CartProvider userId={userId}>
          <Navbar />
          <div className="flex flex-1 flex-col">{children}</div>
        </CartProvider>
      </body>
    </html>
  );
}
