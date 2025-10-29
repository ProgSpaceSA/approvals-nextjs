'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useSession } from 'next-auth/react'
import { useTranslations } from 'next-intl'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Filter, FileText, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateRelative } from '@/lib/utils'
import { type RequestListItem, type RequestStatus, type PaginatedResponse, type ApiResponse } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const locale = useLocale()
  const t = useTranslations('dashboard')
  const tCommon = useTranslations('common')
  const [requests, setRequests] = useState<RequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RequestStatus | ''>('')
  const [stats, setStats] = useState({
    pending: 0,
    processed: 0,
    rejected: 0,
    total: 0,
  })

  const fetchRequests = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: '10',
      })

      if (searchQuery) {
        params.append('q', searchQuery)
      }

      if (statusFilter) {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/requests?${params}`)
      const result: ApiResponse<PaginatedResponse<RequestListItem>> = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      setRequests(result.data.data)
      setTotalPages(result.data.meta.totalPages)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch stats for all statuses
      const [pendingRes, processedRes, rejectedRes] = await Promise.all([
        fetch('/api/requests?status=PENDING&pageSize=1'),
        fetch('/api/requests?status=PROCESSED&pageSize=1'),
        fetch('/api/requests?status=REJECTED&pageSize=1'),
      ])

      const [pending, processed, rejected] = await Promise.all([
        pendingRes.json() as Promise<ApiResponse<PaginatedResponse<RequestListItem>>>,
        processedRes.json() as Promise<ApiResponse<PaginatedResponse<RequestListItem>>>,
        rejectedRes.json() as Promise<ApiResponse<PaginatedResponse<RequestListItem>>>,
      ])

      if (pending.success && processed.success && rejected.success) {
        const pendingCount = pending.data.meta.total
        const processedCount = processed.data.meta.total
        const rejectedCount = rejected.data.meta.total

        setStats({
          pending: pendingCount,
          processed: processedCount,
          rejected: rejectedCount,
          total: pendingCount + processedCount + rejectedCount,
        })
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [currentPage, searchQuery, statusFilter])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchRequests()
  }

  const handleStatusFilter = (status: RequestStatus | '') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  useEffect(() => {
    if (session && session.user.role !== 'CEO') {
      router.replace(`/${locale}/my-requests`)
    }
  }, [session, router, locale])

  if (!session || session.user.role !== 'CEO') return null

  return (
    <MainLayout>
      <div className="space-y-6 pb-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t('title')}
            </h1>
            <p className="text-muted-foreground text-lg">{t('subtitle')}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('totalRequests')}</CardTitle>
              <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('pending')}</CardTitle>
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('processed')}</CardTitle>
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.processed}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('rejected')}</CardTitle>
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-11 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-all"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all"
                >
                  {tCommon('search')}
                </Button>
              </form>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('')}
                  className={statusFilter === '' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white' : ''}
                >
                  {tCommon('all')}
                </Button>
                <Button
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('PENDING')}
                  className={statusFilter === 'PENDING' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
                >
                  {t('pending')}
                </Button>
                <Button
                  variant={statusFilter === 'PROCESSED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('PROCESSED')}
                  className={statusFilter === 'PROCESSED' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                >
                  {t('processed')}
                </Button>
                <Button
                  variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('REJECTED')}
                  className={statusFilter === 'REJECTED' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                  {t('rejected')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-red-600">
                <p>{t('error')}: {error}</p>
                <Button onClick={fetchRequests} className="mt-2">
                  {t('tryAgain')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('noRequests')}</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card 
                key={request.id} 
                className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:scale-[1.01]"
              >
                <CardContent className="pt-6 pb-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3 flex-wrap">
                        <Link
                          href={`/requests/${request.id}`}
                          className="text-lg font-semibold hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          {request.title}
                        </Link>
                        <StatusBadge status={request.status} />
                        {request.status === 'PENDING' && (
                          <Badge variant="outline" className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700">
                            {t('needsReview')}
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-4 line-clamp-2 text-sm leading-relaxed">
                        {request.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          {t('by')} <span className="font-medium">{request.createdBy.name}</span>
                        </span>
                        <span>{request._count.suggestions} {t('suggestions')}</span>
                        <span>{formatDateRelative(request.createdAt)}</span>
                        {request.decidedBy && (
                          <span>{t('decidedBy')} {request.decidedBy.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/requests/${request.id}`}>
                        <Button
                          variant={request.status === 'PENDING' ? 'default' : 'outline'}
                          size="sm"
                          className={request.status === 'PENDING' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all' : ''}
                        >
                          {request.status === 'PENDING' ? t('review') : t('view')}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        )}
      </div>
    </MainLayout>
  )
}
