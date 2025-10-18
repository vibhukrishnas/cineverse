'use client'

import { useState, useEffect } from 'react'
import { getAdminUsers, banUser, updateUserRole, deleteUser } from '@/app/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Ban, UserCog, Trash2, Download } from 'lucide-react'

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    role: 'all',
    status: 'all',
    page: 1,
    limit: 25,
  })

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    setLoading(true)
    const result = await getAdminUsers(filters)
    if (result.success) {
      setUsers(result.users || [])
      setTotal(result.total || 0)
    }
    setLoading(false)
  }

  const handleBan = async (userId: string, username: string) => {
    if (!confirm(`Ban user ${username}?`)) return

    const reason = prompt('Ban reason:')
    if (!reason) return

    const result = await banUser({
      userId,
      reason,
      banType: 'temporary',
      duration: 7, // 7 days
    })

    if (result.success) {
      alert('User banned successfully')
      loadUsers()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`PERMANENTLY DELETE user ${username}? This cannot be undone!`)) return

    const reason = prompt('Delete reason:')
    if (!reason) return

    const result = await deleteUser(userId, reason)

    if (result.success) {
      alert('User deleted successfully')
      loadUsers()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  const handleRoleChange = async (userId: string, newRole: string, username: string) => {
    if (!confirm(`Change ${username}'s role to ${newRole}?`)) return

    const result = await updateUserRole(userId, newRole)

    if (result.success) {
      alert('Role updated successfully')
      loadUsers()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Manage users, roles, and permissions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by email..."
                className="pl-10"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              />
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
            >
              <option value="all">All Roles</option>
              <option value="user">User</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="banned">Banned</option>
            </select>
            <Button onClick={loadUsers}>Refresh</Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({total.toLocaleString()})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-4">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 px-4 py-2 border-b font-medium text-sm">
                <div className="col-span-4">User</div>
                <div className="col-span-2">Role</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Joined</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Table Rows */}
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-12 gap-4 px-4 py-3 border-b hover:bg-muted/50 items-center"
                >
                  <div className="col-span-4">
                    <div className="font-medium">{user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.id}</div>
                  </div>
                  <div className="col-span-2">
                    <Badge variant="outline">{user.role || 'user'}</Badge>
                  </div>
                  <div className="col-span-2">
                    {user.is_banned ? (
                      <Badge variant="destructive">Banned</Badge>
                    ) : (
                      <Badge variant="default">Active</Badge>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBan(user.id, user.email)}
                      disabled={user.is_banned}
                    >
                      <Ban className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newRole = prompt('Enter new role (user, moderator, admin):')
                        if (newRole) handleRoleChange(user.id, newRole, user.email)
                      }}
                    >
                      <UserCog className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600"
                      onClick={() => handleDelete(user.id, user.email)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {total > filters.limit && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {(filters.page - 1) * filters.limit + 1} to{' '}
                {Math.min(filters.page * filters.limit, total)} of {total}
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                  disabled={filters.page === 1}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                  disabled={filters.page * filters.limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
