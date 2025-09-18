import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as createRequest, GET as getRequests } from '@/app/api/requests/route'
import { POST as chooseSuggestion } from '@/app/api/requests/[id]/choose/route'
import { POST as otherDecision } from '@/app/api/requests/[id]/other/route'
import { POST as rejectRequest } from '@/app/api/requests/[id]/reject/route'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Mock NextAuth
const mockGetServerSession = vi.fn()
vi.mock('@/lib/auth', () => ({
  getSession: () => mockGetServerSession(),
  requireAuth: () => mockGetServerSession(),
  requireRole: (roles: string[]) => {
    const session = mockGetServerSession()
    if (!session) throw new Error('Unauthorized')
    if (!roles.includes(session.user.role)) throw new Error('Forbidden')
    return session
  }
}))

describe('Requests API', () => {
  let ceoUser: any
  let executiveUser: any
  let testRequest: any

  beforeEach(async () => {
    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 12)
    
    ceoUser = await db.user.create({
      data: {
        email: 'ceo@test.com',
        name: 'Test CEO',
        role: 'CEO',
        hashedPassword,
      },
    })

    executiveUser = await db.user.create({
      data: {
        email: 'exec@test.com',
        name: 'Test Executive',
        role: 'EXECUTIVE',
        hashedPassword,
      },
    })

    // Create a test request
    testRequest = await db.request.create({
      data: {
        title: 'Test Request',
        description: 'Test description',
        createdById: executiveUser.id,
        suggestions: {
          create: [
            { label: 'Option 1', details: 'Details 1' },
            { label: 'Option 2', details: 'Details 2' },
          ],
        },
      },
      include: {
        suggestions: true,
      },
    })
  })

  describe('POST /api/requests', () => {
    it('should allow executives to create requests', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: executiveUser.id, role: 'EXECUTIVE' },
      })

      const requestData = {
        title: 'New Request',
        description: 'Request description',
        suggestions: [
          { label: 'Suggestion 1', details: 'Details 1' },
          { label: 'Suggestion 2', details: 'Details 2' },
        ],
      }

      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createRequest(request)
      const result = await response.json()

      expect(response.status).toBe(201)
      expect(result.success).toBe(true)
      expect(result.data.title).toBe('New Request')
    })

    it('should reject CEO attempts to create requests', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const requestData = {
        title: 'CEO Request',
        description: 'Should be rejected',
        suggestions: [
          { label: 'Suggestion 1', details: 'Details 1' },
          { label: 'Suggestion 2', details: 'Details 2' },
        ],
      }

      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createRequest(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('FORBIDDEN')
    })

    it('should validate suggestion count', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: executiveUser.id, role: 'EXECUTIVE' },
      })

      const requestData = {
        title: 'Invalid Request',
        description: 'Only one suggestion',
        suggestions: [
          { label: 'Only one', details: 'Not enough' },
        ],
      }

      const request = new NextRequest('http://localhost/api/requests', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await createRequest(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/requests/[id]/choose', () => {
    it('should allow CEO to choose a suggestion', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const suggestionId = testRequest.suggestions[0].id
      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/choose`, {
        method: 'POST',
        body: JSON.stringify({ suggestionId }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await chooseSuggestion(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('PROCESSED')
      expect(result.data.chosenSuggestionId).toBe(suggestionId)
    })

    it('should reject executive attempts to choose suggestions', async () => {
      mockGetServerSession.mockImplementation(() => {
        throw new Error('Forbidden')
      })

      const suggestionId = testRequest.suggestions[0].id
      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/choose`, {
        method: 'POST',
        body: JSON.stringify({ suggestionId }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await chooseSuggestion(request, { params: Promise.resolve({ id: testRequest.id }) })

      expect(response.status).toBe(500) // Error handling
    })

    it('should validate suggestion belongs to request', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      // Create another request with different suggestions
      const otherRequest = await db.request.create({
        data: {
          title: 'Other Request',
          description: 'Other description',
          createdById: executiveUser.id,
          suggestions: {
            create: [
              { label: 'Other Option', details: 'Other details' },
            ],
          },
        },
        include: {
          suggestions: true,
        },
      })

      // Try to use suggestion from other request
      const wrongSuggestionId = otherRequest.suggestions[0].id
      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/choose`, {
        method: 'POST',
        body: JSON.stringify({ suggestionId: wrongSuggestionId }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await chooseSuggestion(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INVALID_SUGGESTION')
    })
  })

  describe('POST /api/requests/[id]/other', () => {
    it('should allow CEO to make other decision', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const otherDecisionText = 'Custom decision from CEO'
      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/other`, {
        method: 'POST',
        body: JSON.stringify({ otherDecision: otherDecisionText }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await otherDecision(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('PROCESSED')
      expect(result.data.otherDecision).toBe(otherDecisionText)
      expect(result.data.chosenSuggestionId).toBe(null)
    })

    it('should require non-empty decision text', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/other`, {
        method: 'POST',
        body: JSON.stringify({ otherDecision: '   ' }),
        headers: { 'Content-Type': 'application/json' },
      })

      const response = await otherDecision(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('VALIDATION_ERROR')
    })
  })

  describe('POST /api/requests/[id]/reject', () => {
    it('should allow CEO to reject request', async () => {
      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/reject`, {
        method: 'POST',
      })

      const response = await rejectRequest(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.data.status).toBe('REJECTED')
      expect(result.data.chosenSuggestionId).toBe(null)
      expect(result.data.otherDecision).toBe(null)
    })

    it('should not allow actions on already processed requests', async () => {
      // First, process the request
      await db.request.update({
        where: { id: testRequest.id },
        data: {
          status: 'PROCESSED',
          decidedById: ceoUser.id,
          decidedAt: new Date(),
        },
      })

      mockGetServerSession.mockReturnValue({
        user: { id: ceoUser.id, role: 'CEO' },
      })

      const request = new NextRequest(`http://localhost/api/requests/${testRequest.id}/reject`, {
        method: 'POST',
      })

      const response = await rejectRequest(request, { params: Promise.resolve({ id: testRequest.id }) })
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.success).toBe(false)
      expect(result.error.code).toBe('INVALID_STATUS')
    })
  })
})
