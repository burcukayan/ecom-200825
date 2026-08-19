import type { Metadata } from "next";
import { requireUser } from "@/lib/auth0";

export const metadata: Metadata = {
  title: "Ecommerce",
  description: "Ecommerce platform",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireUser();

  return <div>{children}</div>;
}
