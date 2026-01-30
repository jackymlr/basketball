import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/useApp';
import type { Player } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

const POSITIONS = ['控球后卫', '得分后卫', '小前锋', '大前锋', '中锋'];

export const Players: React.FC = () => {
  const { state, addPlayer, updatePlayer, deletePlayer, getTeamById } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    position: '',
    teamId: '',
  });

  const filteredPlayers =
    selectedTeamId === 'all'
      ? state.players
      : state.players.filter((p) => p.teamId === selectedTeamId);

  const handleOpenModal = (player?: Player) => {
    if (player) {
      setEditingPlayer(player);
      setFormData({
        name: player.name,
        number: player.number.toString(),
        position: player.position,
        teamId: player.teamId,
      });
    } else {
      setEditingPlayer(null);
      setFormData({
        name: '',
        number: '',
        position: '',
        teamId: state.teams.length > 0 ? state.teams[0].id : '',
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlayer(null);
    setFormData({ name: '', number: '', position: '', teamId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.teamId) return;

    if (editingPlayer) {
      updatePlayer({
        ...editingPlayer,
        name: formData.name.trim(),
        number: parseInt(formData.number) || 0,
        position: formData.position,
        teamId: formData.teamId,
      });
    } else {
      addPlayer({
        id: uuidv4(),
        name: formData.name.trim(),
        number: parseInt(formData.number) || 0,
        position: formData.position,
        teamId: formData.teamId,
        createdAt: new Date().toISOString(),
      });
    }
    handleCloseModal();
  };

  const handleDelete = (playerId: string) => {
    if (window.confirm('确定要删除这个队员吗？该队员的所有比赛数据也会被删除。')) {
      deletePlayer(playerId);
    }
  };

  // 按队伍分组显示
  const playersByTeam = state.teams.map((team) => ({
    team,
    players: state.players.filter((p) => p.teamId === team.id),
  }));

  return (
    <div className="space-y-6">
      {/* 页面标题：430 小屏下操作区换行 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">队员管理</h1>
          <p className="text-sm sm:text-base text-gray-600">管理所有队伍的队员</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
          <select
            value={selectedTeamId}
            onChange={(e) => setSelectedTeamId(e.target.value)}
            className="w-full sm:w-auto min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 touch-manipulation"
          >
            <option value="all">全部队伍</option>
            {state.teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <Button
            onClick={() => handleOpenModal()}
            disabled={state.teams.length === 0}
            className="w-full sm:w-auto touch-manipulation"
          >
            + 添加队员
          </Button>
        </div>
      </div>

      {/* 无队伍提示 */}
      {state.teams.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              请先创建队伍
            </h3>
            <p className="text-gray-600 mb-4">
              在添加队员之前，需要先创建至少一支队伍
            </p>
          </CardBody>
        </Card>
      ) : filteredPlayers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">🏃</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无队员</h3>
            <p className="text-gray-600 mb-4">点击上方按钮添加队员</p>
          </CardBody>
        </Card>
      ) : (
        /* 队员列表 */
        <div className="space-y-6">
          {selectedTeamId === 'all' ? (
            playersByTeam.map(
              ({ team, players }) =>
                players.length > 0 && (
                  <Card key={team.id}>
                    <CardHeader className="bg-orange-50">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {team.name}
                      </h3>
                    </CardHeader>
                    <CardBody>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {players.map((player) => (
                          <PlayerCard
                            key={player.id}
                            player={player}
                            onEdit={() => handleOpenModal(player)}
                            onDelete={() => handleDelete(player.id)}
                          />
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                )
            )
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  teamName={getTeamById(player.teamId)?.name}
                  onEdit={() => handleOpenModal(player)}
                  onDelete={() => handleDelete(player.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 添加/编辑模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingPlayer ? '编辑队员' : '添加队员'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属队伍 *
            </label>
            <select
              value={formData.teamId}
              onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            >
              <option value="">请选择队伍</option>
              {state.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              队员姓名 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="请输入队员姓名"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              球衣号码
            </label>
            <input
              type="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="请输入球衣号码"
              min="0"
              max="99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              场上位置
            </label>
            <select
              value={formData.position}
              onChange={(e) =>
                setFormData({ ...formData, position: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="">请选择位置</option>
              {POSITIONS.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              取消
            </Button>
            <Button type="submit">{editingPlayer ? '保存' : '添加'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// 队员卡片组件
interface PlayerCardProps {
  player: Player;
  teamName?: string;
  onEdit: () => void;
  onDelete: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({
  player,
  teamName,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center text-xl font-bold">
            {player.number || '?'}
          </div>
          <div>
            <h4 className="font-semibold text-gray-900">{player.name}</h4>
            <p className="text-sm text-gray-500">
              {player.position || '未设置位置'}
              {teamName && ` · ${teamName}`}
            </p>
          </div>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-orange-600 transition-colors"
            title="编辑"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-500 hover:text-red-600 transition-colors"
            title="删除"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};
