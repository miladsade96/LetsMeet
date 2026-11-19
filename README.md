# LetsMeet

A video meeting app built with Next.js, Clerk and Stream: instant and scheduled meetings, invitation links, personal rooms, meeting history, and recordings.

## Run locally

Use Node 22.14+ (Node 22 LTS is recommended).

```sh
npm ci
# Copy .env.example to .env.local and fill in development settings.
npm run dev
```

The normal app requires Clerk and Stream. Missing settings lead to `/setup`; writes and API requests return 503. No demo identity is enabled in the production app.

Set Clerk sign-in/sign-up URLs and Stream credentials using `.env.example`. Only the public Stream API key goes to the browser. The server creates short-lived Stream tokens for the current Clerk session. Configure the Stream default call type's membership/host permissions in the Stream dashboard for your deployment. Invite URLs use the current website origin, including deployment previews; no base-URL environment variable is required.

Keep `.env.local` private. Deploy using a Next.js server runtime, not a static HTML export.

## Checks

```sh
npm test
npm run typecheck
npm run lint
npm run build
npm start
```

Offline tests use mocked Clerk and Stream adapters. They cover invitation validation, invalid/past dates, instant versus scheduled behavior, duplicate submission prevention, loading/errors/retries, stale responses and account changes, paginated call lists, recording failures, device permission denial, join failures, clipboard errors, connection cleanup and authenticated token issuance.

## Offline visual preview

```sh
npm run preview:offline
```

Open `http://127.0.0.1:4174`. The separate Vite test harness renders the actual dashboard, navigation, meeting dialogs, personal room and setup components with clearly labeled sample data. It never opens a real camera, microphone or video connection. This harness is not a Next.js route and is not included in the deployed app. Generated screenshots are in the ignored `qa/` directory.

## Repair notes

- Updated Next.js 14 to 16, React, Clerk and Stream SDKs and migrated authentication APIs.
- Added connection lifecycle cleanup, account isolation, recoverable errors, request pagination and stale-response protection.
- Corrected meeting ordering/classification, scheduling without descriptions, instant meeting timestamps and duplicate request handling.
- Restricted invitation navigation to valid internal meeting URLs and corrected invitation copying and clipboard error feedback.
- Awaited joining before entering the room, defaulted media to off, handled device/join errors and cleaned up on exit.
- Improved keyboard/mobile navigation, dialog labels, recordings and end-call error handling.

Real Clerk sign-in, live Stream permissions, calls between two devices, camera/microphone capture and recording playback/upload still require a connected-environment smoke test.
