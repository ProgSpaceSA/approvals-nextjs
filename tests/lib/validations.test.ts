import { describe, it, expect } from 'vitest'
import {
  signInSchema,
  createRequestSchema,
  chooseSuggestionSchema,
  otherDecisionSchema,
} from '@/lib/validations'

describe('Validation Schemas', () => {
  describe('signInSchema', () => {
    it('should validate correct sign-in data', () => {
      const validData = {
        email: 'user@example.com',
        password: 'password123',
      }

      const result = signInSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid email')
      }
    })

    it('should reject short password', () => {
      const invalidData = {
        email: 'user@example.com',
        password: '123',
      }

      const result = signInSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least 8 characters')
      }
    })
  })

  describe('createRequestSchema', () => {
    it('should validate correct request data', () => {
      const validData = {
        title: 'Test Request',
        description: 'This is a test request description',
        suggestions: [
          { label: 'Option 1', details: 'Details for option 1' },
          { label: 'Option 2', details: 'Details for option 2' },
        ],
      }

      const result = createRequestSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject requests with too few suggestions', () => {
      const invalidData = {
        title: 'Test Request',
        description: 'This is a test request description',
        suggestions: [
          { label: 'Only one option', details: 'Only one details' },
        ],
      }

      const result = createRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('At least 2 suggestions')
      }
    })

    it('should reject requests with too many suggestions', () => {
      const suggestions = Array.from({ length: 11 }, (_, i) => ({
        label: `Option ${i + 1}`,
        details: `Details ${i + 1}`,
      }))

      const invalidData = {
        title: 'Test Request',
        description: 'This is a test request description',
        suggestions,
      }

      const result = createRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Maximum 10 suggestions')
      }
    })

    it('should reject empty title', () => {
      const invalidData = {
        title: '',
        description: 'This is a test request description',
        suggestions: [
          { label: 'Option 1', details: 'Details for option 1' },
          { label: 'Option 2', details: 'Details for option 2' },
        ],
      }

      const result = createRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Title is required')
      }
    })

    it('should reject suggestions with empty labels', () => {
      const invalidData = {
        title: 'Test Request',
        description: 'This is a test request description',
        suggestions: [
          { label: '', details: 'Details for option 1' },
          { label: 'Option 2', details: 'Details for option 2' },
        ],
      }

      const result = createRequestSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Label is required')
      }
    })
  })

  describe('chooseSuggestionSchema', () => {
    it('should validate correct suggestion ID', () => {
      const validData = {
        suggestionId: 'clh123abc456def789',
      }

      const result = chooseSuggestionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid suggestion ID format', () => {
      const invalidData = {
        suggestionId: 'invalid-id',
      }

      const result = chooseSuggestionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid suggestion ID')
      }
    })
  })

  describe('otherDecisionSchema', () => {
    it('should validate correct decision text', () => {
      const validData = {
        otherDecision: 'This is my custom decision',
      }

      const result = otherDecisionSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty decision text', () => {
      const invalidData = {
        otherDecision: '',
      }

      const result = otherDecisionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Decision text is required')
      }
    })

    it('should reject decision text that is too long', () => {
      const invalidData = {
        otherDecision: 'x'.repeat(1001),
      }

      const result = otherDecisionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('1000 characters or less')
      }
    })
  })
})
