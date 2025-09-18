'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/ui/status-badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ArrowLeft, Clock, User, CheckCircle, XCircle, FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { type RequestDetail, type ApiResponse, type AuditLogWithRelations } from '@/types'

interface RequestPageProps {
  params: {
    id: string
  }
}

export default function RequestPage({ params }: RequestPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [request, setRequest] = useState<RequestDetail | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [otherDecision, setOtherDecision] = useState('')
  const [showOtherForm, setShowOtherForm] = useState(false)

  const isCEO = session?.user.role === 'CEO'
  const canTakeAction = isCEO && request?.status === 'PENDING'

  const fetchRequest = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/requests/${params.id}`)
      const result: ApiResponse<RequestDetail> = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      setRequest(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch request')
    } finally {
      setLoading(false)
    }
  }

  const fetchAuditLogs = async () => {
    try {
      const response = await fetch(`/api/audit?requestId=${params.id}`)
      const result: ApiResponse<{ data: AuditLogWithRelations[] }> = await response.json()

      if (result.success) {
        setAuditLogs(result.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch audit logs:', err)
    }
  }

  useEffect(() => {
    fetchRequest()
    fetchAuditLogs()
  }, [params.id])

  const handleChooseSuggestion = async (suggestionId: string) => {
    try {
      setActionLoading(suggestionId)

      const response = await fetch(`/api/requests/${params.id}/choose`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ suggestionId }),
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      // Refresh the request data
      await fetchRequest()
      await fetchAuditLogs()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to choose suggestion')
    } finally {
      setActionLoading(null)
    }
  }

  const handleOtherDecision = async () => {
    if (!otherDecision.trim()) {
      alert('Please enter a decision')
      return
    }

    try {
      setActionLoading('other')

      const response = await fetch(`/api/requests/${params.id}/other`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otherDecision: otherDecision.trim() }),
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      // Refresh the request data
      await fetchRequest()
      await fetchAuditLogs()
      setOtherDecision('')
      setShowOtherForm(false)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to submit decision')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async () => {
    try {
      setActionLoading('reject')

      const response = await fetch(`/api/requests/${params.id}/reject`, {
        method: 'POST',
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      // Refresh the request data
      await fetchRequest()
      await fetchAuditLogs()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to reject request')
    } finally {
      setActionLoading(null)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REQUEST_CREATED':
        return <FileText className="h-4 w-4" />
      case 'REQUEST_PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'REQUEST_REJECTED':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'OTHER_DECISION':
        return <CheckCircle className="h-4 w-4 text-blue-600" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionText = (action: string, metadata: any) => {
    switch (action) {
      case 'REQUEST_CREATED':
        return 'Created request'
      case 'REQUEST_PROCESSED':
        return metadata?.suggestionLabel ? `Chose suggestion: ${metadata.suggestionLabel}` : 'Processed request'
      case 'REQUEST_REJECTED':
        return 'Rejected request'
      case 'OTHER_DECISION':
        return 'Made custom decision'
      default:
        return action
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </MainLayout>
    )
  }

  if (error || !request) {
    return (
      <MainLayout>
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error || 'Request not found'}</p>
          <Link href={isCEO ? '/dashboard' : '/my-requests'}>
            <Button>Go Back</Button>
          </Link>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href={isCEO ? '/dashboard' : '/my-requests'}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{request.title}</h1>
              <StatusBadge status={request.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User className="h-4 w-4" />
                Created by {request.createdBy.name}
              </span>
              <span>{formatDate(request.createdAt)}</span>
              {request.decidedBy && (
                <span>Decided by {request.decidedBy.name} on {formatDate(request.decidedAt!)}</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{request.description}</p>
              </CardContent>
            </Card>

            {/* Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>Suggestions ({request.suggestions.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {request.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={`p-4 border rounded-lg ${
                      request.chosenSuggestionId === suggestion.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-border'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                          {suggestion.label}
                          {request.chosenSuggestionId === suggestion.id && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                        </h4>
                        <p className="text-muted-foreground whitespace-pre-wrap">
                          {suggestion.details}
                        </p>
                      </div>
                      {canTakeAction && (
                        <Button
                          onClick={() => handleChooseSuggestion(suggestion.id)}
                          disabled={!!actionLoading}
                          size="sm"
                        >
                          {actionLoading === suggestion.id ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            'Choose'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Other Decision */}
            {request.otherDecision && (
              <Card>
                <CardHeader>
                  <CardTitle>Custom Decision</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="whitespace-pre-wrap">{request.otherDecision}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* CEO Actions */}
            {canTakeAction && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Other Decision Form */}
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowOtherForm(!showOtherForm)}
                      disabled={!!actionLoading}
                    >
                      {showOtherForm ? 'Cancel Other Decision' : 'Make Other Decision'}
                    </Button>

                    {showOtherForm && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <Label htmlFor="otherDecision">Your Decision</Label>
                          <Textarea
                            id="otherDecision"
                            placeholder="Enter your custom decision..."
                            value={otherDecision}
                            onChange={(e) => setOtherDecision(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleOtherDecision}
                          disabled={!otherDecision.trim() || !!actionLoading}
                        >
                          {actionLoading === 'other' ? (
                            <LoadingSpinner size="sm" className="mr-2" />
                          ) : null}
                          Submit Decision
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Reject Button */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={!!actionLoading}>
                        {actionLoading === 'reject' ? (
                          <LoadingSpinner size="sm" className="mr-2" />
                        ) : null}
                        Reject Request
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Reject Request</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to reject this request? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleReject}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Reject
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Audit Log */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {auditLogs.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No activity yet</p>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {getActionText(log.action, log.metadata)}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <span>{log.actor.name}</span>
                            <span className="mx-1">•</span>
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
