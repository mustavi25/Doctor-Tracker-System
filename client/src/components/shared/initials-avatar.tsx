import { cn } from "@/lib/utils";
import { getInitials, hueFromString } from "@/lib/format";

export function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const hue = hueFromString(name);
  return (
    <div
      aria-hidden
      className={cn("flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold", className)}
      style={{ backgroundColor: `hsl(${hue} 70% 92%)`, color: `hsl(${hue} 55% 28%)` }}
    >
      {getInitials(name)}
    </div>
  );
}
