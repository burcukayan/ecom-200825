import { getSessionUser } from "@/lib/auth0";
import NavBarUI from "./NavBarUI";

export default async function Navbar() {
  const user = await getSessionUser();

  return <NavBarUI user={user} />;
}
