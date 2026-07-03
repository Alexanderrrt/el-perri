"use client";
import { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * React hook for Supabase Auth state (Google OAuth).
 * Returns { user, loading, signInWithGoogle, signOut }.
 *
 * user shape when signed in:
 *   { id, email, name, avatar_url }
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? normalize(session.user) : null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? normalize(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/checkout`,
        queryParams: { prompt: "select_account" },
      },
    });
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
    setUser(null);
  };

  return { user, loading, signInWithGoogle, signOut };
}

function normalize(u) {
  if (!u) return null;
  const meta = u.user_metadata || {};
  return {
    id: u.id,
    email: u.email,
    name: meta.full_name || meta.name || "",
    avatar_url: meta.avatar_url || meta.picture || "",
  };
}
