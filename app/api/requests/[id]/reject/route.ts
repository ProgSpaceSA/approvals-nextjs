import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { type ApiResponse } from '@/types'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireRole(['CEO'])
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

    // Process the rejection in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if request exists and is pending
      const requestData = await tx.request.findUnique({
        where: { id },
      })

      if (!requestData) {
        throw new Error('REQUEST_NOT_FOUND')
      }

      if (requestData.status !== 'PENDING') {
        throw new Error('REQUEST_NOT_PENDING')
      }

      // Update the request
      const updatedRequest = await tx.request.update({
        where: { id },
        data: {
          status: 'REJECTED',
          decidedById: session.user.id,
          decidedAt: new Date(),
          chosenSuggestionId: null,
          otherDecision: null,
        },
        include: {
          createdBy: true,
          decidedBy: true,
          suggestions: true,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          requestId: id,
          action: 'REQUEST_REJECTED',
          metadata: {},
        },
      })

      return updatedRequest
    })

    return NextResponse.json<ApiResponse>({
      success: true,
      data: result,
    })

  } catch (error) {
    console.error('Reject request error:', error)

    if (error instanceof Error) {
      switch (error.message) {
        case 'REQUEST_NOT_FOUND':
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Request not found',
            },
          }, { status: 404 })
        
        case 'REQUEST_NOT_PENDING':
          return NextResponse.json<ApiResponse>({
            success: false,
            error: {
              code: 'INVALID_STATUS',
              message: 'Request is not pending',
            },
          }, { status: 400 })
      }
    }

    return NextResponse.json<ApiResponse>({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to reject request',
      },
    }, { status: 500 })
  }
}
