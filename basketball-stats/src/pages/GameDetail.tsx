import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/useApp';
import type { PlayerStats } from '../types';
import { createEmptyPlayerStats } from '../types';
import { Card, CardBody, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';

// 倒计时 Hook - 支持回调
const useGameTimer = (initialMinutes: number = 12, onTick?: () => void) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // 秒
  const [isRunning, setIsRunning] = useState(false);
  const [currentQuarter, setCurrentQuarter] = useState(1);
  const [quarterMinutes, setQuarterMinutes] = useState(initialMinutes);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onTickRef = useRef(onTick);

  // 更新回调引用
  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
        // 每秒回调，用于更新上场时间
        onTickRef.current?.();
      }, 1000);
    } else {
      clearTimer();
    }

    return () => clearTimer();
  }, [isRunning, clearTimer]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  const reset = () => {
    setIsRunning(false);
    setTimeLeft(quarterMinutes * 60);
  };
  const nextQuarter = () => {
    if (currentQuarter < 4) {
      setCurrentQuarter((prev) => prev + 1);
      setTimeLeft(quarterMinutes * 60);
      setIsRunning(false);
    }
  };
  const setQuarterTime = (minutes: number) => {
    setQuarterMinutes(minutes);
    if (!isRunning) {
      setTimeLeft(minutes * 60);
    }
  };
  const adjustTime = (seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    timeLeft,
    formattedTime: formatTime(timeLeft),
    isRunning,
    currentQuarter,
    quarterMinutes,
    start,
    pause,
    reset,
    nextQuarter,
    setQuarterTime,
    adjustTime,
    setCurrentQuarter,
  };
};

// 格式化上场时间（秒转分:秒）
const formatMinutes = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  
  // 在场球员状态（每队最多5人）
  const [onCourtPlayers, setOnCourtPlayers] = useState<Set<string>>(new Set());
  // 换人模态框
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [substitutionTeam, setSubstitutionTeam] = useState<'home' | 'away'>('home');
  // 展开编辑的球员（仅一个展开以节省空间）
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  // 助攻选择弹窗（2中/3中后弹出）
  const [assistModal, setAssistModal] = useState<{
    open: boolean;
    scorerId: string | null;
    teamId: string | null;
  }>({ open: false, scorerId: null, teamId: null });
  // 先选操作再选人：当前待记录的操作类型（得分 + 其他数据）
  type ScoreActionType =
    | '2pt_made' | '2pt_miss' | '3pt_made' | '3pt_miss' | 'ft_made' | 'ft_miss'
    | 'offensiveRebounds' | 'defensiveRebounds' | 'turnovers' | 'steals' | 'blocks' | 'fouls';
  const [scoreActionModal, setScoreActionModal] = useState<{ open: boolean; type: ScoreActionType | null }>({
    open: false,
    type: null,
  });

  const SCORE_ACTION_LABELS: Record<ScoreActionType, string> = {
    '2pt_made': '2中', '2pt_miss': '2投', '3pt_made': '3中', '3pt_miss': '3投', 'ft_made': '罚中', 'ft_miss': '罚投',
    'offensiveRebounds': '前板', 'defensiveRebounds': '后板', 'turnovers': '失误', 'steals': '抢断', 'blocks': '盖帽', 'fouls': '犯规',
  };
  const SCORE_ACTION_TITLE: Record<ScoreActionType, string> = {
    '2pt_made': '2分命中', '2pt_miss': '2分未中', '3pt_made': '3分命中', '3pt_miss': '3分未中', 'ft_made': '罚球命中', 'ft_miss': '罚球未中',
    'offensiveRebounds': '前场篮板', 'defensiveRebounds': '后场篮板', 'turnovers': '失误', 'steals': '抢断', 'blocks': '盖帽', 'fouls': '犯规',
  };
  const isShootingAction = (t: ScoreActionType) =>
    ['2pt_made', '2pt_miss', '3pt_made', '3pt_miss', 'ft_made', 'ft_miss'].includes(t);

  // 使用 useMemo 初始化已有数据
  const initialStatsMap = useMemo(() => {
    if (!gameId) return new Map<string, PlayerStats>();
    const existingStats = getStatsByGameId(gameId);
    const statsMap = new Map<string, PlayerStats>();
    existingStats.forEach((stat) => {
      // 确保旧数据有 plusMinus 字段
      statsMap.set(stat.playerId, {
        ...stat,
        plusMinus: stat.plusMinus ?? 0,
      });
    });
    return statsMap;
  }, [gameId, getStatsByGameId]);
  
  const [playerStats, setPlayerStats] = useState<Map<string, PlayerStats>>(() => initialStatsMap);

  // 计时器每秒回调 - 增加在场球员的上场时间
  const handleTimerTick = useCallback(() => {
    setPlayerStats((prev) => {
      const newStats = new Map(prev);
      let changed = false;
      
      onCourtPlayers.forEach((playerId) => {
        const existing = newStats.get(playerId);
        if (existing) {
          newStats.set(playerId, {
            ...existing,
            minutes: existing.minutes + 1, // 每秒增加1秒（存储为秒）
          });
          changed = true;
        }
      });
      
      if (changed) {
        setHasChanges(true);
      }
      return newStats;
    });
  }, [onCourtPlayers]);
  
  // 比赛计时器
  const timer = useGameTimer(12, handleTimerTick);

  // 获取某队的在场球员
  const getOnCourtPlayersByTeam = useCallback((teamId: string) => {
    const teamPlayers = teamId === game?.homeTeamId 
      ? getPlayersByTeamId(game.homeTeamId)
      : getPlayersByTeamId(game?.awayTeamId || '');
    return teamPlayers.filter(p => onCourtPlayers.has(p.id));
  }, [game, onCourtPlayers, getPlayersByTeamId]);

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

  // 实时计算比分
  const liveScores = useMemo(() => {
    let homeScore = 0;
    let awayScore = 0;
    playerStats.forEach((stat) => {
      if (stat.teamId === game.homeTeamId) {
        homeScore += stat.points;
      } else if (stat.teamId === game.awayTeamId) {
        awayScore += stat.points;
      }
    });
    return { homeScore, awayScore };
  }, [playerStats, game.homeTeamId, game.awayTeamId]);

  // 获取或创建队员统计数据
  const getPlayerStat = (playerId: string, teamId: string): PlayerStats => {
    if (playerStats.has(playerId)) {
      const stat = playerStats.get(playerId)!;
      // 确保旧数据也有 plusMinus 字段
      return {
        ...stat,
        plusMinus: stat.plusMinus ?? 0,
      };
    }
    return createEmptyPlayerStats(gameId!, playerId, teamId);
  };

  // 切换球员在场状态
  const togglePlayerOnCourt = (playerId: string, teamId: string) => {
    const newOnCourt = new Set(onCourtPlayers);
    const teamPlayers = teamId === game.homeTeamId ? homePlayers : awayPlayers;
    const currentTeamOnCourt = teamPlayers.filter(p => newOnCourt.has(p.id));
    
    if (newOnCourt.has(playerId)) {
      // 下场
      newOnCourt.delete(playerId);
    } else {
      // 上场 - 检查是否已有5人
      if (currentTeamOnCourt.length >= 5) {
        alert('场上已有5名球员，请先换下一名球员');
        return;
      }
      newOnCourt.add(playerId);
      
      // 确保球员有统计数据
      if (!playerStats.has(playerId)) {
        const newStats = new Map(playerStats);
        newStats.set(playerId, {
          ...createEmptyPlayerStats(gameId!, playerId, teamId),
          id: uuidv4(),
        });
        setPlayerStats(newStats);
        setHasChanges(true);
      }
    }
    
    setOnCourtPlayers(newOnCourt);
  };

  // 打开换人面板
  const openSubstitution = (team: 'home' | 'away') => {
    setSubstitutionTeam(team);
    setShowSubstitution(true);
  };

  // 更新单个队员的统计数据
  const updateStat = (
    playerId: string,
    teamId: string,
    field: keyof PlayerStats,
    value: number
  ) => {
    const currentStat = getPlayerStat(playerId, teamId);
    const newValue = Math.max(0, value);
    
    // 计算得分变化量（用于更新正负值）
    let pointsDelta = 0;
    if (field === 'twoPointsMade') {
      pointsDelta = (newValue - currentStat.twoPointsMade) * 2;
    } else if (field === 'threePointsMade') {
      pointsDelta = (newValue - currentStat.threePointsMade) * 3;
    } else if (field === 'freeThrowsMade') {
      pointsDelta = (newValue - currentStat.freeThrowsMade) * 1;
    }
    
    const updatedStat: PlayerStats = {
      ...currentStat,
      id: currentStat.id || uuidv4(),
      [field]: newValue,
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
    
    // 如果得分变化了，更新所有在场球员的正负值
    if (pointsDelta !== 0) {
      const scoringTeamId = teamId;
      
      // 更新所有在场球员的正负值
      onCourtPlayers.forEach((onCourtPlayerId) => {
        if (onCourtPlayerId === playerId) return; // 得分者单独处理
        
        const onCourtStat = newStats.get(onCourtPlayerId);
        if (onCourtStat) {
          const currentPlusMinus = onCourtStat.plusMinus ?? 0;
          const updatedOnCourtStat = { ...onCourtStat };
          if (onCourtStat.teamId === scoringTeamId) {
            // 同队球员：调整正负值
            updatedOnCourtStat.plusMinus = currentPlusMinus + pointsDelta;
          } else {
            // 对方球员：调整正负值（反向）
            updatedOnCourtStat.plusMinus = currentPlusMinus - pointsDelta;
          }
          newStats.set(onCourtPlayerId, updatedOnCourtStat);
        }
      });
      
      // 得分者的正负值也要更新
      const scorerStat = newStats.get(playerId);
      if (scorerStat) {
        newStats.set(playerId, {
          ...scorerStat,
          plusMinus: (scorerStat.plusMinus ?? 0) + pointsDelta,
        });
      }
    }
    
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

  // 快捷得分 - 同时更新多个字段和正负值
  const quickScore = (
    playerId: string,
    teamId: string,
    type: '2pt_made' | '2pt_miss' | '3pt_made' | '3pt_miss' | 'ft_made' | 'ft_miss'
  ) => {
    const currentStat = getPlayerStat(playerId, teamId);
    const updatedStat: PlayerStats = {
      ...currentStat,
      id: currentStat.id || uuidv4(),
    };

    let pointsScored = 0; // 本次得分

    switch (type) {
      case '2pt_made':
        updatedStat.twoPointsMade += 1;
        updatedStat.twoPointsAttempted += 1;
        pointsScored = 2;
        break;
      case '2pt_miss':
        updatedStat.twoPointsAttempted += 1;
        break;
      case '3pt_made':
        updatedStat.threePointsMade += 1;
        updatedStat.threePointsAttempted += 1;
        pointsScored = 3;
        break;
      case '3pt_miss':
        updatedStat.threePointsAttempted += 1;
        break;
      case 'ft_made':
        updatedStat.freeThrowsMade += 1;
        updatedStat.freeThrowsAttempted += 1;
        pointsScored = 1;
        break;
      case 'ft_miss':
        updatedStat.freeThrowsAttempted += 1;
        break;
    }

    // 重新计算得分
    updatedStat.points =
      updatedStat.twoPointsMade * 2 +
      updatedStat.threePointsMade * 3 +
      updatedStat.freeThrowsMade;

    const newStats = new Map(playerStats);
    newStats.set(playerId, updatedStat);

    // 更新在场球员的正负值（只有命中时才更新）
    if (pointsScored > 0) {
      const scoringTeamId = teamId;
      
      // 更新所有在场球员的正负值
      onCourtPlayers.forEach((onCourtPlayerId) => {
        if (onCourtPlayerId === playerId) return; // 得分者已经更新过了
        
        const onCourtStat = newStats.get(onCourtPlayerId);
        if (onCourtStat) {
          const currentPlusMinus = onCourtStat.plusMinus ?? 0;
          const updatedOnCourtStat = { ...onCourtStat };
          if (onCourtStat.teamId === scoringTeamId) {
            // 同队球员：+正负值
            updatedOnCourtStat.plusMinus = currentPlusMinus + pointsScored;
          } else {
            // 对方球员：-正负值
            updatedOnCourtStat.plusMinus = currentPlusMinus - pointsScored;
          }
          newStats.set(onCourtPlayerId, updatedOnCourtStat);
        }
      });
      
      // 得分者的正负值也要更新
      const scorerStat = newStats.get(playerId);
      if (scorerStat) {
        newStats.set(playerId, {
          ...scorerStat,
          plusMinus: (scorerStat.plusMinus ?? 0) + pointsScored,
        });
      }
    }

    setPlayerStats(newStats);
    setHasChanges(true);

    // 2中/3中后弹出助攻选择
    if (type === '2pt_made' || type === '3pt_made') {
      setAssistModal({ open: true, scorerId: playerId, teamId });
    }
  };

  const closeAssistModal = () => {
    setAssistModal({ open: false, scorerId: null, teamId: null });
  };

  const closeScoreActionModal = () => {
    setScoreActionModal({ open: false, type: null });
  };

  const applyScoreAction = (playerId: string, teamId: string) => {
    const type = scoreActionModal.type;
    if (!type) return;
    if (isShootingAction(type)) {
      quickScore(playerId, teamId, type as '2pt_made' | '2pt_miss' | '3pt_made' | '3pt_miss' | 'ft_made' | 'ft_miss');
    } else {
      quickAdd(playerId, teamId, type as keyof PlayerStats, 1);
    }
    closeScoreActionModal();
  };

  const recordAssist = (assistPlayerId: string) => {
    if (!assistModal.teamId) return;
    quickAdd(assistPlayerId, assistModal.teamId, 'assists', 1);
    closeAssistModal();
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
                    {liveScores.homeScore} - {liveScores.awayScore}
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

      {/* 比赛计时器 */}
      {game.status !== 'pending' && (
        <Card>
          <CardBody>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* 计时器显示 */}
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">当前节数</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => timer.setCurrentQuarter(Math.max(1, timer.currentQuarter - 1))}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
                      disabled={timer.currentQuarter <= 1 || timer.isRunning}
                    >
                      -
                    </button>
                    <span className="text-3xl font-bold text-orange-600 w-12 text-center">
                      Q{timer.currentQuarter}
                    </span>
                    <button
                      onClick={() => timer.setCurrentQuarter(Math.min(4, timer.currentQuarter + 1))}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-sm font-bold"
                      disabled={timer.currentQuarter >= 4 || timer.isRunning}
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">剩余时间</p>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => timer.adjustTime(-10)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold"
                      title="-10秒"
                    >
                      -10
                    </button>
                    <span className={`text-4xl font-mono font-bold ${timer.timeLeft <= 60 ? 'text-red-600' : 'text-gray-900'}`}>
                      {timer.formattedTime}
                    </span>
                    <button
                      onClick={() => timer.adjustTime(10)}
                      className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold"
                      title="+10秒"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>

              {/* 计时器控制：小屏不换行，可横向滚动 */}
              <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 shrink-0 min-w-0">
                {/* 每节时间设置 */}
                <div className="flex items-center space-x-2 shrink-0">
                  <span className="text-sm text-gray-500 whitespace-nowrap">每节:</span>
                  <select
                    value={timer.quarterMinutes}
                    onChange={(e) => timer.setQuarterTime(Number(e.target.value))}
                    className="px-2 py-1 border border-gray-300 rounded text-sm shrink-0"
                    disabled={timer.isRunning}
                  >
                    <option value={5}>5分钟</option>
                    <option value={8}>8分钟</option>
                    <option value={10}>10分钟</option>
                    <option value={12}>12分钟</option>
                    <option value={20}>20分钟</option>
                  </select>
                </div>

                {/* 开始/暂停按钮 */}
                {timer.isRunning ? (
                  <Button variant="secondary" onClick={timer.pause} className="shrink-0 whitespace-nowrap">
                    暂停
                  </Button>
                ) : (
                  <Button onClick={timer.start} className="shrink-0 whitespace-nowrap">
                    {timer.timeLeft === timer.quarterMinutes * 60 ? '开始' : '继续'}
                  </Button>
                )}

                {/* 重置按钮 */}
                <Button variant="secondary" onClick={timer.reset} disabled={timer.isRunning} className="shrink-0 whitespace-nowrap">
                  重置
                </Button>

                {/* 下一节按钮 */}
                <Button
                  variant="primary"
                  onClick={timer.nextQuarter}
                  disabled={timer.currentQuarter >= 4 || timer.isRunning}
                  className="shrink-0 whitespace-nowrap"
                >
                  下一节 →
                </Button>
              </div>
            </div>

            {/* 节数指示器 */}
            <div className="flex justify-center mt-4 space-x-2">
              {[1, 2, 3, 4].map((q) => (
                <div
                  key={q}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    q === timer.currentQuarter
                      ? 'bg-orange-600 text-white'
                      : q < timer.currentQuarter
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {q}
                </div>
              ))}
              <div className="flex items-center ml-4 text-sm text-gray-500">
                {timer.currentQuarter <= 4 ? (
                  timer.currentQuarter === 4 ? '第四节' : `第${timer.currentQuarter}节`
                ) : '加时赛'}
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 在场球员显示 */}
      {game.status !== 'pending' && (
        <Card>
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">场上阵容</h3>
              <div className="flex items-center space-x-2">
                {timer.isRunning && (
                  <span className="text-xs text-green-600 animate-pulse">● 计时中 - 自动记录上场时间</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 主队在场球员 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">
                    {homeTeam?.name || '主队'} 
                    <span className="text-sm text-gray-500 ml-2">
                      ({getOnCourtPlayersByTeam(game.homeTeamId).length}/5)
                    </span>
                  </h4>
                  <Button size="sm" variant="secondary" onClick={() => openSubstitution('home')}>
                    🔄 换人
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {homePlayers.filter(p => onCourtPlayers.has(p.id)).length === 0 ? (
                    <p className="text-sm text-gray-400">点击"换人"选择上场球员</p>
                  ) : (
                    homePlayers.filter(p => onCourtPlayers.has(p.id)).map((player) => {
                      const stat = getPlayerStat(player.id, player.teamId);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg"
                        >
                          <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {player.number ?? '?'}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{player.name}</p>
                            <p className="text-xs text-gray-500">{formatMinutes(stat.minutes)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              {/* 客队在场球员 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-700">
                    {awayTeam?.name || '客队'}
                    <span className="text-sm text-gray-500 ml-2">
                      ({getOnCourtPlayersByTeam(game.awayTeamId).length}/5)
                    </span>
                  </h4>
                  <Button size="sm" variant="secondary" onClick={() => openSubstitution('away')}>
                    🔄 换人
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {awayPlayers.filter(p => onCourtPlayers.has(p.id)).length === 0 ? (
                    <p className="text-sm text-gray-400">点击"换人"选择上场球员</p>
                  ) : (
                    awayPlayers.filter(p => onCourtPlayers.has(p.id)).map((player) => {
                      const stat = getPlayerStat(player.id, player.teamId);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-lg"
                        >
                          <span className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {player.number ?? '?'}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{player.name}</p>
                            <p className="text-xs text-gray-500">{formatMinutes(stat.minutes)}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* 换人模态框 */}
      {showSubstitution && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {substitutionTeam === 'home' ? homeTeam?.name : awayTeam?.name} - 换人
              </h3>
              <button
                onClick={() => setShowSubstitution(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {/* 当前在场球员 */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                  场上球员 ({(substitutionTeam === 'home' ? homePlayers : awayPlayers).filter(p => onCourtPlayers.has(p.id)).length}/5)
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(substitutionTeam === 'home' ? homePlayers : awayPlayers)
                    .filter(p => onCourtPlayers.has(p.id))
                    .map((player) => {
                      const stat = getPlayerStat(player.id, player.teamId);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between bg-green-50 border border-green-200 p-3 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">
                              {player.number ?? '?'}
                            </span>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-gray-500">
                                {player.position || '未设置'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* 上场时间快捷编辑 */}
                            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded border">
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, 'minutes', -60)}
                                className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 text-xs"
                                title="-1分钟"
                              >
                                -
                              </button>
                              <span className="text-sm font-mono w-12 text-center">{formatMinutes(stat.minutes)}</span>
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, 'minutes', 60)}
                                className="w-6 h-6 bg-blue-100 rounded hover:bg-blue-200 text-xs"
                                title="+1分钟"
                              >
                                +
                              </button>
                            </div>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => togglePlayerOnCourt(player.id, player.teamId)}
                            >
                              下场
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {(substitutionTeam === 'home' ? homePlayers : awayPlayers)
                    .filter(p => onCourtPlayers.has(p.id)).length === 0 && (
                    <p className="text-gray-400 col-span-2">暂无在场球员</p>
                  )}
                </div>
              </div>

              {/* 替补席球员 */}
              <div>
                <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                  替补席
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {(substitutionTeam === 'home' ? homePlayers : awayPlayers)
                    .filter(p => !onCourtPlayers.has(p.id))
                    .map((player) => {
                      const stat = getPlayerStat(player.id, player.teamId);
                      const canSubIn = (substitutionTeam === 'home' ? homePlayers : awayPlayers)
                        .filter(p => onCourtPlayers.has(p.id)).length < 5;
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between bg-gray-50 border border-gray-200 p-3 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <span className="w-10 h-10 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
                              {player.number ?? '?'}
                            </span>
                            <div>
                              <p className="font-medium">{player.name}</p>
                              <p className="text-xs text-gray-500">
                                {player.position || '未设置'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {/* 上场时间快捷编辑 */}
                            <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded border">
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, 'minutes', -60)}
                                className="w-6 h-6 bg-gray-100 rounded hover:bg-gray-200 text-xs"
                                title="-1分钟"
                              >
                                -
                              </button>
                              <span className="text-sm font-mono w-12 text-center">{formatMinutes(stat.minutes)}</span>
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, 'minutes', 60)}
                                className="w-6 h-6 bg-blue-100 rounded hover:bg-blue-200 text-xs"
                                title="+1分钟"
                              >
                                +
                              </button>
                            </div>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => togglePlayerOnCourt(player.id, player.teamId)}
                              disabled={!canSubIn}
                            >
                              上场
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  {(substitutionTeam === 'home' ? homePlayers : awayPlayers)
                    .filter(p => !onCourtPlayers.has(p.id)).length === 0 && (
                    <p className="text-gray-400 col-span-2">所有球员都在场上</p>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50">
              <Button onClick={() => setShowSubstitution(false)} className="w-full">
                完成
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 助攻选择弹窗（2中/3中后） */}
      <Modal
        isOpen={assistModal.open}
        onClose={closeAssistModal}
        title="记录助攻（可选）"
      >
        <p className="text-sm text-gray-500 mb-3">选择助攻球员，或点击「无助攻」跳过</p>
        <div className="space-y-2">
          {assistModal.scorerId != null && assistModal.teamId != null &&
            (assistModal.teamId === game.homeTeamId ? homePlayers : awayPlayers)
              .filter((p) => onCourtPlayers.has(p.id) && p.id !== assistModal.scorerId)
              .map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => recordAssist(player.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors text-left touch-manipulation"
                >
                  <span className="w-9 h-9 bg-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {player.number ?? '?'}
                  </span>
                  <span className="font-medium text-gray-900">{player.name}</span>
                  <span className="text-sm text-gray-500 ml-auto">
                    {getPlayerStat(player.id, player.teamId).assists} 助
                  </span>
                </button>
              ))}
        </div>
        {assistModal.scorerId != null && assistModal.teamId != null &&
          (assistModal.teamId === game.homeTeamId ? homePlayers : awayPlayers).filter(
            (p) => onCourtPlayers.has(p.id) && p.id !== assistModal.scorerId
          ).length === 0 && (
            <p className="text-sm text-gray-400 py-2">本队暂无其他在场球员</p>
          )}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button variant="secondary" onClick={closeAssistModal} className="w-full">
            无助攻
          </Button>
        </div>
      </Modal>

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

      {/* 快捷记录：主客队通用，先选操作再选球员 */}
      {game.status !== 'pending' && (homePlayers.length > 0 || awayPlayers.length > 0) && (
        <div className="bg-orange-50 border-b border-orange-100 px-3 py-3">
          <p className="text-xs text-gray-500 mb-2">快捷记录 — 主客队通用，先选操作再选球员</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SCORE_ACTION_LABELS) as ScoreActionType[]).map((type) => (
              <Button
                key={type}
                size="sm"
                variant={['2pt_miss', '3pt_miss', 'ft_miss'].includes(type) ? 'secondary' : 'primary'}
                className="!px-3 !py-1.5 !text-sm"
                onClick={() => setScoreActionModal({ open: true, type })}
              >
                {SCORE_ACTION_LABELS[type]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 选择球员弹窗：主队左、客队右，先选操作后选人 */}
      <Modal
        isOpen={scoreActionModal.open}
        onClose={closeScoreActionModal}
        title={scoreActionModal.type ? `选择球员 — ${SCORE_ACTION_TITLE[scoreActionModal.type]}` : '选择球员'}
      >
        {scoreActionModal.type && (() => {
          const actionType = scoreActionModal.type;
          const homeOnCourt = homePlayers.filter((p) => onCourtPlayers.has(p.id));
          const awayOnCourt = awayPlayers.filter((p) => onCourtPlayers.has(p.id));
          return (
          <>
            <p className="text-sm text-gray-500 mb-3">仅显示在场球员，左侧主队、右侧客队</p>
            {/* 小屏也左右两列：grid-cols-2 + overflow-x-auto 保证并排可横向滚动 */}
            <div className="grid grid-cols-2 gap-3 min-w-0 overflow-x-auto">
              {/* 主队 */}
              <div className="min-w-[120px]">
                <h4 className="font-medium text-gray-800 mb-2 pb-1 border-b border-orange-200 text-sm truncate" title={homeTeam?.name || '主队'}>
                  {homeTeam?.name || '主队'}
                </h4>
                <div className="space-y-1.5">
                  {homeOnCourt.map((player) => {
                    const stat = getPlayerStat(player.id, player.teamId);
                    const statValue = isShootingAction(actionType)
                      ? `${stat.points} 分`
                      : `${(stat[actionType as keyof PlayerStats] as number) ?? 0} ${SCORE_ACTION_LABELS[actionType]}`;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => applyScoreAction(player.id, player.teamId)}
                        className="w-full flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors text-left touch-manipulation"
                      >
                        <span className="w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {player.number ?? '?'}
                        </span>
                        <span className="font-medium text-gray-900 text-xs truncate flex-1 min-w-0">{player.name}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{statValue}</span>
                      </button>
                    );
                  })}
                  {homeOnCourt.length === 0 && <p className="text-xs text-gray-400 py-2">暂无在场</p>}
                </div>
              </div>
              {/* 客队 */}
              <div className="min-w-[120px]">
                <h4 className="font-medium text-gray-800 mb-2 pb-1 border-b border-orange-200 text-sm truncate" title={awayTeam?.name || '客队'}>
                  {awayTeam?.name || '客队'}
                </h4>
                <div className="space-y-1.5">
                  {awayOnCourt.map((player) => {
                    const stat = getPlayerStat(player.id, player.teamId);
                    const statValue = isShootingAction(actionType)
                      ? `${stat.points} 分`
                      : `${(stat[actionType as keyof PlayerStats] as number) ?? 0} ${SCORE_ACTION_LABELS[actionType]}`;
                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() => applyScoreAction(player.id, player.teamId)}
                        className="w-full flex items-center gap-1.5 p-2 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-orange-300 transition-colors text-left touch-manipulation"
                      >
                        <span className="w-7 h-7 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                          {player.number ?? '?'}
                        </span>
                        <span className="font-medium text-gray-900 text-xs truncate flex-1 min-w-0">{player.name}</span>
                        <span className="text-[10px] text-gray-500 shrink-0">{statValue}</span>
                      </button>
                    );
                  })}
                  {awayOnCourt.length === 0 && <p className="text-xs text-gray-400 py-2">暂无在场</p>}
                </div>
              </div>
            </div>
          </>
          );
        })()}
      </Modal>

      {/* 队员数据统计 */}
      {currentPlayers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-gray-500">该队伍暂无队员，请先在队员管理中添加队员</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {currentPlayers.map((player) => {
            const stat = getPlayerStat(player.id, player.teamId);
            const totalRebounds = stat.offensiveRebounds + stat.defensiveRebounds;
            const isOnCourt = onCourtPlayers.has(player.id);
            const isExpanded = expandedPlayerId === player.id;

            return (
              <Card key={player.id} className={isOnCourt ? 'ring-2 ring-green-500' : ''}>
                <CardHeader className={`${isOnCourt ? 'bg-green-50' : 'bg-gray-50'} py-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                      <div className={`w-9 h-9 shrink-0 ${isOnCourt ? 'bg-green-600' : 'bg-orange-600'} text-white rounded-full flex items-center justify-center text-sm font-bold relative`}>
                        {player.number ?? '?'}
                        {isOnCourt && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{player.name}</h3>
                          {isOnCourt && (
                            <span className="text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full shrink-0">在场</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {player.position || '—'} · {formatMinutes(stat.minutes)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right">
                        <p className="text-lg sm:text-xl font-bold text-orange-600">{stat.points}</p>
                        <p className="text-xs text-gray-500">{totalRebounds}板 {stat.assists}助</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)}
                        className="px-2 py-1.5 text-xs font-medium rounded-lg border border-gray-300 bg-white hover:bg-gray-50 touch-manipulation min-h-[32px]"
                      >
                        {isExpanded ? '收起' : '编辑'}
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardBody className="py-3">
                  {isExpanded ? (
                    <>
                      {/* 上场时间：单行紧凑 */}
                      <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                        <span className="text-xs font-medium text-gray-600">上场:</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => quickAdd(player.id, player.teamId, 'minutes', -60)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold"
                            disabled={game.status === 'pending'}
                            title="-1分钟"
                          >-1m</button>
                          <button
                            onClick={() => quickAdd(player.id, player.teamId, 'minutes', -10)}
                            className="w-7 h-7 bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold"
                            disabled={game.status === 'pending'}
                            title="-10秒"
                          >-10</button>
                          <input
                            type="number"
                            value={Math.floor(stat.minutes / 60)}
                            onChange={(e) => {
                              const mins = parseInt(e.target.value) || 0;
                              const secs = stat.minutes % 60;
                              updateStat(player.id, player.teamId, 'minutes', mins * 60 + secs);
                            }}
                            className="w-10 h-7 text-center border border-gray-300 rounded text-xs"
                            min="0"
                            disabled={game.status === 'pending'}
                            title="分钟"
                          />
                          <span className="text-gray-400">:</span>
                          <input
                            type="number"
                            value={stat.minutes % 60}
                            onChange={(e) => {
                              const mins = Math.floor(stat.minutes / 60);
                              const secs = Math.min(59, Math.max(0, parseInt(e.target.value) || 0));
                              updateStat(player.id, player.teamId, 'minutes', mins * 60 + secs);
                            }}
                            className="w-10 h-7 text-center border border-gray-300 rounded text-xs"
                            min="0"
                            max="59"
                            disabled={game.status === 'pending'}
                            title="秒"
                          />
                          <button
                            onClick={() => quickAdd(player.id, player.teamId, 'minutes', 10)}
                            className="w-7 h-7 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-bold"
                            disabled={game.status === 'pending'}
                            title="+10秒"
                          >+10</button>
                          <button
                            onClick={() => quickAdd(player.id, player.teamId, 'minutes', 60)}
                            className="w-7 h-7 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs font-bold"
                            disabled={game.status === 'pending'}
                            title="+1分钟"
                          >+1m</button>
                        </div>
                        <span className="text-xs text-gray-500 font-mono">{formatMinutes(stat.minutes)}</span>
                      </div>
                      {/* 统计项：紧凑网格 */}
                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 mb-3">
                        {statFields.map((field) => (
                          <div key={field.key} className="bg-gray-50 rounded p-2 text-center">
                            <p className="text-[10px] text-gray-500 mb-0.5 leading-tight">{field.shortLabel}</p>
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, field.key, -1)}
                                className="w-5 h-5 bg-gray-200 rounded hover:bg-gray-300 text-xs font-bold leading-none"
                                disabled={game.status === 'pending'}
                              >−</button>
                              <input
                                type="number"
                                value={stat[field.key] as number}
                                onChange={(e) =>
                                  updateStat(player.id, player.teamId, field.key, parseInt(e.target.value) || 0)
                                }
                                className="w-8 h-6 text-center border border-gray-300 rounded text-xs"
                                min="0"
                                disabled={game.status === 'pending'}
                              />
                              <button
                                onClick={() => quickAdd(player.id, player.teamId, field.key, 1)}
                                className="w-5 h-5 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs font-bold leading-none"
                                disabled={game.status === 'pending'}
                              >+</button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {/* 快捷得分：单行短标签 */}
                      {game.status !== 'pending' && (
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200">
                          <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, '2pt_made')}>2中</Button>
                          <Button size="sm" variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, '2pt_miss')}>2投</Button>
                          <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, '3pt_made')}>3中</Button>
                          <Button size="sm" variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, '3pt_miss')}>3投</Button>
                          <Button size="sm" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, 'ft_made')}>罚中</Button>
                          <Button size="sm" variant="secondary" className="!px-2 !py-1 !text-xs" onClick={() => quickScore(player.id, player.teamId, 'ft_miss')}>罚投</Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>上场 {formatMinutes(stat.minutes)}</span>
                      <button
                        type="button"
                        onClick={() => setExpandedPlayerId(player.id)}
                        className="text-orange-600 font-medium touch-manipulation"
                      >
                        编辑数据 →
                      </button>
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
                    <th className="px-3 py-2 text-center">上场</th>
                    <th className="px-3 py-2 text-center">得分</th>
                    <th className="px-3 py-2 text-center">+/-</th>
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
                    const isOnCourt = onCourtPlayers.has(player.id);
                    return (
                      <tr key={player.id} className={`border-t ${isOnCourt ? 'bg-green-50' : ''}`}>
                        <td className="px-3 py-2 font-medium">
                          <span className="flex items-center">
                            {isOnCourt && <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>}
                            #{player.number} {player.name}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center text-gray-600">
                          {formatMinutes(stat.minutes)}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-orange-600">
                          {stat.points}
                        </td>
                        <td className={`px-3 py-2 text-center font-medium ${
                          (stat.plusMinus ?? 0) > 0 ? 'text-green-600' : (stat.plusMinus ?? 0) < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {(stat.plusMinus ?? 0) > 0 ? '+' : ''}{stat.plusMinus ?? 0}
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
                    <td className="px-3 py-2 text-center text-gray-600">-</td>
                    <td className="px-3 py-2 text-center text-orange-600">
                      {currentPlayers.reduce(
                        (sum, p) => sum + getPlayerStat(p.id, p.teamId).points,
                        0
                      )}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-600">-</td>
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
