import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/useApp';
import { Card, CardBody } from '../components/Card';

export const Home: React.FC = () => {
  const { state } = useApp();

  const stats = [
    {
      label: '队伍数量',
      value: state.teams.length,
      icon: '👥',
      link: '/teams',
      color: 'bg-blue-500',
    },
    {
      label: '队员数量',
      value: state.players.length,
      icon: '🏃',
      link: '/players',
      color: 'bg-green-500',
    },
    {
      label: '比赛数量',
      value: state.games.length,
      icon: '🏀',
      link: '/games',
      color: 'bg-orange-500',
    },
    {
      label: '统计记录',
      value: state.playerStats.length,
      icon: '📊',
      link: '/games',
      color: 'bg-purple-500',
    },
  ];

  const recentGames = state.games
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* 标题：430 小屏缩小字号 */}
      <div className="text-center px-1">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2">
          🏀 篮球数据统计
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          管理你的篮球比赛、队伍和队员数据
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:scale-105 transition-transform">
              <CardBody>
                <div className="flex items-center">
                  <div
                    className={`${stat.color} text-white p-3 rounded-lg text-2xl`}
                  >
                    {stat.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/teams">
          <Card className="hover:bg-blue-50 transition-colors h-full">
            <CardBody className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">队伍管理</h3>
              <p className="text-gray-600">创建和管理篮球队伍</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/players">
          <Card className="hover:bg-green-50 transition-colors h-full">
            <CardBody className="text-center py-8">
              <div className="text-4xl mb-4">🏃</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">队员管理</h3>
              <p className="text-gray-600">管理队伍中的队员信息</p>
            </CardBody>
          </Card>
        </Link>
        <Link to="/games">
          <Card className="hover:bg-orange-50 transition-colors h-full">
            <CardBody className="text-center py-8">
              <div className="text-4xl mb-4">🏀</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">比赛管理</h3>
              <p className="text-gray-600">创建比赛并记录数据</p>
            </CardBody>
          </Card>
        </Link>
      </div>

      {/* 最近比赛 */}
      {recentGames.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">最近比赛</h2>
            <div className="space-y-3">
              {recentGames.map((game) => {
                const homeTeam = state.teams.find((t) => t.id === game.homeTeamId);
                const awayTeam = state.teams.find((t) => t.id === game.awayTeamId);
                return (
                  <Link
                    key={game.id}
                    to={`/games/${game.id}`}
                    className="block p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
                  >
                    {/* 小屏竖排：主队/比分/客队 与 状态/日期 分两行 */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 min-w-0">
                        <span className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                          {homeTeam?.name || '未知队伍'}
                        </span>
                        <span className="text-xl sm:text-2xl font-bold text-orange-600 shrink-0">
                          {game.homeScore} - {game.awayScore}
                        </span>
                        <span className="font-medium text-sm sm:text-base truncate max-w-[100px] sm:max-w-none">
                          {awayTeam?.name || '未知队伍'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:text-right">
                        <span
                          className={`px-2 py-1 rounded-full text-xs shrink-0 ${
                            game.status === 'finished'
                              ? 'bg-green-100 text-green-800'
                              : game.status === 'ongoing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {game.status === 'finished'
                            ? '已结束'
                            : game.status === 'ongoing'
                            ? '进行中'
                            : '未开始'}
                        </span>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {new Date(game.date).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* 空状态提示 */}
      {state.teams.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">开始使用</h3>
            <p className="text-gray-600 mb-4">
              首先创建队伍，然后添加队员，就可以开始记录比赛数据了！
            </p>
            <Link
              to="/teams"
              className="inline-block bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              创建第一支队伍
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
