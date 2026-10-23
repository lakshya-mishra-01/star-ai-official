import { z } from "zod";

export const usernameSchema = z.string().trim().toLowerCase().min(3).max(24).regex(/^[a-z0-9_]+$/, "Use letters, numbers and underscores.");
export const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128).regex(/[a-z]/, "Include a lowercase letter.").regex(/[A-Z]/, "Include an uppercase letter.").regex(/[0-9]/, "Include a number.");
export const signupSchema = z.object({ username: usernameSchema, email: z.string().trim().email().max(254), password: passwordSchema });
export const GUEST_DAILY_LIMIT = 5;
export const GUEST_GLOBAL_DAILY_LIMIT = 100;
export const GUEST_LIMIT_MESSAGE = "You have exceeded the daily AI limit. Subscribe now — coming soon......[SUBSCRIPTION MODEL WILL BE AVAILABLE SOON!!!]\n\n";

export const chatBodySchema = z.object({
  threadId: z.string().uuid().optional(),
  messages: z.array(z.object({
    id: z.string().min(1).max(128),
    role: z.enum(["user", "assistant"]),
    parts: z.array(z.object({ type: z.literal("text"), text: z.string().max(12000) })).min(1).max(20),
  })).min(1).max(40),
});