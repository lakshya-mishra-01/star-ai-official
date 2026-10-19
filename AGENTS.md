<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## STAR AI
- Chat streams through the server route `src/routes/api/chat.ts` (bearer-token verified, RLS as user); model calls live in `src/lib/ai/*.server.ts` so the API key never reaches the browser.
- Threads/messages are stored in Lovable Cloud tables `threads` and `messages` (AI SDK UIMessage parts as jsonb); each thread has its own URL `/chat/$threadId`.
