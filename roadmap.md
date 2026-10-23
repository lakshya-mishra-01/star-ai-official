# Authentication update
- [ ] Fix reported TypeScript errors and verify the preview build.
- [ ] Add public guest chat with a server-enforced daily allowance and limit notice.
- [ ] Add optional accounts with unique usernames, recovery email, signup/login/reset and private history.
- [ ] Preserve branding and landing actions; verify guest chat, accounts, duplicate usernames and isolation.
- [ ] Diagnose Vercel Google 404 when the deployed Vercel URL is supplied; unknown deployment address prevents testing.
- [x] Remove Lovable login and provide Google-only sign-in with loading and error states; Lovable provider disabled.
- [x] Preserve sessions, protected chat, and secure logout; routing tests and real-account refresh/logout checks passed.
- [ ] Complete Google consent and return testing. Blocker: local browser did not open Google authorization; hosted credential and redirect settings are not exposed by available diagnostics. No Google success claimed. Cloud requires its Google connection helper; fully bypassing it is not implemented.