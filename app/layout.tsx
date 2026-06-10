import type { Metadata, Viewport } from "next";
import { DM_Sans } from "next/font/google";
import { ServiceWorkerRegister } from "./sw-register";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Smart Menu",
  description: "Menu QR dynamique pour restaurants",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Smart Menu",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2d6a4f",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${dmSans.variable} min-h-dvh font-sans`}>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
