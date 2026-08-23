"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { MapPin, Clock, UtensilsCrossed } from "lucide-react";
import type { Restaurant } from "@/lib/api";

interface RestaurantCardProps {
  restaurant: Restaurant;
  className?: string;
}

export function RestaurantCard({ restaurant, className }: RestaurantCardProps) {
  return (
    <Link href={`/restaurants/${restaurant._id}`} className="group block">
      <article
        className={cn(
          "relative bg-surface rounded-2xl overflow-hidden border border-border-light card-lift",
          className
        )}
      >
        {/* Image Area */}
        <div className="relative aspect-[16/10] bg-gradient-to-br from-zinc-100 to-zinc-50 overflow-hidden">
          {/* Placeholder pattern */}
          <div className="absolute inset-0 flex items-center justify-center">
            <UtensilsCrossed className="w-12 h-12 text-zinc-200" strokeWidth={1.5} />
          </div>
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Status badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={restaurant.isOpen ? "success" : "error"}>
              {restaurant.isOpen ? "Open" : "Closed"}
            </Badge>
          </div>

          {/* Rating pill */}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 fill-amber-400 text-amber-400" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="text-xs font-semibold text-text tabular-nums">
                {restaurant.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-text group-hover:text-accent transition-colors duration-200 line-clamp-1">
            {restaurant.name}
          </h3>

          {restaurant.description && (
            <p className="text-sm text-text-muted mt-1 line-clamp-1">
              {restaurant.description}
            </p>
          )}

          {/* Cuisine tags */}
          <div className="flex flex-wrap gap-1.5 mt-3">
            {restaurant.cuisine.slice(0, 3).map((c) => (
              <span
                key={c}
                className="text-xs px-2 py-0.5 bg-fresh-light text-fresh rounded-md font-medium"
              >
                {c}
              </span>
            ))}
          </div>

          {/* Footer meta */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border-light text-xs text-text-muted">
            {restaurant.address?.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {restaurant.address.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              20-30 min
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
