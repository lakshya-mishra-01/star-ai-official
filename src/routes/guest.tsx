import { createFileRoute } from "@tanstack/react-router";
import { GuestChatShell } from "@/components/star/ChatShell";

export const Route = createFileRoute("/guest")({
  head: () => ({ meta: [
    { title: "Guest chat — STAR AI" },
    { name: "description", content: "Chat with STAR AI as a guest. Built by Lakshya Mishra." },
    { property: "og:title", content: "Guest chat — STAR AI" },
    { property: "og:description", content: "Your AI. Your Universe. Start chatting without an account." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: GuestChatShell,
});