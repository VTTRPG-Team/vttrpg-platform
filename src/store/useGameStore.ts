import { create } from 'zustand'

export type MessageType = 'USER' | 'SYSTEM' | 'AI';
export type ChatTab = 'PARTY' | 'AI_GM';
export type ChatChannel = 'PARTY' | 'AI';
export type AiStatus = 'IDLE' | 'PLAYER_TURN' | 'WAITING_OTHERS' | 'THINKING' | 'TYPING';
export type DiceType = 'D6' | 'D8' | 'D20' | null;

export interface ChatMessage {
  id: string; sender: string; text: string; type: MessageType; channel: ChatChannel; timestamp: Date;
}

export interface PlayerStats {
  hp: number; maxHp: number; mana: number; maxMana: number; statuses: string[]; 
}

export interface DiceRollData {
  id: string; 
  userId: string;
  username: string;
  diceType: DiceType;
  result: number;
  isRolling: boolean;
}

// 🌟 เพิ่ม Interface สำหรับตัวเลขลอย
export interface FloatingTextData {
  id: string;
  username: string;
  amount: number;
  type: 'damage' | 'heal';
}

interface GameState {
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

  diceState: {
    isActive: boolean;        
    canRoll: boolean;         
    requiredDice: DiceType;   
    targetPlayers: string[];  
    activeRolls: DiceRollData[]; 
    pendingSubmit: string | null; 
  };
  
  triggerDiceRollEvent: (diceType: DiceType, targetPlayers?: string[]) => void;
  addDiceRoll: (rollId: string, userId: string, username: string, diceType: DiceType, result: number, isLocal?: boolean) => void;
  finishDiceRoll: (rollId: string) => void;
  debugUnlockDice: () => void;
  clearPendingSubmit: () => void; 
  closeDiceArena: () => void;

  playerStats: Record<string, PlayerStats>;
  updatePlayerStat: (username: string, statType: 'hp' | 'mana', amount: number) => void;
  setPlayerStatus: (username: string, status: string, action: 'add' | 'remove') => void;

  // 🌟 เพิ่มระบบ Floating Text และอัปเดตเลือดในฟังก์ชันเดียว
  floatingTexts: FloatingTextData[];
  triggerStatChange: (username: string, amount: number, type: 'damage' | 'heal') => void;
  removeFloatingText: (id: string) => void;

  currentBg: string | null;
  setCurrentBg: (bg: string | null) => void;
  
  isTimerActive: boolean;
  tensionTimeLeft: number;
  startTensionTimer: (seconds?: number) => void;
  stopTensionTimer: () => void;
  tickTensionTimer: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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

  diceState: { 
    isActive: false, 
    canRoll: false, 
    requiredDice: null, 
    targetPlayers: [], 
    activeRolls: [], 
    pendingSubmit: null 
  },

  triggerDiceRollEvent: (diceType, targetPlayers = []) => {
    set({ diceState: { isActive: true, canRoll: true, requiredDice: diceType, targetPlayers, activeRolls: [], pendingSubmit: null } });
  },

  addDiceRoll: (rollId, userId, username, diceType, result, isLocal = false) => {
    set((state) => {
      if (state.diceState.activeRolls.some(r => r.id === rollId)) return state;

      const newRolls = [...state.diceState.activeRolls, { id: rollId, userId, username, diceType, result, isRolling: true }];
      return { 
        diceState: { 
          ...state.diceState, 
          isActive: true, 
          canRoll: isLocal ? false : state.diceState.canRoll, 
          activeRolls: newRolls 
        } 
      };
    });
  },

  finishDiceRoll: (rollId) => {
    set((state) => {
      const updatedRolls = state.diceState.activeRolls.map(r => 
        r.id === rollId ? { ...r, isRolling: false } : r
      );
      
      const myRoll = updatedRolls.find(r => r.id === rollId);
      let pendingText = state.diceState.pendingSubmit;
      
      if (myRoll && myRoll.username === get().myUsername) {
         pendingText = `🎲 Rolled ${myRoll.diceType}: [ ${myRoll.result} ]`;
      }

      return { diceState: { ...state.diceState, activeRolls: updatedRolls, pendingSubmit: pendingText } };
    });
  },

  debugUnlockDice: () => set((state) => ({
    diceState: { ...state.diceState, isActive: true, canRoll: true, requiredDice: 'D20' }
  })),

  clearPendingSubmit: () => set((state) => ({ diceState: { ...state.diceState, pendingSubmit: null } })),
  closeDiceArena: () => set((state) => ({ 
    diceState: { 
      isActive: false, 
      activeRolls: [], 
      requiredDice: null,
      targetPlayers: [],
      canRoll: false,
      pendingSubmit: null
    } 
  })),

  playerStats: {},

  updatePlayerStat: (username, statType, amount) => set((state) => {
    const currentStats = state.playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
    const maxVal = statType === 'hp' ? currentStats.maxHp : currentStats.maxMana;
    let newVal = currentStats[statType] + amount;
    
    if (newVal > maxVal) newVal = maxVal;
    if (newVal < 0) newVal = 0;
    return { playerStats: { ...state.playerStats, [username]: { ...currentStats, [statType]: newVal } } };
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

  // 🌟 ฟังก์ชันจัดการ Damage / Heal
  floatingTexts: [],
  triggerStatChange: (username, amount, type) => set((state) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    // อัปเดต HP ไปด้วยเลย
    const currentStats = state.playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
    let newHp = currentStats.hp + amount;
    if (newHp > currentStats.maxHp) newHp = currentStats.maxHp;
    if (newHp < 0) newHp = 0;

    return {
      playerStats: { ...state.playerStats, [username]: { ...currentStats, hp: newHp } },
      floatingTexts: [...state.floatingTexts, { id, username, amount: Math.abs(amount), type }]
    };
  }),
  removeFloatingText: (id) => set((state) => ({
    floatingTexts: state.floatingTexts.filter(ft => ft.id !== id)
  })),

  currentBg: null,
  setCurrentBg: (bg) => set({ currentBg: bg }),

  isTimerActive: false,
  tensionTimeLeft: 0, 
  startTensionTimer: (seconds = 10) => set({ isTimerActive: true, tensionTimeLeft: seconds }),
  stopTensionTimer: () => set({ isTimerActive: false, tensionTimeLeft: 0 }),
  tickTensionTimer: () => set((state) => ({ tensionTimeLeft: Math.max(0, state.tensionTimeLeft - 1) })),
}))