'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api-service'

export function QuestionForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const tags = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)
        .slice(0, 10) // Limit to 10 tags

      const response = await apiService.post('/api/questions', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        tags
      })

      if (response.success) {
        setFormData({ title: '', content: '', tags: '' })
        onSuccess?.(response.question)
      } else {
        setError(response.error || 'Failed to submit question')
      }
    } catch (err) {
      console.error('Question submission error:', err)
      setError('Failed to submit question. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Ask a Question
        </CardTitle>
        <p className="text-gray-600">
          Get help from our community of experts. Be specific and provide context for better answers.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="title" className="text-sm font-medium text-gray-700">
              Question Title *
            </Label>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="What's your question? Be specific and clear..."
              maxLength={200}
              required
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.title.length}/200 characters
            </p>
          </div>

          <div>
            <Label htmlFor="content" className="text-sm font-medium text-gray-700">
              Question Details *
            </Label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Provide detailed information about your question. Include any relevant context, what you've tried, and what specific help you need..."
              maxLength={5000}
              required
              rows={8}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.content.length}/5000 characters
            </p>
          </div>

          <div>
            <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
              Tags (Optional)
            </Label>
            <Input
              id="tags"
              name="tags"
              type="text"
              value={formData.tags}
              onChange={handleChange}
              placeholder="javascript, react, nodejs, api (comma-separated)"
              className="mt-1"
            />
            <p className="text-xs text-gray-500 mt-1">
              Add up to 10 relevant tags, separated by commas
            </p>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFormData({ title: '', content: '', tags: '' })}
              disabled={isSubmitting}
            >
              Clear
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Question'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
