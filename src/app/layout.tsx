import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Inter, Rajdhani } from "next/font/google";
import { SosSync } from "@/components/sos-sync";
import { DemoSeed } from "@/components/demo-seed";
import { ConnectivityBanner } from "@/components/connectivity-banner";
import { MotionProvider } from "@/components/motion-provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  applicationName: "Aapda Saarthi",
  title: "Aapda Saarthi - AI Disaster Response Command Center",
  description:
    "AI-powered flood response intelligence: live risk mapping, evacuation routing, resource allocation and multilingual alerting.",
  appleWebApp: {
    capable: true,
    title: "Aapda Saarthi",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#060a10",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${inter.variable} ${rajdhani.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <div className="ambient-bg" aria-hidden />
        <div className="rain-grid" aria-hidden />
        <div className="ambient-blob" aria-hidden style={{ top: "-10%", left: "5%", width: "600px", height: "600px", background: "rgba(0,180,216,0.08)" }} />
        <div className="ambient-blob" aria-hidden style={{ bottom: "-10%", right: "5%", width: "500px", height: "500px", background: "rgba(255,59,92,0.05)", animationDelay: "7s" }} />
        <MotionProvider>
          <ConnectivityBanner />
          <SosSync />
          <DemoSeed />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
