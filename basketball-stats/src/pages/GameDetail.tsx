import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/useApp';
import type { PlayerStats } from '../types';
import { createEmptyPlayerStats } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';

export const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const {
    getGameById,
    getTeamById,
    getPlayersByTeamId,
    getStatsByGameId,
    updateGame,
    updateMultiplePlayerStats,
  } = useApp();

  const game = gameId ? getGameById(gameId) : undefined;
  const [activeTab, setActiveTab] = useState<'home' | 'away'>('home');
  const [hasChanges, setHasChanges] = useState(false);
  
  // 使用 useMemo 初始化已有数据
  const initialStatsMap = useMemo(() => {
    if (!gameId) return new Map<string, PlayerStats>();
    const existingStats = getStatsByGameId(gameId);
    const statsMap = new Map<string, PlayerStats>();
    existingStats.forEach((stat) => {
      statsMap.set(stat.playerId, stat);
    });
    return statsMap;
  }, [gameId, getStatsByGameId]);
  
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerStats>>(() => initialStatsMap);

  if (!game) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">比赛不存在</h2>
        <Button onClick={() => navigate('/games')}>返回比赛列表</Button>
      </div>
    );
  }

  const homeTeam = getTeamById(game.homeTeamId);
  const awayTeam = getTeamById(game.awayTeamId);
  const homePlayers = getPlayersByTeamId(game.homeTeamId);
  const awayPlayers = getPlayersByTeamId(game.awayTeamId);

  const currentTeam = activeTab === 'home' ? homeTeam : awayTeam;
  const currentPlayers = activeTab === 'home' ? homePlayers : awayPlayers;

  // 获取或创建队员统计数据
  const getPlayerStat = (playerId: string, teamId: string): PlayerStats => {
    if (playerStats.has(playerId)) {
      return playerStats.get(playerId)!;
    }
    return createEmptyPlayerStats(gameId!, playerId, teamId);
  };

  // 更新单个队员的统计数据
  const updateStat = (
    playerId: string,
    teamId: string,
    field: keyof PlayerStats,
    value: number
  ) => {
    const currentStat = getPlayerStat(playerId, teamId);
    const updatedStat: PlayerStats = {
      ...currentStat,
      id: currentStat.id || uuidv4(),
      [field]: Math.max(0, value),
    };

    // 自动计算得分
    if (['twoPointsMade', 'threePointsMade', 'freeThrowsMade'].includes(field)) {
      updatedStat.points =
        updatedStat.twoPointsMade * 2 +
        updatedStat.threePointsMade * 3 +
        updatedStat.freeThrowsMade;
    }

    const newStats = new Map(playerStats);
    newStats.set(playerId, updatedStat);
    setPlayerStats(newStats);
    setHasChanges(true);
  };

  // 快速增加按钮
  const quickAdd = (
    playerId: string,
    teamId: string,
    field: keyof PlayerStats,
    amount: number = 1
  ) => {
    const currentStat = getPlayerStat(playerId, teamId);
    const currentValue = (currentStat[field] as number) || 0;
    updateStat(playerId, teamId, field, currentValue + amount);
  };

  // 保存所有数据
  const handleSave = () => {
    const statsArray = Array.from(playerStats.values());
    updateMultiplePlayerStats(statsArray);

    // 计算两队得分
    let homeScore = 0;
    let awayScore = 0;
    statsArray.forEach((stat) => {
      if (stat.teamId === game.homeTeamId) {
        homeScore += stat.points;
      } else if (stat.teamId === game.awayTeamId) {
        awayScore += stat.points;
      }
    });

    // 更新比赛比分
    updateGame({
      ...game,
      homeScore,
      awayScore,
    });

    setHasChanges(false);
    alert('数据已保存！');
  };

  // 开始比赛
  const handleStartGame = () => {
    updateGame({
      ...game,
      status: 'ongoing',
    });
  };

  // 结束比赛
  const handleEndGame = () => {
    if (window.confirm('确定要结束这场比赛吗？')) {
      handleSave();
      updateGame({
        ...game,
        status: 'finished',
      });
    }
  };

  // 统计数据字段配置
  const statFields: {
    key: keyof PlayerStats;
    label: string;
    shortLabel: string;
  }[] = [
    { key: 'twoPointsMade', label: '两分命中', shortLabel: '2分中' },
    { key: 'twoPointsAttempted', label: '两分出手', shortLabel: '2分投' },
    { key: 'threePointsMade', label: '三分命中', shortLabel: '3分中' },
    { key: 'threePointsAttempted', label: '三分出手', shortLabel: '3分投' },
    { key: 'freeThrowsMade', label: '罚球命中', shortLabel: '罚中' },
    { key: 'freeThrowsAttempted', label: '罚球出手', shortLabel: '罚投' },
    { key: 'offensiveRebounds', label: '前场篮板', shortLabel: '前板' },
    { key: 'defensiveRebounds', label: '后场篮板', shortLabel: '后板' },
    { key: 'assists', label: '助攻', shortLabel: '助攻' },
    { key: 'steals', label: '抢断', shortLabel: '抢断' },
    { key: 'blocks', label: '盖帽', shortLabel: '盖帽' },
    { key: 'turnovers', label: '失误', shortLabel: '失误' },
    { key: 'fouls', label: '犯规', shortLabel: '犯规' },
  ];

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <Button variant="secondary" onClick={() => navigate('/games')}>
        ← 返回比赛列表
      </Button>

      {/* 比赛信息卡片 */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
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
                <span className="text-sm text-gray-500">
                  {new Date(game.date).toLocaleDateString('zh-CN')}
                </span>
                {game.location && (
                  <span className="text-sm text-gray-500">📍 {game.location}</span>
                )}
              </div>
              <div className="flex items-center justify-center space-x-8">
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900">
                    {homeTeam?.name || '未知队伍'}
                  </p>
                  <p className="text-sm text-gray-500">主队</p>
                </div>
                <div className="text-center">
                  <p className="text-4xl font-bold text-orange-600">
                    {game.homeScore} - {game.awayScore}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-xl text-gray-900">
                    {awayTeam?.name || '未知队伍'}
                  </p>
                  <p className="text-sm text-gray-500">客队</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 justify-center">
              {game.status === 'pending' && (
                <Button onClick={handleStartGame}>开始比赛</Button>
              )}
              {game.status === 'ongoing' && (
                <>
                  <Button onClick={handleSave} disabled={!hasChanges}>
                    保存数据
                  </Button>
                  <Button variant="success" onClick={handleEndGame}>
                    结束比赛
                  </Button>
                </>
              )}
              {game.status === 'finished' && (
                <Button onClick={handleSave} disabled={!hasChanges}>
                  保存修改
                </Button>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 队伍切换标签 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('home')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'home'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {homeTeam?.name || '主队'} ({homePlayers.length}人)
        </button>
        <button
          onClick={() => setActiveTab('away')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'away'
              ? 'border-b-2 border-orange-600 text-orange-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {awayTeam?.name || '客队'} ({awayPlayers.length}人)
        </button>
      </div>

      {/* 队员数据统计 */}
      {currentPlayers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">该队伍暂无队员，请先在队员管理中添加队员</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {currentPlayers.map((player) => {
            const stat = getPlayerStat(player.id, player.teamId);
            const totalRebounds = stat.offensiveRebounds + stat.defensiveRebounds;
            
            return (
              <Card key={player.id}>
                <CardHeader className="bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                        {player.number || '?'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{player.name}</h3>
                        <p className="text-sm text-gray-500">{player.position || '未设置位置'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-orange-600">{stat.points} 分</p>
                      <p className="text-sm text-gray-500">
                        {totalRebounds} 篮板 / {stat.assists} 助攻
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    {statFields.map((field) => (
                      <div
                        key={field.key}
                        className="bg-gray-50 rounded-lg p-3 text-center"
                      >
                        <p className="text-xs text-gray-500 mb-1">{field.shortLabel}</p>
                        <div className="flex items-center justify-center space-x-1">
                          <button
                            onClick={() =>
                              quickAdd(player.id, player.teamId, field.key, -1)
                            }
                            className="w-6 h-6 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
                            disabled={game.status === 'pending'}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={stat[field.key] as number}
                            onChange={(e) =>
                              updateStat(
                                player.id,
                                player.teamId,
                                field.key,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-12 h-8 text-center border border-gray-300 rounded text-sm"
                            min="0"
                            disabled={game.status === 'pending'}
                          />
                          <button
                            onClick={() =>
                              quickAdd(player.id, player.teamId, field.key, 1)
                            }
                            className="w-6 h-6 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm font-bold"
                            disabled={game.status === 'pending'}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* 快捷得分按钮 */}
                  {game.status !== 'pending' && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-2">快捷得分：</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'twoPointsMade', 1);
                            quickAdd(player.id, player.teamId, 'twoPointsAttempted', 1);
                          }}
                        >
                          +2分 命中
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'twoPointsAttempted', 1);
                          }}
                        >
                          2分 不中
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'threePointsMade', 1);
                            quickAdd(player.id, player.teamId, 'threePointsAttempted', 1);
                          }}
                        >
                          +3分 命中
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'threePointsAttempted', 1);
                          }}
                        >
                          3分 不中
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'freeThrowsMade', 1);
                            quickAdd(player.id, player.teamId, 'freeThrowsAttempted', 1);
                          }}
                        >
                          +罚球 命中
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            quickAdd(player.id, player.teamId, 'freeThrowsAttempted', 1);
                          }}
                        >
                          罚球 不中
                        </Button>
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* 统计总览 */}
      {currentPlayers.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-900">
              {currentTeam?.name} 数据汇总
            </h3>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left">球员</th>
                    <th className="px-3 py-2 text-center">得分</th>
                    <th className="px-3 py-2 text-center">2分</th>
                    <th className="px-3 py-2 text-center">3分</th>
                    <th className="px-3 py-2 text-center">罚球</th>
                    <th className="px-3 py-2 text-center">篮板</th>
                    <th className="px-3 py-2 text-center">助攻</th>
                    <th className="px-3 py-2 text-center">抢断</th>
                    <th className="px-3 py-2 text-center">盖帽</th>
                    <th className="px-3 py-2 text-center">失误</th>
                    <th className="px-3 py-2 text-center">犯规</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPlayers.map((player) => {
                    const stat = getPlayerStat(player.id, player.teamId);
                    return (
                      <tr key={player.id} className="border-t">
                        <td className="px-3 py-2 font-medium">
                          #{player.number} {player.name}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-orange-600">
                          {stat.points}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stat.twoPointsMade}/{stat.twoPointsAttempted}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stat.threePointsMade}/{stat.threePointsAttempted}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stat.freeThrowsMade}/{stat.freeThrowsAttempted}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {stat.offensiveRebounds + stat.defensiveRebounds}
                        </td>
                        <td className="px-3 py-2 text-center">{stat.assists}</td>
                        <td className="px-3 py-2 text-center">{stat.steals}</td>
                        <td className="px-3 py-2 text-center">{stat.blocks}</td>
                        <td className="px-3 py-2 text-center">{stat.turnovers}</td>
                        <td className="px-3 py-2 text-center">{stat.fouls}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 bg-gray-50 font-bold">
                    <td className="px-3 py-2">合计</td>
                    <td className="px-3 py-2 text-center text-orange-600">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).points,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).twoPointsMade,
                        0
                      )}
                      /
                      {currentPlayers.reduce(
                        (sum, p) =>
                          sum + getPlayerStat(p.id, p.teamId).twoPointsAttempted,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).threePointsMade,
                        0
                      )}
                      /
                      {currentPlayers.reduce(
                        (sum, p) =>
                          sum + getPlayerStat(p.id, p.teamId).threePointsAttempted,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).freeThrowsMade,
                        0
                      )}
                      /
                      {currentPlayers.reduce(
                        (sum, p) =>
                          sum + getPlayerStat(p.id, p.teamId).freeThrowsAttempted,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) =>
                          sum +
                          getPlayerStat(p.id, p.teamId).offensiveRebounds +
                          getPlayerStat(p.id, p.teamId).defensiveRebounds,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).assists,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).steals,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).blocks,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).turnovers,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).fouls,
                        0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};
