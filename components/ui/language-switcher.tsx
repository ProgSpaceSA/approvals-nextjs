'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLanguageChange = () => {
    const newLocale = locale === 'ar' ? 'en' : 'ar'
    const pathWithoutLocale = pathname.replace(`/${locale}`, '')
    router.push(`/${newLocale}${pathWithoutLocale}`)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLanguageChange}
      className="flex items-center space-x-1"
    >
      <Globe className="h-4 w-4" />
      <span>{locale === 'ar' ? 'English' : 'العربية'}</span>
    </Button>
  )
}
