'use client'
import { useEffect, useState } from 'react'
import { useParticipants, VideoTrack, useParticipantTracks, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react'
import { Track, Participant } from 'livekit-client'
import { useGameStore } from '@/store/useGameStore'
import { Heart, Droplet, Skull, Flame, ShieldAlert, Mic, MicOff, Video as VideoIcon, VideoOff, Headphones, HeadphoneOff, Eye, Shield } from 'lucide-react'
import { Cinzel } from 'next/font/google'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'

// 🌟 Import ตัวเลขลอยเข้ามา
import DamageNumbers from './DamageNumbers' 

const cinzel = Cinzel({ subsets: ['latin'], weight: ['700'] });

const renderStatusIcon = (status: string) => {
  switch (status.toUpperCase()) {
    case 'POISON': return <Skull size={14} className="text-green-500 animate-pulse" />;
    case 'BURN': return <Flame size={14} className="text-orange-500 animate-pulse" />;
    case 'SHIELD': return <ShieldAlert size={14} className="text-blue-400" />;
    default: return null;
  }
};

// ==========================================
// 1. Component การ์ดผู้เล่นสไตล์ RPG (ของคุณโอม)
// ==========================================
function PlayerVideoCard({ p, playerData }: { p: Participant, playerData: any }) {
  const { playerStats } = useGameStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const videoTracks = useParticipantTracks([Track.Source.Camera], p.identity);
  const videoTrack = videoTracks.find(t => t.participant.identity === p.identity);
  
  const isVideoOn = videoTrack?.publication?.track && !videoTrack.publication?.isMuted;
  const isMicMuted = !p.isMicrophoneEnabled;
  const isSpeaking = p.isSpeaking; 
  
  const isDeafened = p.attributes?.deafened === 'true';

  // ใช้ชื่อจาก DB ของเพื่อน หรือชื่อจาก LiveKit
  const username = playerData?.profiles?.username || p.name || 'Unknown';
  const isSpectator = playerData?.is_spectator;

  const stats = playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
  const hpPercent = (stats.hp / stats.maxHp) * 100;
  const manaPercent = (stats.mana / stats.maxMana) * 100;
  
  const isDead = stats.hp <= 0;

  useEffect(() => {
    // ถ้ามีรูปจาก DB ของเพื่อนส่งมาแล้ว ก็ใช้ได้เลย จะได้ไม่ต้องดึงใหม่
    if (playerData?.profiles?.avatar_url) {
        setAvatarUrl(playerData.profiles.avatar_url);
        return;
    }
    const fetchAvatar = async () => {
      if (!p.identity) return;
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', p.identity).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [p.identity, playerData]);

  return (
    <div className={`relative bg-[#1a0f0a]/90 backdrop-blur-md border-2 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 group
        ${isSpeaking && !isMicMuted && !isDead && !isSpectator ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105 z-10' : 'border-[#5d4037] hover:border-[#F4E4BC]/50'}
        ${isDead || isSpectator ? 'grayscale opacity-75' : ''}`}> 
      
      {/* 🌟 ยัด DamageNumbers ล่องหนเอาไว้ตรงนี้ */}
      {!isSpectator && <DamageNumbers username={username} />}

      {/* 📸 ส่วนที่ 1: กล้อง Video หรือ Avatar */}
      <div className="relative w-full h-28 bg-black border-b border-[#3e2723]">
        {isVideoOn ? (
          <VideoTrack trackRef={videoTrack} className="w-full h-full object-cover transform scale-x-[-1]" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#2a1d15] to-[#0f0a08]">
            {avatarUrl ? (
               <img src={avatarUrl} alt={username} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all" />
            ) : (
               <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${p.identity}`} className="w-16 h-16 opacity-50 grayscale group-hover:grayscale-0 transition-all" alt="avatar" />
            )}
          </div>
        )}
        
        {/* 💀 โอเวอร์เลย์ตอนตาย */}
        {isDead && !isSpectator && (
          <div className="absolute inset-0 bg-red-950/60 flex flex-col items-center justify-center z-30 backdrop-blur-[2px]">
            <Skull size={32} className="text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
            <span className={`${cinzel.className} text-red-500 font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(0,0,0,1)]`}>DEAD</span>
          </div>
        )}

        {/* ไอคอนสถานะอุปกรณ์ */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {isDeafened && (
            <div className="bg-red-900/80 p-1 rounded text-white backdrop-blur-sm" title="Deafened"><HeadphoneOff size={12} /></div>
          )}
          {isMicMuted ? (
            <div className="bg-red-900/80 p-1 rounded text-white backdrop-blur-sm" title="Muted"><MicOff size={12} /></div>
          ) : isSpeaking && !isDead ? (
            <div className="bg-green-600/90 p-1 rounded text-white backdrop-blur-sm animate-pulse"><Mic size={12} /></div>
          ) : null}
        </div>

        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-1 px-2 z-10 flex justify-between items-end">
          <h3 className={`${cinzel.className} text-[#F4E4BC] text-sm font-bold truncate drop-shadow-md`}>
            {username}
          </h3>
          {isSpectator && (
             <span className="text-[8px] bg-black/80 text-gray-400 px-1 rounded border border-gray-600">SPECTATOR</span>
          )}
        </div>
      </div>

      {/* 📊 ส่วนที่ 2: RPG Stats (ซ่อนถ้าเป็นคนดู) */}
      {!isSpectator && (
        <div className="p-2 space-y-2 relative z-20">
          <div className="relative w-full h-3 bg-red-950 rounded-full border border-red-900 overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 ease-out" style={{ width: `${hpPercent}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md z-10">
              {stats.hp} / {stats.maxHp}
            </div>
            <Heart size={10} className="absolute left-1 top-0.5 text-red-200 z-10 opacity-80" />
          </div>

          <div className="relative w-full h-3 bg-blue-950 rounded-full border border-blue-900 overflow-hidden shadow-inner">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500 ease-out" style={{ width: `${manaPercent}%` }} />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md z-10">
              {stats.mana} / {stats.maxMana}
            </div>
            <Droplet size={10} className="absolute left-1 top-0.5 text-blue-200 z-10 opacity-80" />
          </div>

          {stats.statuses.length > 0 && (
            <div className="flex gap-1 pt-1 border-t border-[#3e2723] mt-1">
              {stats.statuses.map((status, idx) => (
                <div key={idx} className="p-1 bg-black/50 rounded border border-[#5d4037]" title={status}>
                  {renderStatusIcon(status)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* เอฟเฟกต์จอแดงเวลาเลือดจะหมด */}
      {!isDead && !isSpectator && hpPercent <= 20 && hpPercent > 0 && (
        <div className="absolute inset-0 border-2 border-red-600 animate-pulse pointer-events-none rounded-lg z-30" />
      )}
    </div>
  );
}

// ==========================================
// 2. Component หลักจัดการหน้าจอ Overlay
// ==========================================
export default function VideoOverlay() {
  const { masterVolume, setMasterVolume, cameraZoom, setCameraZoom } = useGameStore(); // 🌟
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const params = useParams();
  const roomId = params?.id as string;
  
  // State คุมปุ่มด้านบน (ของคุณโอม)
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  // State เก็บข้อมูลจาก DB (ของเพื่อน)
  const [dbPlayers, setDbPlayers] = useState<any[]>([]);

  useEffect(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(isMicOn).catch(e => console.warn("Mic Error:", e));
    localParticipant.setCameraEnabled(isCamOn).catch(e => console.warn("Cam Error:", e));
  }, [isMicOn, isCamOn, localParticipant]);

  useEffect(() => {
    const updateDeafenStatus = async () => {
      if (!localParticipant) return;
      try { await localParticipant.setAttributes({ deafened: (!isSpeakerOn).toString() }); } 
      catch (error) { console.warn("⚠️ ส่งป้ายประกาศหูตึงไม่ทัน:", error); }
    };
    updateDeafenStatus();
  }, [isSpeakerOn, localParticipant]);

  // ระบบดึงและอัปเดตสถานะ Spectator (ของเพื่อน)
  useEffect(() => {
    if (!roomId) return;
    const fetchPlayers = async () => {
      const { data } = await supabase.from('room_players').select('user_id, is_spectator, profiles(username, avatar_url)').eq('room_id', roomId);
      if (data) setDbPlayers(data);
    };
    fetchPlayers();

    const channel = supabase.channel(`video-overlay-${roomId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'room_players', filter: `room_id=eq.${roomId}` }, () => {
          fetchPlayers();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // แมปข้อมูลเพื่อแยกกลุ่ม
  const mappedParticipants = participants.map(p => {
    const dbData = dbPlayers.find(dbP => dbP.user_id === p.identity);
    return { participant: p, dbData };
  });

  const activePlayers = mappedParticipants.filter(p => !p.dbData?.is_spectator);
  const spectators = mappedParticipants.filter(p => p.dbData?.is_spectator);

  return (
    // ขยายความกว้างกลับมาเป็น w-48 เพื่อให้การ์ดใหญ่ๆ แสดงได้พอดี
    <div className="flex flex-col gap-3 w-48 pointer-events-auto">
      {/* 🌟 1. สไลด์บาร์ควบคุมเสียง (วางไว้เหนือแผงปุ่ม) */}
      <div className="bg-[#1a0f0a]/95 p-2 rounded-lg border-2 border-[#3e2723] flex flex-col gap-1">
          <div className="flex justify-between items-center text-[10px] text-yellow-400 font-bold uppercase px-1">
             <span>Volume</span>
             <span>{Math.round(masterVolume * 100)}%</span>
          </div>
          <input
            type="range" min="0" max="1" step="0.01"
            value={masterVolume}
            onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-yellow-500"
          />
      </div>

      {isSpeakerOn && <RoomAudioRenderer />}

      {/* แผงควบคุมกล้อง/ไมค์ ของคุณโอม */}
      <div className="flex justify-between gap-1 bg-[#1a0f0a]/95 p-2 rounded-lg border-2 border-[#3e2723] backdrop-blur-md shadow-xl">
          <button onClick={() => setIsMicOn(!isMicOn)} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${isMicOn ? 'bg-[#3e2723] text-[#F4E4BC] hover:bg-[#5d4037]' : 'bg-red-900/80 text-red-200 shadow-[0_0_8px_red]'}`} title={isMicOn ? 'Mute Mic' : 'Unmute Mic'}>
            {isMicOn ? <Mic size={16}/> : <MicOff size={16}/>}
          </button>
          <button onClick={() => setIsCamOn(!isCamOn)} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${isCamOn ? 'bg-[#3e2723] text-[#F4E4BC] hover:bg-[#5d4037]' : 'bg-red-900/80 text-red-200 shadow-[0_0_8px_red]'}`} title={isCamOn ? 'Turn Off Camera' : 'Turn On Camera'}>
            {isCamOn ? <VideoIcon size={16}/> : <VideoOff size={16}/>}
          </button>
          <button onClick={() => setIsSpeakerOn(!isSpeakerOn)} className={`flex-1 flex justify-center p-2 rounded-md transition-all ${isSpeakerOn ? 'bg-[#3e2723] text-[#F4E4BC] hover:bg-[#5d4037]' : 'bg-red-900/80 text-red-200 shadow-[0_0_8px_red]'}`} title={isSpeakerOn ? 'Deafen (Mute Audio)' : 'Undeafen'}>
            {isSpeakerOn ? <Headphones size={16}/> : <HeadphoneOff size={16}/>}
          </button>
      </div>

      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1 pb-10">
         <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
         <div className="flex flex-col gap-4 no-scrollbar">
            
            {/* โซน Party (คนเล่น) */}
            {activePlayers.length > 0 && (
               <div className="flex flex-col gap-3">
                  <div className="text-[#F4E4BC] text-[10px] font-bold uppercase tracking-widest bg-[#3e2723]/90 px-2 py-1 rounded shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-[#5d4037] flex items-center justify-center gap-1">
                    <Shield size={10} /> Party
                  </div>
                  {activePlayers.map((p) => (
                    <PlayerVideoCard key={p.participant.identity} p={p.participant} playerData={p.dbData} />
                  ))}
               </div>
            )}

            {/* โซน Spectators (ผู้ชม) */}
            {spectators.length > 0 && (
               <div className="flex flex-col gap-3 mt-2 pt-4 border-t-2 border-dashed border-[#3e2723]/50">
                  <div className="text-[#a1887f] text-[10px] font-bold uppercase tracking-widest bg-black/80 px-2 py-1 rounded shadow-lg border border-[#3e2723] flex items-center justify-center gap-1">
                    <Eye size={10} /> Spectators
                  </div>
                  {spectators.map((p) => (
                    <PlayerVideoCard key={p.participant.identity} p={p.participant} playerData={p.dbData} />
                  ))}
               </div>
            )}

         </div>
      </div>
    </div>
  );
}