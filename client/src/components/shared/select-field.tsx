import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<React.ComponentPropsWithRef<"select">, "children"> {
  label?: string;
  options: readonly Option[];
  /** Label of the empty option (value ""). Omit for selects that always have a value. */
  placeholder?: string;
  compact?: boolean;
}

/** Native <select>: best mobile UX, fully accessible, styled to match the shadcn Input. */
export function SelectField({ label, options, placeholder, compact, className, id, ...props }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={cn(
            "w-full appearance-none rounded-lg border border-input bg-transparent pr-9 pl-3 text-sm outline-none transition-colors",
            "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            compact ? "h-8" : "h-9",
            className
          )}
          {...props}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </div>
    </div>
  );
}
