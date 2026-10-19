import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { SignupForm } from "./SignupForm";

export const metadata = { title: "Create account · AgriPrice" };

export default async function SignupPage() {
  if (await currentUser()) redirect("/dashboard");
  return <SignupForm />;
}
