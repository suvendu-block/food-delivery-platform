"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/Button";
import { ShoppingBag, Menu, X, LogOut, Package, ChevronDown } from "lucide-react";

export function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-sticky glass">
      <div className="container-tight">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-white transition-transform duration-200 group-hover:scale-105">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-text tracking-tight hidden sm:block">
              FreshBite
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/restaurants"
              className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-zinc-100 transition-colors"
            >
              Restaurants
            </Link>
            {user && (
              <Link
                href="/orders"
                className="px-3 py-2 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-zinc-100 transition-colors"
              >
                Orders
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2.5 text-text-secondary hover:text-text hover:bg-zinc-100 rounded-lg transition-colors"
              aria-label={`Cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-zinc-100 transition-colors cursor-default">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-xs font-semibold">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text max-w-[100px] truncate">
                    {user.username}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="h-9 w-9 p-0 text-text-muted hover:text-text"
                  aria-label="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-border">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Sign in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="accent" size="sm">
                    Get started
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile */}
          <div className="flex md:hidden items-center gap-2">
            <Link
              href="/cart"
              className="relative p-2 text-text-secondary hover:text-text"
              aria-label={`Cart with ${totalItems} items`}
            >
              <ShoppingBag className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-white px-1">
                  {totalItems}
                </span>
              )}
            </Link>
            <button
              className="p-2 text-text-secondary hover:text-text"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-label={isMobileOpen ? "Close menu" : "Open menu"}
            >
              {isMobileOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileOpen && (
          <div className="md:hidden border-t border-border-light py-4 animate-slide-down">
            <nav className="flex flex-col gap-1">
              <Link
                href="/restaurants"
                className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-zinc-100 transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                Restaurants
              </Link>
              {user && (
                <Link
                  href="/orders"
                  className="px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-zinc-100 transition-colors"
                  onClick={() => setIsMobileOpen(false)}
                >
                  My Orders
                </Link>
              )}
              <div className="border-t border-border-light my-2" />
              {user ? (
                <button
                  className="text-left px-3 py-2.5 text-sm font-medium text-text-secondary hover:text-text rounded-lg hover:bg-zinc-100 transition-colors"
                  onClick={() => {
                    logout();
                    setIsMobileOpen(false);
                  }}
                >
                  Sign out
                </button>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMobileOpen(false)}>
                    <Button variant="secondary" className="w-full">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setIsMobileOpen(false)}>
                    <Button variant="accent" className="w-full mt-2">
                      Get started
                    </Button>
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
