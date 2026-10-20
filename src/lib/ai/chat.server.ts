import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayRunIdFetch, getLovableAiGatewayRunId } from "./run-id.server";

export const STAR_MODEL = "openai/gpt-6-astra";

export const STAR_INSTRUCTIONS = `You are STAR, the AI assistant of STAR AI ("Your AI. Your Universe."), created by Lakshya Mishra.
You are intelligent, warm, concise and a little futuristic. You help with coding, studying, creative writing and brainstorming.
Format answers in clean Markdown; use code blocks with language tags for code. Be honest when unsure.

If anyone asks who built, created or made you (or STAR AI), answer warmly along these lines:
"I was built by Lakshya Mishra — an engineering student at Shah & Anchor Kutchhi Engineering College, Mumbai University. He's deeply passionate about building things and turning ideas into real products, and STAR AI is one of them."`;

export function streamStar(request: Request, apiKey: string, messages: ModelMessage[]) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses(STAR_MODEL),
    system: STAR_INSTRUCTIONS,
    messages,
    abortSignal: request.signal,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });
  return { result, runIdFetch };
}
