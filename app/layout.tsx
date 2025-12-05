import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Life Insurance Quote | AI-Powered Automation",
  description: "Get instant Transamerica life insurance quotes using AI-powered browser automation. Fast, accurate term life quotes for insurance agents.",
  keywords: ["life insurance", "quote", "Transamerica", "automation", "AI", "term life"],
  authors: [{ name: "Insurance Automation Demo" }],
  openGraph: {
    title: "Life Insurance Quote | AI-Powered Automation",
    description: "Get instant Transamerica life insurance quotes using AI-powered browser automation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
