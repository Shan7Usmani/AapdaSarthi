import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SosSync } from "@/components/sos-sync";
import { DemoSeed } from "@/components/demo-seed";
import { ConnectivityBanner } from "@/components/connectivity-banner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "Aapda Saarthi",

  title: "Aapda Saarthi - AI Disaster Response Command Center",

  description:
    "AI-powered flood response intelligence: live risk mapping, evacuation routing, resource allocation and multilingual alerting.",

  appleWebApp: {
    capable: true,
    title: "Aapda Saarthi",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#0788D1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <ConnectivityBanner />
        <SosSync />
        <DemoSeed />
        {children}
      </body>
    </html>
  );
}
