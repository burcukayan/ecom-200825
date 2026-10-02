import { ProfileForm } from "@/components/ProfileForm";
import { requireUser } from "@/lib/auth0";
import { getDbUser } from "@/lib/backend";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const dbUser = await getDbUser(); 

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="mb-6 text-2xl font-bold">Profile</h1>
      <ProfileForm
        email={dbUser?.email ?? sessionUser.email ?? ""}
        defaultValues={{
          name: dbUser?.name ?? sessionUser.name ?? "",
          address: dbUser?.address ?? "",
        }}
      />
    </div>
  );
}
