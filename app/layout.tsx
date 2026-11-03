
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { siteContent } from "@/lib/site-content";
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
  title: {
    default: `${siteContent.brand} | Industrial Automation & Smart Systems`,
    template: `%s | ${siteContent.brand}`,
  },
  description: `${siteContent.brand} specializes in Industrial Automation & Smart Systems. Automate, Optimize, Innovate.`,
  applicationName: siteContent.brand,
  keywords: [siteContent.brand, "Industrial Automation", "Smart Systems", "Engineering", "Automation Solutions"],
  authors: [{ name: siteContent.brand }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
