"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/upload-image";

interface ImageUploadProps {
  label?: string;
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  className?: string;
  aspect?: "square" | "wide";
}

/** Sélecteur d'image mobile-first avec aperçu */
export function ImageUpload({
  label = "Photo",
  currentUrl,
  onFileSelect,
  className,
  aspect = "square",
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const displayUrl = preview ?? currentUrl ?? null;

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setPreview(URL.createObjectURL(file));
    onFileSelect(file);
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label>{label}</Label>}

      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed border-muted bg-muted/30",
          aspect === "square" ? "aspect-square max-w-[160px]" : "aspect-[16/9] w-full"
        )}
      >
        {displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt="Aperçu"
              fill
              className="object-cover"
              sizes={aspect === "square" ? "160px" : "100vw"}
              unoptimized={!!preview}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute top-2 right-2 h-8 w-8 rounded-full shadow"
              onClick={handleRemove}
              aria-label="Retirer l'image"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary transition-colors p-4"
          >
            <Camera className="h-8 w-8" />
            <span className="text-xs font-medium text-center">
              Appuyer pour ajouter une photo
            </span>
          </button>
        )}
      </div>

      {displayUrl && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full max-w-[160px]"
          onClick={() => inputRef.current?.click()}
        >
          Changer la photo
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
