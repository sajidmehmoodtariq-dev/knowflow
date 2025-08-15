'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { apiService } from '@/lib/api-service'
import { 
  Users, 
  MessageSquare, 
  CheckCircle, 
  Clock,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  UserCheck,
  BarChart3
} from 'lucide-react'

export function AdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')

      const response = await apiService.get('/api/admin/stats')
      
      if (response.success) {
        setStats(response.data)
      } else {
        setError(response.error || 'Failed to fetch statistics')
      }
    } catch (err) {
      console.error('Stats fetch error:', err)
      setError('Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading statistics...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date().toLocaleTimeString()}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.users.total}
                  </span>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {stats.users.newThisMonth} new this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.questions.total}
                  </span>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {stats.questions.newThisMonth} new this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Moderators</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.moderators.active}
                  </span>
                  <Activity className="ml-2 h-4 w-4 text-blue-500" />
                </div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {stats.moderators.pending} pending approval
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <div className="flex items-center mt-2">
                  <span className="text-2xl font-bold text-gray-900">
                    {stats.questions.responseRate}%
                  </span>
                  <TrendingUp className="ml-2 h-4 w-4 text-green-500" />
                </div>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              {stats.questions.answered} questions answered
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.users.byRole.admin}
                  </div>
                  <div className="text-sm text-gray-600">Admins</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.users.byRole.moderator}
                  </div>
                  <div className="text-sm text-gray-600">Moderators</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.users.byRole.user}
                  </div>
                  <div className="text-sm text-gray-600">Users</div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Verified Users</span>
                  <Badge className="bg-green-100 text-green-800">
                    {stats.users.verified}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unverified Users</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {stats.users.unverified}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Question Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>Question Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.questions.byStatus.pending}
                  </div>
                  <div className="text-sm text-gray-600">Pending</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.questions.byStatus.assigned}
                  </div>
                  <div className="text-sm text-gray-600">Assigned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.questions.byStatus.answered}
                  </div>
                  <div className="text-sm text-gray-600">Answered</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.questions.byStatus.escalated}
                  </div>
                  <div className="text-sm text-gray-600">Escalated</div>
                </div>
              </div>

              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Avg Response Time</span>
                  <Badge variant="outline">
                    {stats.questions.averageResponseTime || 'N/A'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Responses</span>
                  <Badge variant="outline">
                    {stats.questions.totalResponses}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moderator Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Moderator Performance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-blue-900">
                    {stats.moderators.total}
                  </div>
                  <div className="text-sm text-blue-600">Total Moderators</div>
                </div>
                <UserCheck className="h-6 w-6 text-blue-600" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-green-900">
                    {stats.moderators.active}
                  </div>
                  <div className="text-sm text-green-600">Active This Month</div>
                </div>
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-yellow-900">
                    {stats.moderators.averageWorkload}
                  </div>
                  <div className="text-sm text-yellow-600">Avg Questions/Mod</div>
                </div>
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          {stats.moderators.pending > 0 && (
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-orange-500 mr-2" />
                <span className="text-sm text-orange-700">
                  {stats.moderators.pending} moderator(s) pending approval
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Categories */}
      {stats.questions.topCategories && stats.questions.topCategories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Popular Categories</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.questions.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {category._id}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                        style={{ 
                          width: `${(category.count / stats.questions.topCategories[0].count) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {category.count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
