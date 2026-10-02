import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-foreground">Access denied</h1>
      <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      <Button asChild variant="outline">
        <Link href="/">Back to store</Link>
      </Button>
    </main>
  );
}
