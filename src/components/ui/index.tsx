"use client";

import * as RDialog from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { X } from "lucide-react";
import Link from "next/link";
import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from "react";

export const cn = (...v: Parameters<typeof clsx>) => twMerge(clsx(v));

// ---------- Button ----------

type Variant = "primary" | "secondary" | "ghost" | "danger" | "subtle";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-accent-strong font-semibold",
  secondary: "bg-raised text-fg border border-line-strong hover:bg-overlay",
  ghost: "text-muted hover:text-fg hover:bg-raised",
  subtle: "bg-surface text-fg border border-line hover:border-line-strong",
  danger: "bg-bad-bg text-bad border border-bad/40 hover:bg-bad/20",
};
const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-4 text-sm gap-2",
  lg: "h-12 px-5 text-base gap-2",
};

export const buttonClass = (variant: Variant = "secondary", size: Size = "md", extra?: string) =>
  cn("inline-flex items-center justify-center rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap", variants[variant], sizes[size], extra);

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  function Button({ variant = "secondary", size = "md", className, type = "button", ...props }, ref) {
    return <button ref={ref} type={type} className={buttonClass(variant, size, className)} {...props} />;
  },
);

export function LinkButton({ href, variant = "secondary", size = "md", className, children, ...rest }: { href: string; variant?: Variant; size?: Size; className?: string; children: ReactNode; "aria-label"?: string }) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)} {...rest}>
      {children}
    </Link>
  );
}

// ---------- Surfaces ----------

export function Card({ className, children, as: As = "div", ...rest }: { className?: string; children: ReactNode; as?: "div" | "section" | "article" | "aside" | "li" } & Record<string, unknown>) {
  return (
    <As className={cn("rounded-[var(--radius-card)] border border-line bg-surface", className)} {...rest}>
      {children}
    </As>
  );
}

export function SectionHeading({ title, eyebrow, action, level = 2, id }: { title: ReactNode; eyebrow?: ReactNode; action?: ReactNode; level?: 1 | 2 | 3; id?: string }) {
  const H = `h${level}` as "h1" | "h2" | "h3";
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-subtle">{eyebrow}</p>}
        <H id={id} className={cn("font-semibold tracking-tight text-fg", level === 1 ? "text-2xl sm:text-3xl" : level === 2 ? "text-lg sm:text-xl" : "text-base")}>
          {title}
        </H>
      </div>
      {action}
    </div>
  );
}

type Tone = "neutral" | "accent" | "ok" | "warn" | "bad" | "ai";
const tones: Record<Tone, string> = {
  neutral: "bg-raised text-muted border-line",
  accent: "bg-accent/10 text-accent border-accent/30",
  ok: "bg-ok-bg text-ok border-ok/30",
  warn: "bg-warn-bg text-warn border-warn/30",
  bad: "bg-bad-bg text-bad border-bad/30",
  ai: "bg-ai-bg text-ai border-ai/30",
};

export function Badge({ tone = "neutral", children, className, icon }: { tone?: Tone; children: ReactNode; className?: string; icon?: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function Notice({ tone = "neutral", title, children, icon, className, action }: { tone?: Tone; title?: ReactNode; children?: ReactNode; icon?: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <div role="note" className={cn("flex gap-3 rounded-xl border p-4 text-sm", tones[tone], className)}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1 text-fg">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn("text-muted", title && "mt-1")}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action, icon }: { title: string; children?: ReactNode; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong px-6 py-12 text-center">
      {icon && <div className="mb-3 text-subtle">{icon}</div>}
      <p className="text-base font-semibold text-fg">{title}</p>
      {children && <div className="mt-1 max-w-md text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---------- Dialog ----------

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-black/60" />
        <RDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-line-strong bg-raised p-6 shadow-2xl animate-rise",
            wide ? "max-w-2xl" : "max-w-md",
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <RDialog.Title className="text-lg font-semibold text-fg">{title}</RDialog.Title>
            <RDialog.Close className="-m-2 rounded-lg p-2 text-muted hover:text-fg" aria-label="Close dialog">
              <X size={18} />
            </RDialog.Close>
          </div>
          {description ? <RDialog.Description className="mt-2 text-sm text-muted">{description}</RDialog.Description> : <RDialog.Description className="sr-only">{title}</RDialog.Description>}
          {children && <div className="mt-4">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

// ---------- Tabs (accessible, manual activation) ----------

export function Tabs<T extends string>({ tabs, value, onChange, label, className }: { tabs: { id: T; label: ReactNode; count?: number }[]; value: T; onChange: (v: T) => void; label: string; className?: string }) {
  const base = useId();
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto rounded-xl border border-line bg-surface p-1", className)}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          id={`${base}-${tab.id}`}
          role="tab"
          type="button"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
            e.preventDefault();
            const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
            onChange(next.id);
            document.getElementById(`${base}-${next.id}`)?.focus();
          }}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
            value === tab.id ? "bg-overlay text-fg" : "text-muted hover:text-fg",
          )}
        >
          {tab.label}
          {tab.count !== undefined && <span className="rounded-full bg-canvas px-1.5 text-xs text-subtle">{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}

// ---------- Form fields ----------

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: ReactNode; children: ReactNode; htmlFor: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-subtle">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "w-full rounded-lg border border-line-strong bg-canvas px-3 py-2.5 text-sm text-fg placeholder:text-subtle focus-visible:outline-2 focus-visible:outline-accent";

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 text-sm text-muted">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-strong border-t-accent motion-reduce:animate-none" aria-hidden />
      {label}
    </div>
  );
}
