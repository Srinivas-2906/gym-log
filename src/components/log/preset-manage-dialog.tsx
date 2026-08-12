import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ActivityKind } from "@/lib/activities";
import { KIND_LABELS } from "@/lib/activities";
import { KIND_DEFAULT_FIELDS } from "@/lib/metrics";
import type { ActivityPreset } from "@/lib/presets";
import { cn } from "@/lib/utils";

const kinds: ActivityKind[] = ["strength", "cardio", "other"];

interface PresetManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presets: ActivityPreset[];
  onSave: (presets: ActivityPreset[]) => void;
}

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function generatePresetId(name: string): string {
  return `${slugify(name)}-${Math.random().toString(36).slice(2, 6)}`;
}

function movePreset(list: ActivityPreset[], index: number, direction: -1 | 1): ActivityPreset[] {
  const target = index + direction;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

interface SortablePresetItemProps {
  preset: ActivityPreset;
  index: number;
  total: number;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}

function SortablePresetItem({ preset, index, total, onMove, onRemove }: SortablePresetItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: preset.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-2",
        isDragging && "z-10 shadow-md ring-1 ring-primary/20",
      )}
    >
      <button
        type="button"
        aria-label={`Drag to reorder ${preset.name}`}
        className="touch-none rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium">{preset.name}</p>
        <p className="text-[11px] text-muted-foreground">{KIND_LABELS[preset.kind]}</p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          aria-label={`Move ${preset.name} up`}
          disabled={index === 0}
          onClick={() => onMove(index, -1)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
        >
          <ChevronUp className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Move ${preset.name} down`}
          disabled={index === total - 1}
          onClick={() => onMove(index, 1)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-30"
        >
          <ChevronDown className="size-4" />
        </button>
        <button
          type="button"
          aria-label={`Remove ${preset.name}`}
          onClick={() => onRemove(preset.id)}
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </li>
  );
}

export function PresetManageDialog({
  open,
  onOpenChange,
  presets,
  onSave,
}: PresetManageDialogProps) {
  const [draft, setDraft] = useState<ActivityPreset[]>(presets);
  const [newName, setNewName] = useState("");
  const [newKind, setNewKind] = useState<ActivityKind>("strength");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (open) {
      setDraft(presets);
      setNewName("");
      setNewKind("strength");
    }
  }, [open, presets]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setDraft((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return items;
      return arrayMove(items, oldIndex, newIndex);
    });
  };

  const handleAdd = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (draft.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return;

    setDraft((prev) => [
      ...prev,
      {
        id: generatePresetId(trimmed),
        name: trimmed,
        kind: newKind,
        fields: KIND_DEFAULT_FIELDS[newKind],
      },
    ]);
    setNewName("");
  };

  const handleSave = () => {
    onSave(draft);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="mx-4 flex max-h-[85dvh] max-w-sm flex-col gap-0 overflow-hidden rounded-2xl p-0">
        <DialogHeader className="border-b border-border px-5 py-4 text-left">
          <DialogTitle className="font-serif text-xl">Suggestions</DialogTitle>
          <DialogDescription>
            Drag or use arrows to reorder, remove, or add quick-pick activities.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-3">
          {draft.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              No suggestions yet. Add one below.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={draft.map((p) => p.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1.5">
                  {draft.map((preset, index) => (
                    <SortablePresetItem
                      key={preset.id}
                      preset={preset}
                      index={index}
                      total={draft.length}
                      onMove={(i, direction) => setDraft((prev) => movePreset(prev, i, direction))}
                      onRemove={(id) => setDraft((prev) => prev.filter((p) => p.id !== id))}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </div>

        <div className="space-y-2 border-t border-border px-5 py-4">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Add new</p>
          <div className="flex gap-1.5">
            {kinds.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setNewKind(k)}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-1.5 text-[11px] transition-colors",
                  newKind === k
                    ? "border-foreground bg-foreground text-background"
                    : "border-border text-muted-foreground",
                )}
              >
                {KIND_LABELS[k]}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="e.g. Rows, HIIT"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-primary"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={handleAdd}
            >
              <Plus className="size-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="border-t border-border px-5 py-4 sm:justify-stretch">
          <Button type="button" className="w-full rounded-xl" onClick={handleSave}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
