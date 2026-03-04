import type { Metadata, Viewport } from "next";
import { BottomNav } from "@/components/nav/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Curious",
  description: "An agent that wants to understand you.",
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
      <body className="font-sans antialiased">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
