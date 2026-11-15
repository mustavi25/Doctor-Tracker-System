import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary/10 text-primary",
} as const;

export function Chip({ children, tone = "neutral", className }: { children: React.ReactNode; tone?: keyof typeof TONES; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", TONES[tone], className)}>
      {children}
    </span>
  );
}
