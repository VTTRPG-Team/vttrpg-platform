'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { LiveKitRoom } from '@livekit/components-react';
import '@livekit/components-styles';
import { Crimson_Text } from 'next/font/google';

// 🌟 Import Component ที่เราแยกไว้
import WaitingRoomContent from './WaitingRoomContent';

const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;
  const localClientId = useRef(Math.random().toString(36).substring(7)).current;

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [myUsername, setMyUsername] = useState<string>('Unknown');
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  // 🌟 ฟังก์ชันดึงผู้เล่น (เรียกซ้ำเวลามีคนเข้าออก)
  const fetchPlayers = async () => {
    if (!roomId) return;
    const { data } = await supabase.from('room_players').select('id, user_id, is_ready, joined_at, profiles(username, avatar_url, role)').eq('room_id', roomId).order('joined_at', { ascending: true });
    if (data) {
      setPlayers(data.map((p: any) => ({
        uniqueKey: p.id, id: p.user_id, name: p.profiles?.username || 'Unknown', avatar: p.profiles?.avatar_url, role: p.profiles?.role || 'Adventurer', isReady: p.is_ready
      })));
    }
  };
  
  const fetchMessages = async () => {
    if (!roomId) return;
    const { data } = await supabase.from('lobby_messages').select('*, profiles(username)').eq('room_id', roomId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    if (!roomId) return;
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return router.push('/lobby/join');
      setCurrentUser(user);
      
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single();
      setMyUsername(profile?.username || 'User');
      
      const { data: roomData, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (error) return router.push('/lobby/join');
      setRoom(roomData);
      
      fetchPlayers();
      fetchMessages();
      
      try {
        const resp = await fetch(`/api/livekit?room=${roomId}&username=${profile?.username || 'User'}&userId=${user.id}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) { console.error("LiveKit Error:", e); }
    };
    initUser();

    // 🌟 แก้ไข Realtime Subscription: ดักจับทั้ง INSERT/UPDATE/DELETE แยกกันให้ชัดเจน จะได้ไม่พลาด
    const playersChannel = supabase.channel(`players:${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
          fetchPlayers(); // รีเฟรชทันทีที่มีใครเข้า ออก หรือกด Ready
      })
      .subscribe();

    const messagesChannel = supabase.channel(`messages:${roomId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `room_id=eq.${roomId}` }, () => {
          fetchMessages();
      })
      .subscribe();

    const roomChannel = supabase.channel(`roomStatus:${roomId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
          if (payload.new.status === 'playing') router.push(`/room/${roomId}`);
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(playersChannel); 
      supabase.removeChannel(messagesChannel); 
      supabase.removeChannel(roomChannel); 
    };
  }, [roomId, router]);

  const handleToggleReady = async () => {
    if (!currentUser) return;
    const myIndex = players.findIndex((p: any) => p.id === currentUser.id);
    if (myIndex !== -1) {
        const newStatus = !players[myIndex].isReady;
        setPlayers(prev => {
            const updated = [...prev];
            updated[myIndex] = { ...updated[myIndex], isReady: newStatus };
            return updated;
        });

        const { error } = await supabase.from('room_players').update({ is_ready: newStatus }).eq('room_id', roomId).eq('user_id', currentUser.id);
        
        if(error) {
            setPlayers(prev => {
                const updated = [...prev];
                updated[myIndex] = { ...updated[myIndex], isReady: !newStatus };
                return updated;
            });
        }
    }
  };

  const handleStartGame = async () => {
      const { error } = await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
      if (!error) router.push(`/room/${roomId}`);
  };

  const handleExit = async () => {
    if (!currentUser || !room) return;
    if (currentUser.id === room.host_id) {
       if (confirm("Disband party?")) { await supabase.from('rooms').delete().eq('id', room.id); router.push('/lobby'); }
    } else {
       await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', currentUser.id);
       router.push('/lobby');
    }
  };
  
  const copyRoomId = () => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!room || !currentUser || !token) return <div className="min-h-screen bg-black flex items-center justify-center text-red-600 font-bold animate-pulse">Summoning Party...</div>;

  return (
    <LiveKitRoom 
      video={false} 
      audio={false} 
      token={token} 
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} 
      connect={true} 
      data-lk-theme="default" 
      className={`min-h-screen flex flex-col items-center relative bg-[#0a0503] ${crimson.className}`}
    >
        <WaitingRoomContent 
          room={room} players={players} messages={messages} setMessages={setMessages} 
          currentUser={currentUser} myUsername={myUsername} localClientId={localClientId}
          handleStartGame={handleStartGame} handleToggleReady={handleToggleReady} 
          handleExit={handleExit} copied={copied} copyRoomId={copyRoomId} roomId={roomId}
        />
    </LiveKitRoom>
  );
}