"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { RestaurantCardSkeleton } from "@/components/ui/Skeleton";
import { restaurantApi, type Restaurant } from "@/lib/api";
import { Search, X } from "lucide-react";

const cuisineFilters = [
  "Italian",
  "Chinese",
  "Mexican",
  "Japanese",
  "Indian",
  "American",
  "Thai",
  "Mediterranean",
];

export function RestaurantsContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCuisine = searchParams.get("cuisine") || "";

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCuisine, setSelectedCuisine] = useState(initialCuisine);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await restaurantApi.getAll();
        setRestaurants(response.data);
        setFilteredRestaurants(response.data);
      } catch {
        console.error("Failed to load restaurants");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  useEffect(() => {
    let result = restaurants;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.cuisine.some((c) => c.toLowerCase().includes(query))
      );
    }

    if (selectedCuisine) {
      result = result.filter((r) =>
        r.cuisine.some((c) => c.toLowerCase() === selectedCuisine.toLowerCase())
      );
    }

    setFilteredRestaurants(result);
  }, [searchQuery, selectedCuisine, restaurants]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white border-b border-border-light">
        <div className="container-tight py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
            Restaurants
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Discover your next favorite meal
          </p>

          <div className="mt-5 max-w-md">
            <Input
              icon={<Search className="w-4 h-4" />}
              placeholder="Search restaurants or cuisines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="container-tight py-6">
        {/* Filters */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCuisine("")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
              !selectedCuisine
                ? "bg-primary text-white"
                : "bg-zinc-100 text-text-secondary hover:bg-zinc-200"
            }`}
          >
            All
          </button>
          {cuisineFilters.map((cuisine) => (
            <button
              key={cuisine}
              onClick={() =>
                setSelectedCuisine(selectedCuisine === cuisine ? "" : cuisine)
              }
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                selectedCuisine === cuisine
                  ? "bg-primary text-white"
                  : "bg-zinc-100 text-text-secondary hover:bg-zinc-200"
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>

        {/* Active filters */}
        {(searchQuery || selectedCuisine) && (
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <span className="text-xs text-text-muted">Filters:</span>
            {searchQuery && (
              <Badge variant="accent" className="gap-1 pr-1">
                {searchQuery}
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-0.5 hover:text-accent-hover"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            {selectedCuisine && (
              <Badge variant="accent" className="gap-1 pr-1">
                {selectedCuisine}
                <button
                  onClick={() => setSelectedCuisine("")}
                  className="ml-0.5 hover:text-accent-hover"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCuisine("");
              }}
              className="text-xs text-accent hover:underline"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <RestaurantCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredRestaurants.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-border-light">
            <p className="text-sm text-text-muted">No restaurants found</p>
            <p className="text-xs text-text-light mt-1">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-text-muted mb-4">
              {filteredRestaurants.length} restaurant
              {filteredRestaurants.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant._id} restaurant={restaurant} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
