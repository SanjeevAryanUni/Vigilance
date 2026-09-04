import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import MobileBottomNav from "@/components/MobileBottomNav";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const viewport: Viewport = {
  themeColor: "#030712",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VIGILANCE — WebGIS Urban Road Intelligence Platform (SIH 2026)",
  description: "AI-Powered Mobile Urban Road Intelligence Platform Using Public Transport Fleet • Bharat Electronics Limited (BEL)",
  openGraph: {
    title: "VIGILANCE — WebGIS Urban Road Intelligence Platform",
    description: "AI-Powered Mobile Urban Road Intelligence Platform Using Public Transport Fleet",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-950 text-slate-100 pb-14 md:pb-0`}
      >
        {children}
        <MobileBottomNav />
      </body>
    </html>
  );
}
