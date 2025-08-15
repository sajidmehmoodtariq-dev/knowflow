'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { AdminStats } from '@/components/admin/AdminStats'
import { UserManagement } from '@/components/admin/UserManagement'
import { QuestionManagement } from '@/components/admin/QuestionManagement'
import { 
  BarChart3, 
  Users, 
  MessageSquare, 
  Shield,
  Settings
} from 'lucide-react'

export function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'questions', label: 'Questions', icon: MessageSquare },
    { id: 'moderators', label: 'Moderators', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <AdminStats />

      case 'users':
        return <UserManagement />

      case 'questions':
        return <QuestionManagement />

      case 'moderators':
        return <UserManagement />

      case 'settings':
        return (
          <div className="text-center py-12">
            <Settings className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
            <p className="text-gray-500">Configure system settings and preferences (Coming Soon)</p>
          </div>
        )

      default:
        return <AdminStats />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Welcome back, {user?.name}! Here's what's happening in your system.
                </p>
              </div>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Administrator
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-1" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'text-gray-500 hover:text-gray-700 bg-white hover:bg-gray-50'
                  } px-3 py-2 font-medium text-sm rounded-md flex items-center space-x-2 transition-colors`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  )
}
