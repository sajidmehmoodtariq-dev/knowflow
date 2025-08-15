'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageCircle, Search, BookOpen, TrendingUp } from 'lucide-react'
import { QuestionForm } from '@/components/QuestionForm'
import { QuestionList } from '@/components/QuestionList'
import { apiService } from '@/lib/api-service'

export function UserDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUserStats()
  }, [])

  const fetchUserStats = async () => {
    try {
      // Fetch user's question statistics
      const response = await apiService.get(`/api/questions?author=${user.id}&limit=1`)
      if (response.success) {
        setStats({
          totalQuestions: response.pagination.count,
          pendingQuestions: 0, // Will be calculated from API
          answeredQuestions: 0, // Will be calculated from API
        })
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleQuestionSubmitted = (question) => {
    setActiveTab('my-questions')
    fetchUserStats()
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}! 👋
        </h1>
        <p className="text-gray-600">
          Ready to ask questions and learn from experts?
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('ask-question')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold">Ask Question</h3>
                <p className="text-sm text-gray-600">Get expert help</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('browse')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Search className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold">Browse</h3>
                <p className="text-sm text-gray-600">Find answers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('my-questions')}
        >
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold">My Questions</h3>
                <p className="text-sm text-gray-600">Track questions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold">Activity</h3>
                <p className="text-sm text-gray-600">Your stats</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              </div>
            ) : stats?.totalQuestions > 0 ? (
              <div className="space-y-4">
                <p className="text-gray-600">You have {stats.totalQuestions} questions.</p>
                <Button
                  onClick={() => setActiveTab('my-questions')}
                  className="w-full"
                  variant="outline"
                >
                  View All Questions
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>You haven't asked any questions yet.</p>
                <Button 
                  className="mt-4"
                  onClick={() => setActiveTab('ask-question')}
                >
                  Ask Your First Question
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Questions Asked</span>
                <span className="font-semibold">
                  {loading ? '...' : (stats?.totalQuestions || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Answers Received</span>
                <span className="font-semibold">
                  {loading ? '...' : (stats?.answeredQuestions || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Questions</span>
                <span className="font-semibold">
                  {loading ? '...' : (stats?.pendingQuestions || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Account Status</span>
                <Badge className={user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {user.verified ? 'Verified' : 'Unverified'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skills Section */}
      <Card>
        <CardHeader>
          <CardTitle>Your Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {user.skills && user.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No skills assigned yet.</p>
              <p className="text-sm mt-1">Skills are managed by administrators based on your activity.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'ask-question':
        return <QuestionForm onSuccess={handleQuestionSubmitted} />
      case 'my-questions':
        return (
          <QuestionList 
            filterByAuthor={true} 
            title="My Questions" 
            showActions={true}
            onQuestionView={(question) => {
              window.location.href = `/questions/${question.id}`;
            }}
          />
        )
      case 'browse':
        return (
          <QuestionList 
            title="Browse Questions" 
            showActions={true}
            onQuestionView={(question) => {
              window.location.href = `/questions/${question.id}`;
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
            { key: 'ask-question', label: 'Ask Question' },
            { key: 'my-questions', label: 'My Questions' },
            { key: 'browse', label: 'Browse' },
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
