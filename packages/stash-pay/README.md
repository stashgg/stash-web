# @stashgg/stash-pay

Embeddable checkout SDK for [Stash Pay](https://docs.stash.gg/guides/stash-pay/integration). Drop it into any React app, plain HTML page, or Unity WebGL build — the component opens a theme-able card that hosts the Stash Pay checkout iframe and surfaces typed success/failure/processing events to the host.

- **React component** — declarative `<StashPay isOpen checkoutUrl ... />`
- **Vanilla ESM core** — `import { open } from '@stashgg/stash-pay/vanilla'` for non-React apps
- **Script-tag UMD** — `<script src="...stash-pay.umd.global.js">` exposes `window.StashPay.open({ ... })`
- Four layout presets: bottom sheet, centered modal, side panels
- Full CSS-variable theming
- Accessible by default: `role=dialog`, focus trap, `inert` siblings, reduced-motion honored
- No runtime dependencies; React is a peer (optional for the vanilla/UMD surface)

## Install

```bash
npm install @stashgg/stash-pay
```

Or load directly via CDN:

```html
<script src="https://unpkg.com/@stashgg/stash-pay@2/dist/umd/stash-pay.umd.global.js"></script>
```

## Quick start — React

```tsx
import { StashPay } from '@stashgg/stash-pay';
import '@stashgg/stash-pay/styles'; // once in your app entry

export function PayButton({ checkoutUrl }: { checkoutUrl: string | null }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Pay</button>
      <StashPay
        isOpen={open}
        checkoutUrl={checkoutUrl}
        checkoutLocale="fr-FR"
        position="center-modal"
        onSuccess={(e) => console.log('paid', e.orderId)}
        onFailure={(e) => console.log('payment failed', e.errorCode)}
        onError={(e) => {
          console.error('checkout error', e.code, e.message);
          setOpen(false);
        }}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
```

## Quick start — script tag (Unity WebGL, vanilla HTML, etc.)

```html
<script src="https://unpkg.com/@stashgg/stash-pay@2/dist/umd/stash-pay.umd.global.js"></script>
<script>
  let handle;
  try {
    handle = StashPay.open({
      checkoutUrl: 'https://checkout.stash.gg/pay/abc...',
      position: 'center-modal',
      dismissOnBackdropClick: true,
      onSuccess: (e) => console.log('paid', e.orderId),
      onError: (e) => console.error('checkout error', e.code, e.message),
      onClose: () => console.log('closed'),
    });
  } catch (e) {
    // Pre-flight failure (invalid URL, bad container, …) — same StashPayError as onError.
    console.error('could not open checkout', e.code, e.message);
  }

  // later (only if open() succeeded):
  // handle.update({ position: 'bottom-sheet' });
  // handle.close();
  // handle.destroy();
</script>
```

Styles are auto-injected once on load in the UMD bundle. No separate CSS import needed.

## Quick start — vanilla ESM (no React)

```ts
import { open, StashPayError } from '@stashgg/stash-pay/vanilla';
import '@stashgg/stash-pay/styles';

try {
  const handle = open({
    checkoutUrl,
    position: 'side-panel-right',
    onSuccess: (e) => console.log(e.orderId),
    onError: (e) => console.error(e.code, e.message),
  });
  // use handle.close(), handle.destroy(), …
} catch (e) {
  if (e instanceof StashPayError && e.code === 'INVALID_URL') {
    // bad checkoutUrl from backend
  }
}
```

## Props / options reference

| Option | Type | Default | Notes |
| --- | --- | --- | --- |
| `checkoutUrl` | `string` | — | **Required.** URL returned by Stash Pay server API. |
| `isOpen` *(React only)* | `boolean` | — | **Required.** Controls visibility. |
| `checkoutTheme` | `'light' \| 'dark'` | — | Forwards a `theme=` query parameter to the checkout page so the checkout UI renders in the matching colour scheme. Distinct from `theme` (which styles the surrounding card). |
| `checkoutLocale` | `string` | — | Forwards a `locale=` query parameter to the checkout page so Stash Pay v2 renders in the requested language (BCP-47 or bare code, e.g. `fr-FR` or `fr`). Independent of Server SDK `regionCode`, which controls pricing and tax. Omit to let checkout resolve language from the browser. Gated per shop by backend `supported_languages`. |
| `position` | `'bottom-sheet' \| 'center-modal' \| 'side-panel-right' \| 'side-panel-left'` | `'bottom-sheet'` | Layout preset. |
| `width` | `string \| number` | — | Overrides the preset width. |
| `height` | `string \| number` | — | Overrides the preset height. |
| `zIndex` | `number` | `2147483000` | Sets `--stash-pay-z-index`. |
| `portalTarget` / `container` | `HTMLElement` | `document.body` | Where the modal mounts. Must be an `HTMLElement`; invalid values emit `onError` with `MOUNT_ERROR`. |
| `showCloseButton` | `boolean` | `true` | |
| `showDragBar` | `boolean` | `true` on bottom-sheet, else `false` | |
| `dismissOnBackdropClick` | `boolean` | `true` | |
| `dismissOnEscape` | `boolean` | `true` | |
| `autoCloseOnSuccess` | `boolean` | `true` | Callback fires *before* close. |
| `autoCloseOnFailure` | `boolean` | `true` | |
| `backdrop` | `{ blur?, color?, opacity?, hidden? }` | — | Inline backdrop overrides. |
| `theme` | `StashPayTheme` | — | Sets CSS variables on the root. |
| `animationDuration` | `number` (ms) | `300` | Overrides the easing duration. |
| `ariaLabel` | `string` | `'Stash Pay checkout'` | |
| `iframe` | `StashPayIframeOptions` | — | See below. |
| `allowedCheckoutHosts` | `string[]` | — | Optional host allowlist for `checkoutUrl`. Entries are exact hosts (`checkout.stash.gg`) or `*.domain` wildcards (apex + any subdomain). If set and the URL's host is not allowed, pre-flight validation fails with `DOMAIN_NOT_ALLOWED`. Distinct from `iframe.allowedOrigins`, which validates `postMessage` origins. |
| `loadTimeout` | `number` (ms) | `20000` | If the checkout iframe does not load within this many ms, `onError` fires with `NETWORK_ERROR`. Set `0` to disable. |
| `errorBeacon` | `boolean` | `true` | On open failures (load timeout, iframe error, mount failure), send a fire-and-forget diagnostic to Stash so integration breakage is detectable without a report. Carries only the checkout URL and error code/message. Set `false` to disable. |
| `debug` | `boolean` | `false` | When `true`, logs SDK lifecycle and callback traces via `console.log` (`[stash-pay]` prefix). |
| `injectStyles` | `boolean` | UMD: `true`, else `false` | Runtime `<style>` injection toggle. |
| `cspNonce` | `string` | — | Applied to the injected `<style>` when runtime injection is enabled. |
| `onOpen / onClose / onReady / onSuccess / onFailure / onProcessing` | fn | — | Callbacks. |
| `onError` | `(e: StashPayError) => void` | — | Receives a typed error — see [Error handling](#error-handling). |

### Iframe options

```ts
interface StashPayIframeOptions {
  sandbox?: string;           // default: allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox
  allow?: string;             // default: "payment"
  title?: string;             // default: "Stash Pay checkout"
  referrerPolicy?: ReferrerPolicy;
  loading?: 'eager' | 'lazy';
  /** Optional postMessage origin whitelist. If set, events from other origins are dropped. */
  allowedOrigins?: string[];
}
```

## Event types

```ts
type StashPaymentEvent =
  | { type: 'success';    orderId?: string;   raw: Record<string, unknown> }
  | { type: 'failure';    orderId?: string;   errorCode?: string; message?: string; raw: Record<string, unknown> }
  | { type: 'processing'; raw: Record<string, unknown> };
```

Every callback receives a structured event plus a `raw` escape hatch containing every field the checkout page emitted, so forward-compatible fields can be read without a library bump. `orderId` is present on `failure` when the checkout reached an order-bound state before failing — useful for reconciliation and support.

### Callback delivery guarantees

- **`onError` vs `onFailure`:** `onError` is for SDK / integration failures (invalid URL, mount error, network timeout). `onFailure` is for **payment** failures reported by the checkout page after it loads. Do not use `onFailure` for pre-flight validation errors.
- `onSuccess` and `onFailure` are **terminal** — each fires **at most once per checkout session**. The checkout can deliver payment events over two channels (the `window.stash_sdk` bridge and `postMessage`); duplicate or late terminal events are dropped.
- `onProcessing` is **not** terminal and may fire multiple times before a terminal event.
- `onOpen`, `onReady`, and `onClose` each fire once per open/close cycle.
- Re-pointing the component at a new `checkoutUrl` starts a fresh session, after which a terminal callback may fire again.

## Error handling

`onError` receives a `StashPayError` — an `Error` subclass with a machine-readable `code`:

```ts
class StashPayError extends Error {
  code: StashPayErrorCode;
  details?: Record<string, unknown>;
}

type StashPayErrorCode =
  | 'INVALID_URL'         // checkoutUrl is empty, unparseable, or not http(s)
  | 'DOMAIN_NOT_ALLOWED'  // checkoutUrl host is not in allowedCheckoutHosts
  | 'NETWORK_ERROR'       // the checkout iframe failed to load (or timed out)
  | 'MOUNT_ERROR'         // the modal could not be mounted into the DOM
  | 'UNKNOWN';
```

`StashPayError` and `StashPayErrorCode` are exported from the package root. Branch on
`err.code` rather than `instanceof` — a bundled copy of the class can differ by reference.

```tsx
<StashPay
  isOpen={open}
  checkoutUrl={url}
  allowedCheckoutHosts={['checkout.stash.gg', '*.stash.gg']}
  loadTimeout={15000}
  onError={(e) => {
    if (e.code === 'INVALID_URL') showBrokenLinkMessage();
    else reportError(e);
    setOpen(false);
  }}
/>
```

The SDK validates `checkoutUrl` before it touches the iframe. An invalid URL (empty,
unparseable, a non-`http(s)` scheme such as `javascript:`/`data:`, or a host outside
`allowedCheckoutHosts`) is a **pre-flight failure**: the modal does not open and the
checkout iframe is never created.

For a syntactically valid URL whose server never responds, the load timeout
surfaces a `NETWORK_ERROR` after a bounded wait (20s by default, tune with
`loadTimeout`, disable with `0`). A checkout that finishes loading after the
timeout still becomes ready: treat the error as the spinner giving up, not a
terminal verdict.

### Pre-flight failures (`open()` / `mount()`)

These failures happen **before** the checkout iframe loads:

- Invalid or disallowed `checkoutUrl` → `INVALID_URL` or `DOMAIN_NOT_ALLOWED`
- Invalid `container` / `portalTarget` (not an `HTMLElement`) → `MOUNT_ERROR`
- A Stash Pay instance already mounted in the same container → `MOUNT_ERROR`
- Other DOM mount errors → `MOUNT_ERROR`

**Vanilla / UMD (`open()`, `StashPayController.open()`):**

1. `onError` fires with a `StashPayError`
2. The same error is **thrown**
3. **No handle is returned** — do not call `handle.close()` unless `open()` completed without throwing

Use `try/catch` around `open()`, or rely on `onError` only — but never assume a handle
exists after a pre-flight failure:

```ts
try {
  const handle = open({
    checkoutUrl,
    onError: (e) => report(e), // optional — same error is also thrown
  });
} catch (e) {
  if (e.code === 'INVALID_URL') { /* … */ }
}
```

**React (`<StashPay>`):** mount failures are caught internally. Use `onError`; the
component does not throw into your render tree. Close the sheet in the handler
(`setOpen(false)`).

**`update()` after mount:** changing to an invalid `checkoutUrl` emits `onError` but
does **not** throw — the existing checkout session stays on screen.

## Debugging

Set `debug: true` to trace the SDK's lifecycle through `console.log`. Every line is
prefixed with `[stash-pay]`, so it filters cleanly in the browser console. The option
defaults to `false`; with it off the SDK logs nothing.

```tsx
<StashPay isOpen={open} checkoutUrl={url} debug />
```

```ts
// vanilla / UMD
open({ checkoutUrl, debug: true, onError: (e) => report(e) });
```

Traced events include:

- **Mount / open / close / destroy** — state transitions and container info.
- **Iframe** — the `src` being loaded, first vs. subsequent `load`, bridge install, and the `error` / `loadTimeout` (`NETWORK_ERROR`) paths.
- **postMessage** — whether each inbound message was parsed or ignored (with its origin).
- **Payment dispatch** — the event type, including when a terminal `success`/`failure` is dropped because the session already settled.
- **Callbacks** — each user callback as it fires.

Keep `debug` off in production. Traces are for troubleshooting only, and the iframe
`src` line includes the `checkoutUrl` — safe to log locally, but avoid shipping it to
end-user consoles.

## Theming

Every visual token is a CSS custom property defined on the root. Override globally:

```css
:root {
  --stash-pay-color-bg: #111;
  --stash-pay-color-accent: #ff7a00;
  --stash-pay-radius: 2rem;
  --stash-pay-animation-duration: 220ms;
}
```

…or per-instance via the `theme` option:

```tsx
<StashPay
  isOpen={open}
  checkoutUrl={url}
  theme={{
    colorBackground: '#111',
    colorAccent: '#ff7a00',
    radius: '2rem',
    animationDuration: 220,
  }}
/>
```

Full token list:

```
--stash-pay-color-bg
--stash-pay-color-backdrop
--stash-pay-color-text
--stash-pay-color-accent
--stash-pay-color-close-bg
--stash-pay-color-close-bg-hover
--stash-pay-color-close-fg
--stash-pay-color-close-fg-hover
--stash-pay-color-spinner-track
--stash-pay-color-spinner-head
--stash-pay-color-drag-bar
--stash-pay-color-shadow
--stash-pay-radius
--stash-pay-sheet-max-width
--stash-pay-modal-max-width
--stash-pay-side-panel-width
--stash-pay-close-offset
--stash-pay-animation-duration
--stash-pay-animation-easing
--stash-pay-iframe-fade-duration
--stash-pay-z-index
```

## Imperative / headless React usage

Prefer a function over a component?

```tsx
import { useStashPay } from '@stashgg/stash-pay';

function PayButton() {
  const { open } = useStashPay();
  return (
    <button
      onClick={() => {
        try {
          open({
            checkoutUrl: '...',
            onSuccess: (e) => alert(`paid ${e.orderId}`),
            onError: (e) => alert(`error: ${e.code}`),
          });
        } catch (e) {
          alert(`could not open: ${e.code}`);
        }
      }}
    >
      Pay
    </button>
  );
}
```

On success, `open()` returns a handle with `close`, `update`, `destroy`, and typed
`on` / `off`. Pre-flight failures throw and return no handle — see
[Pre-flight failures](#pre-flight-failures-open--mount).

## Accessibility

- Root has `role="dialog"`, `aria-modal="true"`, `aria-label="Stash Pay checkout"` (customisable via `ariaLabel`).
- Siblings of the root get `inert` (with `aria-hidden` fallback) while the modal is open.
- Tab cycles between the close button and the iframe; the iframe handles its own internal focus.
- `previouslyFocused` element is restored on close.
- `prefers-reduced-motion: reduce` collapses all transitions.

## How the iframe communicates back

The checkout page drives the host through a small set of methods on
`window.stash_sdk` — the same surface the native Stash Pay SDKs expose
to their WebViews. The SDK installs this bridge on every iframe `load`:

| Method | Fires |
| --- | --- |
| `window.stash_sdk.onPaymentSuccess({ orderId })` | `onSuccess` |
| `window.stash_sdk.onPaymentFailure({ errorCode, message })` | `onFailure` |
| `window.stash_sdk.onPurchaseProcessing({ ... })` | `onProcessing` |
| `window.stash_sdk.expand()` / `.collapse()` | reserved (no-op unless you wire the host) |
| `window.stash_sdk.openExternalBrowser(url)` | `window.open(url, '_blank')` by default |
| `window.close()` | `onClose` |

The bridge is installed by assigning to `iframe.contentWindow` directly.
Because of the same-origin policy this only works when the checkout URL
is served from the **same origin** as your host page (Stash Pay
deployments typically CNAME the checkout onto your own domain). For
cross-origin iframes the installer is a silent no-op, and the SDK
listens for two postMessage envelope shapes as a fallback:

```js
// stash_sdk envelope (preferred)
window.parent.postMessage(
  { source: 'stash_sdk', method: 'onPaymentSuccess', payload: { orderId } },
  '*',
);

// legacy envelope (v1-compatible)
window.parent.postMessage(
  { eventName: 'STASH_WINDOW_EVENT__PAYMENT_SUCCESS', orderId },
  '*',
);
```

Both envelopes resolve to the same typed `onSuccess` callback — pick
whichever is easier to emit from the checkout page.

## Security notes

- The default iframe `sandbox` includes `allow-same-origin` — this is required for the bridge installation, for the checkout page to read its own cookies, redirect through 3DS providers, and drive the webhook round-trip. Override via `iframe.sandbox` if you understand the implications.
- For strict postMessage validation, pass `iframe.allowedOrigins: ['https://checkout.stash.gg']` (or your environment's origin).
- Strict CSP? Runtime `<style>` injection accepts a `cspNonce`; or disable injection with `injectStyles: false` and ship the stylesheet yourself via `<link rel="stylesheet" href="/stash-pay.css">`.

## SSR

`<StashPay>` renders nothing on the server (returns `null`) and mounts its DOM from a client effect, so it is safe inside Next.js server components and app-router layouts. The `/vanilla` entry throws if `document` is not available — call it from a client-side effect or `window`-guarded path.

## Migration from v1.x

See [MIGRATION.md](./MIGRATION.md). Highlights:

- `onPurchaseSuccess` → `onSuccess` (typed).
- `onPurchaseFailed` → `onFailure` (typed).
- Callbacks now fire **before** the auto-close animation starts.
- Width prop unchanged; new `height`, `position`, `backdrop`, `theme`, `iframe`, dismiss and auto-close flags are all additive.
- **2.2.x:** pre-flight failures from `open()` throw `StashPayError` and return no handle — see [Upgrading to 2.2.x](./MIGRATION.md#already-on-21x-upgrading-to-22x) in MIGRATION.md.

## Browser support

Evergreen Chrome/Edge/Firefox, Safari 14+.

## License

MIT © Stash
