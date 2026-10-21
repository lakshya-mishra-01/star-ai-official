import { beforeEach, describe, expect, it, vi } from "vitest";

const { signInWithOAuth } = vi.hoisted(() => ({ signInWithOAuth: vi.fn() }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth } } }));
import { signInWithGoogle } from "@/lib/google-auth";

describe("Google sign-in", () => {
  beforeEach(() => signInWithOAuth.mockReset());

  it("uses Google only and returns to a public same-origin page", async () => {
    signInWithOAuth.mockResolvedValue({ redirected: true });
    await signInWithGoogle("https://star-ai-official.lovable.app");
    expect(signInWithOAuth).toHaveBeenCalledWith("google", {
      redirect_uri: "https://star-ai-official.lovable.app/auth",
      extraParams: { prompt: "select_account" },
    });
  });

  it("does not report success when the provider fails", async () => {
    signInWithOAuth.mockResolvedValue({ error: new Error("Provider unavailable") });
    await expect(signInWithGoogle("https://star-ai-official.lovable.app")).rejects.toThrow("Provider unavailable");
  });
});