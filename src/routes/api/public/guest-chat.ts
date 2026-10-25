import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages } from "ai";
import { chatBodySchema, GUEST_DAILY_LIMIT, GUEST_GLOBAL_DAILY_LIMIT, GUEST_LIMIT_MESSAGE } from "@/lib/account-rules";

export const Route = createFileRoute("/api/public/guest-chat")({
  server: { handlers: { POST: async ({ request }) => {
    if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Invalid request origin." }, { status: 403 });
    const raw = await request.text();
    if (raw.length > 60000) return Response.json({ error: "This conversation is too long. Start a new chat." }, { status: 413 });
    let body;
    try { body = chatBodySchema.safeParse(JSON.parse(raw)); } catch { return Response.json({ error: "Invalid message." }, { status: 400 }); }
    if (!body.success) return Response.json({ error: "Invalid message." }, { status: 400 });
    const bytezKey = process.env["BYTEZ_API_KEY"];
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!bytezKey && !apiKey) return Response.json({ error: "STAR's AI connection is unavailable." }, { status: 503 });
    // Hosting supplies these IP headers; unrecognized/local hosts share a bucket.
    const ip = request.headers.get("cf-connecting-ip") ?? (process.env["VERCEL"] ? request.headers.get("x-vercel-forwarded-for") : null) ?? "local-shared";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip));
    const bucket = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, "0")).join("");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const claim = await supabaseAdmin.rpc("claim_star_allowance", { bucket_key: bucket, daily_limit: GUEST_DAILY_LIMIT });
    if (claim.error) return Response.json({ error: "Guest chat is temporarily unavailable." }, { status: 503 });
    if (!claim.data) return Response.json({ error: GUEST_LIMIT_MESSAGE }, { status: 429 });
    const global = await supabaseAdmin.rpc("claim_star_allowance", { bucket_key: "all-guests", daily_limit: GUEST_GLOBAL_DAILY_LIMIT });
    if (global.error) return Response.json({ error: "Guest chat is temporarily unavailable." }, { status: 503 });
    if (!global.data) return Response.json({ error: GUEST_LIMIT_MESSAGE }, { status: 429 });
    const modelMessages = await convertToModelMessages(body.data.messages);
    if (bytezKey) {
      const { streamBytezResponse } = await import("@/lib/ai/bytez.server");
      return streamBytezResponse({
        apiKey: bytezKey,
        modelId: process.env["BYTEZ_MODEL_ID"],
        messages: modelMessages,
        signal: request.signal,
      });
    }
    const { streamStar } = await import("@/lib/ai/chat.server");
    const { withLovableAiGatewayRunIdHeader } = await import("@/lib/ai/run-id.server");
    const { result, runIdFetch } = streamStar(request, apiKey!, modelMessages);
    return withLovableAiGatewayRunIdHeader(result.toUIMessageStreamResponse({
      originalMessages: body.data.messages,
      sendReasoning: true,
      onError: () => "STAR couldn't finish the reply. Please try again later.",
    }), runIdFetch);
  } } },
});