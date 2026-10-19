import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink-900 text-white hover:bg-ink-700 disabled:bg-ink-200 disabled:text-ink-500",
  secondary: "bg-white text-ink-900 ring-1 ring-ink-200 hover:bg-ink-50 disabled:text-ink-400",
  ghost: "text-ink-900 hover:bg-ink-50 disabled:text-ink-400",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const BASE =
  "inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-900 disabled:cursor-not-allowed";

interface ButtonProps extends ComponentProps<"button"> {
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(BASE, VARIANTS[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {loading && <Spinner className="size-4" />}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function ButtonLink({ variant = "primary", fullWidth, className, ...props }: ButtonLinkProps) {
  return <Link className={cn(BASE, VARIANTS[variant], fullWidth && "w-full", className)} {...props} />;
}
