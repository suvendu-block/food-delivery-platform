"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, Clock, Star, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/restaurants?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/restaurants");
    }
  };

  return (
    <section className="relative overflow-hidden bg-primary">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary opacity-80" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fresh/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative container-tight py-16 sm:py-20 lg:py-28">
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-fresh opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-fresh"></span>
            </span>
            <span className="text-xs font-medium text-white/70 tracking-wide">
              Delivering now in your area
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold text-white leading-[1.1] tracking-tight">
            Great food,{" "}
            <span className="text-gradient">
              delivered fast
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-5 text-base sm:text-lg text-white/60 leading-relaxed max-w-lg">
            Order from the best local restaurants. Fresh ingredients, quick delivery, and flavors you'll love.
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex gap-2 max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pizza, sushi, tacos..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-text placeholder:text-text-light text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 shadow-lg"
                />
              </div>
              <Button type="submit" variant="accent" size="lg" className="shadow-lg shrink-0">
                <span className="hidden sm:inline">Find food</span>
                <ArrowRight className="w-4 h-4 sm:hidden" />
              </Button>
            </div>
          </form>

          {/* Trust indicators */}
          <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-white/50">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <Star className="w-3.5 h-3.5 fill-amber-400" />
              </div>
              <span>4.8 average</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Under 30 min</span>
            </div>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>50+ restaurants</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
