import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { auditQuerySchema } from '@/lib/validations'
import { type ApiResponse, type PaginatedResponse, type AuditLogWithRelations } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const queryValidation = auditQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryValidation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
        },
      }, { status: 400 })
    }

    const { requestId, page, pageSize } = queryValidation.data
    const offset = (page - 1) * pageSize

    // Build where clause based on role and filters
    const where: any = {}
    
    // Request ID filter
    if (requestId) {
      where.requestId = requestId
      
      // If executive is requesting audit logs for a specific request,
      // ensure they own that request
      if (session.user.role === 'EXECUTIVE') {
        const requestData = await db.request.findUnique({
          where: { id: requestId },
          select: { createdById: true },
        })
        
        if (!requestData || requestData.createdById !== session.user.id) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'You can only view audit logs for your own requests',
            },
          }, { status: 403 })
        }
      }
    } else if (session.user.role === 'EXECUTIVE') {
      // If no specific request ID, executives can only see logs for their requests
      const userRequests = await db.request.findMany({
        where: { createdById: session.user.id },
        select: { id: true },
      })
      
      const requestIds = userRequests.map(r => r.id)
      where.requestId = { in: requestIds }
    }

    // Get total count for pagination
    const total = await db.auditLog.count({ where })

    // Get audit logs with pagination
    const auditLogs = await db.auditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        request: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip: offset,
      take: pageSize,
    })

    const totalPages = Math.ceil(total / pageSize)

    const response: PaginatedResponse<AuditLogWithRelations> = {
      data: auditLogs,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<AuditLogWithRelations>>>({
      success: true,
      data: response,
    })

  } catch (error) {
    console.error('Get audit logs error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch audit logs',
      },
    }, { status: 500 })
  }
}
