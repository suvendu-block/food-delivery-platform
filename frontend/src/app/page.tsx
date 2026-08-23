import { Providers } from "@/components/layout/Providers";
import { Hero } from "@/components/sections/Hero";
import { FeaturedRestaurants } from "@/components/sections/FeaturedRestaurants";
import { Categories } from "@/components/sections/Categories";

export default function Home() {
  return (
    <Providers>
      <Hero />
      <FeaturedRestaurants />
      <Categories />
    </Providers>
  );
}
