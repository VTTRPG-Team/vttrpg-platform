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

  // 5. Dice System (แก้ไขใหม่ให้รองรับ Animation)
  diceState: {
    isActive: boolean;        // เปิดหน้าต่างเต๋าไหม
    requiredDice: DiceType;   // เต๋าชนิดไหน
    isRolling: boolean;       // 3D Physics กำลังทำงาน (ลูกเต๋ากำลังตก)
    isShowingResult: boolean; // 3D จบแล้ว -> กำลังโชว์ 2D Overlay (NEW)
    lastResult: number | null;// ผลลัพธ์
  };
  
  triggerDiceRoll: (diceType: DiceType) => void; // เริ่มทอย (สั่ง 3D)
  completeDiceRoll: (result: number) => void;    // 3D ตกเสร็จแล้ว (รับค่า)
  closeDiceUI: () => void;                       // ปิด 2D Overlay (NEW)
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


  // 5. Dice Implementation (แก้ไข Logic ตรงนี้)
  diceState: {
    isActive: false,
    requiredDice: null,
    isRolling: false,
    isShowingResult: false, // เพิ่ม state นี้
    lastResult: null,
  },

  // สั่งเริ่มทอย: เปิดโหมดทอย และสั่ง isRolling เป็น true (เพื่อ trigger 3D)
  triggerDiceRoll: (diceType) => {
    get().addMessage('SYSTEM', `AI requires a ${diceType} roll check!`, 'SYSTEM', 'AI');
    set({ 
      diceState: { 
        isActive: true, 
        requiredDice: diceType, 
        isRolling: true,         // เริ่ม Physics 3D
        isShowingResult: false,  // ยังไม่โชว์ 2D
        lastResult: null 
      } 
    });
  },

  // จบการทอย 3D: รับค่ามา แล้วสั่งเปิด UI 2D
  completeDiceRoll: (result) => {
    const { requiredDice } = get().diceState;
    
    // (Optional) ส่งผลลัพธ์เข้า Chat เลย หรือจะรอปิด UI ก่อนก็ได้
    const resultText = `🎲 Rolled ${requiredDice}: [ ${result} ]`;
    get().submitPlayerAction(resultText);

    set((state) => ({
      diceState: { 
        ...state.diceState, 
        isRolling: false,        // หยุด Physics 3D
        isShowingResult: true,   // เปิด UI 2D (เด้ง Overlay)
        lastResult: result 
      }
    }));
  },

  // สั่งปิด UI ทั้งหมด (เรียกโดย DiceResultOverlay ตอนอนิเมชั่นจบ)
  closeDiceUI: () => {
    set((state) => ({
      diceState: { 
        ...state.diceState, 
        isActive: false,        // ปิดทุกอย่าง
        isShowingResult: false, 
        lastResult: null 
      }
    }));
  }
}))