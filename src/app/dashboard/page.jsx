'use client'

import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Navbar } from '@/components/navbar'
import { UserDashboard } from '@/components/dashboards/UserDashboard'
import { ModeratorDashboard } from '@/components/dashboards/ModeratorDashboard'
import { AdminDashboard } from '@/components/dashboards/AdminDashboard'

export default function DashboardPage() {
    const { user, loading, logout, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !isAuthenticated()) {
            router.push('/login')
        }
    }, [loading, isAuthenticated, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
                    <p className="mt-4">Loading...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null // Will redirect to login
    }

    const handleLogout = async () => {
        await logout()
        router.push('/login')
    }

    // Render role-specific dashboard
    const renderDashboard = () => {
        switch (user.role) {
            case 'admin':
                return <AdminDashboard user={user} />
            case 'moderator':
                return <ModeratorDashboard user={user} />
            case 'user':
            default:
                return <UserDashboard user={user} />
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with Logout */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                                {user.role} Dashboard
                            </h2>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="outline">
                        Logout
                    </Button>
                </div>

                {/* Role-specific Dashboard Content */}
                {renderDashboard()}
            </main>
        </div>
    )
}