'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
import { 
  Send, CheckCircle, Crown, XCircle, User, 
  Mic, MicOff, Video, VideoOff, Headphones, HeadphoneOff 
} from 'lucide-react';

// --- LiveKit Imports ---
import {
  LiveKitRoom,
  useTracks,
  VideoTrack,
  useRoomContext,
  useLocalParticipant,
  isTrackReference,  
  RoomAudioRenderer,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import '@livekit/components-styles';

// ==========================================
// 1. Component ย่อย: แสดงวิดีโอในกรอบวงกลม
// ==========================================
const PlayerVideo = ({ participantIdentity }: { participantIdentity: string }) => {
  // ดึง Track วิดีโอของคนคนนี้ (Camera Only)
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: false }],
    { onlySubscribed: true }
  );

  // หา Track ที่ตรงกับ User ID นี้
  const userTrack = tracks.find(t => t.participant.identity === participantIdentity);

  // --- แก้ตรงนี้: เพิ่ม isTrackReference(userTrack) เพื่อยืนยัน Type ---
  if (userTrack && isTrackReference(userTrack)) {
    return (
      <VideoTrack 
        trackRef={userTrack} 
        className="w-full h-full object-cover transform scale-x-[-1]"
      />
    );
  }
  return null; // ถ้าไม่มีวิดีโอ ให้ส่งค่าว่าง (เพื่อไปโชว์ Avatar แทน)
};

// ==========================================
// 2. Component ย่อย: ปุ่มควบคุม (Mic/Cam) ของตัวเอง
// ==========================================
const MyControls = ({ isMicOn, isCamOn, toggleMic, toggleCam }: any) => {
  // ใช้ Hook ของ LiveKit เพื่อคุมอุปกรณ์จริง
  const { localParticipant } = useLocalParticipant();
  
  // Sync ปุ่มกับสถานะจริง (เผื่อเริ่มมาปิดอยู่)
  useEffect(() => {
    if (localParticipant) {
      localParticipant.setMicrophoneEnabled(isMicOn);
      localParticipant.setCameraEnabled(isCamOn);
    }
  }, [isMicOn, isCamOn, localParticipant]);

  return (
    <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
       <button onClick={toggleMic} className={`p-1.5 rounded-full ${isMicOn ? 'bg-gray-200 text-green-700' : 'bg-red-500 text-white'}`}>
          {isMicOn ? <Mic size={14}/> : <MicOff size={14}/>}
       </button>
       <button onClick={toggleCam} className={`p-1.5 rounded-full ${isCamOn ? 'bg-gray-200 text-blue-700' : 'bg-red-500 text-white'}`}>
          {isCamOn ? <Video size={14}/> : <VideoOff size={14}/>}
       </button>
    </div>
  );
};

// ==========================================
// 3. Component หลัก: Waiting Room
// ==========================================
export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // LiveKit State
  const [token, setToken] = useState("");
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true); // (Note: Logic ลำโพงต้องจัดการที่ AudioRenderer ถ้ายากเกินไปให้คงไว้เป็น UI ก่อน)

  // --- 1. Fetch Token for LiveKit ---
  useEffect(() => {
    if (!currentUser || !roomId || token) return;
    
    (async () => {
      try {
        // ขอ Profile เพื่อเอาชื่อไปแสดง
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', currentUser.id).single();
        const username = profile?.username || 'User';

        // เรียก API ที่เราสร้างในข้อ 3
        const resp = await fetch(`/api/livekit?room=${roomId}&username=${username}&userId=${currentUser.id}`);
        const data = await resp.json();
        setToken(data.token);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [currentUser, roomId, token]);

  // --- 2. Load Supabase Data (เหมือนเดิม) ---
  const fetchPlayers = async () => {
    if (!roomId) return;
    const { data } = await supabase
      .from('room_players')
      .select('id, user_id, is_ready, joined_at, profiles(username, avatar_url)') 
      .eq('room_id', roomId)
      .order('joined_at', { ascending: true });

    if (data) {
      const formatted = data.map((p: any) => ({
        uniqueKey: p.id,
        id: p.user_id,
        name: p.profiles?.username || 'Unknown',
        avatar: p.profiles?.avatar_url,
        isReady: p.is_ready
      }));
      setPlayers(formatted);
    }
  };

  const fetchMessages = async () => {
    if (!roomId) return;
    const { data } = await supabase.from('lobby_messages').select('*, profiles(username)').eq('room_id', roomId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    if (!roomId) return;
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      const { data: roomData, error } = await supabase.from('rooms').select('*').eq('id', roomId).single();
      if (error) return router.push('/lobby/join');
      setRoom(roomData);
      fetchPlayers();
      fetchMessages();

      const channel = supabase.channel(`room-live-${roomId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => fetchPlayers())
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lobby_messages', filter: `room_id=eq.${roomId}` }, () => fetchMessages())
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, (payload) => {
           if (payload.new.status === 'playing') router.push(`/room/${roomId}`);
        })
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'rooms', filter: `id=eq.${roomId}` }, () => {
           alert("The Host has disbanded the party.");
           router.push('/lobby/join');
        })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, [roomId, router]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // --- Actions ---
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const msgContent = newMessage;
    setNewMessage(''); 
    const tempId = Math.random().toString();
    setMessages(prev => [...prev, { id: tempId, user_id: currentUser.id, content: msgContent, profiles: { username: 'Me' } }]);
    await supabase.from('lobby_messages').insert({ room_id: roomId, user_id: currentUser.id, content: msgContent });
    fetchMessages();
  };
  const handleToggleReady = async () => {
    if (!currentUser) return;
    const myPlayer = players.find(p => p.id === currentUser.id);
    if (myPlayer) {
      setPlayers(prev => prev.map(p => p.id === currentUser.id ? { ...p, isReady: !p.isReady } : p));
      await supabase.from('room_players').update({ is_ready: !myPlayer.isReady }).eq('room_id', roomId).eq('user_id', currentUser.id);
    }
  };
  const handleStartGame = async () => {
    await supabase.from('rooms').update({ status: 'playing' }).eq('id', roomId);
    router.push(`/room/${roomId}`);
  };
  const handleExit = async () => {
    if (!currentUser || !room) return;
    if (currentUser.id === room.host_id) {
      await supabase.from('rooms').delete().eq('id', room.id);
      router.push('/lobby'); 
    } else {
      await supabase.from('room_players').delete().eq('room_id', room.id).eq('user_id', currentUser.id);
      router.push('/lobby/join'); 
    }
  };

  if (!room || !currentUser) return <div className="min-h-screen bg-[#1a120b] flex items-center justify-center text-[#F4E4BC] font-mono text-xl animate-pulse">Loading Dungeon...</div>;

  const isHost = currentUser.id === room.host_id;
  const myPlayer = players.find(p => p.id === currentUser.id);
  const isMeReady = myPlayer?.isReady || false;
  const hasEnoughPlayers = players.length >= 1; 
  const everyoneReady = players.every(p => p.id === room.host_id || p.isReady);
  const canStart = hasEnoughPlayers && everyoneReady;

  return (
    // LiveKitRoom ครอบทั้งหน้าเพื่อให้ใช้งาน Hook ข้างในได้
    <LiveKitRoom
      video={isCamOn}
      audio={isMicOn}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      data-lk-theme="default"
      connect={true}
      className="min-h-screen bg-[#1a120b] font-mono relative flex flex-col items-center p-8 w-full"
    >
      {/* ถ้าเปิดหูฟัง (isSpeakerOn) ให้เรนเดอร์เสียง ถ้าปิดก็ไม่ต้องเรนเดอร์ */}
      {isSpeakerOn && <RoomAudioRenderer />}
      {/* ------------------------------------- */}

      <div className="absolute inset-0 bg-[url('/images/dungeon-bg.jpg')] bg-cover opacity-40 blur-sm"></div>
      
      <div className="absolute inset-0 bg-[url('/images/dungeon-bg.jpg')] bg-cover opacity-40 blur-sm"></div>

      <div className="absolute top-6 right-6 z-20">
        <button onClick={handleExit} className="px-6 py-2 bg-[#5A2D0C] border-2 border-[#F4E4BC] text-[#F4E4BC] font-bold hover:bg-red-900 rounded shadow-lg">
          EXIT LOBBY
        </button>
      </div>

      <div className="z-10 w-full max-w-5xl flex gap-6 h-[80vh] mt-10">
        
        {/* Left: Info */}
        <div className="w-1/3 bg-[#D4C5A2] rounded-lg border-4 border-[#5A2D0C] p-6 shadow-2xl flex flex-col">
          <h1 className="text-3xl font-bold text-[#3e2723] mb-2">{room.name}</h1>
          <div className="text-sm text-[#5A2D0C] mb-4 font-bold uppercase border-b-2 border-[#5A2D0C]/30 pb-2">
            Players: {players.length}/{room.max_players}
          </div>
          <div className="bg-[#3e2723] text-[#F4E4BC] p-4 rounded mb-4 flex-1 border border-[#5A2D0C] overflow-y-auto">
             <p className="text-sm opacity-90 italic">"{room.description || 'No description...'}"</p>
          </div>
          <img src={room.image_url || "/images/cover-placeholder.jpg"} className="rounded shadow-lg w-full h-40 object-cover bg-gray-800 grayscale" alt="Cover" />
        </div>

        {/* Right: Players & Chat */}
        <div className="flex-1 flex flex-col gap-2">
           
           <div className="flex gap-4 overflow-x-auto pb-4 pt-6 px-2 custom-scrollbar items-start h-auto min-h-[160px]">
              {players.map((p) => {
                const isMe = p.id === currentUser.id;
                
                return (
                  <div key={p.uniqueKey} className={`w-36 flex-shrink-0 rounded-lg border-2 p-2 flex flex-col items-center shadow-lg relative transition-all duration-300 ${p.isReady ? 'bg-green-100 border-green-600 scale-105' : 'bg-[#F4E4BC] border-[#5A2D0C]'}`}>
                     
                     <div className="w-24 h-24 rounded-full border-4 border-[#3e2723] overflow-hidden bg-gray-900 relative group">
                        {/* --- ส่วนสำคัญ: แสดงวิดีโอจาก LiveKit --- */}
                        {/* ถ้ามี token แล้ว ให้ลองดึงวิดีโอมาโชว์ */}
                        {token ? (
                           <div className="w-full h-full relative">
                              {/* Component นี้จะโชว์วิดีโอถ้าคนนี้เปิดกล้อง */}
                              <PlayerVideo participantIdentity={p.id} />
                              
                              {/* ถ้าเป็นเรา และปิดกล้อง หรือคนอื่นและไม่มีวิดีโอ -> โชว์รูป (ซ้อนข้างหลังหรือบังหน้า) */}
                              {/* เพื่อความง่าย: ถ้าเป็นเราแล้วปิดกล้อง ให้โชว์รูปทับ */}
                              {isMe && !isCamOn && (
                                <div className="absolute inset-0 z-10">
                                   {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-500"><User /></div>}
                                </div>
                              )}
                              {/* ถ้าเป็นคนอื่น แล้ว Track Video หายไป (ปิดกล้อง) LiveKit จะจัดการ return null ใน PlayerVideo -> เราอาจต้องมี fallback image ซ้อนหลังเสมอ */}
                              <div className="absolute inset-0 -z-10">
                                  {p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-500"><User /></div>}
                              </div>
                           </div>
                        ) : (
                           // ถ้ายังไม่มี Token (โหลดอยู่)
                           p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-500"><User /></div>
                        )}

                        {p.isReady && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-in fade-in zoom-in pointer-events-none z-20"><CheckCircle className="text-white w-10 h-10 drop-shadow-md"/></div>}
                        
                        {/* Controls (My Profile Only) - เรียกใช้ Component ย่อย */}
                        {isMe && token && (
                           <MyControls 
                             isMicOn={isMicOn} 
                             isCamOn={isCamOn} 
                             toggleMic={() => setIsMicOn(!isMicOn)} 
                             toggleCam={() => setIsCamOn(!isCamOn)} 
                           />
                        )}
                     </div>

                     <div className="mt-2 text-xs font-bold text-center truncate w-full text-[#3e2723] px-1 bg-white/50 rounded flex justify-between items-center">
                        <span className="truncate flex-1 text-left">{p.name}</span>
                        {isMe && (
                           <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className="ml-1 text-[#5A2D0C] hover:scale-110" title="Toggle Sound">
                              {isSpeakerOn ? <Headphones size={14}/> : <HeadphoneOff size={14} className="text-red-500"/>}
                           </button>
                        )}
                     </div>
                     {p.id === room.host_id && (
                        <div className="absolute -top-5 -left-3 z-20 drop-shadow-lg filter">
                           <Crown className="text-yellow-500 fill-yellow-400 w-8 h-8 animate-pulse-slow"/>
                        </div>
                     )}
                  </div>
                );
              })}
              {[...Array(Math.max(0, room.max_players - players.length))].map((_, i) => (
                 <div key={i} className="w-36 flex-shrink-0 border-2 border-dashed border-[#F4E4BC]/30 rounded-lg flex flex-col items-center justify-center text-[#F4E4BC]/30 font-bold bg-black/20 h-36">
                    <span className="text-4xl mb-2 opacity-50">+</span>
                    <span className="text-sm">Empty</span>
                 </div>
              ))}
           </div>

           <div className="flex-1 bg-[#F4E4BC] rounded-lg border-4 border-[#5A2D0C] flex flex-col shadow-2xl relative">
              <div className="bg-[#5A2D0C] text-[#F4E4BC] px-4 py-2 font-bold text-sm">💬 Party Chat</div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#D4C5A2]/30 flex flex-col">
                 {messages.length === 0 && <div className="text-center text-gray-500 text-sm mt-10 opacity-50">No messages yet...</div>}
                 {messages.map((msg, i) => {
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
              <div className="p-3 bg-[#D4C5A2] border-t-2 border-[#5A2D0C] flex gap-2">
                 <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} className="flex-1 px-4 py-2 rounded border-2 border-[#8B4513] bg-[#F4E4BC] text-[#3e2723] placeholder-[#8B4513]/50 focus:outline-none font-bold" placeholder="Type message..." />
                 <button onClick={handleSendMessage} className="p-3 bg-[#5A2D0C] text-white rounded border-2 border-[#3e2723] hover:bg-[#3e1e08]"><Send size={18}/></button>
              </div>
           </div>

           <div className="flex justify-center mt-2">
              {isHost ? (
                <button onClick={handleStartGame} disabled={!canStart} className={`px-12 py-4 font-bold text-2xl border-4 shadow-lg rounded-lg uppercase tracking-widest transition-all ${canStart ? 'bg-[#8B4513] text-[#F4E4BC] border-[#F4E4BC] hover:scale-105 cursor-pointer shadow-[0_0_15px_rgba(139,69,19,0.5)]' : 'bg-gray-600 text-gray-400 border-gray-500 cursor-not-allowed opacity-80'}`}>
                  {!hasEnoughPlayers ? "WAITING FOR PLAYERS..." : (!everyoneReady ? "WAITING FOR READY..." : "START ADVENTURE")}
                </button>
              ) : (
                <button onClick={handleToggleReady} className={`px-12 py-4 font-bold text-2xl border-4 shadow-lg rounded-lg uppercase tracking-widest transition-all flex items-center gap-3 ${isMeReady ? 'bg-green-700 text-white border-green-400 hover:bg-green-800' : 'bg-[#8B4513] text-[#F4E4BC] border-[#F4E4BC] hover:scale-105'}`}>
                   {isMeReady ? <>I'M READY! <CheckCircle /></> : <>NOT READY <XCircle className="opacity-50"/></>}
                </button>
              )}
           </div>
        </div>
      </div>
    </LiveKitRoom>
  );
}