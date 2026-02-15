import { useState, useEffect, useRef } from "react";
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';
import PusherClient from 'pusher-js';
import { useGameStore } from '@/store/useGameStore';

type UIMessage = { id: string; userId: string | null; sender: string; text: string; type: 'USER' | 'AI' | 'SYSTEM'; channel: 'PARTY' | 'AI'; };

export const ai_gm = () => {
  const params = useParams();
  const roomId = params?.id as string;
  const localClientId = useRef(Math.random().toString(36).substring(7)).current;
  const hasInitialized = useRef(false);

  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentAiText, setCurrentAiText] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string>("Player");
  
  const [players, setPlayers] = useState<string[]>([]);
  const [hostId, setHostId] = useState<string | null>(null); 

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        const { data: prof } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (prof?.username) setMyUsername(prof.username.trim());
      }

      if (roomId) {
        const { data: roomData } = await supabase.from('rooms').select('host_id').eq('id', roomId).single();
        if (roomData) setHostId(roomData.host_id);

        const { data: rp } = await supabase.from('room_players').select('user_id').eq('room_id', roomId);
        if (rp) {
          const userIds = rp.map(r => r.user_id);
          const { data: profs } = await supabase.from('profiles').select('username').in('id', userIds);
          if (profs) setPlayers(profs.map(p => p.username ? p.username.trim() : 'Player'));
        }
      }
    };
    initData();
  }, [roomId]);

  const processRef = useRef((text: string, rollRequest: string | null, msgId: string) => {});
  useEffect(() => {
    processRef.current = (text: string, rollRequest: string | null, msgId: string) => {
        setLoading(true);
        setCurrentAiText("");
        let i = 0;
        const typingInterval = setInterval(() => {
          setCurrentAiText(text.substring(0, i));
          i += 2;
          if (i > text.length) {
            clearInterval(typingInterval);
            setCurrentAiText("");
            setLoading(false);
            setMessages(prev => [...prev, { id: msgId, userId: null, sender: 'AI GM', text, type: 'AI', channel: 'AI' }]);
            
            if (rollRequest) useGameStore.getState().triggerDiceRoll(rollRequest as any);
          }
        }, 10);
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    
    const fetchMessages = async () => {
       const { data } = await supabase.from('game_messages').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
       if (data) setMessages(data.map((m: any) => ({ id: m.id, userId: m.user_id, sender: m.sender_name, text: m.content, type: m.message_type, channel: m.channel })));
    };
    fetchMessages();

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`room-${roomId}`);
    
    channel.bind('party-chat-event', (data: any) => {
      const { message, senderId, actionType, rollRequest } = data;
      if (senderId === localClientId) return; 

      // 🌟 รับคำสั่งให้โชว์ว่า AI กำลังคิด
      if (actionType === 'AI_THINKING' || message?.id === 'sys-thinking') {
         setLoading(true);
      }
      else if (actionType === 'AI_RESPONSE') {
        processRef.current(message.text, rollRequest, message.id); 
      } 
      else if (message && message.text) { // 🌟 กันเหนียว เผื่อ actionType หาย
        setMessages(prev => prev.some(m => m.id === message.id) ? prev : [...prev, message]);
        // ถ้าเป็นเพื่อนพิมพ์ส่ง Action มา ให้เอาใส่ตะกร้าฝั่งเราด้วย
        if (message.channel === 'AI' && message.type === 'USER') {
            useGameStore.getState().submitPlayerAction(message.sender, message.text);
        }
      }
    });

    return () => { pusher.unsubscribe(`room-${roomId}`); pusher.disconnect(); };
  }, [roomId, localClientId]);

  // คำนวณหาว่าใครยังไม่พิมพ์บ้าง
  const aiMessages = messages.filter(m => m.channel === 'AI');
  let lastAiMsgIndex = -1;
  for (let i = aiMessages.length - 1; i >= 0; i--) {
      if (aiMessages[i].type === 'AI' || aiMessages[i].sender === 'AI GM') {
          lastAiMsgIndex = i;
          break;
      }
  }
  const isGameStarted = lastAiMsgIndex !== -1;
  const currentTurnActions = isGameStarted ? aiMessages.slice(lastAiMsgIndex + 1).filter(m => m.type === 'USER') : [];
  const uniqueSubmitted = Array.from(new Set(currentTurnActions.map(m => m.sender)));
  const waitingFor = players.filter(p => !uniqueSubmitted.includes(p));
  const hasSubmittedAction = uniqueSubmitted.includes(myUsername);

  const isFetchingRef = useRef(false);
  
  const triggerAskGemini = async (aggregatedText: string, isAutoStart = false) => {
    setLoading(true);
    
    fetch('/api/pusher/party-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, message: { id: 'sys-thinking', text: '', channel: 'AI', type: 'SYSTEM' }, senderId: localClientId, actionType: 'AI_THINKING' }) }).catch(() => {});

    try {
      const aiHistory = messages.filter(m => m.channel === 'AI').map(m => ({
        role: m.type === 'AI' ? 'AI' : 'USER',
        text: m.type === 'USER' ? `${m.sender}: ${m.text}` : m.text
      }));

      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aggregatedText, history: aiHistory }) });
      const data = await response.json();
      let text = data.text;

      if (!text) throw new Error("No text from AI");

      let rollRequest = null;
      const rollMatch = text.match(/\[ROLL_REQUEST:(D\d+)\]/i);
      if (rollMatch) {
        rollRequest = rollMatch[1].toUpperCase();
        text = text.replace(/\[ROLL_REQUEST:(D\d+)\]/ig, '').trim();
      }

      // เพื่อสั่งให้มันวาดรูป
      import('./ai_asset').then(({ generateBoardImage }) => {
          // ลบดอกจันและภาษาไทยจากผู้เล่นออกไป ใช้แค่คำตอบของ AI วาดรูป
          const cleanText = text.replace(/[*_#]/g, ''); 
          
          const imagePrompt = isAutoStart 
            ? `Fantasy RPG Opening Scene: ${cleanText.slice(0, 150)}`
            : `Fantasy RPG Scene: ${cleanText.slice(0, 150)}`; 
          
          generateBoardImage(roomId, imagePrompt);
      });

      const msgId = `ai-${Date.now()}`;
      
      const fullAiMessage: UIMessage = {
        id: msgId,
        userId: null,
        sender: 'AI GM',
        text: text,
        type: 'AI',
        channel: 'AI'
      };

      fetch('/api/pusher/party-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, message: fullAiMessage, senderId: localClientId, actionType: 'AI_RESPONSE', rollRequest }) });

      processRef.current(text, rollRequest, msgId);

      await supabase.from('game_messages').insert({ room_id: roomId, sender_name: 'AI GM', content: text, message_type: 'AI', channel: 'AI' });

    } catch (err) { console.error(err); setLoading(false); }
  };

  useEffect(() => {
    if (isGameStarted && waitingFor.length === 0 && uniqueSubmitted.length > 0 && currentUserId === hostId) {
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        const aggregatedText = currentTurnActions.map(a => `${a.sender}: ${a.text}`).join('\n');
        triggerAskGemini(aggregatedText).finally(() => { isFetchingRef.current = false; });
      }
    }
  }, [waitingFor.length, uniqueSubmitted.length, currentUserId, hostId, isGameStarted]); 

  const sendPartyMessage = async (text: string) => {
    const msg: UIMessage = { id: `msg-${Date.now()}`, userId: currentUserId, sender: myUsername, text, type: 'USER', channel: 'PARTY' };
    setMessages(prev => [...prev, msg]);
    fetch('/api/pusher/party-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, message: msg, senderId: localClientId }) });
    await supabase.from('game_messages').insert({ room_id: roomId, user_id: currentUserId, sender_name: myUsername, content: text, message_type: 'USER', channel: 'PARTY' });
  };

  const sendAiAction = async (text: string) => {
    const msg: UIMessage = { id: `ai-usr-${Date.now()}`, userId: currentUserId, sender: myUsername, text, type: 'USER', channel: 'AI' };
    setMessages(prev => [...prev, msg]);
    
    // 🌟 ส่งแบบเต็มใบ
    fetch('/api/pusher/party-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ roomId, message: msg, senderId: localClientId, actionType: 'AI_ACTION' }) });
    await supabase.from('game_messages').insert({ room_id: roomId, user_id: currentUserId, sender_name: myUsername, content: text, message_type: 'USER', channel: 'AI' });
  };

  useEffect(() => {
    if (hasInitialized.current || !roomId || players.length === 0 || !hostId || !currentUserId) return;
    
    const checkHistory = async () => {
        const { count } = await supabase.from('game_messages').select('*', { count: 'exact', head: true }).eq('room_id', roomId);
        
        if (count === 0 && !hasInitialized.current) {
            hasInitialized.current = true;
            if (currentUserId === hostId) {
                triggerAskGemini("Act as a Dungeon Master. Introduce the fantasy setting to the players and ask what they want to do.", true);
            }
        }
    };
    checkHistory();
  }, [roomId, players, hostId, currentUserId]);

  return { messages, loading, currentAiText, sendAiAction, sendPartyMessage, currentUserId, myUsername, waitingFor, hasSubmittedAction, isGameStarted };
};