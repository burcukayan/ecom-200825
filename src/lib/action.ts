"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { auth0 } from "@/lib/auth0";

const updateProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  address: z.string().optional(),
});

export async function updateProfileAction(prevState: any, formData: FormData) {
  try {
    const session = await auth0.getSession();
    if (!session || !session.user) {
      return {
        success: false,
        message: "Unauthorized: You must be logged in.",
      };
    }

    const rawData = {
      name: formData.get("name"),
      email: formData.get("email"),
      address: formData.get("address"),
    };

    const validatedData = updateProfileSchema.parse(rawData);

    console.log(
      "Data processed on the server for user:",
      session.user.sub,
      validatedData,
    );

    // TODO: Connect Auth0 Management API (patch-users-by-id) and MongoDB here later.

    revalidatePath("/profile");

    return {
      success: true,
      message: "Your profile has been successfully updated!",
    };
  } catch (error) {
    console.error("An error occurred while updating the profile:", error);
    return {
      success: false,
      message: "An error occurred while updating the profile.",
    };
  }
}
