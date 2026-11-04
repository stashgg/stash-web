'use client';

import { useMemo, useState } from 'react';
import type { PlaygroundConfig } from '../_lib/defaults';

interface CodeSnippetProps {
  config: PlaygroundConfig;
  checkoutUrl: string;
}

type Tab = 'react' | 'vanilla';

/** Serialise a scalar/object as a JS literal. Keeps things simple — no cycles. */
function js(value: unknown, indent = 0): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => js(v, indent)).join(', ')}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (entries.length === 0) return '{}';
    const pad = '  '.repeat(indent + 1);
    const close = '  '.repeat(indent);
    return `{\n${entries
      .map(([k, v]) => `${pad}${identOrQuote(k)}: ${js(v, indent + 1)}`)
      .join(',\n')}\n${close}}`;
  }
  return String(value);
}

function identOrQuote(key: string): string {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

/** React JSX prop — scalar strings get quotes, numbers + objects use braces. */
function jsxProp(name: string, value: unknown): string {
  if (value === undefined) return '';
  if (typeof value === 'string') return `  ${name}="${value}"`;
  if (typeof value === 'boolean' && value === true) return `  ${name}`;
  if (typeof value === 'boolean') return `  ${name}={false}`;
  return `  ${name}={${js(value, 1)}}`;
}

/** Order props roughly by "importance" for readability. */
const PROP_ORDER: (keyof PlaygroundConfig)[] = [
  'checkoutTheme',
  'checkoutLocale',
  'position',
  'width',
  'height',
  'zIndex',
  'showCloseButton',
  'showDragBar',
  'dismissOnBackdropClick',
  'dismissOnEscape',
  'autoCloseOnSuccess',
  'autoCloseOnFailure',
  'animationDuration',
  'ariaLabel',
  'backdrop',
  'theme',
  'iframe',
  'allowedCheckoutHosts',
  'loadTimeout',
  'debug',
];

function buildReactSnippet(config: PlaygroundConfig, url: string): string {
  const urlExpr = url ? `"${url}"` : 'checkoutUrl';
  const lines: string[] = [
    `import { StashPay } from '@stashgg/stash-pay';`,
    `import '@stashgg/stash-pay/styles';`,
    ``,
    `<StashPay`,
    `  isOpen={isOpen}`,
    `  checkoutUrl={${urlExpr}}`,
  ];
  for (const key of PROP_ORDER) {
    const line = jsxProp(key, config[key]);
    if (line) lines.push(line);
  }
  lines.push(
    `  onSuccess={(e) => console.log('paid', e.orderId)}`,
    `  onFailure={(e) => console.log('failed', e.message)}`,
    `  onError={(e) => console.log(e.code, e.message)}`,
    `  onClose={() => setIsOpen(false)}`,
    `/>`,
  );
  return lines.join('\n');
}

function buildVanillaSnippet(config: PlaygroundConfig, url: string): string {
  const options: Record<string, unknown> = {
    checkoutUrl: url || 'https://checkout.stash.gg/pay/...',
  };
  for (const key of PROP_ORDER) {
    const v = config[key];
    if (v !== undefined) options[key] = v;
  }
  const lines: string[] = [
    `<script src="https://unpkg.com/@stashgg/stash-pay@2/dist/umd/stash-pay.umd.global.js"></script>`,
    `<script>`,
    `  const handle = StashPay.open(${js(options, 0)
      .split('\n')
      .map((l, i) => (i === 0 ? l : `  ${l}`))
      .join('\n')});`,
    ``,
    `  handle.on('success', (e) => console.log('paid', e.orderId));`,
    `  handle.on('failure', (e) => console.log('failed', e.message));`,
    `  handle.on('error', (e) => console.log(e.code, e.message));`,
    `  handle.on('close', () => console.log('closed'));`,
    `</script>`,
  ];
  return lines.join('\n');
}

export function CodeSnippet({ config, checkoutUrl }: CodeSnippetProps) {
  const [tab, setTab] = useState<Tab>('react');
  const [copied, setCopied] = useState(false);

  const react = useMemo(
    () => buildReactSnippet(config, checkoutUrl),
    [config, checkoutUrl],
  );
  const vanilla = useMemo(
    () => buildVanillaSnippet(config, checkoutUrl),
    [config, checkoutUrl],
  );

  const source = tab === 'react' ? react : vanilla;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="flex min-h-0 flex-col border-t border-stash-border bg-stash-bg">
      <div className="flex items-center justify-between gap-2 border-b border-stash-border px-6 py-3">
        <div className="flex items-center gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-stash-text-soft">
            Snippet
          </h2>
          <div className="flex gap-1 rounded-full border border-stash-border bg-stash-paper p-0.5">
            <TabButton active={tab === 'react'} onClick={() => setTab('react')}>
              React
            </TabButton>
            <TabButton
              active={tab === 'vanilla'}
              onClick={() => setTab('vanilla')}
            >
              Script tag
            </TabButton>
          </div>
        </div>
        <button
          onClick={copy}
          className="text-[12px] text-stash-text-soft underline decoration-stash-border underline-offset-4 transition hover:text-stash-text hover:decoration-stash-text-muted"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-stash-paper">
        <pre className="px-6 py-4 font-mono text-[12px] leading-relaxed text-stash-text">
          <code>{source}</code>
        </pre>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-[12px] font-medium transition ${
        active
          ? 'bg-stash-text text-white'
          : 'text-stash-text-muted hover:text-stash-text'
      }`}
    >
      {children}
    </button>
  );
}
