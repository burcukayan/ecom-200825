"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateProfileAction } from "@/lib/action";
import { profileSchema, type ProfileValues } from "@/lib/profile-schema";

export function ProfileForm({
  email,
  defaultValues,
}: {
  email: string;
  defaultValues: ProfileValues;
}) {
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const onSubmit = async (values: ProfileValues) => {
    setResult(null);
    setResult(await updateProfileAction(values));
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormItem>
          <FormLabel>Email</FormLabel>
          <Input type="email" value={email} readOnly disabled />
          <FormDescription>
            Email is managed by your login provider.
          </FormDescription>
        </FormItem>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save"}
        </Button>

        {result ? (
          <p
            role="status"
            className={result.success ? "text-green-600" : "text-destructive"}
          >
            {result.message}
          </p>
        ) : null}
      </form>
    </Form>
  );
}
