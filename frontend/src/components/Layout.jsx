import React from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center gap-2 group">
                <span className="text-3xl group-hover:scale-110 transition-transform">📰</span>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  The Daily Digest
                </span>
              </Link>
              <div className="flex space-x-2">
                <Link 
                  to="/" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/') 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">📖</span>
                  Today's Digest
                </Link>
                <Link 
                  to="/read-later" 
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive('/read-later') 
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">⭐</span>
                  Read Later
                </Link>
              </div>
            </div>
            
            {/* User menu */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <span className="text-xl">👤</span>
                <span className="text-sm font-medium text-gray-700">{user?.email}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <span>👋</span>
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              © 2024 The Daily Digest • Your personalized news, curated twice daily
            </p>
            <p className="text-xs text-gray-500">
              Powered by world-class news sources from around the globe 🌍
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;