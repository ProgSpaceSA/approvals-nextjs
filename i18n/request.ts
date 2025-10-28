import { getRequestConfig } from 'next-intl/server'

// Can be imported from a shared config
const locales = ['ar', 'en']

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = !locale || !locales.includes(locale as any) ? 'ar' : (locale as string)

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default
  }
})
