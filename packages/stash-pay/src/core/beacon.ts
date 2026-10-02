/**
 * Error beacon: fire-and-forget diagnostics to Stash when the checkout fails
 * to open on a partner page. Without it, those failures are invisible to
 * Stash until a partner reports them.
 *
 * Deliberately conservative: it never throws, sends at most
 * MAX_BEACONS_PER_CONTROLLER events per controller, and silently skips when
 * the checkout host is unknown or the URL carries no link id.
 */

import type { StashPayError } from './errors';

/** Checkout host -> telemetry API base. Unknown hosts send no beacon. */
const API_BASE_BY_CHECKOUT_HOST: Record<string, string> = {
  'checkout.stash.gg': 'https://api.stash.gg',
  'checkout.stashstaging.com': 'https://test-api.stashstaging.com',
  'checkout.stag.stash.gg': 'https://test-api.stashstaging.com',
};

const LINK_ID_PATH = /^\/(?:pay|order|checkout|subscription)\/([^/?#]+)/;

const EVENT_NAME_BY_CODE: Partial<Record<StashPayError['code'], string>> = {
  NETWORK_ERROR: 'SDK_IFRAME_ERROR',
  MOUNT_ERROR: 'SDK_MOUNT_ERROR',
  INVALID_URL: 'SDK_INVALID_URL',
  DOMAIN_NOT_ALLOWED: 'SDK_INVALID_URL',
};

export const MAX_BEACONS_PER_CONTROLLER = 5;

/** Resolve the beacon endpoint and link id, or null when not beaconable. */
export function resolveBeaconTarget(
  checkoutUrl: string | undefined,
): { endpoint: string; linkId: string } | null {
  if (!checkoutUrl) return null;
  try {
    const url = new URL(checkoutUrl);
    const apiBase = API_BASE_BY_CHECKOUT_HOST[url.host];
    if (!apiBase) return null;
    const linkId = LINK_ID_PATH.exec(url.pathname)?.[1];
    if (!linkId) return null;
    return { endpoint: `${apiBase}/api/checkout_links/telemetry`, linkId };
  } catch {
    return null;
  }
}

/**
 * Send one error event. Returns true when a send was attempted. Uses
 * `sendBeacon` so the event survives page unloads, falling back to a
 * keepalive fetch.
 */
export function sendErrorBeacon(
  checkoutUrl: string | undefined,
  error: StashPayError,
  sdkVersion: string,
): boolean {
  const name =
    error.code === 'NETWORK_ERROR' &&
    (error.details as { timeoutMs?: number } | undefined)?.timeoutMs
      ? 'SDK_LOAD_TIMEOUT'
      : EVENT_NAME_BY_CODE[error.code];
  if (!name) return false;

  const target = resolveBeaconTarget(checkoutUrl);
  if (!target) return false;

  const payload = JSON.stringify({
    checkout_link_id: target.linkId,
    events: [
      {
        name,
        timestamp: new Date().toISOString(),
        params: {
          code: error.code,
          message: String(error.message).slice(0, 300),
          checkout_url: checkoutUrl,
          sdk_version: sdkVersion,
        },
      },
    ],
  });

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(target.endpoint, blob)) return true;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch(target.endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
