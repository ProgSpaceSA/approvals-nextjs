'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { Pagination } from '@/components/ui/pagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { CreateRequestDialog } from '@/components/requests/create-request-dialog'
import { Plus, FileText, Clock, CheckCircle, XCircle, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDate, formatDateRelative, truncateText } from '@/lib/utils'
import { type RequestListItem, type PaginatedResponse, type ApiResponse } from '@/types'

export default function MyRequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<RequestListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
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
  }, [currentPage])

  useEffect(() => {
    fetchStats()
  }, [])

  const handleRequestCreated = () => {
    setShowCreateDialog(false)
    fetchRequests()
    fetchStats()
  }

  const getDecisionSummary = (request: RequestListItem) => {
    if (request.status === 'PENDING') {
      return 'Awaiting CEO review'
    }

    if (request.status === 'REJECTED') {
      return `Rejected by ${request.decidedBy?.name || 'CEO'}`
    }

    // For processed requests, we'd need more data to show the chosen suggestion or other decision
    return `Approved by ${request.decidedBy?.name || 'CEO'}`
  }

  if (session?.user.role !== 'EXECUTIVE') {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-red-600">Access denied. Executive role required.</p>
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
            <h1 className="text-3xl font-bold">My Requests</h1>
            <p className="text-muted-foreground">Create and track your approval requests</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
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
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
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
                <p className="text-lg mb-2">No requests yet</p>
                <p className="mb-4">Create your first request to get started</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Request
                </Button>
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
                      </div>

                      <p className="text-muted-foreground mb-3 line-clamp-2">
                        {truncateText(request.description, 200)}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <span>{request._count.suggestions} suggestions</span>
                        <span>Created {formatDateRelative(request.createdAt)}</span>
                        {request.decidedAt && (
                          <span>Decided {formatDateRelative(request.decidedAt)}</span>
                        )}
                      </div>

                      <p className="text-sm font-medium">
                        {getDecisionSummary(request)}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <Link href={`/requests/${request.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
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

        {/* Create Request Dialog */}
        <CreateRequestDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onRequestCreated={handleRequestCreated}
        />
      </div>
    </MainLayout>
  )
}
