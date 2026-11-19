# Stash Pay for Web [![npm](https://img.shields.io/npm/v/@stashgg/stash-pay.svg)](https://www.npmjs.com/package/@stashgg/stash-pay) [![Build and Publish](https://github.com/stashgg/stash-web/actions/workflows/publish.yml/badge.svg)](https://github.com/stashgg/stash-web/actions/workflows/publish.yml)

<p align="left">
  <img src=".github/assets/stash_web.png" width="128" height="128" alt="Stash Web Logo"/>
</p>

Embeddable [Stash Pay](https://docs.stash.gg/guides/stash-pay/integration) checkout for browsers: a React component, a framework-agnostic ESM core, and a script-tag UMD bundle (including Unity WebGL and plain HTML). This repository is the source for the [`@stashgg/stash-pay`](https://www.npmjs.com/package/@stashgg/stash-pay) npm package plus a Next.js playground.

For native mobile and engine integrations, see [stash-native](https://github.com/stashgg/stash-native), [stash-unity](https://github.com/stashgg/stash-unity), and [stash-unreal](https://github.com/stashgg/stash-unreal).

## Table of contents

**Overview**

- [Integration flow](#integration-flow)
- [Repository layout](#repository-layout)
  - [Requirements](#requirements)
- [Downloads / install](#downloads--install)
- [Quick start (React)](#quick-start-react)
- [Callbacks / events](#callbacks--events)

**Repository**

- [Monorepo folder structure](#monorepo-folder-structure)
- [Sample playground](./sample/README.md)

**Developing**

- [Developing this repository](#developing-this-repository)
  - [Installation](#installation)
  - [Development](#development)
  - [Building](#building)
  - [Workspace scripts](#workspace-scripts)

**Reference**

- [Environment variables (sample only)](#environment-variables-sample-only)
- [Documentation](#documentation)
- [Versioning](#versioning)
- [Support](#support)

## Integration flow

1. **Server generates a checkout URL** — Your backend calls the Stash API to create a checkout link (see the [integration guide](https://docs.stash.gg/guides/stash-pay/integration)).
2. **URL is delivered to the browser** — Send the URL to your web client however you already deliver data (SSR props, REST, WebSocket, etc.).
3. **Client opens checkout** — Use the React component, `open()` from the vanilla entry, or `window.StashPay.open()` from UMD.
4. **Listen for client events** — Handle success, failure, processing, close, and errors in your UI.

Server-side purchase verification (webhooks, entitlements) remains your responsibility, same as the mobile SDKs.

## Repository layout

| Area | Readme / path | Description |
| --- | --- | --- |
| **npm SDK** | [packages/stash-pay/README.md](./packages/stash-pay/README.md) | React API, vanilla ESM (`@stashgg/stash-pay/vanilla`), UMD bundle, props and events reference, theming |
| **v1 → v2** | [packages/stash-pay/MIGRATION.md](./packages/stash-pay/MIGRATION.md) | Upgrade notes for the major SDK revision |
| **Playground** | [sample/README.md](./sample/README.md) · [sample/](./sample/) | Next.js 16 app (React 19): control panel for layout/theme/backdrop/iframe, live callback log, code snippet export, optional checkout generation via API |

The published playground is at [https://pay-playground.stashpreview.com/](https://pay-playground.stashpreview.com/). A no-React page at `/umd-test.html` loads the copied UMD build from `public/` (see [sample/README.md](./sample/README.md)).

#### Requirements

- **Node.js** 20+ (monorepo tooling and CI)
- **React** 18+ or 19+ when using the `<StashPay />` component (optional peers for vanilla/UMD-only usage)
- **Modern evergreen browsers** (checkout runs inside an iframe with `postMessage` events)

## Downloads / install

**npm**

```bash
npm install @stashgg/stash-pay
```

**CDN (UMD)**

Pin a major version in production; example:

```html
<script src="https://unpkg.com/@stashgg/stash-pay@2/dist/umd/stash-pay.umd.global.js"></script>
```

See [packages/stash-pay/README.md](./packages/stash-pay/README.md) for `window.StashPay.open({ ... })` usage. Styles are injected automatically for the UMD bundle.

**Source**

This repository includes the playground and package source—use it if you want to run `npm install` locally and develop or contribute to the SDK.

## Quick start (React)

```tsx
import { useState } from 'react';
import { StashPay } from '@stashgg/stash-pay';
import '@stashgg/stash-pay/styles'; // once in your app entry

export function PayButton({ checkoutUrl }: { checkoutUrl: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Pay</button>
      <StashPay
        isOpen={open}
        checkoutUrl={checkoutUrl}
        position="center-modal"
        onSuccess={(e) => console.log('paid', e.orderId)}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

Vanilla ESM and script-tag examples live in the package readme.

## Callbacks / events

Common handlers (shared across React options, vanilla `open()`, and UMD). See the full table in [packages/stash-pay/README.md](./packages/stash-pay/README.md).

| Callback | When it runs |
| --- | --- |
| **onOpen** | Checkout surface opened |
| **onClose** | User or code closed the dialog |
| **onReady** | Host UI ready |
| **onError** | Host or transport error — receives a typed `StashPayError` with an error `code` (`INVALID_URL`, `NETWORK_ERROR`, …) |
| **onSuccess** | Payment completed successfully in checkout |
| **onFailure** | Payment failed in checkout |
| **onProcessing** | Long-running / intermediate checkout state |

`onSuccess` and `onFailure` fire at most once per checkout session; an invalid `checkoutUrl` fails fast through `onError` instead of hanging on a loading spinner. See [error handling](./packages/stash-pay/README.md#error-handling) for the full error-code list.

## Monorepo folder structure

#### ./packages/stash-pay

Source for `@stashgg/stash-pay`: React wrapper, core controller, CSS, UMD entry.

#### ./sample

Next.js playground (`stash-pay-sample`): depends on `@stashgg/stash-pay` from the workspace; includes `app/api/checkout` when you want generated demo URLs (`STASH_API_KEY` in `sample/.env.local`). Details, UMD copy step, and file map: **[sample/README.md](./sample/README.md)**.

## Developing this repository

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Opens the playground at [http://localhost:3000](http://localhost:3000). Edits under `packages/stash-pay/src/` only show up after the package is rebuilt—run `npm run build:package` or see **Building** and **Workspace scripts** below.

### Building

```bash
npm run build:package   # SDK only (ESM + CJS + UMD + types + CSS)
npm run build:sample    # Next build (prebuild rebuilds the package)
npm run build           # both
```

### Workspace scripts

- `npm run dev` — start the sample playground
- `npm run build` — build all workspaces
- `npm run build:package` — build only `@stashgg/stash-pay`
- `npm run build:sample` — build only the playground (rebuilds the SDK first)
- `npm run typecheck --workspace=@stashgg/stash-pay` — typecheck the SDK without emitting
- `npm test --workspace=@stashgg/stash-pay`: run the SDK's unit tests (Vitest, jsdom)

## Environment variables (sample only)

For the playground’s `app/api/checkout` route, create `sample/.env.local`:

```env
STASH_API_KEY=your_stash_api_key_here
```

Without this key you can still paste a checkout URL generated elsewhere. See **[sample/README.md](./sample/README.md)** for how the playground uses this route.

## Documentation

- [Stash Pay integration guide](https://docs.stash.gg/guides/stash-pay/integration) — generating checkout URLs and server-side practices
- [Stash documentation](https://docs.stash.gg) — broader Stash guides and API reference
- [packages/stash-pay/README.md](./packages/stash-pay/README.md) — SDK API, layout presets, theming, iframe options

## Versioning

This package follows [Semantic Versioning](https://semver.org/) (major.minor.patch):

- **Major** — Breaking changes (see [MIGRATION.md](./packages/stash-pay/MIGRATION.md) when upgrading)
- **Minor** — New features, backward compatible
- **Patch** — Bug fixes

## Support

- Documentation: [https://docs.stash.gg](https://docs.stash.gg)
- Email: [developers@stash.gg](mailto:developers@stash.gg)
