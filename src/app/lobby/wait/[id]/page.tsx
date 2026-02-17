'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { 
  CheckCircle, XCircle, ArrowLeft, Crown, Shield, MessageSquare, Copy, Sword, 
  Mic, MicOff, Video, VideoOff, User, Users, Headphones, HeadphoneOff 
} from 'lucide-react';
import { 
  LiveKitRoom, RoomAudioRenderer, useLocalParticipant, useParticipants, 
  VideoTrack, useParticipantTracks
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';
import { Cinzel, Crimson_Text } from 'next/font/google';

import LobbyChat from '@/components/lobby/LobbyChat';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });
const crimson = Crimson_Text({ subsets: ['latin'], weight: ['400', '600', '700'] });

// ----------------------------------------------------------------------
// 🟢 1. Player Card
// ----------------------------------------------------------------------
function PlayerCard({ playerData, roomHostId, isCurrentUser, toggleMic, toggleCam, micOn, camOn }: any) {
  const participants = useParticipants();
  const lkParticipant = participants.find(p => p.identity === playerData.id);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoTracks = useParticipantTracks([Track.Source.Camera], lkParticipant?.identity);
  const videoTrack = videoTracks.find(t => t.participant.identity === playerData.id);

  useEffect(() => {
    if (!lkParticipant) { setIsSpeaking(false); return; }
    const onSpeakingChanged = (speaking: boolean) => setIsSpeaking(speaking);
    lkParticipant.on('speakingChanged', onSpeakingChanged);
    setIsSpeaking(lkParticipant.isSpeaking);
    return () => { lkParticipant.off('speakingChanged', onSpeakingChanged); };
  }, [lkParticipant]);

  const isMicActive = lkParticipant?.isMicrophoneEnabled;
  const isVideoVisible = videoTrack?.publication?.track && !videoTrack.publication?.isMuted;

  return (
    <div className={`relative group w-36 md:w-44 flex-shrink-0 bg-[#1a0f0a] border rounded-lg p-3 flex flex-col items-center transition-all duration-300 ${isSpeaking ? 'border-green-500 shadow-[0_0_20px_#22c55e] scale-105 z-20' : 'border-[#3e2723] hover:border-[#F4E4BC]/50 hover:shadow-lg'}`}>
      
      {/* Ready Badge: สีเขียวเมื่อ Ready */}
      <div className={`absolute top-2 right-2 w-3 h-3 z-20 rounded-full transition-all duration-300 ${playerData.isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e] scale-125' : 'bg-red-900/50'}`}></div>
      
      <div className={`w-20 h-20 rounded-full border-2 overflow-hidden mb-3 bg-black relative transition-colors ${isSpeaking ? 'border-green-500' : 'border-[#5d4037]'}`}>
        {isVideoVisible ? (
           <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
           <img src={playerData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${playerData.id}`} alt="Avatar" className="w-full h-full object-cover" />
        )}

        {isCurrentUser && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-30 cursor-pointer">
                <button onClick={(e) => { e.stopPropagation(); toggleMic(); }} className={`p-1.5 rounded-full transition-all hover:scale-110 ${micOn ? 'bg-[#F4E4BC] text-[#3e2723]' : 'bg-red-600 text-white'}`}>
                    {micOn ? <Mic size={14}/> : <MicOff size={14}/>}
                </button>
                <button onClick={(e) => { e.stopPropagation(); toggleCam(); }} className={`p-1.5 rounded-full transition-all hover:scale-110 ${camOn ? 'bg-[#F4E4BC] text-[#3e2723]' : 'bg-red-600 text-white'}`}>
                    {camOn ? <Video size={14}/> : <VideoOff size={14}/>}
                </button>
            </div>
        )}

        {roomHostId === playerData.id && (
            <div className="absolute bottom-0 inset-x-0 bg-yellow-900/80 text-[8px] text-center text-yellow-200 font-bold uppercase py-0.5 z-20 pointer-events-none">Leader</div>
        )}
      </div>
      
      <div className="text-center w-full">
          <div className={`${cinzel.className} text-[#F4E4BC] text-xs md:text-sm font-bold truncate`}>{playerData.name}</div>
          <div className="text-[8px] md:text-[10px] text-[#5d4037] uppercase tracking-widest">{playerData.role || 'Adventurer'}</div>
      </div>

      <div className={`mt-2 transition-all ${isSpeaking ? 'text-green-500 scale-125' : 'text-[#3e2723]'}`}>
          {isMicActive ? ( isSpeaking ? <Mic size={16} className="animate-pulse" /> : <Mic size={14} /> ) : ( <MicOff size={14} className="opacity-50" /> )}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 🟢 2. Waiting Room Content
// ----------------------------------------------------------------------
function WaitingRoomContent({ room, players, messages, setMessages, currentUser, myUsername, localClientId, handleStartGame, handleToggleReady, handleExit, copied, copyRoomId, roomId }: any) {
  
  const { localParticipant } = useLocalParticipant();
  const [micOn, setMicOn] = useState(false); 
  const [camOn, setCamOn] = useState(false);
  const [deaf, setDeaf] = useState(false);

  useEffect(() => {
    if (localParticipant) {
      setMicOn(localParticipant.isMicrophoneEnabled);
      setCamOn(localParticipant.isCameraEnabled);
    }
  }, [localParticipant]);

  const toggleMic = async () => {
    if (!localParticipant) return;
    try {
      const newState = !micOn;
      await localParticipant.setMicrophoneEnabled(newState);
      setMicOn(newState);
    } catch (e) { console.error("Mic Error:", e); }
  };

  const toggleCam = async () => {
    if (!localParticipant) return;
    try {
      const newState = !camOn;
      await localParticipant.setCameraEnabled(newState);
      setCamOn(newState);
    } catch (e) { 
      console.error("Cam Error:", e);
      alert("Check camera permissions."); 
    }
  };

  const toggleDeaf = () => { setDeaf(!deaf); };

  const isHost = currentUser.id === room.host_id;
  const isMeReady = players.find((p:any) => p.id === currentUser.id)?.isReady || false;
  const canStart = players.length > 0 && players.every((p:any) => p.id === room.host_id || p.isReady);
  const hostPlayer = players.find((p:any) => p.id === room.host_id);
  const hostName = hostPlayer ? hostPlayer.name : 'Unknown';

  return (
    <>
      {!deaf && <RoomAudioRenderer />}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
         <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-20 blur-sm" /> 
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0503] via-[#0a0503]/80 to-[#0a0503]/50" />
      </div>

      {/* Top Bar */}
      <div className="relative z-50 w-full p-6 flex justify-between items-center border-b border-[#3e2723]/50 bg-[#0f0a08]/80 backdrop-blur-sm">
          <button onClick={handleExit} className="flex items-center gap-2 text-[#a1887f] hover:text-red-500 transition-colors uppercase text-sm font-bold tracking-wider group pointer-events-auto">
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Abandon Quest
          </button>
          <div className="hidden md:block text-[#5d4037] text-xs uppercase tracking-[0.2em]">Lobby Phase</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-7xl flex-1 p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-hidden">
         
         {/* Left Panel */}
         <div className="w-full md:w-1/3 flex flex-col gap-6 h-[80vh] z-20">
            <div className="bg-[#1a0f0a] border-2 border-[#3e2723] p-6 rounded-lg shadow-lg relative overflow-hidden">
               <div className="absolute top-0 right-0 p-2 opacity-10"><Shield size={64} /></div>
               <h1 className={`${cinzel.className} text-2xl md:text-3xl text-[#F4E4BC] font-bold uppercase leading-none mb-2 truncate`}>{room.name}</h1>
               <p className="text-[#a1887f] text-sm italic border-l-2 border-[#5d4037] pl-3 mb-4 line-clamp-3">"{room.description || 'A gathering of brave souls...'}"</p>
               <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#5d4037]">
                  <Crown size={14} className="text-yellow-600" /> Host: <span className="text-[#F4E4BC]">{hostName}</span>
               </div>
            </div>
            <div className="flex-1 bg-[#e3d5c5] rounded-lg border-4 border-[#5d4037] shadow-[inset_0_0_40px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col">
               <div className="h-8 bg-[#3e2723] flex items-center justify-center border-b border-[#5d4037]">
                  <span className="text-[#F4E4BC] text-xs uppercase font-bold tracking-widest flex items-center gap-2"><MessageSquare size={12} /> Party Chat</span>
               </div>
               <div className="flex-1 p-2 overflow-hidden pointer-events-auto">
                  <LobbyChat roomId={roomId} currentUser={currentUser} myUsername={myUsername} messages={messages} setMessages={setMessages} localClientId={localClientId} />
               </div>
            </div>
         </div>

         {/* Right Panel */}
         <div className="flex-1 flex flex-col gap-8 h-[80vh] z-20">
            <div className="flex-1 bg-black/20 rounded-lg border border-[#3e2723]/30 p-4 relative overflow-y-auto custom-scrollbar pointer-events-auto">
                <div className="flex flex-wrap justify-start content-start gap-4 h-full">
                    {players.map((p: any) => (
                        <PlayerCard key={p.uniqueKey} playerData={p} roomHostId={room.host_id} isCurrentUser={p.id === currentUser.id} toggleMic={toggleMic} toggleCam={toggleCam} micOn={micOn} camOn={camOn} />
                    ))}
                    {Array.from({ length: Math.max(0, room.max_players - players.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-36 md:w-44 h-[170px] border-2 border-dashed border-[#3e2723]/30 rounded-lg p-3 flex flex-col items-center justify-center opacity-50 bg-[#0f0a08]/30 flex-shrink-0">
                            <div className="w-16 h-16 rounded-full bg-[#0f0a08] flex items-center justify-center mb-2 border border-[#3e2723]/50"><User size={24} className="text-[#3e2723]" /></div>
                            <span className="text-[10px] text-[#3e2723] uppercase tracking-widest font-bold">Empty</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="h-24 flex items-center justify-between px-6 bg-[#0f0a08]/95 border-t border-[#3e2723] backdrop-blur-md rounded-lg shadow-2xl relative z-[999] pointer-events-auto">
               <div className="flex items-center gap-4">
                  <div className="flex flex-col gap-1 items-start">
                     <span className="text-[10px] text-[#5d4037] uppercase tracking-widest font-bold ml-1">Invite</span>
                     <button onClick={copyRoomId} className="flex items-center gap-3 bg-[#1a0f0a] px-3 py-2 rounded border border-[#3e2723] hover:border-[#F4E4BC]/50 hover:bg-[#2a1d15] transition-all group cursor-pointer active:scale-95">
                        <Users size={16} className="text-[#a1887f] group-hover:text-[#F4E4BC]" /><code className="text-[#F4E4BC] font-mono text-xs hidden md:block">{roomId.substring(0,8)}...</code>
                        <div className="text-[#a1887f]">{copied ? <CheckCircle size={14} className="text-green-500"/> : <Copy size={14} className="group-hover:text-[#F4E4BC]"/>}</div>
                     </button>
                  </div>
                  <div className="h-10 w-[1px] bg-[#3e2723]/50"></div>
                  <div className="flex items-center gap-2">
                      <button onClick={toggleMic} className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 ${micOn ? 'bg-[#3e2723] text-[#F4E4BC] border-[#F4E4BC]' : 'bg-red-900/10 text-red-500 border-red-900/50 hover:bg-red-900/30'}`} title="Toggle Mic">{micOn ? <Mic size={20} /> : <MicOff size={20} />}</button>
                      <button onClick={toggleDeaf} className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 ${!deaf ? 'bg-[#3e2723] text-[#F4E4BC] border-[#F4E4BC]' : 'bg-red-900 text-white border-red-500 shadow-[0_0_10px_red]'}`} title="Deafen (Mute All)">{!deaf ? <Headphones size={20} /> : <HeadphoneOff size={20} />}</button>
                      <button onClick={toggleCam} className={`p-3 rounded-full border transition-all hover:scale-110 active:scale-95 ${camOn ? 'bg-[#3e2723] text-[#F4E4BC] border-[#F4E4BC]' : 'bg-red-900/10 text-red-500 border-red-900/50 hover:bg-red-900/30'}`} title="Toggle Camera">{camOn ? <Video size={20} /> : <VideoOff size={20} />}</button>
                  </div>
               </div>
               <div>
                 {isHost ? (
                    <button onClick={handleStartGame} disabled={!canStart} className={`relative px-8 py-3 rounded font-bold text-lg uppercase tracking-[0.2em] transition-all duration-300 ease-out flex items-center justify-center gap-3 ${canStart ? 'bg-gradient-to-r from-[#8B4513] to-[#5A2D0C] text-[#F4E4BC] border-2 border-[#F4E4BC]/50 hover:text-white hover:border-[#F4E4BC] hover:shadow-[0_0_25px_rgba(244,228,188,0.4)] hover:scale-105 active:scale-95 cursor-pointer' : 'bg-[#1a0f0a] text-[#5d4037] border-2 border-[#3e2723] cursor-not-allowed grayscale opacity-50'}`}>
                       <Sword size={22} className={canStart ? "animate-pulse text-yellow-400" : ""} /> {players.length > 1 && !canStart ? "Waiting..." : "Venture Forth"}
                    </button>
                 ) : (
                    <button 
                      onClick={handleToggleReady} 
                      className={`relative px-10 py-3 rounded font-bold text-lg uppercase tracking-[0.2em] transition-all duration-300 border-2 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 cursor-pointer z-[999] ${isMeReady ? 'bg-green-900/80 border-green-500 text-green-100 hover:bg-green-800 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#3e2723] border-[#F4E4BC] text-[#F4E4BC] hover:bg-[#5d4037] hover:shadow-[0_0_15px_rgba(244,228,188,0.2)]'}`}
                    >
                       {isMeReady ? <><CheckCircle size={22} /> Ready</> : <><XCircle size={22} /> Not Ready</>}
                    </button>
                 )}
               </div>
            </div>
         </div>
      </div>
    </>
  );
}

// ----------------------------------------------------------------------
// 🟢 3. Main Wrapper
// ----------------------------------------------------------------------
export default function WaitingRoomPage() {
  const router = useRouter(); const params = useParams(); const roomId = params?.id as string;
  const localClientId = useRef(Math.random().toString(36).substring(7)).current;
  const [room, setRoom] = useState<any>(null); const [players, setPlayers] = useState<any[]>([]); const [messages, setMessages] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null); const [myUsername, setMyUsername] = useState<string>('Unknown');
  const [token, setToken] = useState(""); const [copied, setCopied] = useState(false);

  const fetchPlayers = async () => { if (!roomId) return; const { data } = await supabase.from('room_players').select('id, user_id, is_ready, joined_at, profiles(username, avatar_url, role)').eq('room_id', roomId).order('joined_at', { ascending: true }); if (data) setPlayers(data.map((p: any) => ({ uniqueKey: p.id, id: p.user_id, name: p.profiles?.username || 'Unknown', avatar: p.profiles?.avatar_url, role: p.profiles?.role || 'Adventurer', isReady: p.is_ready }))); };
  const fetchMessages = async () => { if (!roomId) return; const { data } = await supabase.from('lobby_messages').select('*, profiles(username)').eq('room_id', roomId).order('created_at', { ascending: true }); if (data) setMessages(data); };

  useEffect(() => {
    if (!roomId) return;
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser(); if (!user) return router.push('/lobby/join'); setCurrentUser(user);
      const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single(); setMyUsername(profile?.username || 'User');
      const { data: roomData, error } = await supabase.from('rooms').select('*').eq('id', roomId).single(); if (error) return router.push('/lobby/join'); setRoom(roomData);
      fetchPlayers(); fetchMessages();
      try { const resp = await fetch(`/api/livekit?room=${roomId}&username=${profile?.username || 'User'}&userId=${user.id}`); const data = await resp.json(); setToken(data.token); } catch (e) { console.error("LiveKit Error:", e); }
    };
    initUser();
    const channel = supabase.channel(`room:${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => fetchPlayers()).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `room_id=eq.${roomId}` }, () => fetchMessages()).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => { if (payload.new.status === 'playing') router.push(`/room/${roomId}`); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [roomId, router]);

  // ✅ FIX: Optimistic Update (อัปเดต UI ทันทีที่กด)
  const handleToggleReady = async () => {
    if (!currentUser) return;
    const myIndex = players.findIndex((p: any) => p.id === currentUser.id);
    if (myIndex !== -1) {
        // 1. เปลี่ยนหน้าจอทันที (ไม่ต้องรอ DB)
        const newStatus = !players[myIndex].isReady;
        setPlayers(prev => {
            const updated = [...prev];
            updated[myIndex] = { ...updated[myIndex], isReady: newStatus };
            return updated;
        });

        // 2. ส่งข้อมูลไป DB
        const { error } = await supabase.from('room_players').update({ is_ready: newStatus }).eq('room_id', roomId).eq('user_id', currentUser.id);
        
        // 3. ถ้า DB พัง ค่อยเปลี่ยนกลับ
        if(error) {
            console.error("DB Error:", error);
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
      if (!error) router.push(`/room/${roomId}`); else alert("Error: " + error.message);
  };
  const handleExit = async () => { if (!currentUser || !room) return; if (currentUser.id === room.host_id) { if (confirm("Disband party?")) { await supabase.from('rooms').delete().eq('id', room.id); router.push('/lobby'); } } else { await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', currentUser.id); router.push('/lobby'); } };
  const copyRoomId = () => { navigator.clipboard.writeText(roomId); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  if (!room || !currentUser || !token) return <div className="min-h-screen bg-black flex items-center justify-center text-red-600 font-bold animate-pulse">Summoning Party...</div>;

  return (
    <LiveKitRoom video={false} audio={false} token={token} serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL} connect={true} data-lk-theme="default" className={`min-h-screen flex flex-col items-center relative bg-[#0a0503] ${crimson.className}`}>
        <WaitingRoomContent room={room} players={players} messages={messages} setMessages={setMessages} currentUser={currentUser} myUsername={myUsername} localClientId={localClientId} handleStartGame={handleStartGame} handleToggleReady={handleToggleReady} handleExit={handleExit} copied={copied} copyRoomId={copyRoomId} roomId={roomId} />
    </LiveKitRoom>
  );
}