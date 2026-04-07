'use client'
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import QuickScan from "@/components/marketing/QuickScan";

interface QuickScanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function QuickScanModal({ open, onOpenChange }: QuickScanModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "transition-all duration-200"
          )}
        />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-lg max-h-[90dvh]",
            "flex flex-col",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-200",
            "px-4 sm:px-0"
          )}
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">
            Gratis zelfscan — hoe staat jouw opdracht ervoor?
          </DialogPrimitive.Title>

          <div className="relative overflow-y-auto overscroll-contain rounded-2xl">
            <DialogPrimitive.Close
              className={cn(
                "absolute right-3 top-3 z-10",
                "flex h-7 w-7 items-center justify-center rounded-full",
                "bg-background/80 backdrop-blur-sm border border-border/40",
                "text-muted-foreground hover:text-foreground",
                "shadow-sm transition-all duration-150 hover:bg-background",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              )}
              aria-label="Sluiten"
              data-testid="quickscan-modal-close"
            >
              <X className="h-4 w-4" />
            </DialogPrimitive.Close>

            <QuickScan />
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
