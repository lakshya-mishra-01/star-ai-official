import { createServerFn } from "@tanstack/react-start";
import { setResponseHeader } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { usernameSchema } from "./account-rules";

// Lookup never reaches the browser. Only successful password verification returns tokens.
export const loginWithUsername = createServerFn({ method: "POST" })
  .inputValidator(z.object({ username: z.string().trim().min(1).max(254), password: z.string().min(1).max(128) }))
  .handler(async ({ data }) => {
    setResponseHeader("Cache-Control", "no-store");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) return { error: "Account sign-in is unavailable.", tokens: null };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Auth owns password hashing and verification; the app never stores passwords.
    const identifier = data.username.toLowerCase();
    let email = identifier.includes("@") ? identifier : null;
    if (!email) {
      const parsed = usernameSchema.safeParse(identifier);
      if (parsed.success) {
        const { data: resolved } = await supabaseAdmin.rpc("star_login_email", { candidate: parsed.data });
        email = resolved;
      }
    }
    const client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: result, error } = await client.auth.signInWithPassword({ email: email ?? "invalid-account@invalid.local", password: data.password });
    if (error || !result.session) return { error: "Incorrect username or password, or your email still needs confirmation.", tokens: null };
    return { error: null, tokens: { access_token: result.session.access_token, refresh_token: result.session.refresh_token } };
  });