import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { type ApiResponse, type RequestDetail } from '@/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAuth()
    const { id } = await context.params

    // Validate ID format
    if (!id || typeof id !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'INVALID_ID',
          message: 'Invalid request ID',
        },
      }, { status: 400 })
    }

    const requestData = await db.request.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        decidedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        suggestions: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        chosenSuggestion: true,
        auditLogs: {
          include: {
            actor: {
              select: {
                id: true,
                name: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        _count: {
          select: {
            suggestions: true,
          },
        },
      },
    })

    if (!requestData) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Request not found',
        },
      }, { status: 404 })
    }

    // Role-based access control
    if (session.user.role === 'EXECUTIVE') {
      // Executives can only view their own requests
      if (requestData.createdById !== session.user.id) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only view your own requests',
          },
        }, { status: 403 })
      }
    }

    return NextResponse.json<ApiResponse<RequestDetail>>({
      success: true,
      data: requestData,
    })

  } catch (error) {
    console.error('Get request error:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to fetch request',
      },
    }, { status: 500 })
  }
}
