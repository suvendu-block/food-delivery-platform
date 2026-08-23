"use client";

import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/Button";
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, CreditCard } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function CartContent() {
  const { items, restaurantName, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
            <ShoppingBag className="w-7 h-7 text-text-muted" strokeWidth={1.5} />
          </div>
          <h1 className="text-lg font-semibold text-text mb-1">Your cart is empty</h1>
          <p className="text-sm text-text-muted mb-5">Add items from a restaurant to get started</p>
          <Link href="/restaurants">
            <Button variant="accent" size="sm">
              Browse restaurants
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              href="/restaurants"
              className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-2 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Continue shopping
            </Link>
            <h1 className="text-xl font-semibold text-text">Your cart</h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-text-muted hover:text-error transition-colors"
          >
            Clear cart
          </button>
        </div>

        {/* Restaurant info */}
        {restaurantName && (
          <div className="bg-surface rounded-xl border border-border-light px-4 py-3 mb-4">
            <p className="text-xs text-text-muted">Ordering from</p>
            <p className="text-sm font-medium text-text">{restaurantName}</p>
          </div>
        )}

        {/* Items */}
        <div className="space-y-2 mb-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-3 bg-surface rounded-xl border border-border-light p-3"
            >
              {/* Placeholder image */}
              <div className="w-14 h-14 rounded-lg bg-zinc-100 flex items-center justify-center shrink-0">
                <span className="text-xl">🍽️</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-text truncate">{item.name}</h3>
                <p className="text-xs text-text-muted">${item.price.toFixed(2)}</p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => updateQuantity(item._id, item.quantity - 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-md bg-zinc-100 text-text-secondary hover:bg-zinc-200 transition-colors"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="text-sm font-medium text-text w-5 text-center tabular-nums">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item._id, item.quantity + 1)}
                  className="h-7 w-7 flex items-center justify-center rounded-md bg-zinc-100 text-text-secondary hover:bg-zinc-200 transition-colors"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Price */}
              <p className="text-sm font-medium text-text w-16 text-right tabular-nums">
                ${(item.price * item.quantity).toFixed(2)}
              </p>

              {/* Remove */}
              <button
                onClick={() => removeItem(item._id)}
                className="p-1.5 text-text-light hover:text-error transition-colors"
                aria-label={`Remove ${item.name}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-surface rounded-xl border border-border-light p-4">
          <h2 className="text-sm font-semibold text-text mb-3">Order summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-text-muted">
              <span>Subtotal</span>
              <span className="tabular-nums">${totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Delivery</span>
              <span className="tabular-nums">$2.99</span>
            </div>
            <div className="flex justify-between text-text-muted">
              <span>Tax</span>
              <span className="tabular-nums">${(totalAmount * 0.08).toFixed(2)}</span>
            </div>
            <div className="border-t border-border-light pt-2 mt-2">
              <div className="flex justify-between font-semibold text-text">
                <span>Total</span>
                <span className="tabular-nums">
                  ${(totalAmount + 2.99 + totalAmount * 0.08).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {user ? (
              <Button
                variant="accent"
                className="w-full"
                size="md"
                onClick={() => router.push("/checkout")}
              >
                <CreditCard className="w-4 h-4" />
                Checkout
              </Button>
            ) : (
              <div className="space-y-2">
                <Link href="/login">
                  <Button variant="accent" className="w-full" size="md">
                    Sign in to checkout
                  </Button>
                </Link>
                <p className="text-center text-xs text-text-muted">
                  No account?{" "}
                  <Link href="/register" className="text-accent hover:underline">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
