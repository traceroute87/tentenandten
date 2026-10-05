# Production QA

Do not deploy until these checks pass on a production-like build.

## Platforms

- [ ] Desktop: Firefox and Chromium/Chrome
- [ ] Mobile: iPhone Safari and installed iPhone PWA
- [ ] Mobile: Android Chrome and installed Android PWA

## Flows

- [ ] Landing page and Home
- [ ] Reach 10, Share 10, and Bring 10 progress
- [ ] Editable Text, Email, and Social message presets
- [ ] Voting, first-run state setup (select and Skip), and upcoming elections
- [ ] State/local official lookup and Help flows
- [ ] Add to Calendar download and opening the `.ics` file
- [ ] Magic-link login; refresh persistence; sign-out/sign-in persistence
- [ ] Offline changes and reconnect sync
- [ ] Referral link; referral QR on a second device/session; attribution after signup
- [ ] Challenge-start verification and Impact
- [ ] Trust / Sources
- [ ] Keyboard-only accessibility smoke test, including dialogs and state setup

## PWA installation (production HTTPS: https://tentenandten.com)

- [ ] Desktop Chrome / Edge: eligible install CTA, native prompt, cancel, install, standalone launch, and CTA hidden afterward
- [ ] Android Chrome: install CTA and native install flow; supplied icon appearance; standalone launch and Home Screen relaunch
- [ ] iPhone Safari: Install opens instructions; Share → Add to Home Screen; supplied icon appearance; standalone launch; no install CTA in the installed app
- [ ] Firefox desktop: no dead or fake install action

## Supabase Auth production redirect configuration

- [ ] Set the Supabase Auth **Site URL** to `https://tentenandten.com`.
- [ ] Allow the production redirect `https://tentenandten.com/**`.
- [ ] Keep only intentionally required localhost/LAN development redirects; do not add broad wildcard domains.
