import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowUp, LogOut, Menu, Plus, Square, Trash2, X, Code2, GraduationCap, PenLine, Lightbulb,
  AlertCircle, Search, Settings, PanelLeftClose, PanelLeftOpen, Paperclip, Copy, Check, RotateCcw, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { StarLogo, StarWordmark } from "./StarLogo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
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
      const { data, error } = await supabase.from("threads").select("id,title,updated_at").order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useUser() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
    staleTime: Infinity,
  });
}

function firstName(user: { email?: string; user_metadata?: Record<string, unknown> } | null | undefined) {
  const n = (user?.user_metadata?.["full_name"] ?? user?.user_metadata?.["name"]) as string | undefined;
  return n?.split(" ")[0] || "Lakshya";
}

export function ChatShell({ threadId }: { threadId: string }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const [settings, setSettings] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: threads } = useThreads();
  const { data: user } = useUser();

  const filtered = useMemo(
    () => threads?.filter((t) => t.title.toLowerCase().includes(query.toLowerCase())),
    [threads, query],
  );

  async function newChat() {
    const { data, error } = await supabase.from("threads").insert({}).select("id").single();
    if (error || !data) { toast.error("Couldn't start a new chat."); return; }
    await qc.invalidateQueries({ queryKey: ["threads"] });
    setOpen(false);
    navigate({ to: "/chat/$threadId", params: { threadId: data.id } });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("threads").delete().eq("id", id);
    if (error) { toast.error("Couldn't delete that chat."); return; }
    await qc.invalidateQueries({ queryKey: ["threads"] });
    if (id === threadId) navigate({ to: "/chat", replace: true });
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Couldn’t sign out. Please try again."); return; }
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r bg-sidebar backdrop-blur-xl transition-all duration-300 md:static",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          collapsed && "md:w-0 md:overflow-hidden md:border-r-0",
        )}
      >
        <div className="flex items-center justify-between p-4">
          <Link to="/"><StarWordmark /></Link>
          <button className="md:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X className="size-5" /></button>
          <button className="hidden text-muted-foreground hover:text-foreground md:block" onClick={() => setCollapsed(true)} aria-label="Collapse sidebar">
            <PanelLeftClose className="size-5" />
          </button>
        </div>
        <div className="space-y-2 px-3">
          <Button variant="hero" className="w-full" onClick={newChat}><Plus /> New chat</Button>
          <label className="flex items-center gap-2 rounded-xl border bg-background/40 px-3 py-2 text-sm focus-within:border-violet">
            <Search className="size-4 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search chats" className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground" />
          </label>
        </div>
        <nav className="mt-4 flex-1 space-y-0.5 overflow-y-auto px-3">
          <p className="px-2 pb-1 text-[11px] tracking-wider text-muted-foreground uppercase">History</p>
          {filtered?.length === 0 && <p className="px-2 text-sm text-muted-foreground">{query ? "No matching chats." : "No chats yet."}</p>}
          {filtered?.map((t) => (
            <div key={t.id} className={cn("group flex items-center rounded-lg text-sm transition-colors hover:bg-sidebar-accent", t.id === threadId && "bg-sidebar-accent")}>
              <Link to="/chat/$threadId" params={{ threadId: t.id }} onClick={() => setOpen(false)} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{t.title}</span>
              </Link>
              <button onClick={() => remove(t.id)} className="mr-1 rounded p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive focus:opacity-100" aria-label="Delete chat">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={() => setSettings(true)}><Settings /> Settings</Button>
          <p className="mt-2 px-2 text-[11px] text-muted-foreground">STAR AI © 2026 · Built by Lakshya Mishra</p>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-20 bg-background/60 md:hidden" onClick={() => setOpen(false)} />}

      <main className="relative flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-3 p-3">
          <button className="md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-5" /></button>
          {collapsed && (
            <button className="hidden text-muted-foreground hover:text-foreground md:block" onClick={() => setCollapsed(false)} aria-label="Expand sidebar">
              <PanelLeftOpen className="size-5" />
            </button>
          )}
          <span className={cn(!collapsed && "md:hidden")}><StarWordmark className="text-sm" /></span>
        </div>
        <ThreadLoader key={threadId} threadId={threadId} name={firstName(user)} />
      </main>

      <Dialog open={settings} onOpenChange={setSettings}>
        <DialogContent className="glass">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>Signed in as {user?.email ?? "—"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="rounded-xl border p-3">
              <p className="font-medium">Model</p>
              <p className="text-muted-foreground">STAR is connected to a live AI model through Lovable Cloud.</p>
            </div>
            <Button variant="outline" className="w-full" onClick={signOut}><LogOut /> Sign out</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ThreadLoader({ threadId, name }: { threadId: string; name: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["messages", threadId],
    queryFn: async () => {
      const { data, error } = await supabase.from("messages").select("message_id,role,parts").eq("thread_id", threadId).order("created_at");
      if (error) throw error;
      return data.map((m) => ({ id: m.message_id, role: m.role, parts: m.parts }) as unknown as UIMessage);
    },
    staleTime: Infinity,
  });
  if (isLoading) return <div className="grid flex-1 place-items-center"><StarLogo className="size-10" animated /></div>;
  if (error) return <div className="grid flex-1 place-items-center text-muted-foreground">Couldn't load this chat.</div>;
  return <ChatWindow threadId={threadId} initial={data ?? []} name={name} />;
}

function textOf(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

function ChatWindow({ threadId, initial, name }: { threadId: string; initial: UIMessage[]; name: string }) {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, regenerate, status, stop } = useChat({
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

  function retry() {
    setErr(null);
    regenerate();
  }

  const last = messages[messages.length - 1];
  const waiting = status === "submitted" || (status === "streaming" && last?.role === "assistant" && !textOf(last));

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex animate-rise flex-col items-center pt-[8vh] text-center">
              <StarLogo className="size-16" animated />
              <h2 className="mt-6 text-3xl font-semibold md:text-4xl">Hey {name}, what are we <span className="text-gradient">exploring</span> today?</h2>
              <div className="mt-10 grid w-full gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s.label} onClick={() => send(s.prompt)} className="glass rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-glow">
                    <span className="flex items-center gap-2 text-sm font-medium text-cyan"><s.icon className="size-4" />{s.label}</span>
                    <span className="mt-1.5 block text-sm text-muted-foreground">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-7">
              {messages.map((m, i) => (
                <MessageView key={m.id} message={m} isLast={i === messages.length - 1} busy={busy} onRetry={retry} />
              ))}
              {waiting && (
                <div className="flex items-center gap-3">
                  <StarLogo className="size-6" animated />
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-dot rounded-full bg-cyan" style={{ animationDelay: `${i * 0.15}s` }} />)}
                  </div>
                </div>
              )}
            </div>
          )}
          {err && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
              <AlertCircle className="size-4 shrink-0 text-destructive" />
              <span className="flex-1">{err}</span>
              {messages.length > 0 && <Button size="sm" variant="ghost" onClick={retry}><RotateCcw /> Retry</Button>}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 pb-4">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="glass mx-auto flex max-w-3xl items-end gap-1 rounded-3xl p-2 transition-shadow focus-within:shadow-glow">
          <Button type="button" size="icon" variant="ghost" className="size-10 rounded-full text-muted-foreground" aria-label="Attach file"
            onClick={() => toast("File attachments are coming soon.")}>
            <Paperclip />
          </Button>
          <textarea
            ref={inputRef}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
            placeholder="Message STAR…"
            className="max-h-48 min-h-10 flex-1 resize-none bg-transparent px-2 py-2.5 text-[15px] outline-none placeholder:text-muted-foreground field-sizing-content"
          />
          {busy ? (
            <Button type="button" size="icon" variant="glass" className="size-10" onClick={() => stop()} aria-label="Stop generating"><Square className="fill-current" /></Button>
          ) : (
            <Button type="submit" size="icon" variant="hero" className="size-10" disabled={!input.trim()} aria-label="Send"><ArrowUp /></Button>
          )}
        </form>
        <p className="mt-2 text-center text-[11px] text-muted-foreground">STAR can make mistakes. Check important info. · STAR AI © 2026 · Built by Lakshya Mishra</p>
      </div>
    </>
  );
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      aria-label={label ?? "Copy"}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {label && <span>{done ? "Copied" : label}</span>}
    </button>
  );
}

function CodeBlock({ children, className }: { children?: ReactNode; className?: string | undefined }) {
  const code = String(children ?? "").replace(/\n$/, "");
  const lang = /language-(\w+)/.exec(className ?? "")?.[1];
  return (
    <div className="my-3 overflow-hidden rounded-xl border bg-code">
      <div className="flex items-center justify-between border-b px-3 py-1 text-xs text-muted-foreground">
        <span>{lang ?? "code"}</span>
        <CopyButton text={code} label="Copy" />
      </div>
      <pre className="overflow-x-auto p-4 text-[13px]"><code>{code}</code></pre>
    </div>
  );
}

function MessageView({ message, isLast, busy, onRetry }: { message: UIMessage; isLast: boolean; busy: boolean; onRetry: () => void }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-gradient-brand max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 whitespace-pre-wrap text-primary-foreground">{textOf(message)}</div>
      </div>
    );
  }
  const text = textOf(message);
  return (
    <div className="group flex gap-3">
      <StarLogo className="mt-1 size-6" />
      <div className="min-w-0 flex-1">
        {message.parts.map((p, i) => {
          if (p.type === "reasoning" && p.text)
            return (
              <details key={i} className="mb-2 text-xs text-muted-foreground">
                <summary className="cursor-pointer select-none">Thinking</summary>
                <p className="mt-1 whitespace-pre-wrap border-l pl-3">{p.text}</p>
              </details>
            );
          if (p.type === "text")
            return (
              <div key={i} className="star-prose">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ children }) => <>{children}</>,
                    code: ({ className, children }) =>
                      /language-/.test(className ?? "") || String(children).includes("\n")
                        ? <CodeBlock className={className}>{children}</CodeBlock>
                        : <code>{children}</code>,
                  }}
                >
                  {p.text}
                </ReactMarkdown>
              </div>
            );
          return null;
        })}
        {text && !(isLast && busy) && (
          <div className="mt-1 flex gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <CopyButton text={text} label="Copy" />
            {isLast && (
              <button onClick={onRetry} className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                <RotateCcw className="size-3.5" /> Retry
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
