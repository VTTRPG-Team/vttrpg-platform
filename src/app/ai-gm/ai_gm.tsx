import { useState, useEffect, useRef } from "react";
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import { generateBoardImage } from './ai_asset';
import PusherClient from 'pusher-js'; // 🌟 นำเข้า Pusher

type UIMessage = {
  id: string;
  userId: string | null;
  sender: string;
  text: string;
  type: 'USER' | 'AI' | 'SYSTEM';
  channel: 'PARTY' | 'AI';
};

export const ai_gm = () => {
  const params = useParams();
  const roomId = params?.id as string;

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");
  const hasInitialized = useRef(false);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("Player");

  // 🌟 ID ประจำเครื่อง (เอาไว้เช็คว่าข้อความนี้เราเป็นคนพิมพ์เองหรือเปล่า จะได้ไม่เด้งซ้ำ)
  const localClientId = useRef(Math.random().toString(36).substring(7)).current;

  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (profile?.username) setMyUsername(profile.username);
      }
    };
    getUserInfo();
  }, []);

  // 🌟 โหลดประวัติเก่า + รอรับ Pusher
  useEffect(() => {
    if (!roomId) return;

    // 1. ดึงข้อความเก่าจาก Database (ทำแค่ตอนเข้าห้องครั้งแรก)
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      
      if (data) {
        const formatted: UIMessage[] = data.map((m: any) => ({
          id: m.id,
          userId: m.user_id,
          sender: m.sender_name,
          text: m.content,
          type: m.message_type,
          channel: m.channel
        }));
        setMessages(formatted);
      }
    };
    fetchMessages();

    // 2. ตั้งค่าดักฟัง Pusher (Realtime)
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(`room-${roomId}`);
    
    channel.bind('party-chat-event', (data: { message: UIMessage, senderId: string }) => {
      const { message, senderId } = data;
      
      // 🚫 ถ้าเป็นข้อความที่เราพิมพ์เอง เมินไปเลย! (เพราะเราอัปเดตจอตัวเองไปแล้ว)
      if (senderId === localClientId) return;

      // ถ้าเป็นของคนอื่น ให้เอามาต่อท้าย (เช็ค id ซ้ำกันเหนียว)
      setMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
    });

    return () => {
      pusher.unsubscribe(`room-${roomId}`);
      pusher.disconnect();
    };
  }, [roomId, localClientId]);

  // --- ฟังก์ชันบันทึกลง Supabase (ทำเป็น Background) ---
  const saveToSupabase = async (msg: Omit<UIMessage, 'id' | 'userId'>) => {
    const userIdToSave = msg.type === 'USER' ? currentUserId : null;
    const { error } = await supabase.from('game_messages').insert({
      room_id: roomId,
      user_id: userIdToSave,
      sender_name: msg.sender,
      content: msg.text,
      message_type: msg.type,
      channel: msg.channel,
    });
    if (error) console.error("Error saving message:", error.message);
  };

  // --- 🌟 ส่งข้อความ Party (แบบสายฟ้าแลบ) ---
  const sendPartyMessage = async (text: string) => {
    // 1. สร้าง ID จำลองขึ้นมา
    const tempId = `temp-${Date.now()}`;
    const newMsg: UIMessage = { id: tempId, userId: currentUserId, sender: myUsername, text, type: 'USER', channel: 'PARTY' };

    // 2. แปะขึ้นจอตัวเองทันที (Optimistic UI)
    setMessages(prev => [...prev, newMsg]);

    // 3. ยิง Pusher ไปหาเพื่อนให้จอเพื่อนเด้งตาม
    try {
      fetch('/api/pusher/party-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, message: newMsg, senderId: localClientId })
      });
    } catch (err) {
      console.error("Pusher error:", err);
    }

    // 4. แอบเซฟลง Database เงียบๆ
    saveToSupabase({ sender: myUsername, text, type: 'USER', channel: 'PARTY' });
  };

  // --- Logic AI (เพิ่ม Pusher ให้เพื่อนเห็นข้อความตอนเราคุยกับ AI ด้วย) ---
  const askGemini = async (promptText: string, isAutoStart = false) => {
    if (!roomId) return;

    if (!isAutoStart) {
      // เอาคำถามเราขึ้นจอก่อน
      const tempId = `ai-user-${Date.now()}`;
      const userMsg: UIMessage = { id: tempId, userId: currentUserId, sender: myUsername, text: promptText, type: 'USER', channel: 'AI' };
      setMessages(prev => [...prev, userMsg]);
      
      // ยิงบอกเพื่อนผ่าน Pusher
      fetch('/api/pusher/party-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, message: userMsg, senderId: localClientId })
      });

      saveToSupabase({ sender: myUsername, text: promptText, type: 'USER', channel: 'AI' });
    }

    setLoading(true);
    setCurrentAiText("");

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText })
      });

      if (!response.ok) throw new Error('Chat API Error');
      
      const data = await response.json();
      const text = data.text;
      const imagePrompt = isAutoStart 
        ? `Fantasy RPG Opening Scene: ${text.slice(0, 200)}`
        : `Fantasy RPG Scene: ${promptText}. Context: ${text.slice(0, 150)}...`;
        
      generateBoardImage(roomId, imagePrompt);
      
      if (isAutoStart) {
        // ... (กรณี Auto Start ก็เซฟและโชว์ไป)
        const aiMsg: UIMessage = { id: `ai-${Date.now()}`, userId: null, sender: 'AI GM', text, type: 'AI', channel: 'AI' };
        setMessages(prev => [...prev, aiMsg]);
        fetch('/api/pusher/party-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, message: aiMsg, senderId: localClientId }) });
        saveToSupabase({ sender: 'AI GM', text, type: 'AI', channel: 'AI' });
      } else {
        let i = 0;
        const typingInterval = setInterval(async () => {
          setCurrentAiText(text.substring(0, i));
          i++;
          if (i > text.length) {
            clearInterval(typingInterval);
            setCurrentAiText(""); 
            setLoading(false);
            
            // 🌟 พอ AI พิมพ์เสร็จปุ๊บ เอาเข้า Message + ยิงบอกเพื่อน
            const aiMsg: UIMessage = { id: `ai-${Date.now()}`, userId: null, sender: 'AI GM', text, type: 'AI', channel: 'AI' };
            setMessages(prev => [...prev, aiMsg]);
            
            fetch('/api/pusher/party-chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ roomId, message: aiMsg, senderId: localClientId })
            });

            saveToSupabase({ sender: 'AI GM', text, type: 'AI', channel: 'AI' });
          }
        }, 10);
      }
    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasInitialized.current || !roomId) return;
    const checkHistory = async () => {
        const { count } = await supabase.from('game_messages').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
        if (count === 0 && !hasInitialized.current) {
            hasInitialized.current = true;
            askGemini("Act as a Dungeon Master. Introduce yourself and the setting...", true);
        }
    };
    checkHistory();
  }, [roomId]);

  return { messages, loading, currentAiText, askGemini, sendPartyMessage, currentUserId };
};