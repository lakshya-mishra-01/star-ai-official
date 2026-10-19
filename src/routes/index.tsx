import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Code2, GraduationCap, PenLine, Brain } from "lucide-react";
import { StarLogo, StarWordmark } from "@/components/star/StarLogo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "STAR AI — Your AI. Your Universe." },
      { name: "description", content: "Meet STAR, a premium AI assistant for coding, learning, creative writing and everyday thinking." },
      { property: "og:title", content: "STAR AI — Your AI. Your Universe." },
      { property: "og:description", content: "Meet STAR. A premium AI assistant built by Lakshya Mishra." },
    ],
  }),
  component: Index,
});

const features = [
  { icon: Brain, title: "AI assistance", text: "Clear answers, smart reasoning and help with anything on your mind." },
  { icon: Code2, title: "Coding help", text: "Debug, explain and write code across languages and frameworks." },
  { icon: GraduationCap, title: "Learning", text: "Break down tough topics, quiz yourself and study faster." },
  { icon: PenLine, title: "Creative writing", text: "Stories, captions, essays and ideas — in your voice." },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="starfield pointer-events-none absolute inset-0 opacity-70" />
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <StarWordmark className="text-lg" />
        <Button variant="glass" size="sm" asChild>
          <Link to="/chat">Open app</Link>
        </Button>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24">
          <StarLogo className="size-24 md:size-32" animated />
          <p className="glass mt-10 animate-rise rounded-full px-4 py-1.5 text-xs tracking-widest text-muted-foreground uppercase">
            STAR AI
          </p>
          <h1 className="mt-6 animate-rise text-5xl leading-[1.05] font-semibold md:text-7xl [animation-delay:100ms]">
            Meet STAR.
            <br />
            <span className="text-gradient">Your AI. Your Universe.</span>
          </h1>
          <p className="mt-6 max-w-xl animate-rise text-lg text-muted-foreground [animation-delay:200ms]">
            A calm, brilliant assistant that codes with you, teaches you, and writes with you — all in one
            beautifully simple space.
          </p>
          <Button variant="hero" size="lg" className="mt-10 h-12 animate-rise px-8 text-base [animation-delay:300ms]" asChild>
            <Link to="/chat">
              Start Chatting <ArrowRight />
            </Link>
          </Button>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-28">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="glass group animate-rise rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-glow"
                style={{ animationDelay: `${400 + i * 80}ms` }}
              >
                <div className="bg-gradient-brand mb-5 grid size-10 place-items-center rounded-xl text-primary-foreground">
                  <f.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t py-8 text-center text-sm text-muted-foreground">
        STAR AI © 2026 · Built by Lakshya Mishra
      </footer>
    </div>
  );
}
