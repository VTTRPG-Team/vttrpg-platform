import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';

const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 
const ROOM_ID = "room-1";

type DBMessage = {
  id: string;
  room_id: string;
  sender_name: string;
  content: string;
  message_type: 'USER' | 'AI' | 'SYSTEM';
  channel: 'PARTY' | 'AI';
  created_at: string;
};

type UIMessage = {
  sender: string;
  text: string;
  type: 'USER' | 'AI' | 'SYSTEM';
  channel: 'PARTY' | 'AI';
};

export const ai_gm = () => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");
  const hasInitialized = useRef(false);

useEffect(() => {
    // ฟังก์ชันโหลดข้อความเริ่มต้น
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_messages')
        .select('*')
        .eq('room_id', ROOM_ID)
        .order('created_at', { ascending: true });
      
      if (data) {
        // แปลงจาก DB format เป็น UI format
        const formatted: UIMessage[] = data.map((m: any) => ({
          sender: m.sender_name,
          text: m.content,
          type: m.message_type,
          channel: m.channel
        }));
        setMessages(formatted);
      }
    };

    fetchMessages();

    // ฟัง Realtime (ใครพิมพ์มาก็เห็นหมด)
    const channel = supabase
      .channel('game_chat')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `room_id=eq.${ROOM_ID}` }, 
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            sender: newMsg.sender_name,
            text: newMsg.content,
            type: newMsg.message_type,
            channel: newMsg.channel
          }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // --- 2. ฟังก์ชันบันทึกลง Supabase ---
  const saveToSupabase = async (msg: UIMessage) => {
    await supabase.from('game_messages').insert({
      room_id: ROOM_ID,
      sender_name: msg.sender,
      content: msg.text,
      message_type: msg.type,
      channel: msg.channel,
      user_id: 'user-uuid-placeholder' // ใส่ ID ผู้เล่นจริงที่นี่ถ้ามี
    });
  };

  // --- 3. ส่งข้อความ Party ---
  const sendPartyMessage = async (text: string) => {
    // ส่งเข้า DB แล้วรอ Realtime เด้งกลับมาโชว์
    await saveToSupabase({ sender: 'Player', text, type: 'USER', channel: 'PARTY' });
  };

  const askGemini = async (promptText: string, isAutoStart = false) => {
    if (!isAutoStart) {
      await saveToSupabase({ sender: 'Player', text: promptText, type: 'USER', channel: 'AI' });
    }

    setLoading(true);
    setCurrentAiText("");

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(promptText);
      const text = result.response.text();

      // Typewriter Effect (Local Only - คนอื่นเห็นตอนพิมพ์เสร็จ)
      let i = 0;
      const typingInterval = setInterval(async () => {
        setCurrentAiText(text.substring(0, i));
        i++;
        if (i > text.length) {
          clearInterval(typingInterval);
          setCurrentAiText(""); 
          setLoading(false);
          
          // AI คิดเสร็จ -> บันทึกลง DB -> Realtime แจ้งทุกคน
          await saveToSupabase({ sender: 'AI GM', text, type: 'AI', channel: 'AI' });
        }
      }, 10);

    } catch (err: any) {
      console.error(err);
      setLoading(false);
      // Optional: Save error to DB
    }
  };

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;
    
    // เช็คก่อนว่ามีข้อความในห้องหรือยัง ถ้ายังค่อยให้ AI ทัก
    const checkHistory = async () => {
        const { count } = await supabase.from('game_messages').select('*', { count: 'exact', head: true }).eq('room_id', ROOM_ID);
        if (count === 0) {
            askGemini("Act as a Dungeon Master...", true);
        }
    };
    checkHistory();
  }, []);

  return { messages, loading, currentAiText, askGemini, sendPartyMessage };
};