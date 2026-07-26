import * as React from "react";
import { cn } from "@/lib/utils";

/** Figma "Card": bg #fefdfb, 1px #c4bcb0 border, 20px radius. */
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-line bg-surface", className)}
      {...props}
    />
  );
}

/** Figma CardHeader padding: 24 24 8 24 (stat cards) / 24 24 0 24 (list cards). */
export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pt-6 pb-2", className)} {...props} />;
}

/** 16px / 500 / lh16 / ls-0.312 — e.g. "Recent Orders". */
export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-base font-medium leading-4 text-brand", className)}
      {...props}
    />
  );
}

/** 16px / 400 / lh24 / ls-0.312 — e.g. "Latest orders in the system". */
export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-base leading-6 text-muted", className)} {...props} />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}
