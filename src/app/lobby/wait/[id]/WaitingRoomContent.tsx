'use client';
import { useState, useEffect } from 'react';
import { useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react';
import { CheckCircle, XCircle, ArrowLeft, Crown, Shield, MessageSquare, Copy, Sword, Mic, MicOff, Video, VideoOff, User, Users, Headphones, HeadphoneOff, Bot, UserCog } from 'lucide-react';
import LobbyChat from '@/components/lobby/LobbyChat';
import PlayerCard from './PlayerCard';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });

export default function WaitingRoomContent({ room, players, messages, setMessages, currentUser, myUsername, localClientId, handleStartGame, handleToggleReady, handleExit, copied, copyRoomId, roomId }: any) {
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

  const toggleMic = async () => { if (localParticipant) { const s = !micOn; await localParticipant.setMicrophoneEnabled(s); setMicOn(s); }};
  const toggleCam = async () => { if (localParticipant) { const s = !camOn; await localParticipant.setCameraEnabled(s).catch(()=>alert("Camera error")); setCamOn(s); }};
  const toggleDeaf = () => setDeaf(!deaf);

  const isHost = currentUser.id === room.host_id;
  const isMeReady = players.find((p:any) => p.id === currentUser.id)?.isReady || false;
  // ทุกคนต้อง Ready (ยกเว้น Host) ถึงจะเริ่มได้
  const canStart = players.length > 0 && players.every((p:any) => p.id === room.host_id || p.isReady);
  const hostPlayer = players.find((p:any) => p.id === room.host_id);
  const hostName = hostPlayer ? hostPlayer.name : 'Unknown';

  // 🌟 คำนวณ Slot ว่าง (รวมทุกคน รวมถึง Host แล้วไปหักลบกับ max_players)
  const emptySlotsCount = Math.max(0, room.max_players - players.length);

  return (
    <>
      {!deaf && <RoomAudioRenderer />}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
         <img src="/dungeon_gate.jpg" alt="BG" className="w-full h-full object-cover opacity-20 blur-sm" /> 
         <div className="absolute inset-0 bg-gradient-to-t from-[#0a0503] via-[#0a0503]/80 to-[#0a0503]/50" />
      </div>

      <div className="relative z-50 w-full p-6 flex justify-between items-center border-b border-[#3e2723]/50 bg-[#0f0a08]/80 backdrop-blur-sm">
          <button onClick={handleExit} className="flex items-center gap-2 text-[#a1887f] hover:text-red-500 transition-colors uppercase text-sm font-bold tracking-wider pointer-events-auto">
             <ArrowLeft size={18} /> Abandon Quest
          </button>
          
          {/* 🌟 แสดงประเภท GM ด้านบนให้ชัดเจน */}
          <div className="flex items-center gap-2 bg-[#3e2723]/40 border border-[#5d4037] px-4 py-1.5 rounded-full text-[#F4E4BC] text-xs uppercase font-bold tracking-widest">
             {room.gm_type === 'human' ? <><UserCog size={14} className="text-red-400"/> Human GM</> : <><Bot size={14} className="text-blue-400"/> AI Storyteller</>}
          </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl flex-1 p-6 md:p-10 flex flex-col md:flex-row gap-8 overflow-hidden">
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

         <div className="flex-1 flex flex-col gap-8 h-[80vh] z-20">
            <div className="flex-1 bg-black/20 rounded-lg border border-[#3e2723]/30 p-4 relative overflow-y-auto custom-scrollbar pointer-events-auto">
                <div className="flex flex-wrap justify-start content-start gap-4 h-full">
                    
                    {/* 🌟 Render AI GM Card (ถ้าห้องนี้ใช้ AI) */}
                    {room.gm_type === 'ai' && (
                        <div className="relative w-36 md:w-44 flex-shrink-0 bg-blue-900/10 border-2 border-blue-900/50 rounded-lg p-3 flex flex-col items-center">
                            <div className="absolute top-2 right-2 w-3 h-3 z-20 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6] animate-pulse"></div>
                            <div className="w-20 h-20 rounded-full border-2 border-blue-500 overflow-hidden mb-3 bg-[#0f0a08] flex items-center justify-center">
                               <Bot size={40} className="text-blue-400" />
                            </div>
                            <div className="text-center w-full">
                                <div className={`${cinzel.className} text-blue-200 text-xs md:text-sm font-bold truncate`}>Gemini AI</div>
                                <div className="text-[8px] md:text-[10px] text-blue-500 uppercase tracking-widest">Game Master</div>
                            </div>
                        </div>
                    )}

                    {players.map((p: any) => (
                        <PlayerCard key={p.uniqueKey} playerData={p} roomHostId={room.host_id} isCurrentUser={p.id === currentUser.id} toggleMic={toggleMic} toggleCam={toggleCam} micOn={micOn} camOn={camOn} />
                    ))}
                    
                    {/* 🌟 Render Empty Slots (คำนวณถูกเป๊ะแล้ว) */}
                    {Array.from({ length: emptySlotsCount }).map((_, i) => (
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
                        <Users size={16} className="text-[#a1887f] group-hover:text-[#F4E4BC]" />
                        <code className="text-[#F4E4BC] font-mono text-xs hidden md:block">{roomId.substring(0,8)}...</code>
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
                    <button onClick={handleToggleReady} className={`relative px-10 py-3 rounded font-bold text-lg uppercase tracking-[0.2em] transition-all duration-300 border-2 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 cursor-pointer z-[999] ${isMeReady ? 'bg-green-900/80 border-green-500 text-green-100 hover:bg-green-800 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-[#3e2723] border-[#F4E4BC] text-[#F4E4BC] hover:bg-[#5d4037] hover:shadow-[0_0_15px_rgba(244,228,188,0.2)]'}`}>
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