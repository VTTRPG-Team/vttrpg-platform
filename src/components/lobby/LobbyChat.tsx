'use client'
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Send } from 'lucide-react';

// รับ setMessages เพิ่มเข้ามาใน Props
export default function LobbyChat({ roomId, currentUser, myUsername, messages, setMessages, localClientId }: any) {
  const [newMessage, setNewMessage] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const msgContent = newMessage;
    setNewMessage(''); 

    const tempMsg = { id: `msg-${Date.now()}`, user_id: currentUser.id, content: msgContent, profiles: { username: myUsername } };
    
    // อัปเดตข้อความขึ้นหน้าจอตัวเองเดี๋ยวนั้นเลย!
    setMessages((prev: any) => [...prev, tempMsg]);
    
    fetch('/api/pusher/lobby', { 
        method: 'POST', body: JSON.stringify({ roomId, event: 'lobby-chat', data: { message: tempMsg, senderId: localClientId } }) 
    });
    await supabase.from('lobby_messages').insert({ room_id: roomId, user_id: currentUser.id, content: msgContent });
  };

  return (
    <div className="h-[400px] bg-[#F4E4BC] rounded-lg border-4 border-[#5A2D0C] flex flex-col shadow-2xl relative">
      <div className="bg-[#5A2D0C] text-[#F4E4BC] px-4 py-2 font-bold text-sm flex-shrink-0">💬 Party Chat</div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#D4C5A2]/30 flex flex-col">
        {messages.length === 0 && <div className="text-center text-gray-500 text-sm mt-10 opacity-50">No messages yet...</div>}
        {messages.map((msg: any, i: number) => {
          const isMe = msg.user_id === currentUser.id;
          return (
            <div key={i} className={`max-w-[80%] text-sm p-2 rounded-lg shadow-sm animate-in slide-in-from-bottom-1 ${isMe ? 'self-end bg-[#8B4513] text-[#F4E4BC] border border-[#5A2D0C]' : 'self-start bg-white text-[#3e2723] border border-[#bcaaa4]'}`}>
              <div className={`text-xs font-bold opacity-70 mb-1 ${isMe ? 'text-right' : 'text-left'}`}>{msg.profiles?.username || 'Unknown'}</div>
              <div className={isMe ? 'text-right' : 'text-left'}>{msg.content}</div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>
      <div className="p-3 bg-[#D4C5A2] border-t-2 border-[#5A2D0C] flex gap-2 flex-shrink-0">
         <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 py-2 rounded border-2 border-[#8B4513] bg-[#F4E4BC] text-[#3e2723] placeholder-[#8B4513]/50 focus:outline-none font-bold" placeholder="Type message..." />
         <button onClick={handleSendMessage} className="p-3 bg-[#5A2D0C] text-white rounded border-2 border-[#3e2723] hover:bg-[#3e1e08]"><Send size={18}/></button>
      </div>
    </div>
  )
}