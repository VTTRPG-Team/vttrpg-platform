import { create } from 'zustand'

// --- Types Definition ---
export type MessageType = 'USER' | 'SYSTEM' | 'AI';
export type ChatTab = 'PARTY' | 'AI_GM';
export type ChatChannel = 'PARTY' | 'AI'; // ตัวแยกห้องแชท
export type AiStatus = 'IDLE' | 'PLAYER_TURN' | 'WAITING_OTHERS' | 'THINKING' | 'TYPING';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: MessageType;
  channel: ChatChannel; // เพิ่ม field นี้เพื่อระบุว่าข้อความอยู่ห้องไหน
  timestamp: Date;
}

interface VoteStatus {
  isActive: boolean;
  yesVotes: number;
  neededVotes: number;
  isFinished: boolean;
}

interface GameState {
  // --- View Control ---
  viewMode: 'PERSPECTIVE' | 'TOP_DOWN';
  toggleView: () => void;

  // --- Chat System ---
  activeTab: ChatTab;
  setActiveTab: (tab: ChatTab) => void;
  messages: ChatMessage[];
  // เพิ่ม channel parameter (default = PARTY)
  addMessage: (sender: string, text: string, type?: MessageType, channel?: ChatChannel) => void;

  // --- AI & Turn System ---
  aiStatus: AiStatus;
  turnCount: number;
  timeLeft: number;
  waitingFor: string[]; // รายชื่อคนที่ยังไม่ส่ง Action

  setAiStatus: (status: AiStatus) => void;
  decrementTime: () => void;
  submitPlayerAction: (text: string) => void; // ฟังก์ชันส่ง Action แล้วจบเทิร์นเลย
  mockOthersSubmitting: () => void; // ฟังก์ชันจำลองเพื่อนส่ง

  // --- Game Control (Pause/Vote) ---
  isPaused: boolean;
  voteStatus: VoteStatus;
  togglePause: () => void;
  startExitVote: () => void;
  castVote: () => void;
  resetVote: () => void;
}

// --- Store Implementation ---
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
      sender, 
      text, 
      type, 
      channel, // บันทึกห้องแชท
      timestamp: new Date()
    }]
  })),

  // 3. AI & Turn Logic
  aiStatus: 'PLAYER_TURN',
  turnCount: 0,
  timeLeft: 60,
  waitingFor: [],
  
  setAiStatus: (status) => set({ aiStatus: status }),

  decrementTime: () => set((state) => {
    // ถ้าหมดเวลาในตาผู้เล่น -> บังคับส่ง
    if (state.timeLeft <= 0 && state.aiStatus === 'PLAYER_TURN') {
       get().submitPlayerAction("(หมดเวลาตอบ)");
       return { timeLeft: 0 };
    }
    return { timeLeft: state.timeLeft - 1 };
  }),

  submitPlayerAction: (text) => {
    // 1. บันทึกข้อความลงห้อง AI
    get().addMessage('Player (You)', text, 'USER', 'AI');
    
    // 2. เปลี่ยนสถานะเป็นรอเพื่อน
    set({ 
      aiStatus: 'WAITING_OTHERS', 
      waitingFor: ['Player 2', 'Player 3', 'Player 4'] // Mock รายชื่อเพื่อน
    });

    // 3. เริ่มจำลองเพื่อนส่งข้อความ
    get().mockOthersSubmitting();
  },

  mockOthersSubmitting: () => {
    // Mock: เพื่อนค่อยๆ ทยอยส่ง
    setTimeout(() => {
      set((state) => ({ waitingFor: state.waitingFor.filter(p => p !== 'Player 2') }));
    }, 1500); // 1.5 วินาที

    setTimeout(() => {
        set((state) => ({ waitingFor: state.waitingFor.filter(p => p !== 'Player 3') }));
    }, 3000); // 3 วินาที

    setTimeout(() => {
        set((state) => ({ waitingFor: [] })); // คนสุดท้ายส่งเสร็จ
        set({ aiStatus: 'THINKING' }); // AI เริ่มคิด
    }, 4500); // 4.5 วินาที
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
    const isFinished = newVotes >= state.voteStatus.neededVotes;
    return { voteStatus: { ...state.voteStatus, yesVotes: newVotes, isFinished } };
  }),
  
  resetVote: () => set((state) => ({ 
    voteStatus: { ...state.voteStatus, isActive: false, yesVotes: 0, isFinished: false } 
  }))
}))