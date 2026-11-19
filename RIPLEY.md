---
standard-version: 1.6.1
---

Stash Pay is a browser checkout SDK with React, vanilla, and UMD entry points. The
in-repo migration record shows that duplicate terminal events and invalid checkout
URLs have already needed hardening. Post a finding only when a proposed change can
name a concrete way it breaks the checkout, its public SDK contract, or the sample
proxy; otherwise stay silent.

## What NOT to flag

Defer formatting, TypeScript diagnostics, and sample-app lint concerns to the
configured TypeScript and ESLint tooling in `packages/stash-pay/tsconfig.json` and
`sample/eslint.config.mjs`. Do not request blanket coverage, a test framework,
table-driven tests, or tests for presentation-only playground/CSS changes: the
only harness is the SDK's small Vitest suite (`npm test --workspace=@stashgg/stash-pay`). Do not comment on Tailwind/class ordering or visual
taste. The documented `allowedCheckoutHosts`, `iframe.allowedOrigins`, `loadTimeout`,
and `debug` settings are opt-in consumer choices, so do not demand that every host
enable them without a concrete integration failure.

## 1. external-shape-validation (A2)

Keep untrusted checkout data narrowed before it is used as a typed value. In
`packages/stash-pay/src/core/events.ts`, `parseMessage`,
`parseStashSdkEnvelope`, `parseLegacyEnvelope`, and `buildEvent` first recognize
an object envelope and narrow event fields; preserve that sequence when extending
the payment protocol. In the sample boundary, make `POST` in
`sample/app/api/checkout/route.ts` validate the parsed request's top-level and
optional `item`/`user` record shapes before merging them into `DEFAULT_PAYLOAD`,
just as `handleGenerateSampleCheckout` in `sample/app/page.tsx` validates the
returned `url` before using it.

**Failure:** A syntactically valid but wrong-shaped message or JSON request is treated as a checkout event or dereferenced while building the Stash request, producing a bogus callback, malformed purchase request, or server error.

## 2. terminal-event-idempotency (A3)

Route every success or failure through `StashPayController.dispatchPaymentEvent` in
`packages/stash-pay/src/core/controller.ts` and retain its session-scoped
`_settled` latch. The bridge installed by `installBridge` in
`packages/stash-pay/src/core/bridge.ts` and the `postMessage` parser in
`packages/stash-pay/src/core/events.ts` are alternate delivery channels; reset the
latch only in `setIframeSrc` when a new checkout document starts.

**Failure:** A duplicate or late terminal event invokes a host success or failure callback twice, allowing the host to double-process a payment outcome.

## 3. payment-event-exhaustiveness (B2)

When adding or changing a `StashPaymentEvent` variant in
`packages/stash-pay/src/core/types.ts`, update every discriminating switch:
`legacyKindToMethod` and `buildEvent` in `packages/stash-pay/src/core/events.ts`,
and `StashPayController.dispatchPaymentEvent` in
`packages/stash-pay/src/core/controller.ts`. Keep the existing explicit union and
case-based handling rather than adding a catch-all that hides an unhandled payment
state.

**Failure:** A new payment variant falls through an incomplete mapping or dispatch switch and is silently lost instead of reaching the host with defined semantics.

## 4. dom-selector-sync (B3)

Treat the DOM names and state values in `DATA_ATTR` and `CLASS` from
`packages/stash-pay/src/core/constants.ts` as a protocol with the markup emitted by
`buildTree` and `applyOptionsToDom` in `packages/stash-pay/src/core/dom.ts` and the
selectors in `packages/stash-pay/src/styles/stash-pay.css`. Change all participants
together whenever adding or renaming a class, data attribute, checkout state, or
position.

**Failure:** A DOM/CSS selector mismatch leaves the checkout hidden, permanently loading, or without the intended position and close transition.

## 5. iframe-payment-policy (B3)

Keep the iframe `allow` delegation in `DEFAULT_ALLOW` in
`packages/stash-pay/src/core/constants.ts` and `buildIframe` in
`packages/stash-pay/src/core/dom.ts` aligned with the host
`Permissions-Policy` header returned by `headers` in `sample/next.config.ts`.
The sample configuration documents that `allow="payment"` delegates a permission
but does not grant it at the host-document level.

**Failure:** The checkout iframe is delegated the payment feature but the host policy does not grant it, preventing Payment Request or Apple Pay from initializing.

## 6. react-option-sync (B3)

When exposing a core `StashPayOptions` setting from
`packages/stash-pay/src/core/types.ts` through React, keep the corresponding
`StashPayProps` declaration, `buildOptions` mapping, and `DOM_OPTION_KEYS` update
list in `packages/stash-pay/src/react/StashPay.tsx` synchronized. Update the
documented option contract in `packages/stash-pay/README.md` when the setting is
public.

**Failure:** A React consumer can pass a supported option that is dropped at mount or whose later prop changes never reach the controller.

## 7. checkout-event-contract (B4)

For any checkout event name, envelope, payload field, or callback-semantics change,
trace the full public path: the same-origin bridge in
`packages/stash-pay/src/core/bridge.ts`, both `stash_sdk` and legacy envelopes in
`packages/stash-pay/src/core/events.ts`, the typed event in
`packages/stash-pay/src/core/types.ts`, controller dispatch in
`packages/stash-pay/src/core/controller.ts`, package exports in
`packages/stash-pay/src/index.ts`, and the callback/bridge documentation in
`packages/stash-pay/README.md`. Preserve the documented distinction between
payment outcomes and SDK/pre-flight errors.

**Failure:** A checkout event is dropped or misclassified on one delivery path, or SDK consumers receive a callback shape or error category different from the published contract.

## 8. sample-checkout-contract (B4)

When changing the playground checkout request or response, trace it from
`handleGenerateSampleCheckout` in `sample/app/page.tsx` through `POST` and
`DEFAULT_PAYLOAD` in `sample/app/api/checkout/route.ts` to `STASH_API_URL`. Keep
the client response guard and the proxy's default item/user fields consistent with
the Stash API payload it sends.

**Failure:** A proxy contract change leaves the playground expecting a missing response field or sends the Stash API a different checkout payload than the UI represents.

## 9. debug-observability (C3)

Keep checkout lifecycle tracing opt-in through `debugLog` in
`packages/stash-pay/src/core/debug.ts` and the `debug` option used by
`StashPayController` in `packages/stash-pay/src/core/controller.ts`. Do not move
checkout URLs, raw payment-event payloads, or error details into unconditional or
production-visible logs; `packages/stash-pay/README.md` documents that debug traces
include the iframe source.

**Failure:** A checkout URL, raw payment payload, or sensitive error detail becomes observable in end-user or production logs by default.

## 10. sample-api-key-scope (C3)

Keep `STASH_API_KEY` confined to the server-side Stash request in `POST` within
`sample/app/api/checkout/route.ts`, where it is sent as `X-Stash-Api-Key`. Do not
pass it to `sample/app/page.tsx`, client props, generated snippets, or a response;
the local-only configuration documented in `README.md` and `sample/README.md` is
for the playground proxy, not a browser credential.

**Failure:** A server API credential is used outside the proxy's trusted request scope, letting an untrusted browser caller obtain or misuse the sample account's Stash capability.

## 11. amount-wire-format (D1)

Keep the sample's Stash checkout amount at its server API boundary: the fixed
`DEFAULT_PAYLOAD` in `sample/app/api/checkout/route.ts` supplies the ISO currency
and string `item.pricePerItem`. Do not introduce browser-side price arithmetic or
replace the API's string amount representation with floating-point calculations
when modifying the sample purchase payload.

**Failure:** Floating-point or client-side amount handling encodes a different purchase price than the checkout API receives.
