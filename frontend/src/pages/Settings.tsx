import React from 'react';
import { Card } from '../components/ui/Card';
import { Settings as SettingsIcon, User, Users, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isMerchant = user?.role === 'merchant';
  const isAdminOrOps = ['admin', 'ops', 'finance'].includes(user?.role || '');

  // Merchant view - only show profile
  if (isMerchant) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your merchant profile and business settings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Merchant Profile */}
          <Link to="/settings/profile">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Merchant Profile</h3>
                  <p className="text-sm text-gray-600">Manage your business information and details</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    );
  }

  // Admin/Ops/Finance view - show all settings
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your platform settings and configurations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Bank Accounts - Admin/Ops/Finance only */}
        {isAdminOrOps && (
          <Link to="/settings/bank-accounts">
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Bank Accounts</h3>
                  <p className="text-sm text-gray-600">Manage settlement bank accounts for payments</p>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {isAdmin && (
          <>
            {/* User Management */}
            <Link to="/settings/users">
              <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">User Management</h3>
                    <p className="text-sm text-gray-600">Manage users, roles, and permissions</p>
                  </div>
                </div>
              </Card>
            </Link>

            {/* System Settings */}
            <Card className="p-6 bg-gray-50 h-full">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <SettingsIcon className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1 text-gray-700">System Settings</h3>
                  <p className="text-sm text-gray-500">Advanced configuration options (Coming soon)</p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;

