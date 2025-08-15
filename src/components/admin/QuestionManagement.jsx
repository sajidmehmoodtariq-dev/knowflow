'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api-service'
import { 
  MessageSquare, 
  User, 
  Clock, 
  ThumbsUp, 
  ThumbsDown, 
  Eye,
  Search,
  Filter,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react'

export function QuestionManagement() {
  const [questions, setQuestions] = useState([])
  const [moderators, setModerators] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assigningQuestion, setAssigningQuestion] = useState(null)
  const [selectedModerator, setSelectedModerator] = useState('')
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchQuestions()
    fetchModerators()
  }, [filters])

  const fetchQuestions = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.status !== 'all') params.append('status', filters.status)
      params.append('page', filters.page.toString())

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

  const fetchModerators = async () => {
    try {
      const response = await apiService.get('/api/admin/users?role=moderator')
      if (response.success) {
        setModerators(response.users.filter(user => user.approved))
      }
    } catch (err) {
      console.error('Moderators fetch error:', err)
    }
  }

  const handleManualAssignment = async (questionId) => {
    if (!selectedModerator) {
      alert('Please select a moderator')
      return
    }

    try {
      const response = await apiService.patch(`/api/questions/${questionId}`, {
        assignedTo: selectedModerator,
        status: 'assigned',
        assignedAt: new Date().toISOString(),
        assignmentType: 'manual'
      })

      if (response.success) {
        setAssigningQuestion(null)
        setSelectedModerator('')
        fetchQuestions()
        alert('Question assigned successfully!')
      } else {
        alert(response.error || 'Failed to assign question')
      }
    } catch (error) {
      console.error('Question assignment error:', error)
      alert('Failed to assign question')
    }
  }

  const handleReassignment = async (questionId, currentAssignee) => {
    if (!confirm(`Remove assignment from current moderator and make question available for reassignment?`)) {
      return
    }

    try {
      const response = await apiService.patch(`/api/questions/${questionId}`, {
        assignedTo: null,
        status: 'pending',
        assignedAt: null,
        assignmentType: null
      })

      if (response.success) {
        fetchQuestions()
        alert('Question unassigned successfully!')
      } else {
        alert(response.error || 'Failed to unassign question')
      }
    } catch (error) {
      console.error('Question reassignment error:', error)
      alert('Failed to unassign question')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'assigned': return <User className="h-4 w-4 text-blue-500" />
      case 'answered': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'escalated': return <AlertTriangle className="h-4 w-4 text-red-500" />
      default: return <MessageSquare className="h-4 w-4" />
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

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
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
        <h2 className="text-2xl font-bold text-gray-900">Question Management</h2>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search questions..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="answered">Answered</option>
                <option value="escalated">Escalated</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchQuestions} variant="outline" className="w-full">
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Question List */}
      <div className="grid gap-4">
        {questions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
            <p className="text-gray-500">No questions match your current filters.</p>
          </div>
        ) : (
          questions.map((question) => (
            <Card key={question.id || question._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {getStatusIcon(question.status)}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {question.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {question.description || question.content}
                        </p>
                      </div>
                    </div>

                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(question.status)}>
                      {question.status}
                    </Badge>
                    <Badge className={getPriorityColor(question.priority)}>
                      {question.priority}
                    </Badge>
                  </div>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>By {question.author?.name || 'Unknown'}</span>
                    <span>•</span>
                    <span>{new Date(question.createdAt).toLocaleDateString()}</span>
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
                    {question.responseCount > 0 && (
                      <div className="flex items-center space-x-1">
                        <MessageSquare className="h-4 w-4 text-blue-500" />
                        <span>{question.responseCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories and Tags */}
                {(question.suggestedSkills?.length > 0 || question.tags?.length > 0) && (
                  <div className="space-y-2">
                    {question.suggestedSkills?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 mr-2">Skills:</span>
                        {question.suggestedSkills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="mr-1 text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {question.tags?.length > 0 && (
                      <div>
                        <span className="text-xs font-medium text-gray-500 mr-2">Tags:</span>
                        {question.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="mr-1 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI Summary */}
                {question.summary && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <Label className="text-sm font-medium text-blue-800 mb-1 block">AI Analysis:</Label>
                    <p className="text-sm text-blue-700">{question.summary}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const id = question.id || question._id
                        console.log('Question object:', question)
                        console.log('Using ID:', id)
                        if (id) {
                          window.open(`/questions/${id}`, '_blank')
                        } else {
                          alert('Question ID not found')
                        }
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>

                    {question.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => {
                          const id = question.id || question._id
                          console.log('Assigning question ID:', id)
                          setAssigningQuestion(id)
                        }}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}

                    {question.assignedTo && question.status === 'assigned' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const id = question.id || question._id
                          handleReassignment(id, question.assignedTo)
                        }}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Reassign
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    {question.assignmentType === 'manual' && (
                      <Badge variant="outline" className="text-xs">
                        Manually Assigned
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.total > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <Button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.current <= 1}
            variant="outline"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {pagination.current} of {pagination.total} ({pagination.count} questions)
          </span>
          
          <Button
            onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.current >= pagination.total}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}

      {/* Assignment Modal */}
      {assigningQuestion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Assign Question to Moderator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="moderator">Select Moderator</Label>
                  <select
                    id="moderator"
                    value={selectedModerator}
                    onChange={(e) => setSelectedModerator(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Choose a moderator...</option>
                    {moderators.map((moderator) => (
                      <option key={moderator.id} value={moderator.id}>
                        {moderator.name} - {moderator.skills.join(', ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex space-x-4">
                  <Button
                    onClick={() => handleManualAssignment(assigningQuestion)}
                    className="flex-1"
                    disabled={!selectedModerator}
                  >
                    Assign Question
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAssigningQuestion(null)
                      setSelectedModerator('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
