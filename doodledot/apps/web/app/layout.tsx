import type { Metadata } from "next";
import { Fredoka, Outfit } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DoodleDot — Draw. Guess. Laugh.",
  description:
    "A real-time multiplayer drawing and guessing game. Create a room, draw the prompt, and race to guess what your friends are doodling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fredoka.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
