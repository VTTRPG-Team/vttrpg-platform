import { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

const API_KEY = "AIzaSyD8LSZbkVBxsAz3YjJDmUczZB97UAw3oak"; 

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
  useEffect(() => {
    const getUserInfo = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // ดึงชื่อจากตาราง profiles (ถ้ามี)
        const { data: profile } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', user.id)
          .single();
          
        if (profile?.username) {
          setMyUsername(profile.username);
        }
      }
    };
    getUserInfo();
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) console.error("Error fetching messages:", error);
      
      if (data) {
        // แปลงจาก DB format เป็น UI format
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

    // ฟัง Realtime (ใครพิมพ์มาก็เห็นหมด)
    const channel = supabase
      .channel(`game_chat_${roomId}`)
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'game_messages', filter: `room_id=eq.${roomId}` }, 
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            userId: newMsg.user_id,
            sender: newMsg.sender_name,
            text: newMsg.content,
            type: newMsg.message_type,
            channel: newMsg.channel
          }]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // --- 2. ฟังก์ชันบันทึกลง Supabase ---
  const saveToSupabase = async (msg: Omit<UIMessage, 'id' | 'userId'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    let userIdToSave = null;
    if (msg.type === 'USER') {
        userIdToSave = currentUserId;
    }

    const { error } = await supabase.from('game_messages').insert({
      room_id: roomId,           // UUID ที่ถูกต้อง
      user_id: userIdToSave,      // UUID ของ User หรือ Null
      sender_name: msg.sender,
      content: msg.text,
      message_type: msg.type,
      channel: msg.channel,
    });

    if (error) {
        console.error("Error saving message:", error.message);
        // อาจจะเพิ่ม UI แจ้งเตือนผู้ใช้ตรงนี้
    }
  };

  // --- 3. ส่งข้อความ Party ---
  const sendPartyMessage = async (text: string) => {
    await saveToSupabase({ sender: myUsername, text, type: 'USER', channel: 'PARTY' });
  };

  // --- 4. Logic AI ---
  const askGemini = async (promptText: string, isAutoStart = false) => {
    if (!roomId) return;

    if (!isAutoStart) {
      // บันทึกข้อความผู้เล่น (User ID จะถูกดึงใน saveToSupabase)
      await saveToSupabase({ sender: myUsername, text: promptText, type: 'USER', channel: 'AI' });
    }

    setLoading(true);
    setCurrentAiText("");

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });
      const result = await model.generateContent(promptText);
      const text = result.response.text();

      let i = 0;
      const typingInterval = setInterval(async () => {
        setCurrentAiText(text.substring(0, i));
        i++;
        if (i > text.length) {
          clearInterval(typingInterval);
          setCurrentAiText(""); 
          setLoading(false);
          
          // บันทึกข้อความ AI (User ID จะเป็น null)
          await saveToSupabase({ sender: 'AI GM', text, type: 'AI', channel: 'AI' });
        }
      }, 10);

    } catch (err: any) {
      console.error(err);
      setLoading(false);
    }
  };

  // --- 5. Auto Start ---
  useEffect(() => {
    if (hasInitialized.current || !roomId) return;
    hasInitialized.current = true;
    
    const checkHistory = async () => {
        // ใช้ head: true เพื่อดึงแค่จำนวน ไม่ดึงข้อมูลจริง (ประหยัดเน็ต)
        const { count } = await supabase
            .from('game_messages')
            .select('*', { count: 'exact', head: true })
            .eq('room_id', roomId);
            
        if (count === 0) {
            askGemini("Act as a Dungeon Master...", true);
        }
    };
    checkHistory();
  }, [roomId]);

  return { messages, loading, currentAiText, askGemini, sendPartyMessage, currentUserId };
};