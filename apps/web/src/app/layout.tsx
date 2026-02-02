import React from 'react';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header, Footer } from '@/components/layout';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Store77 Price Tracker — Отслеживание цен на товары',
    template: '%s | Store77 Price Tracker',
  },
  description:
    'Каталог товаров с автоматическим пересчетом цен по актуальному курсу USDT. Отслеживайте цены на электронику, гаджеты и аксессуары.',
  keywords: [
    'магазин',
    'электроника',
    'цены',
    'курс доллара',
    'USDT',
    'смартфоны',
    'гаджеты',
    'аксессуары',
    'сравнение цен',
  ],
  authors: [{ name: 'Store77 Price Tracker' }],
  creator: 'Store77 Price Tracker',
  publisher: 'Store77 Price Tracker',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: siteUrl,
    siteName: 'Store77 Price Tracker',
    title: 'Store77 Price Tracker — Отслеживание цен на товары',
    description:
      'Каталог товаров с автоматическим пересчетом цен по актуальному курсу USDT. Отслеживайте цены на электронику, гаджеты и аксессуары.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Store77 Price Tracker',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Store77 Price Tracker — Отслеживание цен на товары',
    description: 'Каталог товаров с автоматическим пересчетом цен по актуальному курсу USDT.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="canonical" href={siteUrl} />
      </head>
      <body className={inter.className}>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
