import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { convertToModelMessages, type UIMessage } from "ai";
import type { Database } from "@/integrations/supabase/types";

function json(status: number, error: string) {
  return Response.json({ error }, { status });
}

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return json(401, "Please sign in to chat.");
        const url = process.env["SUPABASE_URL"]!;
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const supabase = createClient<Database>(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: {
            headers: { Authorization: `Bearer ${token}` },
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });
        const { data: userData, error: userErr } = await supabase.auth.getUser(token);
        if (userErr || !userData.user) return json(401, "Your session expired. Please sign in again.");

        let body: { messages?: UIMessage[]; threadId?: string };
        try {
          body = await request.json();
        } catch {
          return json(400, "Invalid request.");
        }
        const messages = body.messages;
        const threadId = body.threadId;
        if (!Array.isArray(messages) || messages.length === 0 || typeof threadId !== "string")
          return json(400, "Invalid request.");

        const { data: thread } = await supabase.from("threads").select("id,title").eq("id", threadId).maybeSingle();
        if (!thread) return json(404, "Conversation not found.");

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return json(500, "STAR isn't connected to an AI model yet.");

        // Drop stored messages no longer in history (e.g. after Retry)
        const keep = messages.map((m) => m.id);
        const { data: stored } = await supabase.from("messages").select("message_id").eq("thread_id", threadId);
        const stale = (stored ?? []).map((r) => r.message_id).filter((id) => !keep.includes(id));
        if (stale.length) await supabase.from("messages").delete().eq("thread_id", threadId).in("message_id", stale);

        // Save latest user message
        const last = messages[messages.length - 1];
        if (last && last.role === "user") {
          const { error } = await supabase.from("messages").upsert(
            { thread_id: threadId, message_id: last.id, role: "user", parts: last.parts as never },
            { onConflict: "thread_id,message_id" },
          );
          if (error) console.error("save user message", error);
          const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
          const update: { updated_at: string; title?: string } = { updated_at: new Date().toISOString() };
          if (thread.title === "New chat" && text) update.title = text.slice(0, 60);
          await supabase.from("threads").update(update).eq("id", threadId);
        }

        const { streamStar } = await import("@/lib/ai/chat.server");
        const { withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/run-id.server");
        const { result, runIdFetch } = streamStar(request, apiKey, await convertToModelMessages(messages));

        const res = result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: true,
          onError: (err) => {
            console.error("STAR stream error", err);
            const status = (err as { statusCode?: number })?.statusCode;
            if (status === 429) return "STAR is getting a lot of requests. Please wait a moment and try again.";
            if (status === 402) return "AI credits have run out for this workspace.";
            return "STAR couldn't finish that reply. Please try again.";
          },
          onFinish: async ({ responseMessage }) => {
            if (!responseMessage.parts.length) return;
            const { error } = await supabase.from("messages").upsert(
              {
                thread_id: threadId,
                message_id: responseMessage.id,
                role: "assistant",
                parts: responseMessage.parts as never,
              },
              { onConflict: "thread_id,message_id" },
            );
            if (error) console.error("save assistant message", error);
          },
        });
        return withLovableAiGatewayRunIdHeader(res, runIdFetch);
      },
    },
  },
});
