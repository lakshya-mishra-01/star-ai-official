import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { STAR_INSTRUCTIONS } from "./chat.server";

// Documented Bytez chat model (https://docs.bytez.com/model-api/docs/task/chat).
// Override with the BYTEZ_MODEL_ID environment variable.
export const DEFAULT_BYTEZ_MODEL = "Qwen/Qwen3-4B";

const BYTEZ_API_BASE = "https://api.bytez.com/models/v2/";

export type BytezMessage = { role: "system" | "user" | "assistant"; content: string };

// Bytez chat models take OpenAI-style {role, content} messages. The STAR system
// prompt is prepended here so behaviour matches the Lovable-gateway path.
export function toBytezMessages(messages: ModelMessage[], system: string = STAR_INSTRUCTIONS): BytezMessage[] {
  const out: BytezMessage[] = [{ role: "system", content: system }];
  for (const message of messages) {
    if (message.role === "system") continue;
    const content =
      typeof message.content === "string"
        ? message.content
        : message.content
            .filter((part): part is { type: "text"; text: string } => part.type === "text")
            .map((part) => part.text)
            .join("\n");
    if (!content.trim()) continue;
    out.push({ role: message.role === "assistant" ? "assistant" : "user", content });
  }
  return out;
}

export function bytezErrorMessage(status: number | undefined): string {
  if (status === 401 || status === 403) return "STAR's AI key isn't configured correctly.";
  if (status === 404) return "STAR's model isn't available right now.";
  if (status === 429) return "STAR is getting a lot of requests. Please wait a moment and try again.";
  return "STAR couldn't finish that reply. Please try again.";
}

type StreamBytezOptions = {
  apiKey: string;
  modelId?: string | undefined;
  messages: ModelMessage[];
  signal?: AbortSignal | undefined;
  onFinish?: (message: UIMessage) => void | Promise<void>;
};

// Calls the Bytez Model API server-side and returns an AI SDK UI message stream
// response, so the existing chat UI works unchanged. With `stream: true` Bytez
// returns a plain text token stream (confirmed in the official bytez.js SDK).
export function streamBytezResponse({ apiKey, modelId, messages, signal, onFinish }: StreamBytezOptions): Response {
  const model = modelId?.trim() || DEFAULT_BYTEZ_MODEL;
  const messageId = generateId();

  const stream = createUIMessageStream({
    onError: (error) => bytezErrorMessage((error as { statusCode?: number })?.statusCode),
    execute: async ({ writer }) => {
      const bytezMessages = toBytezMessages(messages);
      const response = await fetch(BYTEZ_API_BASE + model, {
        method: "POST",
        headers: {
          Authorization: `Key ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          input: bytezMessages,
          messages: bytezMessages,
          stream: true,
          params: { temperature: 0.7, max_new_tokens: 2048 },
        }),
        signal: signal ?? null,
      });

      if (!response.ok || !response.body) {
        let detail = "";
        try {
          detail = ((await response.json()) as { error?: string })?.error ?? "";
        } catch {
          // non-JSON error body
        }
        const error = new Error(detail || response.statusText || `Bytez error ${response.status}`) as Error & {
          statusCode?: number;
        };
        error.statusCode = response.status;
        throw error;
      }

      writer.write({ type: "text-start", id: messageId });
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let text = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          text += value;
          writer.write({ type: "text-delta", id: messageId, delta: value });
        }
      } finally {
        reader.releaseLock();
      }
      writer.write({ type: "text-end", id: messageId });

      if (text.trim() && onFinish) {
        await onFinish({ id: messageId, role: "assistant", parts: [{ type: "text", text }] });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
