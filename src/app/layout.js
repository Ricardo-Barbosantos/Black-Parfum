import './globals.css';
import { Cinzel, Inter } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], variable: '--font-cinzel' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata = {
  title: 'Obsidian Parfums | Perfumes Árabes Premium',
  description: 'Descubra a essência do luxo. Perfumes árabes de alta fixação e elegância ímpar.',
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
