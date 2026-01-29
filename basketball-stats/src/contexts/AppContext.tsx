import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { AppState, Team, Player, Game, PlayerStats } from '../types';
import {
  loadState,
  saveTeam,
  deleteTeam as deleteTeamFromStorage,
  savePlayer,
  deletePlayer as deletePlayerFromStorage,
  saveGame,
  deleteGame as deleteGameFromStorage,
  savePlayerStats,
  deletePlayerStats as deletePlayerStatsFromStorage,
  saveMultiplePlayerStats,
} from '../store/storage';

interface AppContextType {
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

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);

  // 队伍操作
  const addTeam = (team: Team) => {
    setState((prev) => saveTeam(prev, team));
  };

  const updateTeam = (team: Team) => {
    setState((prev) => saveTeam(prev, team));
  };

  const deleteTeam = (teamId: string) => {
    setState((prev) => deleteTeamFromStorage(prev, teamId));
  };

  const getTeamById = (teamId: string) => {
    return state.teams.find((t) => t.id === teamId);
  };

  // 队员操作
  const addPlayer = (player: Player) => {
    setState((prev) => savePlayer(prev, player));
  };

  const updatePlayer = (player: Player) => {
    setState((prev) => savePlayer(prev, player));
  };

  const deletePlayer = (playerId: string) => {
    setState((prev) => deletePlayerFromStorage(prev, playerId));
  };

  const getPlayerById = (playerId: string) => {
    return state.players.find((p) => p.id === playerId);
  };

  const getPlayersByTeamId = (teamId: string) => {
    return state.players.filter((p) => p.teamId === teamId);
  };

  // 比赛操作
  const addGame = (game: Game) => {
    setState((prev) => saveGame(prev, game));
  };

  const updateGame = (game: Game) => {
    setState((prev) => saveGame(prev, game));
  };

  const deleteGame = (gameId: string) => {
    setState((prev) => deleteGameFromStorage(prev, gameId));
  };

  const getGameById = (gameId: string) => {
    return state.games.find((g) => g.id === gameId);
  };

  // 数据统计操作
  const addPlayerStats = (stats: PlayerStats) => {
    setState((prev) => savePlayerStats(prev, stats));
  };

  const updatePlayerStats = (stats: PlayerStats) => {
    setState((prev) => savePlayerStats(prev, stats));
  };

  const deletePlayerStats = (statsId: string) => {
    setState((prev) => deletePlayerStatsFromStorage(prev, statsId));
  };

  const getStatsByGameId = (gameId: string) => {
    return state.playerStats.filter((ps) => ps.gameId === gameId);
  };

  const getStatsByPlayerId = (playerId: string) => {
    return state.playerStats.filter((ps) => ps.playerId === playerId);
  };

  const updateMultiplePlayerStats = (statsArray: PlayerStats[]) => {
    setState((prev) => saveMultiplePlayerStats(prev, statsArray));
  };

  const value: AppContextType = {
    state,
    addTeam,
    updateTeam,
    deleteTeam,
    getTeamById,
    addPlayer,
    updatePlayer,
    deletePlayer,
    getPlayerById,
    getPlayersByTeamId,
    addGame,
    updateGame,
    deleteGame,
    getGameById,
    addPlayerStats,
    updatePlayerStats,
    deletePlayerStats,
    getStatsByGameId,
    getStatsByPlayerId,
    updateMultiplePlayerStats,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
