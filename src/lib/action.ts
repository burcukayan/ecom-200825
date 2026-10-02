"use server";

import { revalidatePath } from "next/cache";
import { getSessionUser } from "@/lib/auth0";
import { backendFetch } from "@/lib/backend";
import { profileSchema, type ProfileValues } from "@/lib/profile-schema";

type ActionResult = { success: boolean; message: string };

export async function updateProfileAction(data: ProfileValues): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  if (!(await getSessionUser())) {
    return { success: false, message: "Your session has expired. Please log in again." };
  }

  try {
    const response = await backendFetch("/v1/profile", {
      method: "PUT",
      body: JSON.stringify(parsed.data), 
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Backend error:", errorData);
      return { success: false, message: "An error occurred while communicating with the server." };
    }

    revalidatePath("/", "layout");
    return { success: true, message: "Your profile has been successfully updated." };
  } catch (error) {
    console.error("An error occurred while updating the profile:", error);
    return { success: false, message: "An error occurred while updating the profile." };
  }
}
