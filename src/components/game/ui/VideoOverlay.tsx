'use client';
import { useState, useEffect } from 'react';
import { useParticipants, VideoTrack, useParticipantTracks } from '@livekit/components-react';
import { Track, ParticipantEvent } from 'livekit-client';
import { Mic, MicOff, Eye, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useParams } from 'next/navigation';

// ==========================================
// 1. Component ย่อยสำหรับแสดงกล้อง/รูป ของแต่ละคน
// ==========================================
function PlayerStream({ participant, playerData }: { participant: any, playerData: any }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const videoTracks = useParticipantTracks([Track.Source.Camera], participant.identity);
  const videoTrack = videoTracks.find(t => t.participant.identity === participant.identity);

  useEffect(() => {
    const onSpeakingChanged = (speaking: boolean) => setIsSpeaking(speaking);
    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged);
    setIsSpeaking(participant.isSpeaking);
    return () => { participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChanged); };
  }, [participant]);

  const isMicActive = participant.isMicrophoneEnabled;
  const isVideoVisible = videoTrack?.publication?.track && !videoTrack.publication?.isMuted;
  const isSpectator = playerData?.is_spectator;

  return (
    <div className="flex flex-col items-center gap-1 mb-4 relative group">
      <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border-2 overflow-hidden bg-[#1a0f0a] transition-all duration-300 ${
        isSpeaking ? 'border-green-500 shadow-[0_0_15px_#22c55e] scale-105' : 'border-[#5d4037]'
      }`}>
        {isVideoVisible ? (
          <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
          <img 
            src={playerData?.profiles?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${participant.identity}`} 
            alt="Avatar" 
            className={`w-full h-full object-cover transition-all ${isSpectator ? 'grayscale opacity-60' : ''}`} 
          />
        )}
        
        {/* สถานะไมค์ */}
        <div className="absolute bottom-0 right-0 bg-black/80 rounded-full p-1 z-10 border border-[#3e2723]">
           {isMicActive ? (
              isSpeaking ? <Mic size={10} className="text-green-500 animate-pulse" /> : <Mic size={10} className="text-gray-300" />
           ) : (
              <MicOff size={10} className="text-red-500" />
           )}
        </div>
      </div>
      
      {/* ป้ายชื่อ */}
      <div className={`px-2 py-0.5 rounded text-[10px] md:text-xs text-white border text-center max-w-[80px] truncate shadow-md ${
        isSpectator ? 'bg-black/60 border-[#3e2723] text-gray-400' : 'bg-[#3e2723] border-[#5d4037] font-bold'
      }`}>
         {playerData?.profiles?.username || participant.name || 'Unknown'}
      </div>
    </div>
  );
}

// ==========================================
// 2. Component หลักสำหรับจัดกลุ่ม (Overlay)
// ==========================================
export default function VideoOverlay() {
  const participants = useParticipants();
  const params = useParams();
  const roomId = params?.id as string;
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!roomId) return;
    
    // ดึงข้อมูลลูกเรือจากฐานข้อมูลเพื่อเช็ค is_spectator
    const fetchPlayers = async () => {
      const { data } = await supabase.from('room_players').select('user_id, is_spectator, profiles(username, avatar_url)').eq('room_id', roomId);
      if (data) setDbPlayers(data);
    };
    fetchPlayers();

    // ดักฟังการอัปเดตแบบเรียลไทม์ (เผื่อมีคนเปลี่ยนโหมดเข้าๆ ออกๆ)
    const channel = supabase.channel(`video-overlay-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
          fetchPlayers();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // แมปข้อมูล LiveKit กับข้อมูลใน Database เข้าด้วยกัน
  const mappedParticipants = participants.map(p => {
    const dbData = dbPlayers.find(dbP => dbP.user_id === p.identity);
    return { participant: p, dbData };
  });

  // 🌟 แยกกลุ่มผู้เล่นตัวจริง กับ ผู้ชม ออกจากกัน
  const activePlayers = mappedParticipants.filter(p => !p.dbData?.is_spectator);
  const spectators = mappedParticipants.filter(p => p.dbData?.is_spectator);

  return (
    <div className="flex flex-col gap-2 max-h-[75vh] overflow-y-auto custom-scrollbar pointer-events-auto w-24 md:w-28 items-center pt-2 pb-10">
      
      {/* --- โซนนักผจญภัย (Active Players) --- */}
      {activePlayers.length > 0 && (
         <div className="flex flex-col items-center w-full">
            <div className="text-[#F4E4BC] text-[10px] font-bold uppercase tracking-widest mb-3 bg-[#3e2723]/90 px-2 py-1 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-[#5d4037] flex items-center gap-1 z-10">
              <Shield size={10} /> Party
            </div>
            {activePlayers.map(p => (
              <PlayerStream key={p.participant.identity} participant={p.participant} playerData={p.dbData} />
            ))}
         </div>
      )}

      {/* --- โซนผู้ชม (Spectators) --- */}
      {spectators.length > 0 && (
         <div className="flex flex-col items-center w-full mt-2 pt-4 border-t-2 border-dashed border-[#3e2723]/50">
            <div className="text-[#a1887f] text-[10px] font-bold uppercase tracking-widest mb-3 bg-black/80 px-2 py-1 rounded shadow-lg border border-[#3e2723] flex items-center gap-1 z-10">
              <Eye size={10} /> Spectators
            </div>
            {spectators.map(p => (
              <PlayerStream key={p.participant.identity} participant={p.participant} playerData={p.dbData} />
            ))}
         </div>
      )}

    </div>
  );
}