import Link from 'next/link'
import {getTranslations} from 'next-intl/server'
import { ArrowRight, ShieldCheck, Sparkles, Activity } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const tNav = await getTranslations('navigation')
  const tCommon = await getTranslations('common')
  const tAuth = await getTranslations('auth')

  return (
    <main className="min-h-[80vh] py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4">
        {/* Hero */}
        <section className="max-w-4xl mx-auto text-center animate-in fade-in duration-500">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {tNav('appTitle')}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
            {locale === 'ar'
              ? 'منصة موافقات حديثة لإنشاء الطلبات ومراجعتها والموافقة عليها، مع سجل تدقيق كامل ودعم RTL.'
              : 'A modern approvals platform to create, review and approve requests, with full audit trail and RTL support.'}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href={`/${locale}/sign-in`}
              className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
            >
              {tAuth('signIn')}
              <ArrowRight className={locale === 'ar' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
            </Link>
            <Link
              href={`/${locale}/my-requests`}
              className="inline-flex items-center gap-2 rounded-md border px-6 py-3 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 shadow-md hover:shadow-lg transition-all"
            >
              {locale === 'ar' ? 'طلباتي' : 'My Requests'}
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border-0 p-6 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">
                {locale === 'ar' ? 'واجهة حديثة' : 'Modern UI'}
              </h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {locale === 'ar'
                ? 'مصمم بـ Tailwind و shadcn/ui، مع تفاصيل جمالية وحركات سلسة.'
                : 'Crafted with Tailwind and shadcn/ui, with refined aesthetics and smooth interactions.'}
            </p>
          </div>

          <div className="rounded-xl border-0 p-6 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-semibold">
                {locale === 'ar' ? 'تتبع كامل' : 'Full Traceability'}
              </h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {locale === 'ar'
                ? 'سجل تدقيق واضح يوضح جميع الإجراءات بالتوقيتات.'
                : 'Clear audit log capturing every action with precise timestamps.'}
            </p>
          </div>

          <div className="rounded-xl border-0 p-6 shadow-lg hover:shadow-xl transition-all bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              <h3 className="text-lg font-semibold">
                {locale === 'ar' ? 'مرونة القرار' : 'Flexible Decisions'}
              </h3>
            </div>
            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              {locale === 'ar'
                ? 'اختر اقتراحاً، أو أدخل قراراً مخصصاً، أو ارفض الطلب بثقة.'
                : 'Choose a suggestion, submit a custom decision, or reject requests confidently.'}
            </p>
          </div>
        </section>

        {/* Footer chip */}
        <div className="mt-14 text-center text-sm text-muted-foreground">
          <span className="rounded-full bg-white/70 dark:bg-slate-800/70 px-3 py-1 shadow border border-slate-200/70 dark:border-slate-700/50">
            {tNav('appTitle')} • {locale.toUpperCase()}
          </span>
        </div>
      </div>
    </main>
  )
}
