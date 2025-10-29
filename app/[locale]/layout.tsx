import {NextIntlClientProvider} from 'next-intl'
import {getMessages, setRequestLocale} from 'next-intl/server'

export const dynamic = 'force-dynamic'

export default async function LocaleLayout({
  children,
  params
}: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const isRTL = locale === 'ar'
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>{children}</div>
    </NextIntlClientProvider>
  )
}

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ar' }]
}
