"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/lib/auth-context";
import { orderApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ArrowLeft, CreditCard, Banknote, Wallet, CheckCircle } from "lucide-react";
import Link from "next/link";

type PaymentMethod = "card" | "cash" | "wallet";

export function CheckoutContent() {
  const { items, restaurantId, restaurantName, totalAmount, clearCart } = useCart();
  const { user, token } = useAuth();
  const router = useRouter();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [deliveryAddress, setDeliveryAddress] = useState(
    user?.address?.street
      ? `${user.address.street}, ${user.address.city}, ${user.address.state}`
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !restaurantId) return;

    setIsSubmitting(true);
    try {
      await orderApi.create(token, {
        restaurantId,
        items: items.map((item) => ({
          menuId: item._id,
          quantity: item.quantity,
        })),
        deliveryAddress,
        paymentMethod,
      });
      clearCart();
      setOrderSuccess(true);
    } catch {
      alert("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 mx-auto bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <CheckCircle className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-lg font-semibold text-text mb-1">Order placed</h1>
          <p className="text-sm text-text-muted mb-6">
            Your order has been confirmed. We&apos;ll send you an update shortly.
          </p>
          <div className="space-y-2">
            <Link href="/orders">
              <Button variant="accent" className="w-full" size="md">
                View orders
              </Button>
            </Link>
            <Link href="/restaurants">
              <Button variant="secondary" className="w-full" size="md">
                Continue browsing
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-sm text-text-muted mb-4">Your cart is empty</p>
          <Link href="/restaurants">
            <Button variant="accent" size="md">
              Browse restaurants
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 sm:py-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-text mb-2 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to cart
          </Link>
          <h1 className="text-xl font-semibold text-text">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Order summary */}
          <div className="bg-surface rounded-xl border border-border-light p-4 mb-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Order from {restaurantName}
            </h2>
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item._id} className="flex justify-between text-sm">
                  <span className="text-text-secondary">
                    {item.quantity}× {item.name}
                  </span>
                  <span className="text-text tabular-nums">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="border-t border-border-light pt-2 mt-2">
                <div className="flex justify-between font-semibold text-text text-sm">
                  <span>Total</span>
                  <span className="tabular-nums">
                    ${(totalAmount + 2.99 + totalAmount * 0.08).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="bg-surface rounded-xl border border-border-light p-4 mb-4">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Delivery address
            </h2>
            <Input
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="Enter your delivery address"
              required
            />
          </div>

          {/* Payment method */}
          <div className="bg-surface rounded-xl border border-border-light p-4 mb-6">
            <h2 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              Payment method
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "card", label: "Card", icon: CreditCard },
                { value: "cash", label: "Cash", icon: Banknote },
                { value: "wallet", label: "Wallet", icon: Wallet },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 ${
                    paymentMethod === method.value
                      ? "border-accent bg-accent-light"
                      : "border-border hover:border-zinc-300"
                  }`}
                >
                  <method.icon
                    className={`w-5 h-5 ${
                      paymentMethod === method.value ? "text-accent" : "text-text-muted"
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-xs font-medium ${
                      paymentMethod === method.value ? "text-accent" : "text-text-muted"
                    }`}
                  >
                    {method.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            variant="accent"
            className="w-full"
            size="lg"
            isLoading={isSubmitting}
          >
            {isSubmitting
              ? "Placing order..."
              : `Place order · $${(totalAmount + 2.99 + totalAmount * 0.08).toFixed(2)}`}
          </Button>
        </form>
      </div>
    </div>
  );
}
