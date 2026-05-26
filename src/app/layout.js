import './globals.css';
import { Cinzel, Inter } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Obsidian Parfums | Perfumes Árabes Premium',
  description: 'A maior coleção de perfumes árabes exclusivos do Brasil. Descubra fragrâncias de alta fixação e elegância ímpar.',
  keywords: 'perfumes árabes, fragrâncias de luxo, obsidian parfums, perfumaria premium, vitória da conquista',
  openGraph: {
    title: 'Obsidian Parfums | Boutique de Luxo',
    description: 'Fragrâncias árabes exclusivas com entrega em todo o Brasil.',
    url: 'https://obsidianparfums.com.br',
    siteName: 'Obsidian Parfums',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={`${cinzel.variable} ${inter.variable}`}>
        {children}
      </body>
    </html>
  );
}
