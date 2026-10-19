import { redirect } from "next/navigation";

/** The dashboard is the first screen once a farmer is signed in. */
export default function HomePage() {
  redirect("/dashboard");
}
