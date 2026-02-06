import type { Metadata } from "next";
import { Fraunces, Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LeadFlow Pro | Swiss Lead Intelligence",
  description: "Advanced lead discovery and website generation for the Swiss market.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${fraunces.variable} ${outfit.variable} ${geistMono.variable} font-sans antialiased h-screen flex bg-background text-foreground overflow-hidden luxury-gradient`}
      >
        <div className="noise-overlay" />
        {children}
      </body>
    </html>
  );
}
