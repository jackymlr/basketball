import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/useApp';
import type { Game } from '../types';
import { Card, CardBody } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const Games: React.FC = () => {
  const { state, addGame, updateGame, deleteGame, getTeamById } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    homeTeamId: '',
    awayTeamId: '',
    date: '',
    location: '',
  });

  const filteredGames =
    statusFilter === 'all'
      ? state.games
      : state.games.filter((g) => g.status === statusFilter);

  const sortedGames = [...filteredGames].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleOpenModal = (game?: Game) => {
    if (game) {
      setEditingGame(game);
      setFormData({
        homeTeamId: game.homeTeamId,
        awayTeamId: game.awayTeamId,
        date: game.date.split('T')[0],
        location: game.location || '',
      });
    } else {
      setEditingGame(null);
      setFormData({
        homeTeamId: state.teams.length > 0 ? state.teams[0].id : '',
        awayTeamId: state.teams.length > 1 ? state.teams[1].id : '',
        date: new Date().toISOString().split('T')[0],
        location: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGame(null);
    setFormData({ homeTeamId: '', awayTeamId: '', date: '', location: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.homeTeamId || !formData.awayTeamId || !formData.date) return;
    if (formData.homeTeamId === formData.awayTeamId) {
      alert('主队和客队不能是同一支队伍');
      return;
    }

    if (editingGame) {
      updateGame({
        ...editingGame,
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        date: formData.date,
        location: formData.location.trim(),
      });
    } else {
      addGame({
        id: uuidv4(),
        homeTeamId: formData.homeTeamId,
        awayTeamId: formData.awayTeamId,
        homeScore: 0,
        awayScore: 0,
        date: formData.date,
        location: formData.location.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
    }
    handleCloseModal();
  };

  const handleDelete = (gameId: string) => {
    if (window.confirm('确定要删除这场比赛吗？所有相关的统计数据也会被删除。')) {
      deleteGame(gameId);
    }
  };

  const getStatusBadge = (status: Game['status']) => {
    const styles = {
      pending: 'bg-gray-100 text-gray-800',
      ongoing: 'bg-yellow-100 text-yellow-800',
      finished: 'bg-green-100 text-green-800',
    };
    const labels = {
      pending: '未开始',
      ongoing: '进行中',
      finished: '已结束',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">比赛管理</h1>
          <p className="text-gray-600">管理和记录篮球比赛</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">全部状态</option>
            <option value="pending">未开始</option>
            <option value="ongoing">进行中</option>
            <option value="finished">已结束</option>
          </select>
          <Button
            onClick={() => handleOpenModal()}
            disabled={state.teams.length < 2}
          >
            + 新建比赛
          </Button>
        </div>
      </div>

      {/* 提示信息 */}
      {state.teams.length < 2 && (
        <Card>
          <CardBody className="text-center py-8 bg-yellow-50">
            <p className="text-yellow-800">
              ⚠️ 需要至少两支队伍才能创建比赛，请先在队伍管理中添加队伍
            </p>
          </CardBody>
        </Card>
      )}

      {/* 比赛列表 */}
      {sortedGames.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">🏀</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无比赛</h3>
            <p className="text-gray-600 mb-4">点击上方按钮创建新比赛</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedGames.map((game) => {
            const homeTeam = getTeamById(game.homeTeamId);
            const awayTeam = getTeamById(game.awayTeamId);
            return (
              <Card key={game.id} className="hover:shadow-lg transition-shadow">
                <CardBody>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* 比赛信息 */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-2">
                        {getStatusBadge(game.status)}
                        <span className="text-sm text-gray-500">
                          {new Date(game.date).toLocaleDateString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </span>
                        {game.location && (
                          <span className="text-sm text-gray-500">
                            📍 {game.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center md:justify-start space-x-6">
                        <div className="text-center md:text-right flex-1">
                          <p className="font-semibold text-lg text-gray-900">
                            {homeTeam?.name || '未知队伍'}
                          </p>
                          <p className="text-sm text-gray-500">主队</p>
                        </div>
                        <div className="text-center">
                          <p className="text-3xl font-bold text-orange-600">
                            {game.homeScore} - {game.awayScore}
                          </p>
                        </div>
                        <div className="text-center md:text-left flex-1">
                          <p className="font-semibold text-lg text-gray-900">
                            {awayTeam?.name || '未知队伍'}
                          </p>
                          <p className="text-sm text-gray-500">客队</p>
                        </div>
                      </div>
                    </div>
                    {/* 操作按钮 */}
                    <div className="flex items-center space-x-2 justify-center md:justify-end">
                      <Link to={`/games/${game.id}`}>
                        <Button variant="primary" size="sm">
                          {game.status === 'pending' ? '开始记录' : '查看详情'}
                        </Button>
                      </Link>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleOpenModal(game)}
                      >
                        编辑
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(game.id)}
                      >
                        删除
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* 新建/编辑比赛模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingGame ? '编辑比赛' : '新建比赛'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              主队 *
            </label>
            <select
              value={formData.homeTeamId}
              onChange={(e) =>
                setFormData({ ...formData, homeTeamId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">请选择主队</option>
              {state.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              客队 *
            </label>
            <select
              value={formData.awayTeamId}
              onChange={(e) =>
                setFormData({ ...formData, awayTeamId: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">请选择客队</option>
              {state.teams
                .filter((t) => t.id !== formData.homeTeamId)
                .map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              比赛日期 *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              比赛地点
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="请输入比赛地点（可选）"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              取消
            </Button>
            <Button type="submit">{editingGame ? '保存' : '创建'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
