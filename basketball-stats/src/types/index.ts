// 队员类型
export interface Player {
  id: string;
  name: string;
  number: number;
  position: string;
  teamId: string;
  createdAt: string;
}

// 队伍类型
export interface Team {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  createdAt: string;
}

// 单节比分：每节主队/客队得分（4 节）
export interface QuarterScores {
  home: number[];
  away: number[];
}

// 比赛类型
export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  date: string;
  location?: string;
  status: 'pending' | 'ongoing' | 'finished';
  createdAt: string;
  /** 单节比分：home/away 各 4 个元素，对应 Q1～Q4 该节得分 */
  quarterPoints?: QuarterScores;
}

// 队员数据统计类型
export interface PlayerStats {
  id: string;
  gameId: string;
  playerId: string;
  teamId: string;
  // 得分
  points: number;
  // 两分球命中/出手
  twoPointsMade: number;
  twoPointsAttempted: number;
  // 三分球命中/出手
  threePointsMade: number;
  threePointsAttempted: number;
  // 罚球命中/出手
  freeThrowsMade: number;
  freeThrowsAttempted: number;
  // 篮板
  offensiveRebounds: number;
  defensiveRebounds: number;
  // 助攻
  assists: number;
  // 抢断
  steals: number;
  // 盖帽
  blocks: number;
  // 失误
  turnovers: number;
  // 犯规
  fouls: number;
  // 上场时间（秒）
  minutes: number;
  // 正负值
  plusMinus: number;
}

// 应用状态类型
export interface AppState {
  teams: Team[];
  players: Player[];
  games: Game[];
  playerStats: PlayerStats[];
}

// 创建新的 PlayerStats 的默认值
export const createEmptyPlayerStats = (
  gameId: string,
  playerId: string,
  teamId: string
): PlayerStats => ({
  id: '',
  gameId,
  playerId,
  teamId,
  points: 0,
  twoPointsMade: 0,
  twoPointsAttempted: 0,
  threePointsMade: 0,
  threePointsAttempted: 0,
  freeThrowsMade: 0,
  freeThrowsAttempted: 0,
  offensiveRebounds: 0,
  defensiveRebounds: 0,
  assists: 0,
  steals: 0,
  blocks: 0,
  turnovers: 0,
  fouls: 0,
  minutes: 0,
  plusMinus: 0,
});
