import { create } from 'zustand'

export type MessageType = 'USER' | 'SYSTEM' | 'AI';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  type: MessageType;
  timestamp: Date;
}

interface GameState {
  // --- 1. View & Camera ---
  viewMode: 'PERSPECTIVE' | 'TOP_DOWN';
  toggleView: () => void;

  // --- 2. Chat & AI ---
  aiTokens: number;
  messages: ChatMessage[];
  addMessage: (sender: string, text: string, type?: MessageType) => void;
  decreaseToken: () => void;

  // --- 3. Game Logic (Pause & Vote) ---
  isPaused: boolean;
  voteStatus: {
    isActive: boolean;
    yesVotes: number;
    neededVotes: number; // เป้าหมาย (เช่น 3 เสียง)
  };
  togglePause: () => void;
  startExitVote: () => void;
  castVote: () => void;
  resetVote: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  // 1. View
  viewMode: 'PERSPECTIVE',
  toggleView: () => set((state) => ({ 
    viewMode: state.viewMode === 'PERSPECTIVE' ? 'TOP_DOWN' : 'PERSPECTIVE' 
  })),

  // 2. Chat & AI
  aiTokens: 30,
  messages: [],
  addMessage: (sender, text, type = 'USER') => set((state) => ({
    messages: [...state.messages, {
      id: Math.random().toString(36).substr(2, 9),
      sender, text, type, timestamp: new Date()
    }]
  })),
  decreaseToken: () => set((state) => ({ aiTokens: Math.max(0, state.aiTokens - 1) })),

  // 3. Pause & Vote
  isPaused: false,
  voteStatus: { isActive: false, yesVotes: 0, neededVotes: 3 }, // ตั้งเป้าไว้ 3 คน
  
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  
  startExitVote: () => set((state) => ({
    voteStatus: { ...state.voteStatus, isActive: true, yesVotes: 1 } // คนกดเริ่ม นับเป็น 1 เสียง
  })),

  castVote: () => set((state) => {
    const newVotes = state.voteStatus.yesVotes + 1;
    // เช็คว่าครบจำนวนโหวตหรือยัง
    if (newVotes >= state.voteStatus.neededVotes) {
        setTimeout(() => {
            alert("✅ Game Over! (Mock: Redirecting to Lobby...)");
            get().resetVote();
        }, 500);
    }
    return { voteStatus: { ...state.voteStatus, yesVotes: newVotes } };
  }),

  resetVote: () => set((state) => ({
    voteStatus: { ...state.voteStatus, isActive: false, yesVotes: 0 }
  }))
}))