import Image from "next/image";
import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  showLabel?: boolean;
  labelClassName?: string;
  className?: string;
}

export function AppLogo({
  size = 36,
  showLabel = true,
  labelClassName,
  className,
}: AppLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src="/icons/logo.png"
        alt="Smart Menu"
        width={size}
        height={size}
        className="rounded-xl"
        priority
      />
      {showLabel && (
        <span className={cn("font-bold tracking-tight", labelClassName)}>
          Smart Menu
        </span>
      )}
    </div>
  );
}
