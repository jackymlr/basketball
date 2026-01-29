import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/teams', label: '队伍管理', icon: '👥' },
  { path: '/players', label: '队员管理', icon: '🏃' },
  { path: '/games', label: '比赛管理', icon: '🏀' },
];

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 顶部导航栏 */}
      <nav className="bg-orange-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold flex items-center gap-2">
                🏀 篮球数据统计
              </Link>
            </div>
            <div className="flex space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    location.pathname === item.path
                      ? 'bg-orange-700'
                      : 'hover:bg-orange-500'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* 主内容区域 */}
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>

      {/* 底部 */}
      <footer className="bg-gray-800 text-gray-400 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>篮球数据统计工具 © {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
};
