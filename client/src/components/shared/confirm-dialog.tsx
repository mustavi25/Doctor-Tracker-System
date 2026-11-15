"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Modal } from "./modal";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  destructive = false,
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
