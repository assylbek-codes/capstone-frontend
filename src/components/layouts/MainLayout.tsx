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
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50">
        <div className="px-6 py-4 border-b border-gray-700/50">
          <Link to="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">Husslify</Link>
        </div>
        
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-gray-300 hover:bg-gray-700/50 transition-colors ${
                    location.pathname.startsWith(item.path) 
                      ? 'bg-gray-700/50 border-l-4 border-blue-500 text-blue-400' 
                      : ''
                  }`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Technology background elements for sidebar */}
        <div className="absolute bottom-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 left-8 w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.7s'}}></div>
        <div className="absolute bottom-4 left-12 w-2 h-2 bg-cyan-500 rounded-full animate-pulse" style={{animationDelay: '1.3s'}}></div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800">
        {/* Top navbar */}
        <header className="bg-gray-800/80 backdrop-blur-sm border-b border-gray-700/50 h-16 shadow-md">
          <div className="flex items-center justify-end h-full px-6">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-gray-300">{user.username}</span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </header>
        
        {/* Content area */}
        <main className="flex-1 overflow-auto p-6 relative">
          {/* Background blurred elements */}
          <div className="fixed inset-0 z-0 pointer-events-none opacity-10">
            <div className="absolute top-20 right-10 w-80 h-80 rounded-full bg-blue-500 blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 rounded-full bg-purple-500 blur-3xl"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}; 