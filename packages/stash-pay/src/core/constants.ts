/**
 * Internal constants — data attributes, CSS class names, message prefixes.
 * Centralised so CSS selectors and TS code can't drift apart.
 */

export const MESSAGE_PREFIX = 'STASH_WINDOW_EVENT__';

export const DATA_ATTR = {
  root: 'data-stash-pay-root',
  position: 'data-stash-pay-position',
  state: 'data-stash-pay-state',
  loading: 'data-stash-pay-loading',
  active: 'stashPayActive', // dataset key on container
} as const;

export const CLASS = {
  root: 'stash-pay',
  backdrop: 'stash-pay__backdrop',
  card: 'stash-pay__card',
  dragBar: 'stash-pay__drag-bar',
  dragBarIndicator: 'stash-pay__drag-bar-indicator',
  closeButton: 'stash-pay__close',
  loading: 'stash-pay__loading',
  spinner: 'stash-pay__spinner',
  iframeWrap: 'stash-pay__iframe-wrap',
  iframe: 'stash-pay__iframe',
} as const;

export const DEFAULT_SANDBOX =
  'allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox';

export const DEFAULT_ALLOW = 'payment';
export const DEFAULT_TITLE = 'Stash Pay checkout';
export const DEFAULT_ARIA_LABEL = 'Stash Pay checkout';
export const DEFAULT_ANIMATION_DURATION_MS = 300;

// Load-failure timeout. Generous on purpose: slow mobile networks must not
// produce false NETWORK_ERRORs. 0 opts out.
export const DEFAULT_LOAD_TIMEOUT_MS = 20000;

export const STYLE_TAG_ID = 'stash-pay-styles';
