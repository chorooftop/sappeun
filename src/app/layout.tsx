import type { Metadata } from 'next'
import 'pretendard/dist/web/variable/pretendardvariable.css'
import './globals.css'

export const metadata: Metadata = {
  title: '사뿐 — 산책 빙고',
  description: '산책하면서 빙고를 채우는 PWA',
}

export const viewport = {
  themeColor: '#3DBC8A',
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
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-canvas text-ink-900">
        {children}
      </body>
    </html>
  )
}
