import type { Metadata, Viewport } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import { ThemeScript } from '@/components/theme/ThemeScript'
import './globals.css'

export const metadata: Metadata = {
  title: '사뿐 — 산책 빙고',
  description: '산책하면서 빙고를 채우는 PWA',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F8F5' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1713' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-canvas text-ink-900">
        <ThemeScript />
        {children}
      </body>
    </html>
  )
}
