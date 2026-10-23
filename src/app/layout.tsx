import type { Metadata, Viewport } from "next";
import { Geist, Noto_Nastaliq_Urdu, Playfair_Display, Poppins } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  weight: ["400", "700"],
});

// Used by the brand kit's "Classic" and "Bold" font pairs on slides and post images.
const classic = Playfair_Display({
  variable: "--font-classic",
  subsets: ["latin"],
  weight: ["600", "700"],
});

const bold = Poppins({
  variable: "--font-bold",
  subsets: ["latin"],
  weight: ["600", "800"],
});

export const metadata: Metadata = {
  title: "BrandBuddy AI – English, Urdu & Roman Urdu marketing content",
  description:
    "Generate captions, product descriptions, hashtags and campaign ideas in English, Urdu and Roman Urdu for your small business.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${nastaliq.variable} ${classic.variable} ${bold.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
