import type { AppState, Team, Player, Game, PlayerStats } from '../types';

const STORAGE_KEY = 'basketball-stats-data';

// 获取初始状态
const getInitialState = (): AppState => ({
  teams: [],
  players: [],
  games: [],
  playerStats: [],
});

// 从 localStorage 加载数据
export const loadState = (): AppState => {
  try {
    const serializedState = localStorage.getItem(STORAGE_KEY);
    if (serializedState === null) {
      return getInitialState();
    }
    return JSON.parse(serializedState);
  } catch (err) {
    console.error('Failed to load state from localStorage:', err);
    return getInitialState();
  }
};

// 保存数据到 localStorage
export const saveState = (state: AppState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
};

// 队伍操作
export const saveTeam = (state: AppState, team: Team): AppState => {
  const existingIndex = state.teams.findIndex((t) => t.id === team.id);
  let newTeams: Team[];
  
  if (existingIndex >= 0) {
    newTeams = [...state.teams];
    newTeams[existingIndex] = team;
  } else {
    newTeams = [...state.teams, team];
  }
  
  const newState = { ...state, teams: newTeams };
  saveState(newState);
  return newState;
};

export const deleteTeam = (state: AppState, teamId: string): AppState => {
  const newState = {
    ...state,
    teams: state.teams.filter((t) => t.id !== teamId),
    players: state.players.filter((p) => p.teamId !== teamId),
  };
  saveState(newState);
  return newState;
};

// 队员操作
export const savePlayer = (state: AppState, player: Player): AppState => {
  const existingIndex = state.players.findIndex((p) => p.id === player.id);
  let newPlayers: Player[];
  
  if (existingIndex >= 0) {
    newPlayers = [...state.players];
    newPlayers[existingIndex] = player;
  } else {
    newPlayers = [...state.players, player];
  }
  
  const newState = { ...state, players: newPlayers };
  saveState(newState);
  return newState;
};

export const deletePlayer = (state: AppState, playerId: string): AppState => {
  const newState = {
    ...state,
    players: state.players.filter((p) => p.id !== playerId),
    playerStats: state.playerStats.filter((ps) => ps.playerId !== playerId),
  };
  saveState(newState);
  return newState;
};

// 比赛操作
export const saveGame = (state: AppState, game: Game): AppState => {
  const existingIndex = state.games.findIndex((g) => g.id === game.id);
  let newGames: Game[];
  
  if (existingIndex >= 0) {
    newGames = [...state.games];
    newGames[existingIndex] = game;
  } else {
    newGames = [...state.games, game];
  }
  
  const newState = { ...state, games: newGames };
  saveState(newState);
  return newState;
};

export const deleteGame = (state: AppState, gameId: string): AppState => {
  const newState = {
    ...state,
    games: state.games.filter((g) => g.id !== gameId),
    playerStats: state.playerStats.filter((ps) => ps.gameId !== gameId),
  };
  saveState(newState);
  return newState;
};

// 队员数据统计操作
export const savePlayerStats = (state: AppState, stats: PlayerStats): AppState => {
  const existingIndex = state.playerStats.findIndex((ps) => ps.id === stats.id);
  let newPlayerStats: PlayerStats[];
  
  if (existingIndex >= 0) {
    newPlayerStats = [...state.playerStats];
    newPlayerStats[existingIndex] = stats;
  } else {
    newPlayerStats = [...state.playerStats, stats];
  }
  
  const newState = { ...state, playerStats: newPlayerStats };
  saveState(newState);
  return newState;
};

export const deletePlayerStats = (state: AppState, statsId: string): AppState => {
  const newState = {
    ...state,
    playerStats: state.playerStats.filter((ps) => ps.id !== statsId),
  };
  saveState(newState);
  return newState;
};

// 批量保存队员数据统计
export const saveMultiplePlayerStats = (state: AppState, statsArray: PlayerStats[]): AppState => {
  let newPlayerStats = [...state.playerStats];
  
  statsArray.forEach((stats) => {
    const existingIndex = newPlayerStats.findIndex((ps) => ps.id === stats.id);
    if (existingIndex >= 0) {
      newPlayerStats[existingIndex] = stats;
    } else {
      newPlayerStats.push(stats);
    }
  });
  
  const newState = { ...state, playerStats: newPlayerStats };
  saveState(newState);
  return newState;
};
