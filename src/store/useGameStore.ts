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

  // 3. AI Logic & Turn Management (🌟 อัปเกรดใหม่)
  aiStatus: AiStatus;
  turnCount: number;
  timeLeft: number;
  waitingFor: string[];
  playerActions: { playerName: string; action: string }[]; // ตะกร้าเก็บ Action ของทุกคน
  
  setAiStatus: (status: AiStatus) => void;
  decrementTime: () => void;
  setWaitingFor: (players: string[]) => void; // กำหนดรายชื่อคนในห้องที่ต้องรอ
  submitPlayerAction: (playerName: string, action: string) => void; // เอา Action ใส่ตะกร้า
  resetTurn: () => void; // ล้างตะกร้าเตรียมเริ่มเทิร์นใหม่
  forceAiTurn: () => void; // บังคับให้ AI ตอบเลย

  // 4. Game Control
  isPaused: boolean;
  voteStatus: {
    isActive: boolean;
    yesVotes: number;
    neededVotes: number;
    isFinished: boolean;
  };
  togglePause: () => void;
  startExitVote: () => void;
  castVote: () => void;
  resetVote: () => void;

  // 5. Dice System
  diceState: {
    isActive: boolean;
    requiredDice: DiceType;
    isRolling: boolean;
    isShowingResult: boolean;
    lastResult: number | null;
  };
  triggerDiceRoll: (diceType: DiceType) => void;
  completeDiceRoll: (result: number) => void;
  closeDiceUI: () => void;
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

  // 3. AI Logic & Turn Management (🌟 ระบบใหม่ของจริง)
  aiStatus: 'PLAYER_TURN',
  turnCount: 0,
  timeLeft: 60,
  waitingFor: [],
  playerActions: [], // เริ่มมาตะกร้าว่างเปล่า

  setAiStatus: (status) => set({ aiStatus: status }),
  
  decrementTime: () => set((state) => {
    return { timeLeft: state.timeLeft > 0 ? state.timeLeft - 1 : 0 };
  }),

  // 🌟 เริ่มเทิร์นใหม่: ระบุชื่อทุกคนที่ต้องรอพิมพ์
  setWaitingFor: (players) => set({ 
    waitingFor: players, 
    playerActions: [], 
    aiStatus: 'PLAYER_TURN',
    timeLeft: 60 
  }),

  // 🌟 เมื่อมีคนส่งข้อความ (ทั้งเราและเพื่อน)
  submitPlayerAction: (playerName, action) => set((state) => {
    const newActions = [...state.playerActions, { playerName, action }];
    
    // 🌟 ใช้ trim() และแปลงเป็นตัวเล็ก เพื่อป้องกันบั๊ก "เคาะเว้นวรรคเกิน" ทำให้รายชื่อไม่ยอมหาย
    const newWaitingFor = state.waitingFor.filter(
      p => p.trim().toLowerCase() !== playerName.trim().toLowerCase()
    );
    
    const nextStatus = newWaitingFor.length === 0 ? 'THINKING' : 'WAITING_OTHERS';

    return { 
      playerActions: newActions, 
      waitingFor: newWaitingFor, 
      aiStatus: nextStatus 
    };
  }),

  resetTurn: () => set({ playerActions: [], waitingFor: [], aiStatus: 'PLAYER_TURN' }),
  
  //บังคับเคลียร์รายชื่อรอ และเปลี่ยนสถานะเป็น AI คิด
  forceAiTurn: () => set({ waitingFor: [], playerActions: [], aiStatus: 'THINKING' }),

  // 4. Game Control
  isPaused: false,
  voteStatus: { isActive: false, yesVotes: 0, neededVotes: 3, isFinished: false },
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
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

  // 5. Dice System 
  diceState: {
    isActive: false,
    requiredDice: null,
    isRolling: false,
    isShowingResult: false,
    lastResult: null,
  },

  triggerDiceRoll: (diceType) => {
    // 🌟 ระบบเพิ่มข้อความลงแชทอัตโนมัติเมื่อ AI สั่งทอยเต๋า
    get().addMessage('SYSTEM', `AI requires a ${diceType} roll check!`, 'SYSTEM', 'AI');
    set({ 
      diceState: { 
        isActive: true, 
        requiredDice: diceType, 
        isRolling: true,         
        isShowingResult: false,  
        lastResult: null 
      } 
    });
  },

  completeDiceRoll: (result) => {
    const { requiredDice } = get().diceState;
    // 🌟 ส่งผลลัพธ์การทอยกลับไปให้ AI รู้!
    const resultText = `🎲 Rolled ${requiredDice}: [ ${result} ]`;
    
    // อันนี้จะเอาไปใช้ในขั้นตอนหน้า (รอผู้เล่นคนอื่นทอยเสร็จ หรือยิงให้ AI เลย)
    // ตอนนี้ขอแปะเข้าแชทไปก่อนครับ
    get().addMessage('SYSTEM', resultText, 'SYSTEM', 'AI');

    set((state) => ({
      diceState: { 
        ...state.diceState, 
        isRolling: false,        
        isShowingResult: true,   
        lastResult: result 
      }
    }));
  },

  closeDiceUI: () => {
    set((state) => ({
      diceState: { 
        ...state.diceState, 
        isActive: false,        
        isShowingResult: false, 
        lastResult: null 
      }
    }));
  }
}))