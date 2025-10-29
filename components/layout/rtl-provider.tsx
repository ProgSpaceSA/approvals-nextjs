'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RTLProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  // Default is RTL; only switch to LTR for English pages
  const isEnglish = pathname?.startsWith('/en') || pathname?.startsWith('/en/')
  const isRTL = !isEnglish

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
      document.documentElement.setAttribute('lang', isRTL ? 'ar' : 'en')
      document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    }
  }, [isRTL, pathname])

  return <>{children}</>
}

