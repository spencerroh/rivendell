import type { Metadata } from "next";
import localFont from "next/font/local";
import { Geist_Mono } from "next/font/google";
import "./globals.css";

const lgeiText = localFont({
  src: [
    { path: "../../assets/LGEITextTTF-Light.ttf", weight: "300", style: "normal" },
    { path: "../../assets/LGEITextTTF-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../assets/LGEITextTTF-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../assets/LGEITextTTF-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-lgei-text",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rivendell",
  description: "Universal usage log collection and analytics service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${lgeiText.variable} ${geistMono.variable} antialiased font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
