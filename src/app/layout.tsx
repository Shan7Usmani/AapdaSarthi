import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SosSync } from "@/components/sos-sync";
import { DemoSeed } from "@/components/demo-seed";
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
  title: "Aapda Saarthi — AI Disaster Response Command Center",
  description:
    "AI-powered flood response intelligence: live risk mapping, evacuation routing, resource allocation and multilingual alerting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SosSync />
        <DemoSeed />
        {children}
      </body>
    </html>
  );
}
