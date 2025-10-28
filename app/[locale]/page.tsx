import Link from 'next/link'
import {getTranslations} from 'next-intl/server'

interface HomePageProps {
  params: { locale: string }
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params
  const tNav = await getTranslations('navigation')
  const tCommon = await getTranslations('common')
  const tAuth = await getTranslations('auth')

  return (
    <main className="min-h-[80vh] bg-gradient-to-b from-white to-slate-50 py-16">
      <div className="container mx-auto px-4">
        <section className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            {tNav('appTitle')}
          </h1>
          <p className="mt-4 text-muted-foreground text-lg">
            {locale === 'ar'
              ? 'أنشئ الطلبات ووافق عليها بسهولة مع سجل تدقيق كامل.'
              : 'Create and approve requests with a complete audit trail.'}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-white shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              {tAuth('signIn')}
            </Link>
            <Link
              href={`/${locale}/my-requests`}
              className="inline-flex items-center rounded-md border px-5 py-2.5 text-foreground hover:bg-secondary"
            >
              {locale === 'ar' ? 'طلباتي' : 'My Requests'}
            </Link>
          </div>
        </section>

        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? 'قرارات مرنة' : 'Flexible Decisions'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'اختر اقتراحاً أو أدخل قراراً مخصصاً أو ارفض الطلب.'
                : 'Choose a suggestion, enter a custom decision, or reject.'}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? 'تتبع كامل' : 'Full Traceability'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'سجل تدقيق يوضح جميع الإجراءات بالتوقيتات.'
                : 'Audit trail capturing every action with timestamps.'}
            </p>
          </div>

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-semibold">
              {locale === 'ar' ? 'واجهة حديثة' : 'Modern UI'}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === 'ar'
                ? 'مصمم بـ Tailwind و shadcn/ui مع دعم RTL.'
                : 'Built with Tailwind and shadcn/ui with RTL support.'}
            </p>
          </div>
        </section>

        <div className="mt-14 text-center text-sm text-muted-foreground">
          <span className="rounded bg-secondary px-2 py-1">
            {tCommon('confirm')} • {locale.toUpperCase()}
          </span>
        </div>
      </div>
    </main>
  )
}
