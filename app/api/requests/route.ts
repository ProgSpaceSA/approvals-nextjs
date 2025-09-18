import { NextRequest, NextResponse } from 'next/server'
import { getSession, requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createRequestSchema, requestsQuerySchema } from '@/lib/validations'
import { type ApiResponse, type PaginatedResponse, type RequestListItem } from '@/types'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth()
    
    // Only executives can create requests
    if (session.user.role !== 'EXECUTIVE') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only executives can create requests',
        },
      }, { status: 403 })
    }

    const body = await request.json()
    const validation = createRequestSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          fieldErrors: validation.error.flatten().fieldErrors as Record<string, string>,
        },
      }, { status: 400 })
    }

    const { title, description, suggestions } = validation.data

    // Create request with suggestions in a transaction
    const result = await db.$transaction(async (tx) => {
      const newRequest = await tx.request.create({
        data: {
          title,
          description,
          createdById: session.user.id,
          suggestions: {
            create: suggestions,
          },
        },
        include: {
          suggestions: true,
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          requestId: newRequest.id,
          action: 'REQUEST_CREATED',
          metadata: {
            title,
            suggestionsCount: suggestions.length,
          },
        },
      })

      return newRequest
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    }, { status: 201 })

  } catch (error) {
    console.error('Create request error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create request',
      },
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth()
    const { searchParams } = new URL(request.url)
    
    const queryValidation = requestsQuerySchema.safeParse(Object.fromEntries(searchParams))
    if (!queryValidation.success) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
        },
      }, { status: 400 })
    }

    const { status, q, page, pageSize } = queryValidation.data
    const offset = (page - 1) * pageSize

    // Build where clause based on role and filters
    const where: any = {}
    
    // Role-based filtering
    if (session.user.role === 'EXECUTIVE') {
      // Executives see their own requests plus decisions on their requests
      where.createdById = session.user.id
    }
    // CEOs see all requests

    // Status filter
    if (status) {
      where.status = status
    }

    // Search filter
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const total = await db.request.count({ where })

    // Get requests with pagination
    const requests = await db.request.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        decidedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            suggestions: true,
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

    const response: PaginatedResponse<RequestListItem> = {
      data: requests,
      meta: {
        page,
        pageSize,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    }

    return NextResponse.json<ApiResponse<PaginatedResponse<RequestListItem>>>({
      success: true,
      data: response,
    })

  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch requests',
      },
    }, { status: 500 })
  }
}
