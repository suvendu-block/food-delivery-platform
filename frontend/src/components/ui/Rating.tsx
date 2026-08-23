import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface RatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { star: "w-3 h-3", text: "text-xs" },
  md: { star: "w-4 h-4", text: "text-sm" },
  lg: { star: "w-5 h-5", text: "text-base" },
};

export function Rating({
  value,
  max = 5,
  size = "md",
  showValue = true,
  className,
}: RatingProps) {
  const s = sizeMap[size];

  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            s.star,
            "transition-colors",
            i < Math.floor(value)
              ? "fill-amber-400 text-amber-400"
              : i < value
              ? "fill-amber-400/50 text-amber-400"
              : "fill-zinc-200 text-zinc-200"
          )}
        />
      ))}
      {showValue && (
        <span
          className={cn(
            s.text,
            "font-medium text-text-secondary ml-1 tabular-nums"
          )}
        >
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
