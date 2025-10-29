import './globals.css'
import { SessionProvider } from '@/components/providers/session-provider'
import { RTLProvider } from '@/components/layout/rtl-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="font-inter" dir="rtl">
        <RTLProvider>
          <SessionProvider>{children}</SessionProvider>
        </RTLProvider>
      </body>
    </html>
  )
}


