'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth, requireRole } from '@/lib/auth'
import { db } from '@/lib/db'
import { createRequestSchema, chooseSuggestionSchema, otherDecisionSchema } from '@/lib/validations'
import { type CreateRequestInput, type ChooseSuggestionInput, type OtherDecisionInput } from '@/lib/validations'

export async function createRequest(data: CreateRequestInput) {
  try {
    const session = await requireAuth()
    
    // Only executives can create requests
    if (session.user.role !== 'EXECUTIVE') {
      throw new Error('Only executives can create requests')
    }

    const validation = createRequestSchema.safeParse(data)
    if (!validation.success) {
      throw new Error('Invalid request data')
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

    revalidatePath('/my-requests')
    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create request' 
    }
  }
}

export async function chooseSuggestion(requestId: string, data: ChooseSuggestionInput) {
  try {
    const session = await requireRole(['CEO'])
    
    const validation = chooseSuggestionSchema.safeParse(data)
    if (!validation.success) {
      throw new Error('Invalid suggestion ID')
    }

    const { suggestionId } = validation.data

    // Process the decision in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if request exists and is pending
      const requestData = await tx.request.findUnique({
        where: { id: requestId },
        include: {
          suggestions: true,
        },
      })

      if (!requestData) {
        throw new Error('Request not found')
      }

      if (requestData.status !== 'PENDING') {
        throw new Error('Request is not pending')
      }

      // Verify the suggestion belongs to this request
      const suggestion = requestData.suggestions.find(s => s.id === suggestionId)
      if (!suggestion) {
        throw new Error('Suggestion does not belong to this request')
      }

      // Update the request
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'PROCESSED',
          decidedById: session.user.id,
          decidedAt: new Date(),
          chosenSuggestionId: suggestionId,
          otherDecision: null,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          requestId,
          action: 'REQUEST_PROCESSED',
          metadata: {
            suggestionId,
            suggestionLabel: suggestion.label,
          },
        },
      })

      return updatedRequest
    })

    revalidatePath('/dashboard')
    revalidatePath(`/requests/${requestId}`)
    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to choose suggestion' 
    }
  }
}

export async function makeOtherDecision(requestId: string, data: OtherDecisionInput) {
  try {
    const session = await requireRole(['CEO'])
    
    const validation = otherDecisionSchema.safeParse(data)
    if (!validation.success) {
      throw new Error('Invalid decision data')
    }

    const { otherDecision } = validation.data

    // Process the decision in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if request exists and is pending
      const requestData = await tx.request.findUnique({
        where: { id: requestId },
      })

      if (!requestData) {
        throw new Error('Request not found')
      }

      if (requestData.status !== 'PENDING') {
        throw new Error('Request is not pending')
      }

      // Update the request
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'PROCESSED',
          decidedById: session.user.id,
          decidedAt: new Date(),
          otherDecision,
          chosenSuggestionId: null,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          requestId,
          action: 'OTHER_DECISION',
          metadata: {
            otherDecisionLength: otherDecision.length,
          },
        },
      })

      return updatedRequest
    })

    revalidatePath('/dashboard')
    revalidatePath(`/requests/${requestId}`)
    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to make decision' 
    }
  }
}

export async function rejectRequest(requestId: string) {
  try {
    const session = await requireRole(['CEO'])

    // Process the rejection in a transaction
    const result = await db.$transaction(async (tx) => {
      // Check if request exists and is pending
      const requestData = await tx.request.findUnique({
        where: { id: requestId },
      })

      if (!requestData) {
        throw new Error('Request not found')
      }

      if (requestData.status !== 'PENDING') {
        throw new Error('Request is not pending')
      }

      // Update the request
      const updatedRequest = await tx.request.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          decidedById: session.user.id,
          decidedAt: new Date(),
          chosenSuggestionId: null,
          otherDecision: null,
        },
      })

      // Create audit log
      await tx.auditLog.create({
        data: {
          actorId: session.user.id,
          requestId,
          action: 'REQUEST_REJECTED',
          metadata: {},
        },
      })

      return updatedRequest
    })

    revalidatePath('/dashboard')
    revalidatePath(`/requests/${requestId}`)
    return { success: true, data: result }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to reject request' 
    }
  }
}

export async function signOutAction() {
  redirect('/sign-in')
}
