'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionList } from '@/components/QuestionList'
import { apiService } from '@/lib/api-service'
import { MessageSquare, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export function ModeratorDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [assignedQuestions, setAssignedQuestions] = useState([])

  useEffect(() => {
    fetchModeratorStats()
    fetchAssignedQuestions()
  }, [])

  const fetchModeratorStats = async () => {
    try {
      const response = await apiService.get('/api/questions/routing')
      if (response.success) {
        const moderatorStat = response.stats.moderators.find(m => m._id === user.id)
        setStats(moderatorStat || { totalAssigned: 0, activeQuestions: 0 })
      }
    } catch (error) {
      console.error('Failed to fetch moderator stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignedQuestions = async () => {
    try {
      const response = await apiService.get(`/api/questions?status=assigned&assignedTo=${user.id}`)
      if (response.success) {
        setAssignedQuestions(response.questions)
      }
    } catch (error) {
      console.error('Failed to fetch assigned questions:', error)
    }
  }

  const handleAssignQuestion = async (questionId, action = 'self-assign') => {
    try {
      const response = await apiService.post(`/api/questions/${questionId}/assign`, { action })
      if (response.success) {
        fetchModeratorStats()
        fetchAssignedQuestions()
        // Optionally show success message
      }
    } catch (error) {
      console.error('Failed to assign question:', error)
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Moderator Dashboard 🛡️
        </h1>
        <p className="text-gray-600">
          Welcome {user.name}, ready to help the community?
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {loading ? '...' : (stats?.totalAssigned || 0)}
                </div>
                <p className="text-sm text-gray-600">Total Assigned</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {loading ? '...' : (stats?.activeQuestions || 0)}
                </div>
                <p className="text-sm text-gray-600">Active Questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {loading ? '...' : ((stats?.totalAssigned || 0) - (stats?.activeQuestions || 0))}
                </div>
                <p className="text-sm text-gray-600">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {user.approved ? '✅' : '⏳'}
                </div>
                <p className="text-sm text-gray-600">Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('assigned')}
        >
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-3 text-orange-600" />
            <h3 className="font-semibold mb-1">My Assignments</h3>
            <p className="text-sm text-gray-600">Questions assigned to you</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('all')}
        >
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-1">All Questions</h3>
            <p className="text-sm text-gray-600">Browse all questions</p>
          </CardContent>
        </Card>
      </div>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Expertise Areas</CardTitle>
        </CardHeader>
        <CardContent>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <Badge key={index} className="bg-blue-100 text-blue-800 text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No skills assigned yet.</p>
              <p className="text-sm mt-1">Contact an administrator to set your expertise areas.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Assigned Questions */}
      {assignedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assignedQuestions.slice(0, 3).map((question) => (
                <div key={question.id} className="border-l-4 border-blue-500 pl-4 space-y-3">
                  <h4 className="font-medium text-gray-900 line-clamp-1">
                    {question.title}
                  </h4>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {question.summary}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Badge className="text-xs" variant="outline">
                        {question.status}
                      </Badge>
                      <Badge className="text-xs" variant="secondary">
                        {question.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.location.href = `/questions/${question.id}`}
                        className="text-xs px-2 py-1"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {assignedQuestions.length > 3 && (
                <Button
                  onClick={() => setActiveTab('assigned')}
                  variant="outline"
                  className="w-full mt-4"
                >
                  View All Assignments ({assignedQuestions.length})
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'assigned':
        return (
          <QuestionList 
            title="My Assigned Questions"
            showFilters={false}
            filterByAssignee={user.id}
            showActions={true}
            onQuestionView={(question) => {
              // Navigate to question detail page
              window.location.href = `/questions/${question.id}`
            }}
          />
        )
      case 'all':
        return (
          <QuestionList 
            title="All Questions"
            showFilters={true}
            showActions={true}
            onQuestionView={(question) => {
              // Navigate to question detail page
              window.location.href = `/questions/${question.id}`
            }}
          />
        )
      default:
        return renderOverview()
    }
  }

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'assigned', label: 'My Assignments' },
            { key: 'all', label: 'All Questions' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  )
}
