import { create } from 'zustand'

export type MessageType = 'USER' | 'SYSTEM' | 'AI';
export type ChatTab = 'PARTY' | 'AI_GM';
export type ChatChannel = 'PARTY' | 'AI';
export type AiStatus = 'IDLE' | 'PLAYER_TURN' | 'WAITING_OTHERS' | 'THINKING' | 'TYPING';
export type DiceType = 'D6' | 'D8' | 'D20' | null;

export interface ChatMessage {
  id: string; sender: string; text: string; type: MessageType; channel: ChatChannel; timestamp: Date;
}

// 🌟 1. เพิ่ม Type สำหรับค่า Stats ของผู้เล่น
export interface PlayerStats {
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  statuses: string[]; // เช่น ['POISON', 'BURN', 'SHIELD']
}

interface GameState {
  // 🌟 State สำหรับ Quick Choices
  quickChoices: string[];
  setQuickChoices: (choices: string[]) => void;
  clearQuickChoices: () => void;
  
  myUsername: string;
  setMyUsername: (name: string) => void;

  viewMode: 'PERSPECTIVE' | 'TOP_DOWN';
  toggleView: () => void;

  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  addMessage: (sender: string, text: string, type?: MessageType, channel?: ChatChannel) => void;

  aiStatus: AiStatus; turnCount: number; timeLeft: number; waitingFor: string[];
  playerActions: { playerName: string; action: string }[]; 
  
  setAiStatus: (status: AiStatus) => void; decrementTime: () => void;
  setWaitingFor: (players: string[]) => void; 
  submitPlayerAction: (playerName: string, action: string) => void; 
  resetTurn: () => void; forceAiTurn: () => void; 

  isPaused: boolean;
  voteStatus: { isActive: boolean; yesVotes: number; neededVotes: number; isFinished: boolean; };
  togglePause: () => void; startExitVote: () => void; castVote: () => void; resetVote: () => void;

  // Dice System 
  diceState: {
    isActive: boolean; requiredDice: DiceType; targetPlayer: string | null;
    isRolling: boolean; isShowingResult: boolean; lastResult: number | null;
    pendingSubmit: string | null; 
  };
  triggerDiceRoll: (diceType: DiceType, targetPlayer?: string | null) => void;
  completeDiceRoll: (result: number) => void;
  clearPendingSubmit: () => void; 
  closeDiceUI: () => void;

  // ==========================================
  // 🌟 2. เพิ่ม State สำหรับ Player Stats System
  // ==========================================
  playerStats: Record<string, PlayerStats>;
  updatePlayerStat: (username: string, statType: 'hp' | 'mana', amount: number) => void;
  setPlayerStatus: (username: string, status: string, action: 'add' | 'remove') => void;

  // 🌟 State ของคุณที่แทรกเพิ่ม
  currentBg: string | null;
  setCurrentBg: (bg: string | null) => void;
  
  isTimerActive: boolean;
  tensionTimeLeft: number;
  startTensionTimer: (seconds?: number) => void;
  stopTensionTimer: () => void;
  tickTensionTimer: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  
  // 🌟 Implementation ของ Quick Choices
  quickChoices: [],
  setQuickChoices: (choices) => set({ quickChoices: choices }),
  clearQuickChoices: () => set({ quickChoices: [] }),

  myUsername: '',
  setMyUsername: (name) => set({ myUsername: name }),

  viewMode: 'PERSPECTIVE',
  toggleView: () => set((state) => ({ viewMode: state.viewMode === 'PERSPECTIVE' ? 'TOP_DOWN' : 'PERSPECTIVE' })),

  activeTab: 'PARTY', setActiveTab: (tab) => set({ activeTab: tab }), messages: [],
  addMessage: (sender, text, type = 'USER', channel = 'PARTY') => set((state) => ({
    messages: [...state.messages, { id: Math.random().toString(36).substr(2, 9), sender, text, type, channel, timestamp: new Date() }]
  })),

  // หมายเหตุ: timeLeft ตัวนี้เป็นคนละตัวกับ tensionTimeLeft นะครับ (น่าจะใช้กับการจับเวลาเทิร์นหลัก) ผมคงไว้ให้ตามเดิม
  aiStatus: 'PLAYER_TURN', turnCount: 0, timeLeft: 60, waitingFor: [], playerActions: [], 

  setAiStatus: (status) => set({ aiStatus: status }),
  decrementTime: () => set((state) => ({ timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0 })),
  setWaitingFor: (players) => set({ waitingFor: players, playerActions: [], aiStatus: 'PLAYER_TURN', timeLeft: 60 }),

  submitPlayerAction: (playerName, action) => set((state) => {
    const newActions = [...state.playerActions, { playerName, action }];
    const newWaitingFor = state.waitingFor.filter(p => p.trim().toLowerCase() !== playerName.trim().toLowerCase());
    return { playerActions: newActions, waitingFor: newWaitingFor, aiStatus: newWaitingFor.length === 0 ? 'THINKING' : 'WAITING_OTHERS' };
  }),

  resetTurn: () => set({ playerActions: [], waitingFor: [], aiStatus: 'PLAYER_TURN' }),
  forceAiTurn: () => set({ waitingFor: [], playerActions: [], aiStatus: 'THINKING' }),

  isPaused: false, voteStatus: { isActive: false, yesVotes: 0, neededVotes: 3, isFinished: false },
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  startExitVote: () => set((state) => ({ voteStatus: { ...state.voteStatus, isActive: true, yesVotes: 1, isFinished: false } })),
  castVote: () => set((state) => {
    const newVotes = state.voteStatus.yesVotes + 1;
    return { voteStatus: { ...state.voteStatus, yesVotes: newVotes, isFinished: newVotes >= state.voteStatus.neededVotes } };
  }),
  resetVote: () => set((state) => ({ voteStatus: { ...state.voteStatus, isActive: false, yesVotes: 0, isFinished: false } })),

  diceState: { isActive: false, requiredDice: null, targetPlayer: null, isRolling: false, isShowingResult: false, lastResult: null, pendingSubmit: null },

  triggerDiceRoll: (diceType, targetPlayer = null) => {
    set({ diceState: { isActive: true, requiredDice: diceType, targetPlayer, isRolling: true, isShowingResult: false, lastResult: null, pendingSubmit: null } });
  },

  completeDiceRoll: (result) => {
    const { requiredDice } = get().diceState;
    set((state) => ({
      diceState: { 
        ...state.diceState, isRolling: false, isShowingResult: true, lastResult: result,
        pendingSubmit: `🎲 Rolled ${requiredDice}: [ ${result} ]`
      }
    }));
  },

  clearPendingSubmit: () => set((state) => ({ diceState: { ...state.diceState, pendingSubmit: null } })),
  closeDiceUI: () => set((state) => ({ diceState: { ...state.diceState, isActive: false, isShowingResult: false, lastResult: null } })),

  // ==========================================
  // 🌟 3. Implementation สำหรับ Player Stats System
  // ==========================================
  playerStats: {},

  updatePlayerStat: (username, statType, amount) => set((state) => {
    const currentStats = state.playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
    const maxVal = statType === 'hp' ? currentStats.maxHp : currentStats.maxMana;
    let newVal = currentStats[statType] + amount;
    
    if (newVal > maxVal) newVal = maxVal;
    if (newVal < 0) newVal = 0;

    return {
      playerStats: {
        ...state.playerStats,
        [username]: { ...currentStats, [statType]: newVal }
      }
    };
  }),

  setPlayerStatus: (username, status, action) => set((state) => {
    const currentStats = state.playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
    let newStatuses = [...currentStats.statuses];

    if (action === 'add' && !newStatuses.includes(status)) newStatuses.push(status);
    if (action === 'remove') newStatuses = newStatuses.filter(s => s !== status);

    return {
      playerStats: {
        ...state.playerStats,
        [username]: { ...currentStats, statuses: newStatuses }
      }
    };
  }),

  // 🌟 Implementation ของคุณ
  currentBg: null,
  setCurrentBg: (bg) => set({ currentBg: bg }),

  // 🌟 แก้ไขตรงนี้ครับ เปลี่ยนจาก timeLeft เป็น tensionTimeLeft ให้หมด
  isTimerActive: false,
  tensionTimeLeft: 0, // ตั้งค่าเริ่มต้นให้เป็น 0
  startTensionTimer: (seconds = 10) => set({ isTimerActive: true, tensionTimeLeft: seconds }),
  stopTensionTimer: () => set({ isTimerActive: false, tensionTimeLeft: 0 }),
  tickTensionTimer: () => set((state) => ({ tensionTimeLeft: Math.max(0, state.tensionTimeLeft - 1) })),
}))