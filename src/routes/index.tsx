import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, Code2, GraduationCap, PenLine, Search, Lightbulb, Plus, ArrowUp, Paperclip, MessageSquare, Settings } from "lucide-react";
import heroImg from "@/assets/hero-star.jpg";
import { StarLogo, StarWordmark } from "@/components/star/StarLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "STAR AI — Meet STAR. Think Beyond." },
      { name: "description", content: "Your intelligent AI companion for ideas, learning, coding and everything in between. Built by Lakshya Mishra." },
      { property: "og:title", content: "STAR AI — Meet STAR. Think Beyond." },
      { property: "og:description", content: "Your intelligent AI companion for ideas, learning, coding and everything in between." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Brain, title: "AI Chat", text: "Natural, thoughtful conversations about anything on your mind." },
  { icon: Code2, title: "Coding Assistant", text: "Write, debug and understand code across languages." },
  { icon: GraduationCap, title: "Study Companion", text: "Break down hard topics and build smart study plans." },
  { icon: PenLine, title: "Creative Writing", text: "Stories, essays, captions and scripts in your voice." },
  { icon: Search, title: "Smart Search", text: "Find past conversations instantly from your history." },
  { icon: Lightbulb, title: "Brainstorming", text: "Turn a spark into a universe of ideas." },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <header className="fixed inset-x-0 top-0 z-30">
        <div className="glass mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-full px-5 py-2.5 mx-4 md:mx-auto">
          <Link to="/"><StarWordmark className="text-base" /></Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Preview</a>
            <Link to="/chat" className="hover:text-foreground transition-colors">Chat</Link>
          </nav>
          <Button variant="hero" size="sm" asChild><Link to="/chat">Start Chatting</Link></Button>
        </div>
      </header>

      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
        <img src={heroImg} alt="" className="absolute inset-0 h-full w-full object-cover opacity-90" />
        <div className="absolute inset-0 bg-hero-fade" />
        <div className="starfield pointer-events-none absolute inset-0 opacity-50" />
        <div className="relative z-10 flex flex-col items-center">
          <p className="glass animate-rise rounded-full px-4 py-1.5 text-xs tracking-[0.3em] text-muted-foreground uppercase">Your AI. Your Universe.</p>
          <h1 className="mt-8 animate-rise text-5xl leading-[1.02] font-semibold md:text-8xl [animation-delay:100ms]">
            Meet STAR.<br /><span className="text-gradient">Think Beyond.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg text-muted-foreground [animation-delay:200ms]">
            Your intelligent AI companion for ideas, learning, coding and everything in between.
          </p>
          <div className="mt-10 flex animate-rise flex-wrap justify-center gap-3 [animation-delay:300ms]">
            <Button variant="hero" size="lg" className="h-12 px-8 text-base" asChild>
              <Link to="/chat">Start Chatting <ArrowRight /></Link>
            </Button>
            <Button variant="glass" size="lg" className="h-12 px-8 text-base" asChild>
              <a href="#features">Explore STAR</a>
            </Button>
          </div>
        </div>
      </section>

      <section id="features" className="relative mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <h2 className="text-center text-3xl font-semibold md:text-5xl">One companion. <span className="text-gradient">Infinite orbits.</span></h2>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div key={f.title} className="glass animate-float rounded-2xl p-6 transition-shadow hover:shadow-glow" style={{ animationDelay: `${i * 0.6}s` }}>
              <div className="bg-gradient-brand mb-5 grid size-11 place-items-center rounded-xl text-primary-foreground"><f.icon className="size-5" /></div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="preview" className="relative mx-auto max-w-5xl scroll-mt-24 px-6 pb-28">
        <div className="glass overflow-hidden rounded-3xl p-2 shadow-glow">
          <div className="flex h-[420px] overflow-hidden rounded-2xl bg-background">
            <div className="hidden w-56 flex-col border-r bg-sidebar p-3 sm:flex">
              <StarWordmark className="text-sm" />
              <div className="bg-gradient-brand mt-4 flex items-center gap-2 rounded-full px-3 py-2 text-xs text-primary-foreground"><Plus className="size-3.5" /> New chat</div>
              <div className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground"><Search className="size-3.5" /> Search chats</div>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                {["Physics study plan", "React hooks explained", "Sci-fi story opening"].map((t) => (
                  <div key={t} className="flex items-center gap-2 rounded-md px-2 py-1.5"><MessageSquare className="size-3" />{t}</div>
                ))}
              </div>
              <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground"><Settings className="size-3.5" /> Settings</div>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center p-6">
              <StarLogo className="size-12" animated />
              <p className="mt-4 text-center font-display text-xl">Hey Lakshya, what are we <span className="text-gradient">exploring</span> today?</p>
              <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                {["Debug my code", "Plan my study week", "Brainstorm ideas"].map((s) => (
                  <span key={s} className="glass rounded-full px-3 py-1.5 text-muted-foreground">{s}</span>
                ))}
              </div>
              <div className="glass mt-8 flex w-full max-w-md items-center gap-2 rounded-2xl p-2 text-sm text-muted-foreground">
                <Paperclip className="ml-1 size-4" /><span className="flex-1">Message STAR…</span>
                <span className="bg-gradient-brand grid size-8 place-items-center rounded-full text-primary-foreground"><ArrowUp className="size-4" /></span>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">Preview of the STAR workspace</p>
      </section>

      <footer className="relative border-t py-8 text-center text-sm text-muted-foreground">STAR AI © 2026 · Built by Lakshya Mishra</footer>
    </div>
  );
}
