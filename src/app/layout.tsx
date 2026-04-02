import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/layout/Navbar";
import SearchSection from "@/components/layout/SearchSection";
import AppBottomNav from "@/components/layout/AppBottomNav";

export const metadata: Metadata = {
  title: "myhipa.com - affordable and adorable",
  description:
    "Buy and sell products securely on myhipa.com. Affordable and adorable marketplace for Rwanda. Shop with escrow protection from verified sellers.",
  keywords: [
    "e-commerce",
    "marketplace",
    "buy",
    "sell",
    "Rwanda",
    "Kigali",
    "online shopping",
  ],
  icons: {
    icon: "/myhipa-logo.svg",
    apple: "/myhipa-logo.svg",
  },
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased min-h-screen flex flex-col bg-gray-50 pb-20 md:pb-0 pt-32 md:pt-24">
        <Providers>
          <Navbar />
          <SearchSection />
          <main className="flex-1">{children}</main>
          <AppBottomNav />
        </Providers>
      </body>
    </html>
  );
}
