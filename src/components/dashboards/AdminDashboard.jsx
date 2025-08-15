'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { QuestionList } from '@/components/QuestionList'
import { apiService } from '@/lib/api-service'
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3, 
  UserCheck, 
  AlertTriangle,
  MessageCircle,
  TrendingUp,
  Database,
  Globe,
  UserPlus,
  Activity,
  Bot,
  Zap
} from 'lucide-react'

export function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [routingStats, setRoutingStats] = useState(null)

  useEffect(() => {
    fetchSystemStats()
    fetchRoutingStats()
  }, [])

  const fetchSystemStats = async () => {
    try {
      // This would be a comprehensive system stats endpoint
      setStats({
        totalUsers: 0,
        activeModerators: 0,
        pendingApprovals: 0,
        systemHealth: 'Good'
      })
    } catch (error) {
      console.error('Failed to fetch system stats:', error)
    }
  }

  const fetchRoutingStats = async () => {
    try {
      const response = await apiService.get('/api/questions/routing')
      if (response.success) {
        setRoutingStats(response.stats)
      }
    } catch (error) {
      console.error('Failed to fetch routing stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBatchProcessing = async () => {
    try {
      const response = await apiService.post('/api/questions/routing', { action: 'process-pending' })
      if (response.success) {
        alert(`Processed ${response.processed} questions`)
        fetchRoutingStats()
      }
    } catch (error) {
      console.error('Failed to process questions:', error)
    }
  }

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard 👑
            </h1>
            <p className="text-gray-600">
              Welcome, {user.name}! Manage the KnowFlow platform and community.
            </p>
          </div>
          <Badge variant="destructive">
            System Administrator
          </Badge>
        </div>
      </div>

      {/* System Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {loading ? '...' : (stats?.totalUsers || 0)}
                </h3>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {loading ? '...' : (routingStats?.moderators?.length || 0)}
                </h3>
                <p className="text-sm text-gray-600">Active Moderators</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold">
                  {loading ? '...' : (stats?.pendingApprovals || 0)}
                </h3>
                <p className="text-sm text-gray-600">Pending Approvals</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-600">
                  {stats?.systemHealth || 'Good'}
                </h3>
                <p className="text-sm text-gray-600">System Health</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Routing Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="h-5 w-5" />
            <span>AI Question Routing System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? '...' : (routingStats?.total || 0)}
              </div>
              <p className="text-sm text-gray-600">Total Questions</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {loading ? '...' : (routingStats?.pending || 0)}
              </div>
              <p className="text-sm text-gray-600">Pending Assignment</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? '...' : (routingStats?.assigned || 0)}
              </div>
              <p className="text-sm text-gray-600">Assigned</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {loading ? '...' : (routingStats?.answered || 0)}
              </div>
              <p className="text-sm text-gray-600">Answered</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">
                {loading ? '...' : (routingStats?.closed || 0)}
              </div>
              <p className="text-sm text-gray-600">Closed</p>
            </div>
          </div>
          
          <div className="mt-4 flex space-x-4">
            <Button 
              onClick={handleBatchProcessing}
              className="flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Auto-Process Pending</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setActiveTab('routing-details')}
            >
              View Routing Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('users')}
        >
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3 text-blue-600" />
            <h3 className="font-semibold mb-1">User Management</h3>
            <p className="text-sm text-gray-600">Manage users and roles</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('moderators')}
        >
          <CardContent className="p-6 text-center">
            <Shield className="h-8 w-8 mx-auto mb-3 text-green-600" />
            <h3 className="font-semibold mb-1">Moderator Management</h3>
            <p className="text-sm text-gray-600">Approve and manage moderators</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('questions')}
        >
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 text-purple-600" />
            <h3 className="font-semibold mb-1">Question Management</h3>
            <p className="text-sm text-gray-600">Manage all questions</p>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setActiveTab('settings')}
        >
          <CardContent className="p-6 text-center">
            <Settings className="h-8 w-8 mx-auto mb-3 text-gray-600" />
            <h3 className="font-semibold mb-1">System Settings</h3>
            <p className="text-sm text-gray-600">Configure platform settings</p>
          </CardContent>
        </Card>
      </div>

      {/* Moderator Performance */}
      {routingStats?.moderators && (
        <Card>
          <CardHeader>
            <CardTitle>Moderator Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {routingStats.moderators.slice(0, 5).map((moderator) => (
                <div key={moderator._id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Shield className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{moderator.name}</h4>
                      <p className="text-sm text-gray-600">{moderator.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold">{moderator.totalAssigned}</div>
                      <div className="text-gray-600">Assigned</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold">{moderator.activeQuestions}</div>
                      <div className="text-gray-600">Active</div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {moderator.skills?.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
      case 'questions':
        return <QuestionList title="All Questions (Admin View)" showFilters={true} />
      case 'routing-details':
        return (
          <Card>
            <CardHeader>
              <CardTitle>AI Routing System Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Detailed routing statistics and management tools will be available here.</p>
              <Button className="mt-4" onClick={() => setActiveTab('overview')}>
                Back to Overview
              </Button>
            </CardContent>
          </Card>
        )
      case 'users':
      case 'moderators':
      case 'settings':
        return (
          <Card>
            <CardHeader>
              <CardTitle>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p>This section is under development. Advanced management features will be available here.</p>
              <Button className="mt-4" onClick={() => setActiveTab('overview')}>
                Back to Overview
              </Button>
            </CardContent>
          </Card>
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
            { key: 'questions', label: 'Questions' },
            { key: 'users', label: 'Users' },
            { key: 'moderators', label: 'Moderators' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-red-500 text-red-600'
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
