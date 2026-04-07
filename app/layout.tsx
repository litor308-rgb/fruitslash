import type { Metadata, Viewport } from "next";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "FruitSlash | Slash Fruits on Base",
  description:
    "A fast-paced fruit slashing game on the Base blockchain. Slash fruits, dodge bombs, compete for the top of the leaderboard, and earn rewards.",
  openGraph: {
    title: "FruitSlash | Slash Fruits on Base",
    description:
      "Slash fruits, dodge bombs, and compete on-chain. Built on Base.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FruitSlash | Slash Fruits on Base",
    description:
      "Slash fruits, dodge bombs, and compete on-chain. Built on Base.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#1A0A2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fredoka+One&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-game-bg text-white antialiased font-sans min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
