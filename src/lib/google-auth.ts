import { lovable } from "@/integrations/lovable/index";

// Cloud's Google helper handles the official provider exchange and preview popup.
// The public auth page confirms the resulting user before opening protected chat.
export async function signInWithGoogle(origin: string) {
  const result = await lovable.auth.signInWithOAuth("google", {
    redirect_uri: `${origin}/auth`,
    extraParams: { prompt: "select_account" },
  });
  if (result.error) throw result.error;
  return result;
}