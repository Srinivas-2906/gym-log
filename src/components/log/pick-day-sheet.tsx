import { formatDayLabel, type DayGroup } from "@/lib/activities";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface PickDaySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: DayGroup[];
  targetDate: string;
  onSelect: (fromDate: string) => void;
}

export function PickDaySheet({
  open,
  onOpenChange,
  groups,
  targetDate,
  onSelect,
}: PickDaySheetProps) {
  const options = groups.filter((group) => group.date !== targetDate);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[70dvh] overflow-y-auto rounded-t-2xl px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6"
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="font-serif text-2xl">Copy a routine</SheetTitle>
          <SheetDescription>
            Pick a previous day to copy all its entries onto today.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-2">
          {options.length > 0 ? (
            options.map((group) => (
              <button
                key={group.date}
                type="button"
                onClick={() => {
                  onSelect(group.date);
                  onOpenChange(false);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-border paper px-4 py-3 text-left transition-colors hover:border-primary/40"
              >
                <div>
                  <p className="text-[15px] font-medium">{formatDayLabel(group.date)}</p>
                  <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{group.date}</p>
                </div>
                <span className="font-mono text-[12px] text-muted-foreground">
                  {group.entries.length} entries
                </span>
              </button>
            ))
          ) : (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Log at least one other day first.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
