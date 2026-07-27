import type { Metadata } from "next";
import { requireAdmin } from '@/lib/auth0';



export const metadata: Metadata = {
  title: "Ecommerce Admin",
  description: "Admin ecommerce platform",
};

export  default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  await requireAdmin();

  return <div>{children}</div>;
}
