import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "skeleton",
        className
      )}
    />
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl border border-border-light overflow-hidden">
      <Skeleton className="h-48 w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function MenuItemSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 bg-surface rounded-xl border border-border-light">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-8 w-20 rounded-lg" />
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="bg-surface rounded-xl border border-border-light p-6">
      <div className="flex items-start gap-4">
        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="text-right space-y-1">
          <Skeleton className="h-6 w-16 ml-auto" />
          <Skeleton className="h-4 w-12 ml-auto" />
        </div>
      </div>
    </div>
  );
}
