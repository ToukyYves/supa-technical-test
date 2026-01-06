"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function SignOutButton() {
  const [loading, setLoading] = useState(false);
  return (
    <button
      type="button"
      className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-60"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const { error } = await supabase.auth.signOut();
          if (error) throw error;
          window.location.assign("/login");
        } catch (e) {
          // eslint-disable-next-line no-alert
          alert((e as Error).message);
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
