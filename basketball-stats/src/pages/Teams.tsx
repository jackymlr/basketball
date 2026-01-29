import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
import type { Team } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

export const Teams: React.FC = () => {
  const { state, addTeam, updateTeam, deleteTeam, getPlayersByTeamId } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleOpenModal = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      setFormData({
        name: team.name,
        description: team.description || '',
      });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingTeam) {
      updateTeam({
        ...editingTeam,
        name: formData.name.trim(),
        description: formData.description.trim(),
      });
    } else {
      addTeam({
        id: uuidv4(),
        name: formData.name.trim(),
        description: formData.description.trim(),
        createdAt: new Date().toISOString(),
      });
    }
    handleCloseModal();
  };

  const handleDelete = (teamId: string) => {
    if (window.confirm('确定要删除这个队伍吗？队伍下的所有队员也会被删除。')) {
      deleteTeam(teamId);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">队伍管理</h1>
          <p className="text-gray-600">管理所有篮球队伍</p>
        </div>
        <Button onClick={() => handleOpenModal()}>+ 添加队伍</Button>
      </div>

      {/* 队伍列表 */}
      {state.teams.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">暂无队伍</h3>
            <p className="text-gray-600 mb-4">点击上方按钮添加第一支队伍</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {state.teams.map((team) => {
            const players = getPlayersByTeamId(team.id);
            return (
              <Card key={team.id}>
                <CardHeader className="bg-orange-50">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {team.name}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {players.length} 名队员
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  {team.description && (
                    <p className="text-gray-600 mb-4">{team.description}</p>
                  )}
                  <div className="text-sm text-gray-500 mb-4">
                    创建时间: {new Date(team.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenModal(team)}
                    >
                      编辑
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(team.id)}
                    >
                      删除
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* 添加/编辑模态框 */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTeam ? '编辑队伍' : '添加队伍'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              队伍名称 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="请输入队伍名称"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              队伍描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              placeholder="请输入队伍描述（可选）"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              取消
            </Button>
            <Button type="submit">{editingTeam ? '保存' : '添加'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
