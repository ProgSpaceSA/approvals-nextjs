'use client'

import { useEffect, useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations, useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { LanguageSwitcher } from '@/components/ui/language-switcher'
import { signInSchema, type SignInInput } from '@/lib/validations'

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('auth')
  const tNav = useTranslations('navigation')
  const locale = useLocale()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInInput) => {
    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl: `/${locale}/dashboard`,
      })

      if (!result) {
        setError(t('invalidCredentials'))
      } else if (result.error) {
        setError(t('invalidCredentials'))
      } else {
        // Decide destination based on role
        const s = await getSession()
        const role = s?.user?.role
        if (role === 'CEO') {
          router.replace(`/${locale}/dashboard`)
        } else {
          router.replace(`/${locale}/my-requests`)
        }
      }
    } catch (err) {
      setError(t('invalidCredentials'))
    } finally {
      setIsLoading(false)
    }
  }

  // If we were redirected back by NextAuth with an error query, surface it
  useEffect(() => {
    const err = searchParams?.get('error')
    if (!err) return
    // Map common NextAuth errors to a friendly message
    const known = new Set([
      'CredentialsSignin',
      'AccessDenied',
      'Callback',
      'OAuthAccountNotLinked',
      'OAuthCallback',
      'EmailCreateAccount',
      'Verification',
    ])
    if (known.has(err)) {
      setError(t('invalidCredentials'))
    } else {
      setError(t('invalidCredentials'))
    }
  }, [searchParams, t])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {tNav('appTitle')}
            </h1>
            <LanguageSwitcher />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {t('signIn')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('enterCredentials')}
            </p>
          </div>
        </div>

        {/* Sign In Card */}
        <Card className="shadow-xl border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="pt-8 pb-8 px-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('email')}
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('enterEmail')}
                  {...register('email')}
                  disabled={isLoading}
                  className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 animate-in slide-in-from-top-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('password')}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('enterPassword')}
                  {...register('password')}
                  disabled={isLoading}
                  className="h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                />
                {errors.password && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1 animate-in slide-in-from-top-1">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="text-sm text-red-600 dark:text-red-400 text-center p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg animate-in slide-in-from-top-1">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner size="sm" className={locale === 'ar' ? 'ml-2' : 'mr-2'} />
                    {t('signingIn')}
                  </div>
                ) : (
                  t('signIn')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {new Date().getFullYear()} © {tNav('appTitle')}
        </p>
      </div>
    </div>
  )
}
