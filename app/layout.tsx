import type { Metadata } from "next";
import "./globals.css";
import { ToastViewport } from "@/components/ui/toast";
import { AuthHashCatcher } from "@/components/shared/auth-hash-catcher";

export const metadata: Metadata = {
  title: { default: "MCC — The Marketplace for Content Creation", template: "%s · MCC" },
  description:
    "UGC creators and brands, matched. AI scripting, auto-contracts, Stripe payments, and delivery tracking in one workspace.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Space+Grotesk:wght@400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-text-primary">
        {children}
        <AuthHashCatcher />
        <ToastViewport />
      </body>
    </html>
  );
}
