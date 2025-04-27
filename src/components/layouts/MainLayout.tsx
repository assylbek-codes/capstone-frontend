import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useAuthStore();
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Environments', path: '/environments' },
    { name: 'Scenarios', path: '/scenarios' },
    { name: 'Tasks', path: '/tasks' },
    { name: 'Solves', path: '/solves' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          {/* <h1 className="text-2xl font-bold text-primary">Warehouse Opt</h1> */}
          <Link to="/" className="text-2xl font-bold text-primary">Husslify</Link>
        </div>
        
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 ${
                    location.pathname.startsWith(item.path) ? 'bg-gray-100 border-l-4 border-primary' : ''
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <header className="bg-white shadow-sm h-16">
          <div className="flex items-center justify-end h-full px-6">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-700 hover:text-primary"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 