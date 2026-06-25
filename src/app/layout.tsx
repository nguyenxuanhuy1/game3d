import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://nostress.online"),
  title: {
    default: "No Stress | Immersive 3D Stress Relief Simulator",
    template: "%s | No Stress",
  },
  description: "A first-person interactive 3D simulator designed for satisfying stress relief. Wash a car, water plants, and relax in a beautifully minimalist sensory environment.",
  keywords: [
    "stress relief",
    "3d simulator",
    "relaxation",
    "satisfying games",
    "interactive environment",
    "first person simulator",
    "zen",
    "mindfulness",
    "car wash game",
    "plant watering",
  ],
  authors: [{ name: "No Stress Team" }],
  creator: "No Stress Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://nostress.online",
    title: "No Stress | Immersive 3D Stress Relief Simulator",
    description: "Relax, interact, and wash away stress in a beautiful first-person 3D simulator.",
    siteName: "No Stress",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "No Stress - 3D Stress Relief Simulator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "No Stress | Immersive 3D Stress Relief Simulator",
    description: "Relax, interact, and wash away stress in a beautiful first-person 3D simulator.",
    images: ["/og-image.png"],
    creator: "@nostress_online",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full bg-zinc-950 text-zinc-50 overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
