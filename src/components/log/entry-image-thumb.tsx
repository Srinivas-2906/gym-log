import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEntryImageUrl } from "@/hooks/use-entry-image";

interface EntryImageThumbProps {
  entryId: string;
  entryName: string;
}

export function EntryImageThumb({ entryId, entryName }: EntryImageThumbProps) {
  const url = useEntryImageUrl(entryId);
  const [open, setOpen] = useState(false);

  if (!url) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="mt-2 block overflow-hidden rounded-lg border border-border"
      >
        <img src={url} alt="" className="h-20 w-full object-cover" />
      </button>

      {open ? (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="mx-4 max-w-sm gap-0 overflow-hidden rounded-2xl p-0">
            <DialogHeader className="sr-only">
              <DialogTitle>{entryName} photo</DialogTitle>
              <DialogDescription>Workout photo attachment</DialogDescription>
            </DialogHeader>
            <img src={url} alt={entryName} className="max-h-[70dvh] w-full object-contain" />
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
