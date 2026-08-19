import { getSessionUser } from "@/lib/auth0";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await getSessionUser();

  return (
    <div className="container mx-auto p-8 max-w-2xl mt-10">
      <ProfileForm user={user} />
    </div>
  );
}