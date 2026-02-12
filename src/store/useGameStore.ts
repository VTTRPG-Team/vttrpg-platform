import { create } from 'zustand'

// --- Types Definitions ---
export type MessageType = 'USER' | 'SYSTEM' | 'AI';
export type ChatTab = 'PARTY' | 'AI_GM';
export type ChatChannel = 'PARTY' | 'AI';
export type AiStatus = 'IDLE' | 'PLAYER_TURN' | 'WAITING_OTHERS' | 'THINKING' | 'TYPING';
export type DiceType = 'D6' | 'D8' | 'D20' | null;

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: MessageType;
  channel: ChatChannel;
  timestamp: Date;
}

// --- Interface (สเปคของ Store) ---
interface GameState {
  // 1. View
  viewMode: 'PERSPECTIVE' | 'TOP_DOWN';
  toggleView: () => void;

  // 2. Chat
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  addMessage: (sender: string, text: string, type?: MessageType, channel?: ChatChannel) => void;

  // 3. AI Logic
  aiStatus: AiStatus;
  turnCount: number;
  timeLeft: number;
  waitingFor: string[];
  setAiStatus: (status: AiStatus) => void;
  decrementTime: () => void;
  submitPlayerAction: (text: string) => void;
  mockOthersSubmitting: () => void;

  // 4. Game Control (ส่วนที่แก้ให้หายแดง)
  isPaused: boolean;          // <--- ต้องมีบรรทัดนี้
  voteStatus: {               // <--- และบรรทัดนี้
    isActive: boolean;
    yesVotes: number;
    neededVotes: number;
    isFinished: boolean;
  };
  togglePause: () => void;    // <--- ประกาศฟังก์ชันด้วย
  startExitVote: () => void;
  castVote: () => void;
  resetVote: () => void;

  // 5. Dice System
  diceState: {
    isActive: boolean;
    isManualMode: boolean;
    requiredDice: DiceType;
    isRolling: boolean;
    lastResult: number | null;
  };
  triggerDiceRoll: (diceType: DiceType) => void;
  toggleManualDice: () => void;
  startRolling: () => void;
  manualStartRoll: (diceType: DiceType) => void;
  completeDiceRoll: (result: number) => void;
}

// --- Implementation (การทำงานจริง) ---
export const useGameStore = create<GameState>((set, get) => ({
  // 1. View
  viewMode: 'PERSPECTIVE',
  toggleView: () => set((state) => ({ viewMode: state.viewMode === 'PERSPECTIVE' ? 'TOP_DOWN' : 'PERSPECTIVE' })),

  // 2. Chat
  activeTab: 'PARTY',
  setActiveTab: (tab) => set({ activeTab: tab }),
  messages: [],
  addMessage: (sender, text, type = 'USER', channel = 'PARTY') => set((state) => ({
    messages: [...state.messages, {
      id: Math.random().toString(36).substr(2, 9),
      sender, text, type, channel, timestamp: new Date()
    }]
  })),

  // 3. AI Logic
  aiStatus: 'PLAYER_TURN',
  turnCount: 0,
  timeLeft: 60,
  waitingFor: [],
  setAiStatus: (status) => set({ aiStatus: status }),
  
  decrementTime: () => set((state) => {
    if (state.timeLeft <= 0 && state.aiStatus === 'PLAYER_TURN') {
       get().submitPlayerAction("(หมดเวลาตอบ)");
       return { timeLeft: 0 };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  submitPlayerAction: (text) => {
    get().addMessage('Player (You)', text, 'USER', 'AI');
    set({ aiStatus: 'WAITING_OTHERS', waitingFor: ['Player 2', 'Player 3', 'Player 4'] });
    get().mockOthersSubmitting();
  },

  mockOthersSubmitting: () => {
    setTimeout(() => { set((state) => ({ waitingFor: state.waitingFor.filter(p => p !== 'Player 2') })) }, 1500);
    setTimeout(() => { set((state) => ({ waitingFor: state.waitingFor.filter(p => p !== 'Player 3') })) }, 3000);
    setTimeout(() => { 
        set((state) => ({ waitingFor: [] })); 
        set({ aiStatus: 'THINKING' }); 
    }, 4500);
  },

  // 4. Game Control (Implementation)
  isPaused: false,
  voteStatus: { isActive: false, yesVotes: 0, neededVotes: 3, isFinished: false },
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })), // <--- ตรงนี้จะหายแดงแล้ว
  
  startExitVote: () => set((state) => ({ 
    voteStatus: { ...state.voteStatus, isActive: true, yesVotes: 1, isFinished: false } 
  })),
  
  castVote: () => set((state) => {
    const newVotes = state.voteStatus.yesVotes + 1;
    return { 
      voteStatus: { 
        ...state.voteStatus, 
        yesVotes: newVotes, 
        isFinished: newVotes >= state.voteStatus.neededVotes 
      } 
    };
  }),
  
  resetVote: () => set((state) => ({ 
    voteStatus: { ...state.voteStatus, isActive: false, yesVotes: 0, isFinished: false } 
  })),


  // 5. Dice Implementation
  diceState: {
    isActive: false,
    isManualMode: false,
    requiredDice: null,
    isRolling: false,
    lastResult: null,
  },

  triggerDiceRoll: (diceType) => {
    set({ diceState: { isActive: true, isManualMode: false, requiredDice: diceType, isRolling: false, lastResult: null } });
    get().addMessage('SYSTEM', `AI requires a ${diceType} roll check!`, 'SYSTEM', 'AI');
  },

  toggleManualDice: () => set((state) => ({
    diceState: { 
      ...state.diceState, 
      isManualMode: !state.diceState.isManualMode,
      isActive: false, 
      requiredDice: null 
    }
  })),

  startRolling: () => set((state) => ({
    diceState: { ...state.diceState, isRolling: true }
  })),

  manualStartRoll: (diceType) => set((state) => ({
    diceState: { 
      ...state.diceState, 
      requiredDice: diceType,
      isRolling: true 
    }
  })),

  completeDiceRoll: (result) => {
    const { requiredDice } = get().diceState;
    const resultText = `🎲 Rolled ${requiredDice}: [ ${result} ]`;
    
    get().submitPlayerAction(resultText);

    set({
      diceState: { 
        isActive: false, 
        isManualMode: false, 
        requiredDice: null, 
        isRolling: false, 
        lastResult: result 
      }
    });
  }
}))