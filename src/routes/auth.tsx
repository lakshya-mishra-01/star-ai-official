import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { signInWithGoogle } from "@/lib/google-auth";
import { StarLogo } from "@/components/star/StarLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Google sign-in — STAR AI" },
      { name: "description", content: "Sign in securely with Google to continue your STAR AI conversations." },
      { property: "og:title", content: "Google sign-in — STAR AI" },
      { property: "og:description", content: "Your AI. Your Universe. Continue to STAR AI with Google." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { data: user, isPending } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
    staleTime: 0,
    retry: false,
  });

  useEffect(() => {
    if (user) navigate({ to: "/chat", replace: true });
  }, [user, navigate]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const search = new URLSearchParams(window.location.search);
    if (hash.has("error") || search.has("error")) {
      setError("Google sign-in wasn’t completed. Please try again.");
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  async function oauth() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await signInWithGoogle(window.location.origin);
      if (result.redirected) return;
      const { data, error: sessionError } = await supabase.auth.getUser();
      if (sessionError || !data.user) throw new Error("Your Google session could not be confirmed. Please try again.");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      await navigate({ to: "/chat", replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-12">
      <div className="starfield pointer-events-none absolute inset-0 opacity-60" />
      <main className="relative w-full max-w-sm animate-rise text-center">
        <Link to="/" className="mx-auto mb-8 flex w-fit flex-col items-center gap-4">
          <StarLogo className="size-16" animated />
          <span className="font-display text-3xl font-semibold">STAR <span className="text-gradient">AI</span></span>
        </Link>
        <h1 className="font-display text-2xl font-semibold">Welcome to STAR</h1>
        <p className="mt-3 text-sm text-muted-foreground">Your AI. Your Universe.</p>
        <Button variant="outline" size="lg" className="mt-9 h-12 w-full gap-3 rounded-lg" disabled={busy || isPending || Boolean(user)} onClick={oauth}>
          {busy || isPending || user ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : <img src="/google-logo.svg" alt="" className="size-5" />}
          {busy ? "Connecting to Google…" : isPending || user ? "Checking your session…" : "Continue with Google"}
        </Button>
        {error && <p role="alert" className="mt-4 break-words text-sm text-destructive">{error}</p>}
      </main>
      <footer className="absolute bottom-5 px-5 text-center text-xs text-muted-foreground">STAR AI © 2026 · Built by Lakshya Mishra</footer>
    </div>
  );
}
