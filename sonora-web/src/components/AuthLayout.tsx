import type { ReactNode } from "react";

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
          <h1 className="font-display text-3xl tracking-tight text-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        </header>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          {children}
        </div>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {footer}
        </p>
      </div>
    </div>
  );
}