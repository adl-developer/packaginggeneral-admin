import { ClipboardList, Shield, ShieldCheck } from "lucide-react";
import { ROLE_LABEL, type TeamRole } from "@/lib/data/types";
import { cn } from "@/lib/utils";

/**
 * Role pill in the Team Members table — Figma 3803:3429.
 *
 * h20, padding 2/10, gap 6, radius full, label 12px/500, 12px icon.
 * These are the ONLY non-palette colours in the whole admin design, so they are
 * hard-coded arbitrary values rather than tokens:
 *
 *   Super Admin    bg #ede9fe  fg #7008e7   (violet)
 *   Admin          bg #dbeafe  fg #1447e6   (blue)
 *   Order Manager  bg #fef3c6  fg #bb4d00   (amber)
 */
const TONE: Record<TeamRole, { chip: string; Icon: typeof Shield }> = {
  "super-admin": {
    chip: "bg-[#ede9fe] text-[#7008e7]",
    Icon: ShieldCheck,
  },
  admin: {
    chip: "bg-[#dbeafe] text-[#1447e6]",
    Icon: Shield,
  },
  "order-manager": {
    chip: "bg-[#fef3c6] text-[#bb4d00]",
    Icon: ClipboardList,
  },
};

export function RolePill({ role }: { role: TeamRole }) {
  const { chip, Icon } = TONE[role];
  return (
    <span
      className={cn(
        "inline-flex h-5 shrink-0 items-center gap-1.5 rounded-full px-2.5",
        "text-xs leading-4 font-medium whitespace-nowrap",
        chip,
      )}
    >
      <Icon className="size-3" aria-hidden />
      {ROLE_LABEL[role]}
    </span>
  );
}
