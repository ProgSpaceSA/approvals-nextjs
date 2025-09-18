'use client'

import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Trash2 } from 'lucide-react'
import { createRequestSchema, type CreateRequestInput } from '@/lib/validations'
import { type ApiResponse } from '@/types'

interface CreateRequestDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRequestCreated: () => void
}

export function CreateRequestDialog({ open, onOpenChange, onRequestCreated }: CreateRequestDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRequestInput>({
    resolver: zodResolver(createRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      suggestions: [
        { label: '', details: '' },
        { label: '', details: '' },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'suggestions',
  })

  const onSubmit = async (data: CreateRequestInput) => {
    try {
      setIsSubmitting(true)
      setError(null)

      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result: ApiResponse = await response.json()

      if (!result.success) {
        throw new Error(result.error.message)
      }

      // Reset form and close dialog
      reset()
      onRequestCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      reset()
      setError(null)
      onOpenChange(false)
    }
  }

  const addSuggestion = () => {
    if (fields.length < 10) {
      append({ label: '', details: '' })
    }
  }

  const removeSuggestion = (index: number) => {
    if (fields.length > 2) {
      remove(index)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Request</AlertDialogTitle>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter request title"
                {...register('title')}
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Provide detailed context for your request"
                rows={4}
                {...register('description')}
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Suggestions */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">Suggestions (2-10 required)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSuggestion}
                disabled={fields.length >= 10 || isSubmitting}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Suggestion
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex justify-between items-center">
                      Suggestion {index + 1}
                      {fields.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSuggestion(index)}
                          disabled={isSubmitting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor={`suggestions.${index}.label`}>Label *</Label>
                      <Input
                        id={`suggestions.${index}.label`}
                        placeholder="Brief description of this option"
                        {...register(`suggestions.${index}.label`)}
                        disabled={isSubmitting}
                      />
                      {errors.suggestions?.[index]?.label && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.suggestions[index]?.label?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`suggestions.${index}.details`}>Details *</Label>
                      <Textarea
                        id={`suggestions.${index}.details`}
                        placeholder="Detailed explanation of this option"
                        rows={3}
                        {...register(`suggestions.${index}.details`)}
                        disabled={isSubmitting}
                      />
                      {errors.suggestions?.[index]?.details && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.suggestions[index]?.details?.message}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {errors.suggestions && (
              <p className="text-sm text-red-600 mt-2">{errors.suggestions.message}</p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 text-center p-3 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </div>
              ) : (
                'Create Request'
              )}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  )
}
