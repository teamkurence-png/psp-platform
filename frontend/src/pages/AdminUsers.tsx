import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, type User } from '../services';
import { Card } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import StatusBadge from '../components/ui/StatusBadge';
import { Users, Shield, UserX, UserCheck, Search, Key } from 'lucide-react';
import { formatDate } from '../lib/utils';

interface RoleModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (userId: string, role: string) => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ user, onClose, onUpdate }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);

  const roles = [
    { value: 'merchant', label: 'Merchant', description: 'Can create payment requests and view transactions' },
    { value: 'ops', label: 'Operations', description: 'Can review and approve transactions' },
    { value: 'finance', label: 'Finance', description: 'Can manage settlements and withdrawals' },
    { value: 'admin', label: 'Administrator', description: 'Full system access' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(user._id, selectedRole);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change User Role</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">User Email:</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-3">Select Role</label>
              <div className="space-y-2">
                {roles.map((role) => (
                  <label
                    key={role.value}
                    className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRole === role.value
                        ? 'border-primary bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      value={role.value}
                      checked={selectedRole === role.value}
                      onChange={(e) => setSelectedRole(e.target.value as 'merchant' | 'ops' | 'finance' | 'admin')}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-900">{role.label}</p>
                      <p className="text-xs text-gray-600">{role.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Update Role
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

interface PasswordChangeModalProps {
  user: User;
  onClose: () => void;
  onUpdate: (userId: string, password: string) => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({ user, onClose, onUpdate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    onUpdate(user._id, password);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Change User Password</h3>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">User Email:</p>
              <p className="font-medium text-gray-900">{user.email}</p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Confirm Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full"
                required
              />
            </div>

            <div className="flex gap-3">
              <Button type="submit" className="flex-1">
                Update Password
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

const AdminUsers: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);

  // Fetch users
  const { data: users, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: () => settingsService.getUsers(),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      settingsService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSelectedUser(null);
    },
  });

  // Deactivate user mutation
  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => settingsService.deactivateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Activate user mutation
  const activateMutation = useMutation({
    mutationFn: (userId: string) => settingsService.activateUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: ({ userId, password }: { userId: string; password: string }) =>
      settingsService.updateUserPassword(userId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setPasswordChangeUser(null);
    },
  });

  const handleUpdateRole = (userId: string, role: string) => {
    updateRoleMutation.mutate({ userId, role });
  };

  const handleUpdatePassword = (userId: string, password: string) => {
    updatePasswordMutation.mutate({ userId, password });
  };

  const handleToggleActive = (user: User) => {
    const action = user.isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this user?`)) {
      if (user.isActive) {
        deactivateMutation.mutate(user._id);
      } else {
        activateMutation.mutate(user._id);
      }
    }
  };

  const filteredUsers = users?.filter((user) =>
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: users?.length || 0,
    active: users?.filter((u) => u.isActive).length || 0,
    pending: users?.filter((u) => !u.isActive && u.role === 'merchant').length || 0,
    admins: users?.filter((u) => u.role === 'admin').length || 0,
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorAlert message="Failed to load users" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage user accounts and permissions</p>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <UserX className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">{stats.admins}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  2FA
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <p className="text-gray-500">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers?.map((user) => (
                  <tr 
                    key={user._id} 
                    className={`hover:bg-gray-50 ${!user.isActive && user.role === 'merchant' ? 'bg-yellow-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-gray-900">{user.email}</div>
                        {!user.isActive && user.role === 'merchant' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending Approval
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge
                        status={user.isActive ? 'active' : 'inactive'}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.twoFactorEnabled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Shield className="h-4 w-4 mr-1" />
                          Role
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPasswordChangeUser(user)}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Password
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleActive(user)}
                          disabled={deactivateMutation.isPending || activateMutation.isPending}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Role Modal */}
      {selectedUser && (
        <RoleModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdate={handleUpdateRole}
        />
      )}

      {/* Password Change Modal */}
      {passwordChangeUser && (
        <PasswordChangeModal
          user={passwordChangeUser}
          onClose={() => setPasswordChangeUser(null)}
          onUpdate={handleUpdatePassword}
        />
      )}
    </div>
  );
};

export default AdminUsers;

