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

import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '4557237254506270');
          fbq('track', 'PageView');
        `}} />
      </head>
      <body className={`${cinzel.variable} ${inter.variable}`}>
        {children}
        <noscript>
          <img height="1" width="1" style={{ display: 'none' }} src="https://www.facebook.com/tr?id=4557237254506270&ev=PageView&noscript=1" alt="" />
        </noscript>
      </body>
    </html>
  );
}
