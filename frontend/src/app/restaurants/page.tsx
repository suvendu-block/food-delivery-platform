import { Providers } from "@/components/layout/Providers";
import { RestaurantsContent } from "@/components/restaurant/RestaurantsContent";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function RestaurantsPage() {
  return (
    <Providers>
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        }
      >
        <RestaurantsContent />
      </Suspense>
    </Providers>
  );
}
