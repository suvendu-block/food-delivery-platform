"use client";

import Link from "next/link";
import { Pizza, Salad, Coffee, Cake, Truck, Shield, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const categories = [
  { name: "Italian", icon: Pizza, color: "bg-red-50 text-red-600", emoji: "🍝" },
  { name: "Healthy", icon: Salad, color: "bg-emerald-50 text-emerald-600", emoji: "🥗" },
  { name: "Coffee", icon: Coffee, color: "bg-amber-50 text-amber-600", emoji: "☕" },
  { name: "Desserts", icon: Cake, color: "bg-pink-50 text-pink-600", emoji: "🍰" },
];

const features = [
  {
    icon: Truck,
    title: "Fast delivery",
    description: "Average delivery under 30 minutes from kitchen to door.",
  },
  {
    icon: Shield,
    title: "Secure checkout",
    description: "Your payment information is always protected and encrypted.",
  },
  {
    icon: Clock,
    title: "Live tracking",
    description: "Follow your order in real-time from preparation to arrival.",
  },
];

export function Categories() {
  return (
    <>
      {/* Categories */}
      <section className="py-16 bg-white border-y border-border-light">
        <div className="container-tight">
          <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight text-center mb-8">
            What are you craving?
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={`/restaurants?cuisine=${category.name}`}
                className="group"
              >
                <div className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border-light bg-background hover:bg-surface hover:border-zinc-200 hover:shadow-sm transition-all duration-200">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center ${category.color} group-hover:scale-110 transition-transform duration-200`}
                  >
                    <category.icon className="w-6 h-6" strokeWidth={1.5} />
                  </div>
                  <span className="text-sm font-medium text-text group-hover:text-accent transition-colors">
                    {category.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="container-tight">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-text tracking-tight">
              Why FreshBite?
            </h2>
            <p className="text-sm text-text-muted mt-1.5">
              Everything you need for a great ordering experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center p-6 bg-surface rounded-xl border border-border-light"
              >
                <div className="w-11 h-11 mx-auto rounded-xl bg-accent-light flex items-center justify-center mb-4">
                  <feature.icon className="w-5 h-5 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-text text-sm mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 text-center">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 bg-surface rounded-2xl border border-border-light">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-text">
                  Ready to order?
                </h3>
                <p className="text-sm text-text-muted">
                  Join thousands of happy customers
                </p>
              </div>
              <Link href="/register">
                <Button variant="accent" size="md">
                  Get started
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
