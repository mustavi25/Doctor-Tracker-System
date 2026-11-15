"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const SIZES = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" } as const;

/**
 * Built on the native <dialog>: focus trap, Escape to close, inert background
 * and screen-reader semantics come from the browser, with zero extra dependencies.
 * Children are only mounted while open, so forms always start fresh.
 */
export function Modal({ open, onClose, title, description, size = "md", children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // A click on the dialog element itself (not its content) is a backdrop click
        if (e.target === e.currentTarget) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] rounded-2xl border bg-background p-0 text-foreground shadow-2xl",
        "backdrop:bg-black/50 backdrop:backdrop-blur-[2px]",
        SIZES[size]
      )}
    >
      <div className="flex max-h-[90dvh] flex-col">
        <div className="flex items-start justify-between gap-4 border-b p-5">
          <div className="space-y-1">
            <h2 id={titleId} className="text-lg font-semibold tracking-tight">
              {title}
            </h2>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <Button type="button" variant="ghost" size="icon" aria-label="Close" onClick={onClose}>
            <X className="size-4" />
          </Button>
        </div>
        <div className="overflow-y-auto p-5">{open && children}</div>
      </div>
    </dialog>
  );
}
