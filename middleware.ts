import createIntlMiddleware from 'next-intl/middleware'
import { NextRequest } from 'next/server'

const locales = ['ar', 'en']
const defaultLocale = 'ar'

const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false
})

export default intlMiddleware

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)']
}