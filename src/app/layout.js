import "./globals.css";
import { Cinzel, Inter } from "next/font/google";

const cinzel = Cinzel({ subsets: ["latin"], variable: "--font-cinzel" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Obsidian Parfums | Combos de Decantes",
  description: "Combos premium com 3 decantes selecionados pela Obsidian Parfums.",
  keywords: "decantes, perfumes arabes, fragrancias de luxo, obsidian parfums",
  openGraph: {
    title: "Obsidian Parfums | Combos de Decantes",
    description: "Experimente fragrancias de luxo em combos de 3 decantes.",
    url: "https://obsidianparfums.com.br",
    siteName: "Obsidian Parfums",
    locale: "pt_BR",
    type: "website",
  },
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${cinzel.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
