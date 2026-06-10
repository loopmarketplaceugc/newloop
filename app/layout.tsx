import type { Metadata } from "next";
import "./globals.css";
import { ToastViewport } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: { default: "MCC — The Marketplace for Content Creation", template: "%s · MCC" },
  description:
    "UGC creators and brands, matched. AI scripting, auto-contracts, escrow payments, and delivery tracking in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
