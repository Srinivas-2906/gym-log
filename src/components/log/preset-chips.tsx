import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import type { ActivityPreset } from "@/lib/presets";
import { cn } from "@/lib/utils";

import { PresetManageDialog } from "./preset-manage-dialog";

interface PresetChipsProps {
  presets: ActivityPreset[];
  selectedId: string | null;
  onSelect: (preset: ActivityPreset) => void;
  onSave: (presets: ActivityPreset[]) => void;
}

export function PresetChips({ presets, selectedId, onSelect, onSave }: PresetChipsProps) {
  const [manageOpen, setManageOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 pb-0.5">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelect(preset)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-[12px] transition-colors",
                selectedId === preset.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {preset.name}
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-label="Manage suggestions"
          onClick={() => setManageOpen(true)}
          className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          <SlidersHorizontal className="size-3.5" />
        </button>
      </div>

      <PresetManageDialog
        open={manageOpen}
        onOpenChange={setManageOpen}
        presets={presets}
        onSave={onSave}
      />
    </>
  );
}
