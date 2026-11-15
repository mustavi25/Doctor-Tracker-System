import { Stethoscope } from "lucide-react";

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Stethoscope className="size-5" aria-hidden />
      </div>
      <span className="text-base font-semibold tracking-tight">Doctor Tracker</span>
    </div>
  );
}
