import React, { useState, useMemo } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import {
  LayoutDashboard,
  FileText,
  Building2,
  Wallet,
  Settings,
  LogOut,
  Menu,
  X,
  Bitcoin,
  UserCheck,
} from 'lucide-react';
import { UserRole } from '../../types';
import Button from '../ui/Button';
import NotificationBell from '../ui/NotificationBell';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: UserRole[];
}

const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Build navigation based on user role
  const navigation = useMemo(() => {
    const allNavItems: NavigationItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { 
        name: 'Payment Requests', 
        href: '/payment-requests', 
        icon: FileText,
        roles: [UserRole.MERCHANT]
      },
      { 
        name: 'Manual Confirmations', 
        href: '/confirmations', 
        icon: UserCheck,
        roles: [UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN]
      },
      { name: 'Balances', href: '/balances', icon: Wallet },
      { name: 'Crypto Withdrawals', href: '/withdrawals', icon: Bitcoin },
      { 
        name: 'Merchants', 
        href: '/merchants', 
        icon: Building2,
        roles: [UserRole.OPS, UserRole.FINANCE, UserRole.ADMIN]
      },
      { name: 'Settings', href: '/settings', icon: Settings },
    ];

    // Filter navigation items based on user role
    return allNavItems.filter(item => {
      if (!item.roles) return true;
      return user?.role && item.roles.includes(user.role as UserRole);
    });
  }, [user?.role]);

  const isActive = (path: string) => location.pathname === path;

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 space-y-1 px-2 py-4">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={isMobile ? () => setSidebarOpen(false) : undefined}
            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon className="mr-3 h-5 w-5" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  const renderUserInfo = () => (
    <div className="p-4 border-t">
      <div className="flex items-center mb-3">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{user?.email}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Logout
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="text-xl font-bold text-primary">PSP Platform</span>
              <button 
                onClick={() => setSidebarOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {renderNavLinks(true)}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r">
          <div className="flex items-center h-16 px-4 border-b">
            <span className="text-xl font-bold text-primary">PSP Platform</span>
          </div>
          {renderNavLinks()}
          {renderUserInfo()}
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex h-16 bg-white border-b">
          <button
            className="px-4 text-gray-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex flex-1 items-center justify-between px-4">
            <span className="text-xl font-bold text-primary lg:hidden">PSP Platform</span>
            <div className="ml-auto">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;

