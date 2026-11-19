import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { StashPayController } from './controller';
import type { StashPayOptions } from './types';

const CHECKOUT_URL = 'https://checkout.example.test/subscription/abc';
const CHECKOUT_ORIGIN = 'https://checkout.example.test';
const READY = { source: 'stash_sdk', method: 'onCheckoutReady' };

function mount(options: Partial<StashPayOptions> = {}) {
  const callbacks = {
    onReady: vi.fn(),
    onError: vi.fn(),
    onSuccess: vi.fn(),
    onFailure: vi.fn(),
    onProcessing: vi.fn(),
  };
  const controller = new StashPayController({
    checkoutUrl: CHECKOUT_URL,
    ...callbacks,
    ...options,
  });
  controller.mount();
  vi.advanceTimersByTime(50);
  const root = document.querySelector<HTMLElement>('[data-stash-pay-root]');
  const iframe = root?.querySelector('iframe');
  if (!root || !iframe) throw new Error('controller did not mount');
  const loading = () => root.getAttribute('data-stash-pay-loading');
  const post = (
    data: unknown,
    init: { origin?: string; source?: Window | null } = {},
  ) => {
    window.dispatchEvent(
      new MessageEvent('message', {
        data,
        origin: init.origin ?? CHECKOUT_ORIGIN,
        source: init.source === undefined ? iframe.contentWindow : init.source,
      }),
    );
  };
  const load = () => iframe.dispatchEvent(new Event('load'));
  return { controller, callbacks, iframe, loading, post, load };
}

describe('checkout-ready envelope', () => {
  let active: StashPayController | null = null;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    active?.destroy();
    active = null;
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('hides the overlay and settles the watchdog without firing a callback', () => {
    const m = mount({ loadTimeout: 1000 });
    active = m.controller;
    expect(m.loading()).toBe('true');

    m.post(READY);

    expect(m.loading()).toBe('false');
    vi.advanceTimersByTime(5000);
    expect(m.callbacks.onError).not.toHaveBeenCalled();
    expect(m.callbacks.onReady).not.toHaveBeenCalled();
    expect(m.callbacks.onSuccess).not.toHaveBeenCalled();
    expect(m.callbacks.onFailure).not.toHaveBeenCalled();
    expect(m.callbacks.onProcessing).not.toHaveBeenCalled();
    expect(m.controller.isReady).toBe(false);
  });

  it('still fires onReady once and installs the bridge on the later load', () => {
    const m = mount();
    active = m.controller;

    m.post(READY);
    m.post(READY);
    m.load();
    m.load();

    expect(m.callbacks.onReady).toHaveBeenCalledTimes(1);
    expect(m.controller.isReady).toBe(true);
    expect(
      (m.iframe.contentWindow as unknown as { stash_sdk?: unknown }).stash_sdk,
    ).toBeDefined();
  });

  it('clears the overlay on load when the checkout never sends it', () => {
    const m = mount();
    active = m.controller;

    m.load();

    expect(m.loading()).toBe('false');
    expect(m.callbacks.onReady).toHaveBeenCalledTimes(1);
  });

  it('ignores the envelope from another window', () => {
    const m = mount({ loadTimeout: 1000 });
    active = m.controller;

    m.post(READY, { source: window });
    m.post(READY, { source: null });

    expect(m.loading()).toBe('true');
    vi.advanceTimersByTime(1000);
    expect(m.callbacks.onError).toHaveBeenCalledTimes(1);
    expect(m.callbacks.onError.mock.calls[0]?.[0]?.code).toBe('NETWORK_ERROR');
  });

  it('ignores the envelope from another origin', () => {
    const m = mount();
    active = m.controller;

    m.post(READY, { origin: 'https://evil.example.test' });

    expect(m.loading()).toBe('true');
  });

  it('honors iframe.allowedOrigins', () => {
    const m = mount({
      iframe: { allowedOrigins: ['https://other.example.test'] },
    });
    active = m.controller;

    m.post(READY);

    expect(m.loading()).toBe('true');
  });

  it('ignores the previous checkout origin after the URL changes', () => {
    const m = mount();
    active = m.controller;
    m.post(READY);
    expect(m.loading()).toBe('false');

    m.controller.update({
      checkoutUrl: 'https://checkout2.example.test/pay/xyz',
    });
    expect(m.loading()).toBe('true');

    m.post(READY);
    expect(m.loading()).toBe('true');

    m.post(READY, { origin: 'https://checkout2.example.test' });
    expect(m.loading()).toBe('false');
  });

  it('does not treat other stash_sdk methods as ready', () => {
    const m = mount();
    active = m.controller;

    m.post({ source: 'stash_sdk', method: 'onCheckoutLoaded' });
    m.post({ source: 'stash_sdk' });
    m.post('onCheckoutReady');

    expect(m.loading()).toBe('true');
  });

  it('keeps settling the overlay on a pre-load payment envelope', () => {
    const m = mount({ loadTimeout: 1000, autoCloseOnSuccess: false });
    active = m.controller;

    m.post({
      source: 'stash_sdk',
      method: 'onPaymentSuccess',
      payload: { orderId: 'o1' },
    });

    expect(m.loading()).toBe('false');
    expect(m.callbacks.onSuccess).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(5000);
    expect(m.callbacks.onError).not.toHaveBeenCalled();
  });
});
