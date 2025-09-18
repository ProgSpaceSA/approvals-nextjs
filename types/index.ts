import { type User, type Request, type Suggestion, type AuditLog, type Role, type RequestStatus, type AuditAction } from '@prisma/client'

// Database types with relations
export type UserWithRelations = User & {
  createdRequests?: RequestWithRelations[]
  decidedRequests?: RequestWithRelations[]
}

export type RequestWithRelations = Request & {
  createdBy: User
  decidedBy?: User | null
  suggestions: Suggestion[]
  chosenSuggestion?: Suggestion | null
  auditLogs?: AuditLogWithRelations[]
}

export type AuditLogWithRelations = AuditLog & {
  actor: User
  request?: Request
}

// Extended types for UI
export type RequestListItem = {
  id: string
  title: string
  description: string
  status: RequestStatus
  createdAt: Date
  updatedAt: Date
  decidedAt: Date | null
  createdBy: {
    id: string
    name: string
    email: string
  }
  decidedBy?: {
    id: string
    name: string
  } | null
  _count: {
    suggestions: number
  }
}

export type RequestDetail = RequestWithRelations & {
  _count: {
    suggestions: number
  }
}

// API response types
export type ApiResponse<T = unknown> = {
  success: true
  data: T
} | {
  success: false
  error: {
    code: string
    message: string
    fieldErrors?: Record<string, string>
  }
}

export type PaginatedResponse<T> = {
  data: T[]
  meta: {
    page: number
    pageSize: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Session and auth types
export type SessionUser = {
  id: string
  email: string
  name: string
  role: Role
}

// Utility types
export { type Role, type RequestStatus, type AuditAction }

export type RequestFormData = {
  title: string
  description: string
  suggestions: Array<{
    label: string
    details: string
  }>
}
