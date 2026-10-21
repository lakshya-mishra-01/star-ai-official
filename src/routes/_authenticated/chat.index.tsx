import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [
    { title: "Chat workspace — STAR AI" },
    { name: "description", content: "Continue your conversations in the STAR AI workspace." },
    { property: "og:title", content: "Chat workspace — STAR AI" },
    { property: "og:description", content: "Your private STAR AI chat workspace." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  beforeLoad: async () => {
    const { data: existing } = await supabase
      .from("threads")
      .select("id")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing) throw redirect({ to: "/chat/$threadId", params: { threadId: existing.id }, replace: true });
    const { data, error } = await supabase.from("threads").insert({}).select("id").single();
    if (error || !data) throw error ?? new Error("Could not start a chat");
    throw redirect({ to: "/chat/$threadId", params: { threadId: data.id }, replace: true });
  },
});
