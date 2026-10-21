import { createFileRoute } from "@tanstack/react-router";
import { ChatShell } from "@/components/star/ChatShell";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Conversation — STAR AI" },
      { property: "og:title", content: "Conversation — STAR AI" },
      { property: "og:description", content: "Your private conversation with STAR AI." },
      { name: "description", content: "Your conversation with STAR AI." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <ChatShell threadId={threadId} />;
}
