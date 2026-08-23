import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "FreshBite — Fresh Food, Delivered Fast",
    template: "%s | FreshBite",
  },
  description:
    "Your favorite local restaurants, ready to order. From kitchen to your door in minutes.",
  keywords: ["food delivery", "restaurants", "online ordering", "fresh food", "delivery"],
  authors: [{ name: "FreshBite" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#E8553D",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable}`}>
      <body className="min-h-screen bg-background text-text font-body antialiased">
        {children}
      </body>
    </html>
  );
}
