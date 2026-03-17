import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KRF Consumer Simulator | R&D Formulation Testing",
  description: "AI-powered consumer panel simulation for Kate's Real Food snack bar formulations",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">{children}</body>
    </html>
  );
}
