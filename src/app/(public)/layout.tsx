import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppBottomNav from "@/components/layout/AppBottomNav";

export const metadata: Metadata = {
  title: "Hipa - Shop Smart",
  description: "Buy & sell across Africa",
  themeColor: "#1a1a1a",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="max-w-full overflow-x-hidden">
        {/* Main Content */}
        <main className="pt-20">{children}</main>

        {/* Bottom Navigation */}
        <AppBottomNav />
      </body>
    </html>
  );
}
