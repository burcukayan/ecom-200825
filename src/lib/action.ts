"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

const updateProfileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  address: z.string().optional(),
});

export async function updateProfileAction(
  formData: z.infer<typeof updateProfileSchema>,
) {
  try {
    const validatedData = updateProfileSchema.parse(formData);

    console.log("Data that was processed on the server:", validatedData);

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
