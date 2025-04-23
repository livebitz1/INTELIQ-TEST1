import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/toaster";
import { Notifications } from "@/components/Notifications";
import { NotificationToast } from "@/components/NotificationToast";

export const metadata: Metadata = {
  title: "INTELIQ",
  description: "AI-powered Web3 wallet with natural language transaction support",
  icons: {
    icon: [
      { url: "/logo.webp", type: "image/webp" }
    ],
    apple: [
      { url: "/logo.webp", type: "image/webp" }
    ],
    shortcut: [
      { url: "/logo.webp", type: "image/webp" }
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "/logo.webp",
      }
    ]
  },
  manifest: "/manifest.json",
  openGraph: {
    images: [
      {
        url: "/logo.webp",
        width: 800,
        height: 600,
        alt: "INTELIQ Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/logo.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
          <Toaster />
          <Notifications />
          <NotificationToast />
        </Providers>
      </body>
    </html>
  );
}
