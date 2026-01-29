import type { AppState, Team, Player, Game, PlayerStats } from '../types';

export interface AppContextType {
  state: AppState;
  // 队伍操作
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (teamId: string) => void;
  getTeamById: (teamId: string) => Team | undefined;
  // 队员操作
  addPlayer: (player: Player) => void;
  updatePlayer: (player: Player) => void;
  deletePlayer: (playerId: string) => void;
  getPlayerById: (playerId: string) => Player | undefined;
  getPlayersByTeamId: (teamId: string) => Player[];
  // 比赛操作
  addGame: (game: Game) => void;
  updateGame: (game: Game) => void;
  deleteGame: (gameId: string) => void;
  getGameById: (gameId: string) => Game | undefined;
  // 数据统计操作
  addPlayerStats: (stats: PlayerStats) => void;
  updatePlayerStats: (stats: PlayerStats) => void;
  deletePlayerStats: (statsId: string) => void;
  getStatsByGameId: (gameId: string) => PlayerStats[];
  getStatsByPlayerId: (playerId: string) => PlayerStats[];
  updateMultiplePlayerStats: (statsArray: PlayerStats[]) => void;
}
