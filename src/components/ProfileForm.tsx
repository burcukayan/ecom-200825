"use client";

import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Auth0SessionUser } from "@/lib/auth0";
import { updateProfileAction } from "@/lib/action";
import { useActionState, useTransition } from "react";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name could be at least two characters." }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address." }),
  address: z
    .string()
    .trim()
    .min(10, { message: "Address must be at least 10 characters long." })
    .optional(),
});

export default function ProfileForm({
  user,
}: {
  user: Auth0SessionUser | null;
}) {
  const [state, formAction] = useActionState(updateProfileAction, null);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onBlur",
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      address: "", // TODO: Connect to MongoDB later to persist address on reload
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(async () => {
      const formData = new FormData();
      Object.entries(values).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      await formAction(formData);
    });
  }

  {
    state?.message && (
      <div className="p-4 text-sm rounded-md bg-muted text-foreground font-medium border">
        {state.message}
      </div>
    );
  }

  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    <Label htmlFor="name">Name</Label>
    <Input id="name" {...form.register("name")} disabled={isPending} />
    {form.formState.errors.name && (
      <p className="text-sm text-red-600">
        {form.formState.errors.name.message}
      </p>
    )}
    <Label htmlFor="email">Email</Label>
    <Input id="email" {...form.register("email")} disabled={isPending} />
    {form.formState.errors.email && (
      <p className="text-sm text-red-600">
        {form.formState.errors.email.message}
      </p>
    )}
    <Label htmlFor="address">Address</Label>
    <Input id="address" {...form.register("address")} disabled={isPending} />
    {form.formState.errors.address && (
      <p className="text-sm text-red-600">
        {form.formState.errors.address.message}
      </p>
    )}

    <Button type="submit" disabled={isPending}>
      {isPending ? "Updating..." : "Update Profile"}
    </Button>
  </form>;
}
