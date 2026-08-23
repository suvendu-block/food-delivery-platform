"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { orderApi, type Order } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { OrderCardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Package, Clock, CheckCircle, XCircle, Truck, ChefHat } from "lucide-react";
import Link from "next/link";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "success" | "warning" | "error" | "info";
    icon: typeof Clock;
  }
> = {
  pending: { label: "Pending", variant: "warning", icon: Clock },
  confirmed: { label: "Confirmed", variant: "info", icon: CheckCircle },
  preparing: { label: "Preparing", variant: "info", icon: ChefHat },
  out_for_delivery: { label: "On the way", variant: "info", icon: Truck },
  delivered: { label: "Delivered", variant: "success", icon: CheckCircle },
  cancelled: { label: "Cancelled", variant: "error", icon: XCircle },
};

export function OrdersContent() {
  const { token } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/login");
      return;
    }

    const fetchOrders = async () => {
      try {
        const response = await orderApi.getUserOrders(token);
        setOrders(response.data.orders);
      } catch {
        console.error("Failed to load orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [token, router]);

  if (isLoading) {
    return (
      <div className="container-tight py-8">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <OrderCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-tight py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-semibold text-text mb-6">Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-surface rounded-2xl border border-border-light">
            <div className="w-14 h-14 mx-auto bg-zinc-100 rounded-2xl flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-text-muted" strokeWidth={1.5} />
            </div>
            <h2 className="text-base font-semibold text-text mb-1">No orders yet</h2>
            <p className="text-sm text-text-muted mb-5">
              Your order history will appear here
            </p>
            <Link href="/restaurants">
              <Button variant="accent" size="md">
                Browse restaurants
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = status.icon;

              return (
                <div
                  key={order._id}
                  className="bg-surface rounded-xl border border-border-light p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
                      <StatusIcon className="w-5 h-5 text-text-muted" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-medium text-text">
                          Order #{order._id.slice(-6).toUpperCase()}
                        </h3>
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-text-muted">
                        {formatDate(order.createdAt)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {order.items.length} item{order.items.length !== 1 ? "s" : ""}
                        {typeof order.restaurantId === "object" && (
                          <> from {order.restaurantId.name}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-text tabular-nums">
                        {formatCurrency(order.totalAmount)}
                      </p>
                      <p className="text-[11px] text-text-muted capitalize">
                        {order.paymentMethod}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
