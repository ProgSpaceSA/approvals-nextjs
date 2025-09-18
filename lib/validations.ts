import { z } from 'zod'

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type SignInInput = z.infer<typeof signInSchema>

// Suggestion schema
export const suggestionSchema = z.object({
  label: z.string().min(1, 'Label is required').max(100, 'Label must be 100 characters or less'),
  details: z.string().min(1, 'Details are required').max(1000, 'Details must be 1000 characters or less'),
})

export type SuggestionInput = z.infer<typeof suggestionSchema>

// Request schemas
export const createRequestSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description must be 2000 characters or less'),
  suggestions: z.array(suggestionSchema).min(2, 'At least 2 suggestions are required').max(10, 'Maximum 10 suggestions allowed'),
})

export type CreateRequestInput = z.infer<typeof createRequestSchema>

// Decision schemas
export const chooseSuggestionSchema = z.object({
  suggestionId: z.string().cuid('Invalid suggestion ID'),
})

export type ChooseSuggestionInput = z.infer<typeof chooseSuggestionSchema>

export const otherDecisionSchema = z.object({
  otherDecision: z.string().min(1, 'Decision text is required').max(1000, 'Decision must be 1000 characters or less'),
})

export type OtherDecisionInput = z.infer<typeof otherDecisionSchema>

// Search and pagination schemas
export const requestsQuerySchema = z.object({
  status: z.enum(['PENDING', 'PROCESSED', 'REJECTED']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

export type RequestsQuery = z.infer<typeof requestsQuerySchema>

export const auditQuerySchema = z.object({
  requestId: z.string().cuid('Invalid request ID').optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
})

export type AuditQuery = z.infer<typeof auditQuerySchema>

// API response schemas
export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string()).optional(),
})

export type ApiError = z.infer<typeof apiErrorSchema>

export const paginationMetaSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})

export type PaginationMeta = z.infer<typeof paginationMetaSchema>
