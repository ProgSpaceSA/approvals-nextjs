import {NextIntlClientProvider} from 'next-intl'
import {getMessages, setRequestLocale} from 'next-intl/server'

interface LocaleLayoutProps {
  children: React.ReactNode
  params: { locale: string }
}

export default async function LocaleLayout({
  children,
  params
}: LocaleLayoutProps) {
  const { locale } = params
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
