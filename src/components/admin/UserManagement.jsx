'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiService } from '@/lib/api-service'
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Shield,
  User
} from 'lucide-react'

export function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    page: 1
  })
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (filters.search) params.append('search', filters.search)
      if (filters.role !== 'all') params.append('role', filters.role)
      params.append('page', filters.page.toString())

      const response = await apiService.get(`/api/admin/users?${params}`)
      
      if (response.success) {
        setUsers(response.users)
        setPagination(response.pagination)
      } else {
        setError(response.error || 'Failed to fetch users')
      }
    } catch (err) {
      console.error('Users fetch error:', err)
      setError('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (userData) => {
    try {
      const response = await apiService.post('/api/admin/users', userData)
      if (response.success) {
        setShowCreateForm(false)
        fetchUsers()
        alert('User created successfully!')
      } else {
        alert(response.error || 'Failed to create user')
      }
    } catch (error) {
      console.error('User creation error:', error)
      alert('Failed to create user')
    }
  }

  const handleUpdateUser = async (userId, updates) => {
    try {
      const response = await apiService.patch(`/api/admin/users/${userId}`, updates)
      if (response.success) {
        setEditingUser(null)
        fetchUsers()
        alert('User updated successfully!')
      } else {
        alert(response.error || 'Failed to update user')
      }
    } catch (error) {
      console.error('User update error:', error)
      alert('Failed to update user')
    }
  }

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await apiService.delete(`/api/admin/users/${userId}`)
      if (response.success) {
        fetchUsers()
        alert('User deleted successfully!')
      } else {
        alert(response.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('User deletion error:', error)
      alert('Failed to delete user')
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />
      case 'moderator': return <Users className="h-4 w-4" />
      case 'user': return <User className="h-4 w-4" />
      default: return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'moderator': return 'bg-blue-100 text-blue-800'
      case 'user': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
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
                  placeholder="Search by name or email..."
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Role</Label>
              <select
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="user">User</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button onClick={fetchUsers} variant="outline" className="w-full">
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

      {/* User List */}
      <div className="grid gap-4">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    {getRoleIcon(user.role)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRoleColor(user.role)}>
                        {user.role}
                      </Badge>
                      <Badge className={user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                        {user.verified ? (
                          <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                        ) : (
                          <><XCircle className="h-3 w-3 mr-1" /> Unverified</>
                        )}
                      </Badge>
                      {user.role === 'moderator' && (
                        <Badge className={user.approved ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                          {user.approved ? 'Approved' : 'Pending'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => setEditingUser(user)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Skills */}
              {user.skills && user.skills.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium text-gray-500">Skills:</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 text-xs text-gray-500">
                Created: {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
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
            Page {pagination.current} of {pagination.total} ({pagination.count} users)
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

      {/* Create User Modal */}
      {showCreateForm && (
        <CreateUserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onSubmit={(updates) => handleUpdateUser(editingUser.id, updates)}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}

// Create User Form Component
function CreateUserForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    skills: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const skills = formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)

    onSubmit({
      ...formData,
      skills
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
                minLength={6}
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="javascript, react, nodejs..."
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1">Create User</Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Edit User Form Component
function EditUserForm({ user, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    role: user.role,
    verified: user.verified,
    approved: user.approved,
    skills: user.skills.join(', ')
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const skills = formData.skills
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0)

    onSubmit({
      ...formData,
      skills
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">User</option>
                <option value="moderator">Moderator</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.verified}
                  onChange={(e) => setFormData(prev => ({ ...prev, verified: e.target.checked }))}
                  className="mr-2"
                />
                Verified
              </label>

              {formData.role === 'moderator' && (
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.approved}
                    onChange={(e) => setFormData(prev => ({ ...prev, approved: e.target.checked }))}
                    className="mr-2"
                  />
                  Approved
                </label>
              )}
            </div>

            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills}
                onChange={(e) => setFormData(prev => ({ ...prev, skills: e.target.value }))}
                placeholder="javascript, react, nodejs..."
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1">Update User</Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
