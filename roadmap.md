# Task roadmap
- [x] Integrate Bytez Model API server-side (src/lib/ai/bytez.server.ts) with Lovable gateway fallback; chat + guest chat routes prefer Bytez when BYTEZ_API_KEY is set. Typecheck, 13 tests, and preview build pass.
- [ ] Bytez live reply is untested: BYTEZ_API_KEY is not stored yet (secure form requested). Model defaults to Qwen/Qwen3-4B, overridable via BYTEZ_MODEL_ID. For Vercel, BYTEZ_API_KEY must also be added in Vercel project env vars.

# Authentication update
- [x] Fix reported TypeScript errors and verify the preview build; eight existing tests pass, sign-in redirect and guest screen render without runtime errors.
- [ ] Add public guest chat with a server-enforced daily allowance and limit notice.
- [ ] Add optional accounts with unique usernames, recovery email, signup/login/reset and private history.
- [ ] Preserve branding and landing actions; verify guest chat, accounts, duplicate usernames and isolation.
- [ ] Diagnose Vercel Google 404 when the deployed Vercel URL is supplied; unknown deployment address prevents testing.
- [x] Remove Lovable login and provide Google-only sign-in with loading and error states; Lovable provider disabled.
- [x] Preserve sessions, protected chat, and secure logout; routing tests and real-account refresh/logout checks passed.
- [ ] Complete Google consent and return testing. Blocker: local browser did not open Google authorization; hosted credential and redirect settings are not exposed by available diagnostics. No Google success claimed. Cloud requires its Google connection helper; fully bypassing it is not implemented.