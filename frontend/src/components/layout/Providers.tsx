"use client";

import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "./Header";
import { Footer } from "./Footer";

function LayoutContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        <LayoutContent>{children}</LayoutContent>
      </CartProvider>
    </AuthProvider>
  );
}
