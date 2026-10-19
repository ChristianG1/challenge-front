import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section className={cn("rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ink-100", className)} {...props} />;
}
