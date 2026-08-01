import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure section for the Order Detail dialog.
 *
 * Built on native <details>/<summary>: keyboard operation, the open/closed
 * accessibility state and find-in-page all come for free, and it works with
 * no JavaScript. A hand-rolled div+onClick version would have to rebuild all
 * of that and would get it subtly wrong.
 *
 * `summary` and `count` exist because a collapsed section that reveals nothing
 * about its contents is how staff miss information — every collapsed header
 * must still say how much is inside, or what it is.
 */
export function Collapsible({
  title,
  summary,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  summary?: React.ReactNode;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={defaultOpen}
      className="group mt-4 border-t border-line pt-4 first:mt-0 first:border-t-0 first:pt-0"
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 rounded-button py-1",
          "hover:bg-line/30 focus-visible:outline-2 focus-visible:outline-offset-2",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          className="size-4 shrink-0 text-muted transition-transform group-open:rotate-90"
          aria-hidden
        />
        <span className="text-sm font-medium leading-5 text-brand">
          {title}
          {typeof count === "number" && (
            <span className="text-muted"> ({count})</span>
          )}
        </span>
        {summary && (
          <span className="ml-auto truncate text-sm leading-5 text-muted group-open:hidden">
            {summary}
          </span>
        )}
      </summary>
      <div className="pt-3 pl-6">{children}</div>
    </details>
  );
}
