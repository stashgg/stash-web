"use client";

import { useState } from "react";
import type { StashCheckoutTheme, StashPayPosition } from "@stashgg/stash-pay";
import type { PlaygroundConfig } from "../_lib/defaults";

interface ControlPanelProps {
  config: PlaygroundConfig;
  update: (patch: Partial<PlaygroundConfig>) => void;
  updateBackdrop: (
    patch: Partial<NonNullable<PlaygroundConfig["backdrop"]>>,
  ) => void;
  updateTheme: (patch: Partial<NonNullable<PlaygroundConfig["theme"]>>) => void;
  updateIframe: (
    patch: Partial<NonNullable<PlaygroundConfig["iframe"]>>,
  ) => void;
  customCss: string;
  onCustomCssChange: (next: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onCopyConfig: () => void;
  isOpen: boolean;
  canOpen: boolean;
  url: string;
  onUrlChange: (next: string) => void;
  onGenerateSampleCheckout: () => void | Promise<void>;
  isGeneratingSampleCheckout: boolean;
}

const POSITIONS: { value: StashPayPosition; label: string }[] = [
  { value: "bottom-sheet", label: "Bottom" },
  { value: "center-modal", label: "Center" },
  { value: "side-panel-right", label: "Right" },
  { value: "side-panel-left", label: "Left" },
];

const CHECKOUT_THEMES: {
  value: StashCheckoutTheme | undefined;
  label: string;
}[] = [
  { value: undefined, label: "Auto" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

const CHECKOUT_LOCALE_PRESETS: {
  value: string | undefined;
  label: string;
}[] = [
  { value: undefined, label: "Auto" },
  { value: "en-US", label: "en-US" },
  { value: "fr-FR", label: "fr-FR" },
  { value: "de-DE", label: "de-DE" },
  { value: "ja-JP", label: "ja-JP" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-t border-stash-border pt-5 first:border-t-0 first:pt-0">
      <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-stash-text-soft">
        {title}
      </h2>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-[13px] text-stash-text-muted">
      <span className="shrink-0 font-medium">{label}</span>
      <span className="flex-1 text-right">{children}</span>
    </label>
  );
}

const input =
  "h-9 w-full rounded border border-stash-border bg-stash-paper px-3 text-[13px] text-stash-text outline-none transition placeholder:text-stash-text-soft/60 focus:border-stash-text/30";

const textarea =
  "w-full rounded border border-stash-border bg-stash-paper p-3 font-mono text-[12px] leading-relaxed text-stash-text outline-none transition placeholder:text-stash-text-soft/60 focus:border-stash-text/30";

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-stash-text transition ${
        checked ? "stash-accent-gradient" : "bg-stash-paper"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-stash-text transition-transform ${
          checked ? "translate-x-[22px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

export function ControlPanel({
  config,
  update,
  updateBackdrop,
  updateTheme,
  updateIframe,
  customCss,
  onCustomCssChange,
  onOpen,
  onClose,
  onCopyConfig,
  isOpen,
  canOpen,
  url,
  onUrlChange,
  onGenerateSampleCheckout,
  isGeneratingSampleCheckout,
}: ControlPanelProps) {
  const [cssCopied, setCssCopied] = useState(false);

  const copyCss = () => {
    navigator.clipboard
      .writeText(customCss)
      .then(() => {
        setCssCopied(true);
        setTimeout(() => setCssCopied(false), 1200);
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-5">
      {/* Checkout URL */}
      <Section title="Checkout URL">
        <input
          className={input}
          placeholder="https://checkout.stash.gg/pay/..."
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && canOpen) onOpen();
          }}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => void onGenerateSampleCheckout()}
          disabled={isGeneratingSampleCheckout}
          className="h-10 w-full rounded-full border border-stash-border-strong bg-stash-paper text-[13px] font-semibold text-stash-text transition hover:bg-white disabled:cursor-not-allowed disabled:border-stash-border disabled:text-stash-text-soft"
        >
          {isGeneratingSampleCheckout
            ? "Generating…"
            : "Generate Sample Checkout"}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onOpen}
            disabled={!canOpen}
            className="h-10 rounded-full border border-stash-border-strong bg-white text-[13px] font-semibold text-stash-text transition hover:bg-stash-paper disabled:cursor-not-allowed disabled:border-stash-border disabled:bg-stash-paper disabled:text-stash-text-soft"
          >
            {isOpen ? "Re-open" : "Open"}
          </button>
          <button
            onClick={onClose}
            disabled={!isOpen}
            className="h-10 rounded-full border border-stash-border bg-transparent text-[13px] font-semibold text-stash-text-muted transition hover:border-stash-border-strong disabled:cursor-not-allowed disabled:text-stash-text-soft/50"
          >
            Close
          </button>
        </div>
        <div className="pt-0.5">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-stash-text-soft">
            Checkout page theme
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {CHECKOUT_THEMES.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => update({ checkoutTheme: t.value })}
                className={`h-9 rounded-full border text-[12px] font-medium transition ${
                  config.checkoutTheme === t.value
                    ? "border-stash-text bg-stash-text text-white"
                    : "border-stash-border bg-stash-paper text-stash-text-muted hover:border-stash-border-strong"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="pt-0.5">
          <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.06em] text-stash-text-soft">
            Checkout locale
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {CHECKOUT_LOCALE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => update({ checkoutLocale: preset.value })}
                className={`h-9 rounded-full border text-[12px] font-medium transition ${
                  config.checkoutLocale === preset.value
                    ? "border-stash-text bg-stash-text text-white"
                    : "border-stash-border bg-stash-paper text-stash-text-muted hover:border-stash-border-strong"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <input
            className={input + " mt-2"}
            placeholder="Custom locale (e.g. es-MX)"
            value={config.checkoutLocale ?? ""}
            onChange={(e) =>
              update({ checkoutLocale: e.target.value.trim() || undefined })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onCopyConfig}
            className="text-[12px] text-stash-text-soft underline decoration-stash-border underline-offset-4 transition hover:text-stash-text hover:decoration-stash-text-muted"
          >
            Copy config JSON →
          </button>
          <button
            type="button"
            onClick={() => onUrlChange("not-a-valid-url")}
            className="text-[12px] text-stash-text-soft underline decoration-stash-border underline-offset-4 transition hover:text-stash-text hover:decoration-stash-text-muted"
          >
            Try an invalid URL →
          </button>
        </div>
      </Section>

      {/* Position */}
      <Section title="Position">
        <div className="grid grid-cols-4 gap-1.5">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => update({ position: p.value })}
              className={`h-9 rounded-full border text-[12px] font-medium transition ${
                config.position === p.value
                  ? "border-stash-text bg-stash-text text-white"
                  : "border-stash-border bg-stash-paper text-stash-text-muted hover:border-stash-border-strong"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Dimensions */}
      <Section title="Dimensions">
        <Row label="Width">
          <input
            className={input}
            placeholder="500px"
            value={typeof config.width === "string" ? config.width : ""}
            onChange={(e) => update({ width: e.target.value || undefined })}
          />
        </Row>
        <Row label="Height">
          <input
            className={input}
            placeholder="80vh"
            value={typeof config.height === "string" ? config.height : ""}
            onChange={(e) => update({ height: e.target.value || undefined })}
          />
        </Row>
        <Row label="z-index">
          <input
            className={input + " text-right"}
            type="number"
            placeholder="auto"
            value={config.zIndex ?? ""}
            onChange={(e) =>
              update({
                zIndex: e.target.value ? Number(e.target.value) : undefined,
              })
            }
          />
        </Row>
      </Section>

      {/* Dismiss */}
      <Section title="Dismiss">
        <Row label="Backdrop click">
          <Toggle
            checked={config.dismissOnBackdropClick ?? true}
            onChange={(v) => update({ dismissOnBackdropClick: v })}
          />
        </Row>
        <Row label="Escape key">
          <Toggle
            checked={config.dismissOnEscape ?? true}
            onChange={(v) => update({ dismissOnEscape: v })}
          />
        </Row>
        <Row label="Close on success">
          <Toggle
            checked={config.autoCloseOnSuccess ?? true}
            onChange={(v) => update({ autoCloseOnSuccess: v })}
          />
        </Row>
        <Row label="Close on failure">
          <Toggle
            checked={config.autoCloseOnFailure ?? true}
            onChange={(v) => update({ autoCloseOnFailure: v })}
          />
        </Row>
      </Section>

      {/* Chrome */}
      <Section title="Chrome">
        <Row label="Close button">
          <Toggle
            checked={config.showCloseButton ?? true}
            onChange={(v) => update({ showCloseButton: v })}
          />
        </Row>
        <Row label="Drag bar">
          <Toggle
            checked={
              config.showDragBar ??
              (config.position === "bottom-sheet" ||
                config.position === undefined)
            }
            onChange={(v) => update({ showDragBar: v })}
          />
        </Row>
      </Section>

      {/* Backdrop */}
      <Section title="Backdrop">
        <Row label="Hidden">
          <Toggle
            checked={config.backdrop?.hidden ?? false}
            onChange={(v) => updateBackdrop({ hidden: v })}
          />
        </Row>
        <Row label="Color">
          <input
            type="text"
            placeholder="rgba(0,0,0,0.4)"
            className={input}
            value={config.backdrop?.color ?? ""}
            onChange={(e) =>
              updateBackdrop({ color: e.target.value || undefined })
            }
          />
        </Row>
        <Row label={`Opacity (${config.backdrop?.opacity ?? 1})`}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={config.backdrop?.opacity ?? 1}
            onChange={(e) =>
              updateBackdrop({ opacity: Number(e.target.value) })
            }
            className="w-full accent-stash-text"
          />
        </Row>
        <Row
          label={`Blur (${
            typeof config.backdrop?.blur === "number"
              ? `${config.backdrop.blur}px`
              : (config.backdrop?.blur ?? "4px")
          })`}
        >
          <input
            type="range"
            min="0"
            max="20"
            step="1"
            value={
              typeof config.backdrop?.blur === "number"
                ? config.backdrop.blur
                : 4
            }
            onChange={(e) => updateBackdrop({ blur: Number(e.target.value) })}
            className="w-full accent-stash-text"
          />
        </Row>
      </Section>

      {/* Theme */}
      <Section title="Theme">
        <Row label="Background">
          <input
            type="text"
            placeholder="#000000"
            className={input}
            value={config.theme?.colorBackground ?? ""}
            onChange={(e) =>
              updateTheme({ colorBackground: e.target.value || undefined })
            }
          />
        </Row>
        <Row label="Accent">
          <input
            type="text"
            placeholder="#4f46e5"
            className={input}
            value={config.theme?.colorAccent ?? ""}
            onChange={(e) =>
              updateTheme({ colorAccent: e.target.value || undefined })
            }
          />
        </Row>
        <Row label="Radius">
          <input
            type="text"
            placeholder="1.5rem"
            className={input}
            value={config.theme?.radius ?? ""}
            onChange={(e) =>
              updateTheme({ radius: e.target.value || undefined })
            }
          />
        </Row>
        <Row label={`Animation (${config.animationDuration ?? 300}ms)`}>
          <input
            type="range"
            min="0"
            max="1000"
            step="25"
            value={config.animationDuration ?? 300}
            onChange={(e) =>
              update({ animationDuration: Number(e.target.value) })
            }
            className="w-full accent-stash-text"
          />
        </Row>
      </Section>

      {/* Iframe */}
      <Section title="Iframe">
        <Row label="Title">
          <input
            type="text"
            className={input}
            value={config.iframe?.title ?? ""}
            onChange={(e) =>
              updateIframe({ title: e.target.value || undefined })
            }
          />
        </Row>
        <Row label="sandbox">
          <input
            type="text"
            className={input}
            placeholder="allow-forms allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            value={config.iframe?.sandbox ?? ""}
            onChange={(e) =>
              updateIframe({ sandbox: e.target.value || undefined })
            }
          />
        </Row>
        <Row label="allow">
          <input
            type="text"
            className={input}
            placeholder="payment"
            value={config.iframe?.allow ?? ""}
            onChange={(e) =>
              updateIframe({ allow: e.target.value || undefined })
            }
          />
        </Row>
        <Row label="referrerPolicy">
          <input
            type="text"
            className={input}
            placeholder="e.g. no-referrer, origin"
            value={config.iframe?.referrerPolicy ?? ""}
            onChange={(e) =>
              updateIframe({
                referrerPolicy:
                  (e.target.value as ReferrerPolicy) || undefined,
              })
            }
          />
        </Row>
        <Row label="loading">
          <input
            type="text"
            className={input}
            placeholder="eager | lazy"
            value={config.iframe?.loading ?? ""}
            onChange={(e) =>
              updateIframe({
                loading:
                  (e.target.value as NonNullable<
                    PlaygroundConfig["iframe"]
                  >["loading"]) || undefined,
              })
            }
          />
        </Row>
        <Row label="aria-label">
          <input
            type="text"
            className={input}
            placeholder="Stash Pay checkout"
            value={config.ariaLabel ?? ""}
            onChange={(e) => update({ ariaLabel: e.target.value || undefined })}
          />
        </Row>
      </Section>

      {/* Validation & loading */}
      <Section title="Validation & loading">
        <Row label="Allowed hosts">
          <input
            type="text"
            className={input}
            placeholder="checkout.stash.gg, *.stashpreview.com"
            value={(config.allowedCheckoutHosts ?? []).join(", ")}
            onChange={(e) => {
              const hosts = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean);
              update({
                allowedCheckoutHosts: hosts.length > 0 ? hosts : undefined,
              });
            }}
          />
        </Row>
        <Row label="Load timeout (ms)">
          <input
            type="number"
            className={input + " text-right"}
            placeholder="20000 (0 = off)"
            value={config.loadTimeout ?? ""}
            onChange={(e) =>
              update({
                loadTimeout: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
          />
        </Row>
        <Row label="Debug logging">
          <Toggle
            checked={config.debug ?? false}
            onChange={(v) => update({ debug: v || undefined })}
          />
        </Row>
      </Section>

      {/* Custom CSS */}
      <Section title="Custom CSS override">
        <p className="text-[12px] leading-relaxed text-stash-text-soft">
          Live-applied to the modal. Target the SDK&apos;s public classes (e.g.{" "}
          <code>.stash-pay__card</code>). Copy and send this block to the client.
        </p>
        <textarea
          className={textarea}
          rows={10}
          spellCheck={false}
          placeholder={".stash-pay__card { max-width: 480px; }"}
          value={customCss}
          onChange={(e) => onCustomCssChange(e.target.value)}
        />
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={copyCss}
            disabled={!customCss.trim()}
            className="text-[12px] text-stash-text-soft underline decoration-stash-border underline-offset-4 transition hover:text-stash-text hover:decoration-stash-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {cssCopied ? "Copied!" : "Copy CSS →"}
          </button>
          <button
            type="button"
            onClick={() => onCustomCssChange("")}
            disabled={!customCss}
            className="text-[12px] text-stash-text-soft underline decoration-stash-border underline-offset-4 transition hover:text-stash-text hover:decoration-stash-text-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </Section>
    </div>
  );
}
