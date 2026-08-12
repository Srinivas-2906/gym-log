import { ImagePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { compressImage, getEntryImage } from "@/lib/entry-images";

interface ImageUploadFieldProps {
  entryId?: string;
  value: Blob | null;
  touched: boolean;
  onChange: (blob: Blob | null, touched: boolean) => void;
}

export function ImageUploadField({ entryId, value, touched, onChange }: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (value) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }

    if (!touched && entryId) {
      let url: string | null = null;
      let cancelled = false;

      getEntryImage(entryId)
        .then((blob) => {
          if (cancelled || !blob) return;
          url = URL.createObjectURL(blob);
          setPreview(url);
        })
        .catch(() => {
          if (!cancelled) setPreview(null);
        });

      return () => {
        cancelled = true;
        if (url) URL.revokeObjectURL(url);
      };
    }

    setPreview(null);
    return undefined;
  }, [entryId, touched, value]);

  const handlePick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const blob = await compressImage(file);
      onChange(blob, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add photo.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setError(null);
    onChange(null, true);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handlePick(e.target.files?.[0])}
      />

      {preview ? (
        <div className="flex items-center gap-3">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-xl border border-border">
            <img src={preview} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove photo"
              onClick={handleRemove}
              className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm"
            >
              <X className="size-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-[12px] text-muted-foreground transition-colors hover:text-primary"
          >
            Replace photo
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        >
          <ImagePlus className="size-3.5" />
          {loading ? "Processing…" : "Add photo (optional)"}
        </button>
      )}

      {error ? <p className="mt-1 text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}
