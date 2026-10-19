import { createFileRoute } from "@tanstack/react-router";
import { ChatShell } from "@/components/star/ChatShell";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Chat — STAR AI" },
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
