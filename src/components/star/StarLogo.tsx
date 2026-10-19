import { useId } from "react";
import { cn } from "@/lib/utils";

export function StarLogo({ className, animated = false }: { className?: string; animated?: boolean }) {
  const id = useId();
  return (
    <svg viewBox="0 0 64 64" className={cn("shrink-0", animated && "animate-star", className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--violet)" />
          <stop offset="100%" stopColor="var(--cyan)" />
        </linearGradient>
      </defs>
      <path
        d="M32 2 C34 22 42 30 62 32 C42 34 34 42 32 62 C30 42 22 34 2 32 C22 30 30 22 32 2 Z"
        fill={`url(#${id}-g)`}
      />
      <circle cx="32" cy="32" r="4" fill="var(--foreground)" opacity="0.9" />
    </svg>
  );
}

export function StarWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-semibold tracking-tight", className)}>
      <StarLogo className="size-7" />
      <span>
        STAR <span className="text-gradient">AI</span>
      </span>
    </span>
  );
}
