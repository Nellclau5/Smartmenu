import Image from "next/image";
import { Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemThumbnailProps {
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "h-14 w-14 rounded-xl",
  md: "h-20 w-20 rounded-2xl",
  lg: "h-28 w-full rounded-2xl aspect-[4/3]",
};

/** Miniature plat avec fallback icône */
export function MenuItemThumbnail({
  imageUrl,
  name,
  size = "md",
  className,
}: MenuItemThumbnailProps) {
  const sizeClass = SIZES[size];

  if (imageUrl) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden bg-muted", sizeClass, className)}>
        <Image
          src={imageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes={size === "lg" ? "100vw" : size === "md" ? "80px" : "56px"}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-primary/10 text-primary",
        sizeClass,
        className
      )}
    >
      <Utensils className={size === "sm" ? "h-5 w-5" : "h-6 w-6"} />
    </div>
  );
}
