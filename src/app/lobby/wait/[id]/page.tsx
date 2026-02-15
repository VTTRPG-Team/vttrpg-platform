'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import PusherClient from 'pusher-js';
import { CheckCircle, XCircle } from 'lucide-react';
import { LiveKitRoom, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';

// 🌟 Import Components ที่เราแยกไฟล์ไว้
import PlayerGrid from '@/components/lobby/PlayerGrid';
import LobbyChat from '@/components/lobby/LobbyChat';

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

  const fetchPlayers = async () => {
    if (!roomId) return;
    const { data } = await supabase.from('room_players').select('id, user_id, is_ready, joined_at, profiles(username, avatar_url)').eq('room_id', roomId).order('joined_at', { ascending: true });
    if (data) {
      setPlayers(data.map((p: any) => ({
        uniqueKey: p.id, id: p.user_id, name: p.profiles?.username || 'Unknown',
        avatar: p.profiles?.avatar_url, isReady: p.is_ready
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
      const username = profile?.username || 'User';
      setMyUsername(username);

      const { data: roomData, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (error) return router.push('/lobby/join');
      setRoom(roomData);

      fetchPlayers();
      fetchMessages();

      try {
        const resp = await fetch(`/api/livekit?room=${roomId}&username=${username}&userId=${user.id}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) { console.error("LiveKit Error:", e); }
    };
    initUser();
  }, [roomId, router]);

  // 🌟 PUSHER REAL-TIME SYNC
  useEffect(() => {
    if (!roomId || !currentUser) return;
    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY!, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER! });
    const channel = pusher.subscribe(`lobby-${roomId}`);

    channel.bind('player-sync', () => fetchPlayers());
    channel.bind('lobby-chat', (data: { message: any, senderId: string }) => {
      if (data.senderId !== localClientId) {
         setMessages(prev => prev.some(m => m.id === data.message.id) ? prev : [...prev, data.message]);
      }
    });
    channel.bind('start-game', () => router.push(`/room/${roomId}`));
    channel.bind('room-closed', () => {
      alert("The Host has disbanded the party.");
      router.push('/lobby');
    });

    return () => { pusher.unsubscribe(`lobby-${roomId}`); pusher.disconnect(); };
  }, [roomId, currentUser, localClientId, router]);

  const handleToggleReady = async () => {
    if (!currentUser) return;
    const myPlayer = players.find(p => p.id === currentUser.id);
    if (myPlayer) {
      await supabase.from('room_players').update({ is_ready: !myPlayer.isReady }).eq('room_id', roomId).eq('user_id', currentUser.id);
      fetch('/api/pusher/lobby', { method: 'POST', body: JSON.stringify({ roomId, event: 'player-sync', data: {} }) });
      fetchPlayers(); // อัปเดตฝั่งตัวเองทันที
    }
  };

  const handleStartGame = async () => {
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
    fetch('/api/pusher/lobby', { method: 'POST', body: JSON.stringify({ roomId, event: 'start-game', data: {} }) });
    router.push(`/room/${roomId}`);
  };

  const handleExit = async () => {
    if (!currentUser || !room) return;
    if (currentUser.id === room.host_id) {
      await supabase.from('rooms').delete().eq('id', room.id);
      fetch('/api/pusher/lobby', { method: 'POST', body: JSON.stringify({ roomId, event: 'room-closed', data: {} }) });
      router.push('/lobby'); 
    } else {
      await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', currentUser.id);
      fetch('/api/pusher/lobby', { method: 'POST', body: JSON.stringify({ roomId, event: 'player-sync', data: {} }) });
      router.push('/lobby'); 
    }
  };

  if (!room || !currentUser) return <div className="min-h-screen bg-[#1a120b] flex items-center justify-center text-[#F4E4BC] font-mono animate-pulse">Loading...</div>;

  const isHost = currentUser.id === room.host_id;
  const isMeReady = players.find(p => p.id === currentUser.id)?.isReady || false;
  const canStart = players.length === 1 || (players.length > 1 && players.every(p => p.id === room.host_id || p.isReady));

  return (
    <LiveKitRoom 
      video={true} 
      audio={true} 
      token={token} 
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} 
      connect={true} 
      data-lk-theme="default" // ล็อคให้เป็นโหมดมืดเสมอ แก้บั๊กพื้นขาว!
      className="min-h-screen bg-[#1a120b] font-mono relative flex flex-col items-center p-8 w-full"
    >
      <RoomAudioRenderer />
      <div className="absolute inset-0 bg-[url('/images/dungeon-bg.jpg')] bg-cover opacity-40 blur-sm"></div>

      <div className="absolute top-6 right-6 z-20">
        <button onClick={handleExit} className="px-6 py-2 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold hover:bg-red-900 rounded shadow-lg">EXIT LOBBY</button>
      </div>

      <div className="z-10 w-full max-w-5xl flex gap-6 h-[80vh] mt-10">
        
        {/* Left: Info */}
        <div className="w-1/3 bg-[#D4C5A2] rounded-lg border-4 border-[#5A2D0C] p-6 shadow-2xl flex flex-col h-full">
          <h1 className="text-3xl font-bold text-[#3e2723] mb-2">{room.name}</h1>
          <div className="text-sm text-[#5A2D0C] mb-4 font-bold uppercase border-b-2 border-[#5A2D0C]/30 pb-2">Players: {players.length}/{room.max_players}</div>
          <div className="bg-[#3e2723] text-[#F4E4BC] p-4 rounded mb-4 flex-1 border border-[#5A2D0C] overflow-y-auto italic text-sm">"{room.description || 'No description...'}"</div>
          <img src={room.image_url || "/images/cover-placeholder.jpg"} className="rounded shadow-lg w-full h-40 object-cover bg-gray-800 grayscale" alt="Cover" />
        </div>

        {/* Right: Modules */}
        <div className="flex-1 flex flex-col gap-4 h-full">
           <PlayerGrid players={players} room={room} currentUser={currentUser} token={token} />
           
           {/* ส่ง setMessages เข้าไปด้วย */}
           <LobbyChat 
              roomId={roomId} 
              currentUser={currentUser} 
              myUsername={myUsername} 
              messages={messages} 
              setMessages={setMessages} 
              localClientId={localClientId} 
           />

           <div className="flex justify-center mt-auto pb-4">
              {isHost ? (
                <button onClick={handleStartGame} disabled={!canStart} className={`px-12 py-4 font-bold text-2xl border-4 shadow-lg rounded-lg uppercase transition-all ${canStart ? 'bg-[#8B4513] text-[#F4E4BC] border-[#F4E4BC] hover:scale-105 shadow-[0_0_15px_rgba(139,69,19,0.5)]' : 'bg-gray-600 text-gray-400 border-gray-500 opacity-80'}`}>
                  {players.length > 1 && !canStart ? "WAITING FOR READY..." : "START ADVENTURE"}
                </button>
              ) : (
                <button onClick={handleToggleReady} className={`px-12 py-4 font-bold text-2xl border-4 shadow-lg rounded-lg uppercase transition-all flex items-center gap-3 ${isMeReady ? 'bg-green-700 text-white border-green-400' : 'bg-[#8B4513] text-[#F4E4BC] border-[#F4E4BC] hover:scale-105'}`}>
                   {isMeReady ? <>I'M READY! <CheckCircle /></> : <>NOT READY <XCircle className="opacity-50"/></>}
                </button>
              )}
           </div>
        </div>
      </div>
    </LiveKitRoom>
  );
}