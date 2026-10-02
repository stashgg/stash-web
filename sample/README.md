# Stash Pay — sample playground

Next.js app that exercises the workspace build of [`@stashgg/stash-pay`](../packages/stash-pay/) with a configurable `<StashPay />` demo, optional server-side checkout URL generation, and a no-React UMD smoke page.

## Live demo

Published build: [https://pay-playground.stashpreview.com/](https://pay-playground.stashpreview.com/)

## Run locally

From the **monorepo root** (recommended):

```bash
npm install
npm run dev
```

This starts Next.js at [http://localhost:3000](http://localhost:3000). The sample’s `predev` script builds `@stashgg/stash-pay` and runs `copy-umd` so the UMD file exists under `public/` before the server starts.

To work only inside the sample workspace after a root install:

```bash
cd sample && npm run dev
```

## What’s in the UI

The main playground is `app/page.tsx`:

- **Control panel** — Layout/preset controls, checkout URL field, checkout page theme and locale (`?theme=` / `?locale=`), optional **Generate sample checkout** (calls the API route below).
- **Theme, backdrop, iframe** — Tweak styling and iframe-related options passed through to `<StashPay />`.
- **Validation & loading** — Set an `allowedCheckoutHosts` allowlist and tune the `loadTimeout` (default 20000 ms, `0` disables). The **Try an invalid URL** link exercises the `onError` path (invalid URLs no longer open the modal).
- **Reaction log** — Live stream of SDK callbacks (`open`, `close`, `ready`, success, failure, processing, errors with their `code`).
- **Code snippet** — JSON view of the current prop configuration for quick copy/export.

The URL field defaults to [`https://test.stashpreview.com/`](https://test.stashpreview.com/) so you can open checkout and observe events without wiring your own backend first.

## Checkout API route

- **Path:** `app/api/checkout/route.ts`
- **Method:** `POST` (body can be `{}` for the playground button)
- **Behavior:** Proxies to the Stash test API to mint a checkout URL using a fixed demo payload item when `STASH_API_KEY` is set.

Configure the key for local runs:

1. Create `sample/.env.local`
2. Set `STASH_API_KEY=your_stash_api_key_here`

Without the key you can still paste any checkout URL (for example one created with your own server). Full env notes: [Environment variables](../README.md#environment-variables-sample-only) in the repo README.

## UMD smoke test

`npm run dev` / `npm run build` copies the freshly built bundle to `public/stash-pay.umd.global.js`.

Open [http://localhost:3000/umd-test.html](http://localhost:3000/umd-test.html) after `npm run dev` to exercise `window.StashPay` via a plain `<script>` tag without React.

## Stack

See `package.json` in this folder: Next.js 16, React 19, TypeScript, Tailwind CSS 4.

## SDK reference

Props, callbacks, vanilla ESM, and UMD usage: [packages/stash-pay/README.md](../packages/stash-pay/README.md).
