/**
 * Public type surface of the Stash Pay SDK.
 * Stable contract — anything exported here is part of the semver API.
 */

export type { StashPayErrorCode } from "./errors";
export { StashPayError } from "./errors";
import type { StashPayError } from "./errors";

export type StashPayPosition =
  | "bottom-sheet"
  | "center-modal"
  | "side-panel-right"
  | "side-panel-left";

/**
 * Forwarded to the checkout page as a `?theme=` query parameter so the
 * checkout UI renders in the matching colour scheme. Affects the iframe
 * content only; for the surrounding card styling use the `theme` option.
 */
export type StashCheckoutTheme = "light" | "dark";

export type StashPayState =
  | "idle"
  | "opening"
  | "open"
  | "closing"
  | "closed"
  | "destroyed";

export interface StashPayBackdropOptions {
  /** Blur in pixels (number) or any CSS length. Set 0/`'0'` to disable. */
  blur?: number | string;
  /** Any CSS color. */
  color?: string;
  /** 0..1. Multiplied on top of `color`'s alpha. */
  opacity?: number;
  /** Hide the backdrop entirely. */
  hidden?: boolean;
}

export interface StashPayIframeOptions {
  /** Overrides the default sandbox attribute. */
  sandbox?: string;
  /** `allow` attribute. Default: `'payment'`. */
  allow?: string;
  /** Accessible title. */
  title?: string;
  referrerPolicy?: ReferrerPolicy;
  loading?: "eager" | "lazy";
  /**
   * If set, only postMessages whose `event.origin` matches one of these values
   * are processed. Leave undefined for permissive (v1-compatible) behavior.
   */
  allowedOrigins?: string[];
}

export interface StashPayTheme {
  // Colors
  colorBackground?: string;
  colorBackdrop?: string;
  colorText?: string;
  colorAccent?: string;
  colorCloseButtonBg?: string;
  colorCloseButtonBgHover?: string;
  colorCloseButtonFg?: string;
  colorCloseButtonFgHover?: string;
  colorSpinnerTrack?: string;
  colorSpinnerHead?: string;
  colorDragBar?: string;
  colorShadow?: string;

  // Geometry
  radius?: string;
  sheetMaxWidth?: string;
  modalMaxWidth?: string;
  sidePanelWidth?: string;

  // Motion
  animationDuration?: number | string;
  animationEasing?: string;

  // Layering
  zIndex?: number | string;
}

export interface PaymentSuccessEvent {
  type: "success";
  orderId?: string;
  raw: Record<string, unknown>;
}

export interface PaymentFailureEvent {
  type: "failure";
  /** Present when the checkout reached an order-bound state before failing. */
  orderId?: string;
  errorCode?: string;
  message?: string;
  raw: Record<string, unknown>;
}

export interface PaymentProcessingEvent {
  type: "processing";
  raw: Record<string, unknown>;
}

export type StashPaymentEvent =
  | PaymentSuccessEvent
  | PaymentFailureEvent
  | PaymentProcessingEvent;

/**
 * Full option set — used by both the vanilla controller and the React wrapper.
 * React wrapper additionally takes `isOpen: boolean` and `portalTarget`.
 */
export interface StashPayOptions {
  /** Checkout URL returned by Stash Pay API. */
  checkoutUrl: string;
  /**
   * Colour scheme forwarded to the checkout page as `?theme=light|dark`.
   * Leave undefined to let the checkout pick its own default.
   */
  checkoutTheme?: StashCheckoutTheme;
  /**
   * UI language forwarded to the checkout page as `?locale=` (BCP-47 or bare
   * language code, e.g. `fr-FR` or `fr`). Independent of Server SDK `regionCode`,
   * which controls pricing and tax. Leave undefined to let checkout resolve
   * language from the browser's Accept-Language header.
   */
  checkoutLocale?: string;

  // Layout
  position?: StashPayPosition;
  width?: string | number;
  height?: string | number;
  /** Portal root. Defaults to `document.body`. */
  container?: HTMLElement;
  zIndex?: number;

  // Chrome
  showCloseButton?: boolean;
  showDragBar?: boolean;

  // Dismiss
  dismissOnBackdropClick?: boolean;
  dismissOnEscape?: boolean;

  // Auto-close (fires callback first, then closes if enabled)
  autoCloseOnSuccess?: boolean;
  autoCloseOnFailure?: boolean;

  // Styling
  backdrop?: StashPayBackdropOptions;
  theme?: StashPayTheme;
  /** Inject stylesheet at runtime. Default: `false` in ESM, `true` in UMD. */
  injectStyles?: boolean;
  /** Applied to the runtime-injected `<style>` for strict CSP. */
  cspNonce?: string;
  ariaLabel?: string;

  // Iframe
  iframe?: StashPayIframeOptions;

  // Motion (ms) — overrides `theme.animationDuration`.
  animationDuration?: number;

  /**
   * Allowlist of hostnames `checkoutUrl` may use. Entries may be exact hosts
   * (`'checkout.stash.gg'`) or `'*.domain'` wildcards (matching the apex and any
   * subdomain). Undefined or empty = any valid http(s) URL is accepted. A URL
   * whose host is not allowed fires `onError` with code `DOMAIN_NOT_ALLOWED`.
   */
  allowedCheckoutHosts?: string[];

  /**
   * Milliseconds to wait for the checkout iframe's first load before firing
   * `onError` with code `NETWORK_ERROR`. Default: 20000. Set `0` to disable.
   */
  loadTimeout?: number;

  /**
   * Send a fire-and-forget diagnostic to Stash when the checkout fails to
   * open (load timeout, iframe error, mount failure), so Stash can detect
   * integration breakage without a partner report. Carries only the checkout
   * URL and the error code/message. Default: `true`;
   * `false` disables.
   */
  errorBeacon?: boolean;

  /**
   * When `true`, the SDK prints lifecycle and callback traces via `console.log`.
   * Default: `false`.
   */
  debug?: boolean;

  // Callbacks
  onOpen?: () => void;
  onClose?: () => void;
  onReady?: () => void;
  onError?: (e: StashPayError) => void;
  onSuccess?: (e: PaymentSuccessEvent) => void;
  onFailure?: (e: PaymentFailureEvent) => void;
  onProcessing?: (e: PaymentProcessingEvent) => void;
}

/**
 * Internal event map used by the typed emitter (handle.on / handle.off).
 * Independent of the `on*` callback options so both surfaces can coexist.
 */
export interface StashPayEventMap {
  open: () => void;
  close: () => void;
  ready: () => void;
  error: (err: StashPayError) => void;
  success: (e: PaymentSuccessEvent) => void;
  failure: (e: PaymentFailureEvent) => void;
  processing: (e: PaymentProcessingEvent) => void;
}

export interface StashPayHandle {
  close(): void;
  update(partial: Partial<StashPayOptions>): void;
  on<K extends keyof StashPayEventMap>(
    event: K,
    handler: StashPayEventMap[K],
  ): () => void;
  off<K extends keyof StashPayEventMap>(
    event: K,
    handler: StashPayEventMap[K],
  ): void;
  destroy(): void;
}
