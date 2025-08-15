'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api-service'
import { 
  ArrowLeft,
  User,
  Clock,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Send,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

export default function QuestionDetailPage() {
  const params = useParams()
  const questionId = params.id
  const [question, setQuestion] = useState(null)
  const [responses, setResponses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newResponse, setNewResponse] = useState('')
  const [submittingResponse, setSubmittingResponse] = useState(false)

  useEffect(() => {
    if (questionId) {
      fetchQuestion()
      fetchResponses()
    }
  }, [questionId])

  const fetchQuestion = async () => {
    try {
      const response = await apiService.get(`/api/questions/${questionId}`)
      if (response.success) {
        setQuestion(response.question)
      } else {
        setError(response.error || 'Question not found')
      }
    } catch (err) {
      console.error('Question fetch error:', err)
      setError('Failed to load question')
    }
  }

  const fetchResponses = async () => {
    try {
      const response = await apiService.get(`/api/questions/${questionId}/responses`)
      if (response.success) {
        setResponses(response.responses)
      }
    } catch (err) {
      console.error('Responses fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (e) => {
    e.preventDefault()
    if (!newResponse.trim()) return

    try {
      setSubmittingResponse(true)
      const response = await apiService.post(`/api/questions/${questionId}/responses`, {
        content: newResponse.trim()
      })

      if (response.success) {
        setNewResponse('')
        fetchResponses()
        // Update response count
        setQuestion(prev => ({ 
          ...prev, 
          responseCount: (prev.responseCount || 0) + 1 
        }))
      } else {
        alert(response.error || 'Failed to submit response')
      }
    } catch (err) {
      console.error('Response submission error:', err)
      alert('Failed to submit response')
    } finally {
      setSubmittingResponse(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-blue-100 text-blue-800'
      case 'answered': return 'bg-green-100 text-green-800'
      case 'escalated': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Question Not Found</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (!question) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor(question.status)}>
            {question.status}
          </Badge>
          <Badge className={getPriorityColor(question.priority)}>
            {question.priority}
          </Badge>
        </div>
      </div>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{question.title}</CardTitle>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>By {question.author?.name || 'Unknown'}</span>
              <span>•</span>
              <span>{new Date(question.createdAt).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}</span>
              {question.assignedTo && (
                <>
                  <span>•</span>
                  <span className="text-blue-600">
                    Assigned to {question.assignedTo?.name || 'Unknown'}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center space-x-3">
              {question.upvotes > 0 && (
                <div className="flex items-center space-x-1">
                  <ThumbsUp className="h-4 w-4 text-green-500" />
                  <span>{question.upvotes}</span>
                </div>
              )}
              {question.downvotes > 0 && (
                <div className="flex items-center space-x-1">
                  <ThumbsDown className="h-4 w-4 text-red-500" />
                  <span>{question.downvotes}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span>{question.responseCount || 0}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap">{question.content}</p>
          </div>

          {/* Skills and Tags */}
          {(question.suggestedSkills?.length > 0 || question.tags?.length > 0) && (
            <div className="mt-6 space-y-3">
              {question.suggestedSkills?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Related Skills:</Label>
                  <div className="flex flex-wrap gap-2">
                    {question.suggestedSkills.map((skill, index) => (
                      <Badge key={index} variant="outline">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {question.tags?.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-500 mb-2 block">Tags:</Label>
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AI Summary */}
          {question.summary && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-md p-4">
              <Label className="text-sm font-medium text-blue-800 mb-2 block">AI Analysis:</Label>
              <p className="text-sm text-blue-700">{question.summary}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Responses Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Responses ({responses.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No responses yet. Be the first to respond!
            </div>
          ) : (
            <div className="space-y-4">
              {responses.map((response, index) => (
                <div key={index} className="border-l-4 border-gray-200 pl-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-sm">
                        {response.author?.name || 'Anonymous'}
                      </span>
                      {response.author?.role && (
                        <Badge variant="outline" className="text-xs">
                          {response.author.role}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(response.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{response.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Response Form */}
          <form onSubmit={handleSubmitResponse} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="response">Add a Response</Label>
              <textarea
                id="response"
                value={newResponse}
                onChange={(e) => setNewResponse(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={4}
                placeholder="Share your thoughts, provide an answer, or ask for clarification..."
                disabled={submittingResponse}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newResponse.trim() || submittingResponse}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {submittingResponse ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Response
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
