import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { loginWithUsername } from "@/lib/accounts.functions";
import { signupSchema, usernameSchema } from "@/lib/account-rules";
import { StarLogo } from "@/components/star/StarLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Mode = "signin" | "signup" | "forgot";
export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({ mode: search.mode === "signup" ? "signup" : search.mode === "forgot" ? "forgot" : "signin" }),
  head: () => ({ meta: [
    { title: "Your account — STAR AI" },
    { name: "description", content: "Create an optional STAR AI account to save your conversations." },
    { property: "og:title", content: "Your account — STAR AI" },
    { property: "og:description", content: "Save your universe of ideas with a STAR AI account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const login = useServerFn(loginWithUsername);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [availability, setAvailability] = useState("");
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: async () => (await supabase.auth.getUser()).data.user, staleTime: 0, retry: false });
  useEffect(() => { if (user) navigate({ to: "/chat", replace: true }); }, [user, navigate]);
  useEffect(() => { setError(""); setNotice(""); setAvailability(""); }, [mode]);
  useEffect(() => {
    if (mode !== "signup") return;
    const parsed = usernameSchema.safeParse(username);
    if (!parsed.success) { setAvailability(""); return; }
    let active = true;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc("star_username_available", { candidate: parsed.data });
      if (active) setAvailability(error ? "Couldn't check availability." : data ? "Username available" : "Username already taken");
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [username, mode]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(""); setNotice(""); setBusy(true);
    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If an account uses that email, a password reset link is on its way.");
      } else if (mode === "signup") {
        const parsed = signupSchema.safeParse({ username, email, password });
        if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Check your details.");
        const check = await supabase.rpc("star_username_available", { candidate: parsed.data.username });
        if (check.error) throw new Error("Couldn't check username availability. Please try again.");
        if (!check.data) throw new Error("Username already taken. Choose another username.");
        const { data, error } = await supabase.auth.signUp({ email: parsed.data.email, password, options: { data: { username: parsed.data.username }, emailRedirectTo: `${window.location.origin}/auth` } });
        if (error) {
          const recheck = await supabase.rpc("star_username_available", { candidate: parsed.data.username });
          if (recheck.data === false) throw new Error("Username already taken. Choose another username.");
          throw error;
        }
        if (!data.session) setNotice("Check your email to confirm your account, then log in. You can keep chatting as a guest.");
      } else {
        const result = await login({ data: { username, password } });
        if (!result.tokens) throw new Error(result.error ?? "Sign-in failed.");
        const { error } = await supabase.auth.setSession(result.tokens);
        if (error) throw error;
      }
      await qc.invalidateQueries({ queryKey: ["me"] });
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="starfield pointer-events-none absolute inset-0 opacity-60" />
      <main className="relative w-full max-w-sm animate-rise">
        <Link to="/" className="mx-auto mb-6 flex w-fit flex-col items-center gap-3"><StarLogo className="size-12" animated /><span className="font-display text-2xl font-semibold">STAR <span className="text-gradient">AI</span></span></Link>
        <h1 className="text-center font-display text-2xl font-semibold">{mode === "signup" ? "Create your account" : mode === "forgot" ? "Reset your password" : "Welcome back"}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">Your AI. Your Universe.</p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="username">{mode === "signup" ? "Username" : "Username or email"}</Label><Input id="username" autoComplete="username" required maxLength={mode === "signup" ? 24 : 254} value={username} onChange={e => setUsername(e.target.value)} />{mode === "signup" && <p aria-live="polite" className="text-xs text-muted-foreground">{availability || "3–24 letters, numbers or underscores"}</p>}</div>}
          {mode !== "signin" && <div className="space-y-2"><Label htmlFor="email">Recovery email</Label><Input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></div>}
          {mode !== "forgot" && <div className="space-y-2"><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required maxLength={128} minLength={mode === "signup" ? 10 : 1} value={password} onChange={e => setPassword(e.target.value)} />{mode === "signup" && <p className="text-xs text-muted-foreground">10+ characters, uppercase, lowercase and a number</p>}</div>}
          <Button variant="hero" type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send reset link" : "Log In"}</Button>
        </form>
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-cyan">{notice}</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Button variant="link" size="sm" asChild><Link to="/auth" search={{ mode: mode === "signup" ? "signin" : "signup" }}>{mode === "signup" ? "Log In" : "Create Account"}</Link></Button>
          {mode === "signin" && <Button variant="link" size="sm" asChild><Link to="/auth" search={{ mode: "forgot" }}>Forgot password?</Link></Button>}
          <Button variant="ghost" size="sm" asChild><Link to="/guest">Continue as guest</Link></Button>
        </div>
      </main>
      <footer className="relative mt-10 text-center text-xs text-muted-foreground">STAR AI © 2026 · Built by Lakshya Mishra</footer>
    </div>
  );
}
