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
    <div className="min-h-screen min-h-[100dvh] bg-gray-100 flex flex-col">
      {/* 顶部：移动端仅 logo，桌面端完整导航 */}
      <header
        className="bg-orange-600 text-white shadow-lg shrink-0"
        style={{ paddingTop: 'var(--sat, 0)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-12 sm:h-16">
            <Link
              to="/"
              className="text-base sm:text-xl font-bold flex items-center gap-1.5 sm:gap-2 min-w-0"
            >
              <span aria-hidden>🏀</span>
              <span className="truncate">篮球数据统计</span>
            </Link>
            {/* 桌面端导航：≥640px 显示 */}
            <nav className="hidden sm:flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                    location.pathname === item.path
                      ? 'bg-orange-700'
                      : 'hover:bg-orange-500'
                  }`}
                >
                  <span className="mr-1">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* 主内容：移动端留出底部导航高度 */}
      <main className="max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex-1 pb-20 sm:pb-6">
        {children}
      </main>

      {/* 移动端底部导航：<640px 显示，适配 430×932 */}
      <nav
        className="sm:hidden fixed bottom-0 left-0 right-0 bg-orange-600 text-white border-t border-orange-700 z-40 grid grid-cols-4"
        style={{
          paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))',
          paddingLeft: 'env(safe-area-inset-left)',
          paddingRight: 'env(safe-area-inset-right)',
        }}
      >
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2.5 min-h-[56px] touch-manipulation transition-colors ${
                isActive ? 'bg-orange-700 text-white' : 'text-orange-100 active:bg-orange-700'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className="text-xs mt-1 truncate max-w-full px-1">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 底部：移动端缩小 */}
      <footer className="bg-gray-800 text-gray-400 py-3 sm:py-4 mt-auto shrink-0 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm sm:text-base">
            篮球数据统计工具 © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};
