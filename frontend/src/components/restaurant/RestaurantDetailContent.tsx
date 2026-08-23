"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { MenuItemCard } from "@/components/restaurant/MenuItemCard";
import { Rating } from "@/components/ui/Rating";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { restaurantApi, type Restaurant, type MenuItem } from "@/lib/api";
import { useCart } from "@/lib/cart-context";
import { MapPin, Clock, Phone, ArrowLeft, ShoppingBag, UtensilsCrossed } from "lucide-react";

export function RestaurantDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { totalItems, totalAmount } = useCart();
  const [restaurant, setRestaurant] = useState<(Restaurant & { menu: MenuItem[] }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const response = await restaurantApi.getById(params.id as string);
        setRestaurant(response.data);
      } catch {
        setError("Restaurant not found");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [params.id]);

  const menuItems = (restaurant?.menu || []).filter(
    (item): item is MenuItem => typeof item !== "string"
  );

  const categories = restaurant
    ? ["all", ...Array.from(new Set(menuItems.map((item) => item.category)))]
    : [];

  const filteredMenu =
    activeCategory === "all"
      ? menuItems
      : menuItems.filter((item) => item.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-56 sm:h-72 w-full rounded-none" />
        <div className="container-tight py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-4 w-96 mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4 p-4 bg-surface rounded-xl border border-border-light">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-text-muted">{error || "Restaurant not found"}</p>
        <Button variant="secondary" onClick={() => router.push("/restaurants")}>
          Back to restaurants
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-zinc-800 to-zinc-900">
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <UtensilsCrossed className="w-24 h-24 text-white" strokeWidth={1} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="container-tight">
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Restaurants
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                    {restaurant.name}
                  </h1>
                  <Badge variant={restaurant.isOpen ? "success" : "error"}>
                    {restaurant.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-white/70 text-sm">
                  <Rating value={restaurant.rating} size="sm" />
                  {restaurant.address?.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {restaurant.address.city}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-tight py-6">
        {/* Info bar */}
        <div className="flex flex-wrap items-center gap-4 py-4 border-b border-border-light mb-6">
          {restaurant.phone && (
            <span className="flex items-center gap-1.5 text-sm text-text-muted">
              <Phone className="w-3.5 h-3.5" />
              {restaurant.phone}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-sm text-text-muted">
            <Clock className="w-3.5 h-3.5" />
            20-30 min
          </span>
          {restaurant.cuisine.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {restaurant.cuisine.map((c) => (
                <Badge key={c} variant="info" className="text-[10px]">
                  {c}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {restaurant.description && (
          <p className="text-sm text-text-muted mb-6 max-w-2xl">
            {restaurant.description}
          </p>
        )}

        {/* Menu */}
        <div>
          <h2 className="text-lg font-semibold text-text mb-4">Menu</h2>

          {/* Category tabs */}
          <div className="flex gap-1 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors whitespace-nowrap ${
                  activeCategory === category
                    ? "bg-primary text-white"
                    : "bg-zinc-100 text-text-secondary hover:bg-zinc-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Menu items */}
          {filteredMenu.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-xl border border-border-light">
              <p className="text-sm text-text-muted">No menu items available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {filteredMenu.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  restaurantId={restaurant._id}
                  restaurantName={restaurant.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating cart button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-fixed animate-slide-up">
          <Link href="/cart">
            <button className="flex items-center gap-2.5 bg-primary text-white pl-5 pr-6 py-3 rounded-full shadow-xl hover:bg-primary-light transition-colors">
              <ShoppingBag className="w-4 h-4" />
              <span className="text-sm font-medium">
                View cart ({totalItems})
              </span>
              <span className="text-sm font-semibold text-white/80">
                ${totalAmount.toFixed(2)}
              </span>
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
