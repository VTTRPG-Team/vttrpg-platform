'use client'
import { useEffect, useState } from 'react'
import { useParticipants, VideoTrack, useParticipantTracks, useLocalParticipant, RoomAudioRenderer } from '@livekit/components-react'
import { Track, Participant } from 'livekit-client'
import { useGameStore } from '@/store/useGameStore'
import { Heart, Droplet, Skull, Flame, ShieldAlert, Mic, MicOff, Video as VideoIcon, VideoOff, Headphones, HeadphoneOff } from 'lucide-react'
import { Cinzel } from 'next/font/google'
import { supabase } from '@/lib/supabase'

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

function PlayerVideoCard({ p }: { p: Participant }) {
  const { playerStats } = useGameStore();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const videoTracks = useParticipantTracks([Track.Source.Camera], p.identity);
  const videoTrack = videoTracks.find(t => t.participant.identity === p.identity);
  
  const isVideoOn = videoTrack?.publication?.track && !videoTrack.publication?.isMuted;
  const isMicMuted = !p.isMicrophoneEnabled;
  const isSpeaking = p.isSpeaking; 
  
  const isDeafened = p.attributes?.deafened === 'true';

  const username = p.name || 'Unknown';
  const stats = playerStats[username] || { hp: 100, maxHp: 100, mana: 50, maxMana: 50, statuses: [] };
  
  const hpPercent = (stats.hp / stats.maxHp) * 100;
  const manaPercent = (stats.mana / stats.maxMana) * 100;
  
  // 🌟 เช็คสถานะความตาย (HP เหลือ 0)
  const isDead = stats.hp <= 0;

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!p.identity) return;
      const { data } = await supabase.from('profiles').select('avatar_url').eq('id', p.identity).single();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [p.identity]);

  return (
    <div className={`relative bg-[#1a0f0a]/90 backdrop-blur-md border-2 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden transition-all duration-300 group
        ${isSpeaking && !isMicMuted && !isDead ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.6)] scale-105 z-10' : 'border-[#5d4037] hover:border-[#F4E4BC]/50'}
        ${isDead ? 'grayscale opacity-75' : ''}`}> 
        {/* 👆 ถ้าตาย จะทำให้ทั้งการ์ดเป็นสีเทาและจางลงนิดหน่อย */}
      
      {/* 🌟 ยัด DamageNumbers ล่องหนเอาไว้ตรงนี้ให้ทับหน้าคนพอดี! */}
      <DamageNumbers username={username} />

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
        
        {/* 💀 โอเวอร์เลย์ตอนตาย แปะทับหน้าไปเลย */}
        {isDead && (
          <div className="absolute inset-0 bg-red-950/60 flex flex-col items-center justify-center z-30 backdrop-blur-[2px]">
            <Skull size={32} className="text-red-500 drop-shadow-[0_0_8px_rgba(255,0,0,0.8)]" />
            <span className={`${cinzel.className} text-red-500 font-black tracking-widest text-lg drop-shadow-[0_0_8px_rgba(0,0,0,1)]`}>DEAD</span>
          </div>
        )}

        {/* ไอคอนสถานะอุปกรณ์ */}
        <div className="absolute top-2 right-2 flex gap-1 z-20">
          {isDeafened && (
            <div className="bg-red-900/80 p-1 rounded text-white backdrop-blur-sm" title="Deafened">
              <HeadphoneOff size={12} />
            </div>
          )}
          {isMicMuted ? (
            <div className="bg-red-900/80 p-1 rounded text-white backdrop-blur-sm" title="Muted">
              <MicOff size={12} />
            </div>
          ) : isSpeaking && !isDead ? (
            <div className="bg-green-600/90 p-1 rounded text-white backdrop-blur-sm animate-pulse">
              <Mic size={12} />
            </div>
          ) : null}
        </div>

        {/* ป้ายชื่อ */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/80 to-transparent pt-6 pb-1 px-2 z-10">
          <h3 className={`${cinzel.className} text-[#F4E4BC] text-sm font-bold truncate drop-shadow-md`}>
            {username}
          </h3>
        </div>
      </div>

      {/* 📊 ส่วนที่ 2: RPG Stats */}
      <div className="p-2 space-y-2 relative z-20">
        <div className="relative w-full h-3 bg-red-950 rounded-full border border-red-900 overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-500 ease-out"
            style={{ width: `${hpPercent}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white drop-shadow-md z-10">
            {stats.hp} / {stats.maxHp}
          </div>
          <Heart size={10} className="absolute left-1 top-0.5 text-red-200 z-10 opacity-80" />
        </div>

        <div className="relative w-full h-3 bg-blue-950 rounded-full border border-blue-900 overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-700 to-blue-400 transition-all duration-500 ease-out"
            style={{ width: `${manaPercent}%` }}
          />
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
      
      {/* เอฟเฟกต์จอแดงเวลาเลือดจะหมด (ซ่อนถ้าตายแล้ว) */}
      {!isDead && hpPercent <= 20 && hpPercent > 0 && (
        <div className="absolute inset-0 border-2 border-red-600 animate-pulse pointer-events-none rounded-lg z-30" />
      )}
    </div>
  );
}

export default function VideoOverlay() {
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);

  useEffect(() => {
    if (!localParticipant) return;
    localParticipant.setMicrophoneEnabled(isMicOn).catch(e => console.warn("Mic Error:", e));
    localParticipant.setCameraEnabled(isCamOn).catch(e => console.warn("Cam Error:", e));
  }, [isMicOn, isCamOn, localParticipant]);

  useEffect(() => {
    const updateDeafenStatus = async () => {
      if (!localParticipant) return;
      try {
        await localParticipant.setAttributes({ deafened: (!isSpeakerOn).toString() });
      } catch (error) {
        console.warn("⚠️ ส่งป้ายประกาศหูตึงไม่ทัน:", error);
      }
    };
    updateDeafenStatus();
  }, [isSpeakerOn, localParticipant]);

  return (
    <div className="flex flex-col gap-3 w-48 pointer-events-auto">
      {isSpeakerOn && <RoomAudioRenderer />}

      {/* 🎛️ ปุ่มควบคุมส่วนตัว (My Controls) */}
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

      {/* วิดีโอผู้เล่นทั้งหมด */}
      <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-1 pb-10">
         <style jsx>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
         <div className="flex flex-col gap-3 no-scrollbar">
           {participants.map((p) => (
             <PlayerVideoCard key={p.identity} p={p} />
           ))}
         </div>
      </div>
    </div>
  );
}