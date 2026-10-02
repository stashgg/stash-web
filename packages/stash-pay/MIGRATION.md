# Migrating to @stashgg/stash-pay v2

v2 is a breaking, additive redesign of the v1.x React SDK. If you only use the default bottom-sheet modal with success/failure callbacks, you need two small renames; everything else is optional.

## 1. Rename callbacks

```diff
 <StashPay
   isOpen={open}
   checkoutUrl={url}
-  onPurchaseSuccess={(data) => console.log(data)}
-  onPurchaseFailed={(data) => console.log(data)}
+  onSuccess={(e) => console.log(e.orderId, e.raw)}
+  onFailure={(e) => console.log(e.errorCode, e.message, e.raw)}
 />
```

Payloads are now strongly typed. The full original payload is available on `e.raw` — nothing is lost.

## 2. Callback timing

**v1** closed the modal immediately and then fired the callback.
**v2** fires the callback first, then starts the close animation (on by default). Opt out with:

```tsx
<StashPay autoCloseOnSuccess={false} autoCloseOnFailure={false} ... />
```

You can drive open state from the callback if you need more control — e.g. show a "thank you" step before closing.

## 3. Styles

CSS import path is unchanged:

```ts
import '@stashgg/stash-pay/styles';
```

All hardcoded color and sizing values are now CSS custom properties. If you were overriding v1 class internals with your own CSS, switch to overriding the CSS variables instead — see the Theming section of the README for the full list.

## 4. `width` prop

Still supported, still accepts `string | number`. Now complemented by `height`, `zIndex`, and the full `theme` object.

## 5. Script-tag usage (new)

If you ever wanted to embed checkout from a Unity WebGL build or a plain HTML page, v2 ships a UMD bundle:

```html
<script src="https://unpkg.com/@stashgg/stash-pay@2/dist/umd/stash-pay.umd.global.js"></script>
<script>
  StashPay.open({ checkoutUrl: '…', onSuccess: (e) => {} });
</script>
```

## 6. Removed exports

- `StashWindowEvent` (v1 enum) — replaced by the typed `StashPaymentEvent` discriminated union.
- `StashEventMessage` (v1 type) — replaced by `PaymentSuccessEvent`, `PaymentFailureEvent`, `PaymentProcessingEvent`.

If you were importing these for switch-case logic, replace with:

```ts
import type { StashPaymentEvent } from '@stashgg/stash-pay';

function handle(e: StashPaymentEvent) {
  switch (e.type) {
    case 'success':    /* ... */ break;
    case 'failure':    /* ... */ break;
    case 'processing': /* ... */ break;
  }
}
```

## 7. Newly available props

None of these are required; defaults preserve v1 visuals.

- `position: 'bottom-sheet' | 'center-modal' | 'side-panel-right' | 'side-panel-left'`
- `height`, `zIndex`, `portalTarget`, `ariaLabel`
- `showCloseButton`, `showDragBar`
- `dismissOnBackdropClick`, `dismissOnEscape`
- `autoCloseOnSuccess`, `autoCloseOnFailure`
- `backdrop: { blur, color, opacity, hidden }`
- `theme: { ...CSS variable map }`
- `iframe: { sandbox, allow, title, referrerPolicy, loading, allowedOrigins }`
- `animationDuration`, `injectStyles`, `cspNonce`
- `onOpen`, `onClose`, `onReady`, `onError`, `onProcessing`

## 8. `'use client'`

The React entry is marked `'use client'`; the `@stashgg/stash-pay/vanilla` entry is not. If you're in a Next.js server component, import from the default entry (React wrapper) and it will work correctly.

## 9. Minimum React version

Peer range unchanged: `react ^18.0.0 || ^19.0.0`.

---

## Already on v2? Upgrading to 2.1.0

**2.1.0 is a non-breaking minor release — no code changes are required to upgrade.** It hardens the callback and URL handling:

- **Callbacks fire once.** `onSuccess` and `onFailure` are terminal — each fires at most once per checkout session. Duplicate or late payment events (the checkout can deliver over two channels) are now dropped.
- **`checkoutUrl` is validated.** An invalid URL — empty, unparseable, a non-`http(s)` scheme (`javascript:`/`data:` are rejected), or a host outside `allowedCheckoutHosts` — fires `onError` and the modal no longer opens, instead of leaving the checkout stuck on an endless loading spinner.
- **`onError` now receives a `StashPayError`** (still an `Error`) with a `code`: `INVALID_URL`, `DOMAIN_NOT_ALLOWED`, `NETWORK_ERROR`, `MOUNT_ERROR`, `UNKNOWN`. Existing `(e: Error) => …` handlers keep working — `StashPayError extends Error`.
- **New optional props:** `allowedCheckoutHosts` (host allowlist, `*.domain` wildcards) and `loadTimeout` (load-failure timeout in ms, default 20000, `0` disables).
- **`PaymentFailureEvent` gained an optional `orderId`.**
- **New exports:** `StashPayError` (class) and `StashPayErrorCode` (type) from the package root.

---

## Already on 2.1.x? Upgrading to 2.2.x

**2.2.x tightens pre-flight error handling for imperative `open()` callers.** React
`<StashPay>` users only need an `onError` handler if they do not already have one.

### What changed

In **2.1.0**, an invalid `checkoutUrl` fired `onError` but **`open()` still returned
a handle** (a controller with nothing mounted). Mount failures could throw a plain
`Error` without a stable `code`.

In **2.2.x**, pre-flight failures are consistent:

| | 2.1.0 | 2.2.x |
| --- | --- | --- |
| Invalid URL | `onError`, handle returned | `onError` **and throw**, **no handle** |
| Bad `container` / `portalTarget` | Often untyped throw | `onError` **and throw** `MOUNT_ERROR`, **no handle** |
| React `<StashPay>` | `onError` | `onError` (unchanged — no throw to your tree) |

### What you should do

**Vanilla ESM, UMD, or `useStashPay().open()`** — wrap `open()` in `try/catch`:

```diff
- const handle = open({ checkoutUrl, onSuccess });
+ try {
+   const handle = open({
+     checkoutUrl,
+     onSuccess,
+     onError: (e) => { /* optional — same error is also thrown */ },
+   });
+ } catch (e) {
+   if (e.code === 'INVALID_URL') { /* … */ }
+ }
```

Branch on **`e.code`**, not `instanceof StashPayError`.

**React `<StashPay>`** — add or keep `onError`; close the sheet when it fires:

```tsx
<StashPay
  isOpen={open}
  checkoutUrl={url}
  onError={(e) => {
    report(e);
    setOpen(false);
  }}
/>
```

**Do not use `onFailure` for pre-flight errors** — that callback is for payment
failures from the checkout page. Invalid URLs and mount errors use **`onError`**.

### Unchanged from 2.1.x

- `loadTimeout` is now **on by default** (20s) for slow or unreachable hosts (e.g. a
  valid-looking URL whose server never responds). Set `loadTimeout: 0` to restore the
  old behavior.
- `update()` with a new invalid `checkoutUrl` still emits `onError` only (does not throw).
