import { describe, expect, it } from "vitest";
import type { ModelMessage } from "ai";
import { bytezErrorMessage, DEFAULT_BYTEZ_MODEL, toBytezMessages } from "@/lib/ai/bytez.server";

describe("toBytezMessages", () => {
  it("prepends the STAR system prompt", () => {
    const out = toBytezMessages([{ role: "user", content: "hi" }]);
    expect(out[0].role).toBe("system");
    expect(out[0].content).toContain("STAR");
    expect(out[1]).toEqual({ role: "user", content: "hi" });
  });

  it("joins multi-part text content and keeps roles", () => {
    const messages: ModelMessage[] = [
      { role: "user", content: [{ type: "text", text: "hello" }, { type: "text", text: "world" }] },
      { role: "assistant", content: [{ type: "text", text: "hey there" }] },
    ];
    const out = toBytezMessages(messages, "sys");
    expect(out).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "hello\nworld" },
      { role: "assistant", content: "hey there" },
    ]);
  });

  it("drops empty and duplicate system messages", () => {
    const messages: ModelMessage[] = [
      { role: "system", content: "other system" },
      { role: "user", content: "   " },
      { role: "user", content: "real question" },
    ];
    const out = toBytezMessages(messages, "sys");
    expect(out).toEqual([
      { role: "system", content: "sys" },
      { role: "user", content: "real question" },
    ]);
  });
});

describe("bytezErrorMessage", () => {
  it("maps auth, model, and rate-limit failures to friendly messages", () => {
    expect(bytezErrorMessage(401)).toMatch(/key/i);
    expect(bytezErrorMessage(403)).toMatch(/key/i);
    expect(bytezErrorMessage(404)).toMatch(/model/i);
    expect(bytezErrorMessage(429)).toMatch(/wait a moment/i);
    expect(bytezErrorMessage(500)).toMatch(/try again/i);
    expect(bytezErrorMessage(undefined)).toMatch(/try again/i);
  });
});

describe("DEFAULT_BYTEZ_MODEL", () => {
  it("is the documented Bytez chat model", () => {
    expect(DEFAULT_BYTEZ_MODEL).toBe("Qwen/Qwen3-4B");
  });
});
