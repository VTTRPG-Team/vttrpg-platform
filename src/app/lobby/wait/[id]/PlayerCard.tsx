'use client';
import { useState, useEffect } from 'react';
import { useParticipants, VideoTrack, useParticipantTracks } from '@livekit/components-react';
import { Track, ParticipantEvent } from 'livekit-client';
import { Mic, MicOff, Video, VideoOff, Eye } from 'lucide-react';
import { Cinzel } from 'next/font/google';

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700', '900'] });

export default function PlayerCard({ playerData, roomHostId, isCurrentUser, toggleMic, toggleCam, micOn, camOn }: any) {
  const participants = useParticipants();
  const lkParticipant = participants.find(p => p.identity === playerData.id);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoTracks = useParticipantTracks([Track.Source.Camera], lkParticipant?.identity);
  const videoTrack = videoTracks.find(t => t.participant.identity === playerData.id);

  useEffect(() => {
    if (!lkParticipant) { setIsSpeaking(false); return; }
    const onSpeakingChanged = (speaking: boolean) => setIsSpeaking(speaking);
    lkParticipant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    setIsSpeaking(lkParticipant.isSpeaking);
    return () => { lkParticipant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged); };
  }, [lkParticipant]);

  const isMicActive = lkParticipant?.isMicrophoneEnabled;
  const isVideoVisible = videoTrack?.publication?.track && !videoTrack.publication?.isMuted;
  const isHost = roomHostId === playerData.id;
  const isSpectator = playerData.isSpectator; // 🌟 เช็คว่าเป็นการ์ดของคนดูไหม

  return (
    // 🌟 ถ้าเป็น Spectator การ์ดจะดูทึบๆ หน่อย ให้แยกความแตกต่าง
    <div className={`relative group w-36 md:w-44 flex-shrink-0 bg-[#1a0f0a] border rounded-lg p-3 flex flex-col items-center transition-all duration-300 ${isSpeaking ? 'border-green-500 shadow-[0_0_20px_#22c55e] scale-105 z-20' : 'border-[#3e2723] hover:border-[#F4E4BC]/50 hover:shadow-lg'} ${isSpectator ? 'opacity-70 hover:opacity-100' : ''}`}>
      
      {/* Ready Badge: ปิดซ่อนถ้าเป็น Host หรือเป็น Spectator */}
      {!isHost && !isSpectator && (
         <div className={`absolute top-2 right-2 w-3 h-3 z-20 rounded-full transition-all duration-300 ${playerData.isReady ? 'bg-green-500 shadow-[0_0_10px_#22c55e] scale-125' : 'bg-red-900/50'}`}></div>
      )}
      
      <div className={`w-20 h-20 rounded-full border-2 overflow-hidden mb-3 bg-black relative transition-colors ${isSpeaking ? 'border-green-500' : 'border-[#5d4037]'}`}>
        {isVideoVisible ? (
           <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
           <img src={playerData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${playerData.id}`} alt="Avatar" className="w-full h-full object-cover grayscale-[20%]" />
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

        {isHost && (
            <div className="absolute bottom-0 inset-x-0 bg-yellow-900/80 text-[8px] text-center text-yellow-200 font-bold uppercase py-0.5 z-20 pointer-events-none">Leader</div>
        )}
      </div>
      
      <div className="text-center w-full">
          <div className={`${cinzel.className} text-[#F4E4BC] text-xs md:text-sm font-bold truncate`}>{playerData.name}</div>
          {/* 🌟 แสดงคำว่า Spectator ถ้าเป็นผู้ชม */}
          <div className="text-[8px] md:text-[10px] text-[#5d4037] uppercase tracking-widest flex justify-center items-center gap-1">
             {isSpectator ? <><Eye size={10} className="text-[#a1887f]"/> Spectator</> : (playerData.role || 'Adventurer')}
          </div>
      </div>

      <div className={`mt-2 transition-all ${isSpeaking ? 'text-green-500 scale-125' : 'text-[#3e2723]'}`}>
          {isMicActive ? ( isSpeaking ? <Mic size={16} className="animate-pulse" /> : <Mic size={14} /> ) : ( <MicOff size={14} className="opacity-50" /> )}
      </div>
    </div>
  );
}