import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({ meta: [{ title: "Chat — STAR AI" }, { name: "description", content: "Chat with STAR AI." }] }),
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
