import { create } from 'zustand'

export type MessageType = 'USER' | 'SYSTEM' | 'AI';
export type ChatTab = 'PARTY' | 'AI_GM';
export type ChatChannel = 'PARTY' | 'AI';
export type AiStatus = 'IDLE' | 'PLAYER_TURN' | 'WAITING_OTHERS' | 'THINKING' | 'TYPING';
export type DiceType = 'D6' | 'D8' | 'D20' | null;

export interface ChatMessage {
  id: string; sender: string; text: string; type: MessageType; channel: ChatChannel; timestamp: Date;
}

interface GameState {
  // 🌟 เพิ่มการจำชื่อตัวเอง
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

  // 🌟 อัปเกรด Dice System ให้ส่งแชทได้
  diceState: {
    isActive: boolean; requiredDice: DiceType; targetPlayer: string | null;
    isRolling: boolean; isShowingResult: boolean; lastResult: number | null;
    pendingSubmit: string | null; // 🌟 ผลเต๋าที่รอส่งเข้าแชท
  };
  triggerDiceRoll: (diceType: DiceType, targetPlayer?: string | null) => void;
  completeDiceRoll: (result: number) => void;
  clearPendingSubmit: () => void; 
  closeDiceUI: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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

  // 🌟 Dice Logic ใหม่
  diceState: { isActive: false, requiredDice: null, targetPlayer: null, isRolling: false, isShowingResult: false, lastResult: null, pendingSubmit: null },

  triggerDiceRoll: (diceType, targetPlayer = null) => {
    set({ diceState: { isActive: true, requiredDice: diceType, targetPlayer, isRolling: true, isShowingResult: false, lastResult: null, pendingSubmit: null } });
  },

  completeDiceRoll: (result) => {
    const { requiredDice } = get().diceState;
    set((state) => ({
      diceState: { 
        ...state.diceState, isRolling: false, isShowingResult: true, lastResult: result,
        pendingSubmit: `🎲 Rolled ${requiredDice}: [ ${result} ]` // 🌟 เอาผลยัดใส่ pendingSubmit
      }
    }));
  },

  clearPendingSubmit: () => set((state) => ({ diceState: { ...state.diceState, pendingSubmit: null } })),
  closeDiceUI: () => set((state) => ({ diceState: { ...state.diceState, isActive: false, isShowingResult: false, lastResult: null } }))
}))