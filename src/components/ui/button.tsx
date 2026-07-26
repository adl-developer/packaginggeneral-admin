import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "outline"
  | "surface"
  | "rust"
  | "plum"
  | "plumOutline"
  | "ghost";
type ButtonSize = "xs" | "sm" | "md";

/*
  Figma:
  - primary  bg #3d3428, text #fefdfb            (Sign In, Create Code, active range chip)
  - outline  bg #e8e5de, 1px #c4bcb0, #3d3428    (Claim, View All, header user button,
                                                  inactive range chips)
  - surface  bg #fefdfb, 1px #c4bcb0, #3d3428    (the All Statuses / All Workers pickers,
                                                  which sit ON the filter card)
  - rust     bg rgba(150,64,34,0.9), text #fff   (the View action in the orders table)

  DESTRUCTIVE ACTIONS ARE PLUM, NOT RED — matching the storefront's plum
  empty-cart dialog. There is no red button anywhere in these designs:
  - plum        bg #9b6b8f, text #fff                       (Confirm Cancellation)
  - plumOutline bg #e8e5de, 1px rgba(155,107,143,0.4), plum (Cancel Order)
  All radius 14.
*/
const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-brand text-brand-foreground hover:bg-brand/90 active:bg-brand/80",
  outline:
    "bg-background text-brand border border-line hover:bg-line/40 active:bg-line/60",
  surface:
    "bg-surface text-brand border border-line hover:bg-line/30 active:bg-line/50",
  rust: "bg-[rgba(150,64,34,0.9)] text-white hover:bg-[rgba(150,64,34,1)] active:bg-[rgba(130,55,29,1)]",
  plum: "bg-plum text-white hover:bg-[#8a5e7f] active:bg-[#7a5370]",
  plumOutline:
    "bg-background text-plum border border-[rgba(155,107,143,0.4)] hover:bg-[rgba(155,107,143,0.08)]",
  ghost: "bg-transparent text-brand hover:bg-line/40",
};

/*
  xs → the 32px chips/buttons in the filter bar and header (12px/500 label, pad 0 10)
  sm → 32px with a roomier gutter
  md → the 36px standard button (14px/500 label, pad 8 16)
*/
const sizeStyles: Record<ButtonSize, string> = {
  xs: "h-8 px-2.5 text-xs font-medium gap-1.5",
  sm: "h-8 px-3 text-sm font-medium gap-2",
  md: "h-9 px-4 text-sm font-medium gap-2",
};

export function buttonVariants({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}) {
  return cn(
    "inline-flex shrink-0 items-center justify-center rounded-button leading-5",
    "transition-[color,background-color,border-color] duration-200 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
    "disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    fullWidth && "w-full",
    className,
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", fullWidth, type, ...props },
    ref,
  ) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={buttonVariants({ variant, size, fullWidth, className })}
      {...props}
    />
  ),
);
Button.displayName = "Button";
