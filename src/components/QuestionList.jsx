'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { apiService } from '@/lib/api-service'
import { useAuth } from '@/lib/auth-context'

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  'in-progress': 'bg-purple-100 text-purple-800',
  answered: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
}

export function QuestionList({ 
  showFilters = true, 
  filterByAuthor = false,
  onQuestionSelect,
  title = "Questions"
}) {
  const { user } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filters, setFilters] = useState({
    status: 'all',
    skill: '',
    search: '',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchQuestions()
  }, [filters])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.status !== 'all') params.append('status', filters.status)
      if (filters.skill) params.append('skill', filters.skill)
      if (filterByAuthor && user?.id) params.append('author', user.id)
      params.append('page', filters.page.toString())
      params.append('limit', '10')

      const response = await apiService.get(`/api/questions?${params}`)
      
      if (response.success) {
        setQuestions(response.questions)
        setPagination(response.pagination)
      } else {
        setError(response.error || 'Failed to fetch questions')
      }
    } catch (err) {
      console.error('Questions fetch error:', err)
      setError('Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateContent = (content, maxLength = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading questions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        {pagination && (
          <p className="text-sm text-gray-600">
            Showing {questions.length} of {pagination.count} questions
          </p>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="answered">Answered</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill/Topic
                </label>
                <Input
                  value={filters.skill}
                  onChange={(e) => handleFilterChange('skill', e.target.value)}
                  placeholder="Filter by skill..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search questions..."
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
          <Button
            onClick={fetchQuestions}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {questions.length === 0 && !loading && !error && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No questions found</p>
          <p className="text-gray-400 text-sm mt-1">
            Try adjusting your filters or be the first to ask a question!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {questions.map((question) => (
          <Card 
            key={question.id} 
            className={`hover:shadow-md transition-shadow cursor-pointer ${
              onQuestionSelect ? 'hover:bg-gray-50' : ''
            }`}
            onClick={() => onQuestionSelect?.(question)}
          >
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {question.title}
                </h3>
                <div className="flex space-x-2 ml-4">
                  <Badge className={statusColors[question.status]}>
                    {question.status}
                  </Badge>
                  <Badge className={priorityColors[question.priority]}>
                    {question.priority}
                  </Badge>
                </div>
              </div>

              <p className="text-gray-600 mb-4">
                {truncateContent(question.summary || question.content)}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {question.suggestedSkills.map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>

              <div className="flex justify-between items-center text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>By {question.author.name}</span>
                  <span>{formatDate(question.createdAt)}</span>
                  {question.assignedTo && (
                    <span className="text-blue-600">
                      Assigned to {question.assignedTo.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <span className="text-green-600 mr-1">↑</span>
                    {question.upvotes}
                  </span>
                  <span className="flex items-center">
                    💬 {question.responseCount}
                  </span>
                  <span className="flex items-center">
                    👁 {question.viewCount}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination && pagination.total > 1 && (
        <div className="flex justify-center items-center space-x-4 mt-8">
          <Button
            onClick={() => handlePageChange(pagination.current - 1)}
            disabled={pagination.current <= 1}
            variant="outline"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.current} of {pagination.total}
          </span>
          
          <Button
            onClick={() => handlePageChange(pagination.current + 1)}
            disabled={pagination.current >= pagination.total}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
