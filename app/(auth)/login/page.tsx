import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/session";
import { demoModeEnabled } from "@/lib/config";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Log in · AgriPrice" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  if (await currentUser()) redirect("/dashboard");

  const raw = searchParams.next;
  const next =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;

  return <LoginForm demoEnabled={demoModeEnabled()} next={next} />;
}
