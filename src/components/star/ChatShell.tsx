import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowUp, LogOut, Menu, Plus, Square, Trash2, X, Code2, GraduationCap, PenLine, Lightbulb, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StarLogo, StarWordmark } from "./StarLogo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  { icon: Code2, label: "Coding", prompt: "Explain the difference between let, const and var in JavaScript with examples." },
  { icon: GraduationCap, label: "Studying", prompt: "Help me make a 7-day study plan for my physics exam on electromagnetism." },
  { icon: PenLine, label: "Writing", prompt: "Write a short sci-fi story opening about a girl who finds a star in her backyard." },
  { icon: Lightbulb, label: "Brainstorming", prompt: "Brainstorm 10 creative startup ideas for college students." },
];

function useThreads() {
  return useQuery({
    queryKey: ["threads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("threads")
        .select("id,title,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function ChatShell({ threadId }: { threadId: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads } = useThreads();

  async function newChat() {
    const { data, error } = await supabase.from("threads").insert({}).select("id").single();
    if (error || !data) return toast.error("Couldn't start a new chat.");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    setOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete that chat.");
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (id === threadId) navigate({ to: "/chat", replace: true });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r bg-sidebar backdrop-blur-xl transition-transform md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <Link to="/"><StarWordmark /></Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
        </div>
        <div className="px-3">
          <Button variant="hero" className="w-full" onClick={newChat}><Plus /> New chat</Button>
        </div>
        <nav className="mt-4 flex-1 space-y-1 overflow-y-auto px-3">
          <p className="px-2 pb-1 text-xs tracking-wider text-muted-foreground uppercase">History</p>
          {threads?.length === 0 && <p className="px-2 text-sm text-muted-foreground">No chats yet.</p>}
          {threads?.map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center rounded-lg text-sm transition-colors hover:bg-sidebar-accent",
                t.id === threadId && "bg-sidebar-accent",
              )}
            >
              <Link
                to="/chat/$threadId"
                params={{ threadId: t.id }}
                onClick={() => setOpen(false)}
                className="flex-1 truncate px-3 py-2"
              >
                {t.title}
              </Link>
              <button
                onClick={() => remove(t.id)}
                className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100"
                aria-label="Delete chat"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}><LogOut /> Sign out</Button>
          <p className="mt-2 px-2 text-[11px] text-muted-foreground">STAR AI © 2026 · Built by Lakshya Mishra</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setOpen(false)} />}

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 border-b p-3 md:hidden">
          <button onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          <StarWordmark className="text-sm" />
        </div>
        <ThreadLoader key={threadId} threadId={threadId} />
      </main>
    </div>
  );
}

function ThreadLoader({ threadId }: { threadId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("message_id,role,parts")
        .eq("thread_id", threadId)
        .order("created_at");
      if (error) throw error;
      return data.map((m) => ({ id: m.message_id, role: m.role, parts: m.parts }) as unknown as UIMessage);
    },
    staleTime: Infinity,
  });
  if (isLoading) return <div className="grid flex-1 place-items-center"><StarLogo className="size-10" animated /></div>;
  if (error) return <div className="grid flex-1 place-items-center text-muted-foreground">Couldn't load this chat.</div>;
  return <ChatWindow threadId={threadId} initial={data ?? []} />;
}

function ChatWindow({ threadId, initial }: { threadId: string; initial: UIMessage[] }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    messages: initial,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { threadId },
      headers: async (): Promise<Record<string, string>> => {
        const { data } = await supabase.auth.getSession();
        return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
      },
    }),
    onError: (e) => {
      let msg = e.message;
      try { msg = JSON.parse(e.message).error ?? msg; } catch { /* plain text */ }
      setErr(msg || "Something went wrong. Please try again.");
    },
    onFinish: () => {
      qc.invalidateQueries({ queryKey: ["threads"] });
      inputRef.current?.focus();
    },
  });

  const busy = status === "submitted" || status === "streaming";

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    setErr(null);
    setInput("");
    sendMessage({ text: t });
    setTimeout(() => qc.invalidateQueries({ queryKey: ["threads"] }), 800);
    inputRef.current?.focus();
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !last.parts.some((p) => p.type === "text" && p.text));

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center pt-[8vh] text-center animate-rise">
              <StarLogo className="size-16" animated />
              <h2 className="mt-6 text-3xl font-semibold">How can <span className="text-gradient">STAR</span> help today?</h2>
              <p className="mt-2 text-muted-foreground">Pick a starting point or ask anything.</p>
              <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => send(s.prompt)}
                    className="glass rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-cyan"><s.icon className="size-4" />{s.label}</span>
                    <span className="mt-1.5 block text-sm text-muted-foreground">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((m) => <MessageView key={m.id} message={m} />)}
              {waiting && (
                <div className="flex items-center gap-3">
                  <StarLogo className="size-6" animated />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="size-1.5 animate-dot rounded-full bg-cyan" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {err && (
            <div className="mt-6 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="mt-0.5 size-4 text-destructive" /> {err}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="glass mx-auto flex max-w-3xl items-end gap-2 rounded-3xl p-2 focus-within:shadow-glow"
        >
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
            }}
            placeholder="Message STAR…"
            className="max-h-48 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground field-sizing-content"
          />
          {busy ? (
            <Button type="button" size="icon" variant="glass" className="size-10" onClick={() => stop()} aria-label="Stop">
              <Square className="fill-current" />
            </Button>
          ) : (
            <Button type="submit" size="icon" variant="hero" className="size-10" disabled={!input.trim()} aria-label="Send">
              <ArrowUp />
            </Button>
          )}
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">STAR can make mistakes. Check important info.</p>
      </div>
    </>
  );
}

function MessageView({ message }: { message: UIMessage }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-brand max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 whitespace-pre-wrap text-primary-foreground">{text}</div>
      </div>
    );
  }
  return (
    <div className="flex gap-3">
      <StarLogo className="mt-1 size-6" />
      <div className="min-w-0 flex-1 space-y-3">
        {message.parts.map((p, i) => {
          if (p.type === "reasoning" && p.text)
            return (
              <details key={i} className="text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">Thinking</summary>
                <p className="mt-1 whitespace-pre-wrap border-l pl-3">{p.text}</p>
              </details>
            );
          if (p.type === "text")
            return (
              <div key={i} className="star-prose">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{p.text}</ReactMarkdown>
              </div>
            );
          return null;
        })}
      </div>
    </div>
  );
}
