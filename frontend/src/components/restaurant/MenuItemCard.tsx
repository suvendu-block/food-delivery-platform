"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Plus, Minus, Clock } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import type { MenuItem } from "@/lib/api";

interface MenuItemCardProps {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
  className?: string;
}

export function MenuItemCard({
  item,
  restaurantId,
  restaurantName,
  className,
}: MenuItemCardProps) {
  const { items, addItem, updateQuantity } = useCart();
  const cartItem = items.find((i) => i._id === item._id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div
      className={cn(
        "flex items-start gap-4 p-4 bg-surface rounded-xl border border-border-light",
        "hover:border-zinc-200 transition-all duration-200",
        !item.isAvailable && "opacity-50 pointer-events-none",
        className
      )}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="font-medium text-text text-sm">{item.name}</h4>
            {item.description && (
              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">
                {item.description}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-text shrink-0 tabular-nums">
            ${item.price.toFixed(2)}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="info" className="text-[10px] px-2 py-0.5">
            {item.category}
          </Badge>
          <span className="flex items-center gap-1 text-[11px] text-text-muted">
            <Clock className="w-3 h-3" />
            {item.prepTime} min
          </span>
        </div>

        {/* Add to cart */}
        <div className="mt-3">
          {quantity > 0 ? (
            <div className="inline-flex items-center gap-2 bg-accent-light rounded-lg px-1 py-0.5">
              <button
                onClick={() => updateQuantity(item._id, quantity - 1)}
                className="h-7 w-7 flex items-center justify-center rounded-md bg-white text-accent hover:bg-accent hover:text-white transition-colors"
                aria-label={`Decrease ${item.name} quantity`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold text-accent w-5 text-center tabular-nums">
                {quantity}
              </span>
              <button
                onClick={() => addItem(item, restaurantId, restaurantName)}
                className="h-7 w-7 flex items-center justify-center rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
                aria-label={`Increase ${item.name} quantity`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => addItem(item, restaurantId, restaurantName)}
              className="h-8 text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
