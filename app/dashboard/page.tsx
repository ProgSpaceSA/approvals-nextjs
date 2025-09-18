'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
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
      setError(err instanceof Error ? err.message : 'Failed to fetch requests')
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

  if (session?.user.role !== 'CEO') {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-red-600">Access denied. CEO role required.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">CEO Dashboard</h1>
            <p className="text-muted-foreground">Review and approve requests from executives</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.processed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" variant="outline">
                  Search
                </Button>
              </form>

              <div className="flex gap-2">
                <Button
                  variant={statusFilter === '' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('')}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('PENDING')}
                >
                  Pending
                </Button>
                <Button
                  variant={statusFilter === 'PROCESSED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('PROCESSED')}
                >
                  Processed
                </Button>
                <Button
                  variant={statusFilter === 'REJECTED' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusFilter('REJECTED')}
                >
                  Rejected
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
                <p>Error: {error}</p>
                <Button onClick={fetchRequests} className="mt-2">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : requests.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No requests found</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Link
                          href={`/requests/${request.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {request.title}
                        </Link>
                        <StatusBadge status={request.status} />
                        {request.status === 'PENDING' && (
                          <Badge variant="outline" className="text-amber-600">
                            Needs Review
                          </Badge>
                        )}
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {request.description}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>By {request.createdBy.name}</span>
                        <span>{request._count.suggestions} suggestions</span>
                        <span>{formatDateRelative(request.createdAt)}</span>
                        {request.decidedBy && (
                          <span>Decided by {request.decidedBy.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/requests/${request.id}`}>
                        <Button
                          variant={request.status === 'PENDING' ? 'default' : 'outline'}
                          size="sm"
                        >
                          {request.status === 'PENDING' ? 'Review' : 'View'}
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
