import { getServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  } else {
    return (
      redirect("/dashboard")
    );
  }
}
