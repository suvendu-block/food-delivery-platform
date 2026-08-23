"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { restaurantApi, type Restaurant } from "@/lib/api";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { RestaurantCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export function FeaturedRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantApi.getAll();
        setRestaurants(response.data.slice(0, 6));
      } catch {
        setError("Failed to load restaurants");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <section className="py-16 sm:py-20">
      <div className="container-tight">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              Popular near you
            </h2>
            <p className="text-sm text-text-muted mt-1.5">
              Top-rated spots our customers love
            </p>
          </div>
          <Link href="/restaurants">
            <Button variant="ghost" size="sm" className="group gap-1.5">
              View all
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-border-light">
            <p className="text-text-muted">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Try again
            </Button>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-border-light">
            <p className="text-text-muted">No restaurants available yet</p>
            <p className="text-xs text-text-light mt-1">
              Check back soon for new listings
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {restaurants.map((restaurant) => (
              <RestaurantCard key={restaurant._id} restaurant={restaurant} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
