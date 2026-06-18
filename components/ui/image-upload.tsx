"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, X } from "lucide-react";
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

/** Sélecteur d'image — galerie ou appareil photo */
export function ImageUpload({
  label = "Photo",
  currentUrl,
  onFileSelect,
  className,
  aspect = "square",
}: ImageUploadProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
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
    e.target.value = "";
  }

  function handleRemove() {
    setPreview(null);
    setError(null);
    onFileSelect(null);
    if (galleryRef.current) galleryRef.current.value = "";
    if (cameraRef.current) cameraRef.current.value = "";
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
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="flex w-full flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => galleryRef.current?.click()}
              >
                Galerie photos
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="mr-2 h-4 w-4" />
                Appareil photo
              </Button>
            </div>
          </div>
        )}
      </div>

      {displayUrl && (
        <div className="flex max-w-[160px] flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => galleryRef.current?.click()}
          >
            Changer (galerie)
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => cameraRef.current?.click()}
          >
            Reprendre une photo
          </Button>
        </div>
      )}

      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
