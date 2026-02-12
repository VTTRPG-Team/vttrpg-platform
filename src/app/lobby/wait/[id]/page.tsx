'use client';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useParams } from 'next/navigation';
// เพิ่ม icon ที่ต้องใช้
import { 
  Mic, Send, CheckCircle, Crown, XCircle, User, 
  MicOff, Video, VideoOff, Headphones, HeadphoneOff
} from 'lucide-react';

export default function WaitingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const roomId = params?.id as string;

  const [room, setRoom] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // --- Media State (เพิ่มใหม่) ---
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const myVideoRef = useRef<HTMLVideoElement>(null);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // --- Functions Load Data ---
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
    const { data } = await supabase
      .from('lobby_messages')
      .select('*, profiles(username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  // --- Init & Media Setup ---
  useEffect(() => {
    if (!roomId) return;

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // ขอเข้าถึงกล้องและไมค์ (User Media)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
      } catch (err) {
        console.error("Error accessing media:", err);
        // ถ้าไม่ให้สิทธิ์ ก็ตั้งเป็น false ไว้ก่อน
        setIsMicOn(false);
        setIsCamOn(false);
      }

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

      return () => { 
        supabase.removeChannel(channel); 
        // Cleanup Stream ตอนออกจากหน้า
        localStream?.getTracks().forEach(track => track.stop());
      };
    };
    init();
  }, [roomId, router]);

  // --- Attach Stream to Video Element ---
  useEffect(() => {
    if (myVideoRef.current && localStream) {
      myVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isCamOn, players]); // Re-run เมื่อ UI เปลี่ยน

  // --- Media Controls ---
  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => track.enabled = !isMicOn);
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCam = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = !isCamOn);
      setIsCamOn(!isCamOn);
    }
  };

  const toggleSpeaker = () => {
    // Note: อันนี้เป็น Logic UI สำหรับ Mute คนอื่น (ในอนาคต)
    setIsSpeakerOn(!isSpeakerOn);
  };

  // ... (ส่วน Logic ป้องกันปิดจอ, Auto Scroll เหมือนเดิม) ...
  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (currentUser && room && currentUser.id === room.host_id) {
         supabase.from('rooms').delete().eq('id', roomId).then();
      } else if (currentUser) {
         supabase.from('room_players').delete().eq('room_id', roomId).eq('user_id', currentUser.id).then();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [currentUser, room, roomId]);


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
  
  // Logic Start (Updated >= 1)
  const hasEnoughPlayers = players.length >= 1; 
  const everyoneReady = players.every(p => p.id === room.host_id || p.isReady);
  const canStart = hasEnoughPlayers && everyoneReady;

  return (
    <div className="min-h-screen bg-[#1a120b] font-mono relative flex flex-col items-center p-8">
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
        {/* แก้ 1: ลด gap-4 เป็น gap-2 เพื่อดึง Chat ให้สูงขึ้น */}
        <div className="flex-1 flex flex-col gap-2">
           
           {/* Player Grid */}
           {/* แก้ 2: 
               - เพิ่ม pt-6 (Padding Top) เพื่อให้มีที่ว่างสำหรับมงกุฏ ไม่ให้โดนขอบตัด 
               - เปลี่ยน h-48 เป็น h-auto เพื่อไม่ให้กินที่เกินจำเป็น
           */}
           <div className="flex gap-4 overflow-x-auto pb-4 pt-6 px-2 custom-scrollbar items-start h-auto min-h-[160px]">
              {players.map((p) => {
                const isMe = p.id === currentUser.id;
                
                return (
                  <div key={p.uniqueKey} className={`w-36 flex-shrink-0 rounded-lg border-2 p-2 flex flex-col items-center shadow-lg relative transition-all duration-300 ${p.isReady ? 'bg-green-100 border-green-600 scale-105' : 'bg-[#F4E4BC] border-[#5A2D0C]'}`}>
                     
                     {/* --- Video / Avatar Frame --- */}
                     {/* (ส่วน Video/Image) */}
                     <div className="w-24 h-24 rounded-full border-4 border-[#3e2723] overflow-hidden bg-gray-900 relative group">
                        {isMe && isCamOn ? (
                           <video ref={myVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                        ) : (
                           p.avatar ? <img src={p.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-gray-500"><User /></div>
                        )}
                        {/* Ready Badge */}
                        {p.isReady && <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center animate-in fade-in zoom-in pointer-events-none"><CheckCircle className="text-white w-10 h-10 drop-shadow-md"/></div>}
                        
                        {/* Controls (My Profile Only) */}
                        {isMe && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button onClick={toggleMic} className={`p-1.5 rounded-full ${isMicOn ? 'bg-gray-200 text-green-700' : 'bg-red-500 text-white'}`}>
                                {isMicOn ? <Mic size={14}/> : <MicOff size={14}/>}
                             </button>
                             <button onClick={toggleCam} className={`p-1.5 rounded-full ${isCamOn ? 'bg-gray-200 text-blue-700' : 'bg-red-500 text-white'}`}>
                                {isCamOn ? <Video size={14}/> : <VideoOff size={14}/>}
                             </button>
                          </div>
                        )}
                     </div>

                     {/* Name & Headphone Control */}
                     <div className="mt-2 text-xs font-bold text-center truncate w-full text-[#3e2723] px-1 bg-white/50 rounded flex justify-between items-center">
                        <span className="truncate flex-1 text-left">{p.name}</span>
                        
                        {/* แก้ 3: เปลี่ยนจากลำโพง เป็นหูฟัง (Headphones) */}
                        {isMe && (
                           <button onClick={toggleSpeaker} className="ml-1 text-[#5A2D0C] hover:scale-110" title="Toggle Sound">
                              {isSpeakerOn ? <Headphones size={14}/> : <HeadphoneOff size={14} className="text-red-500"/>}
                           </button>
                        )}
                     </div>

                     {/* แก้ 4: ขยับตำแหน่งมงกุฏขึ้น (-top-5) และซ้าย (-left-3) พร้อมใส่ z-20 ให้ลอยเหนือทุกอย่าง */}
                     {p.id === room.host_id && (
                        <div className="absolute -top-5 -left-3 z-20 drop-shadow-lg filter">
                           <Crown className="text-yellow-500 fill-yellow-400 w-8 h-8 animate-pulse-slow"/>
                        </div>
                     )}
                  </div>
                );
              })}
              
              {/* Empty Slots (ปรับความสูงให้พอดีกัน) */}
              {[...Array(Math.max(0, room.max_players - players.length))].map((_, i) => (
                 <div key={i} className="w-36 flex-shrink-0 border-2 border-dashed border-[#F4E4BC]/30 rounded-lg flex flex-col items-center justify-center text-[#F4E4BC]/30 font-bold bg-black/20 h-36">
                    <span className="text-4xl mb-2 opacity-50">+</span>
                    <span className="text-sm">Empty</span>
                 </div>
              ))}
           </div>

           {/* Chat Box (เหมือนเดิม) */}
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

           {/* Start Button */}
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
    </div>
  );
}