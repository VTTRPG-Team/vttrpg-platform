'use client'
import { useEffect, useRef, useState } from 'react'
import { Volume1, Volume2, VolumeX, Music } from 'lucide-react'

// 🎵 1. เปลี่ยนมาใช้ไฟล์เสียงในเครื่องเราเอง (ชัวร์ 100%)
const AUDIO_LIBRARY = {
  // ดึงไฟล์จาก public/sounds/ambient.mp3
  ambient: '/sounds/ambient.mp3', 
  
  // (พวกนี้ถ้าหาไฟล์ได้ ก็โหลดมาใส่แล้วเปลี่ยนลิงก์เป็น /sounds/... ได้เลยครับ)
  sfx: {
    sword: 'https://actions.google.com/sounds/v1/weapons/sword_clash.ogg',
    magic: 'https://actions.google.com/sounds/v1/science_fiction/alien_beam.ogg',
    explosion: 'https://actions.google.com/sounds/v1/explosions/explosion_large.ogg',
    monster: 'https://actions.google.com/sounds/v1/horror/monster_zombie_growl.ogg',
  },
  bgm: {
    rain: 'https://actions.google.com/sounds/v1/weather/rain_heavy_loud.ogg',
    tavern: 'https://actions.google.com/sounds/v1/crowds/pub_ambience.ogg',
    dungeon: 'https://actions.google.com/sounds/v1/horror/ambience_creepy_drone.ogg',
  }
}

export default function AudioEngine() {
  const [volume, setVolume] = useState(0.8); // 🌟 ปรับค่าเริ่มต้นให้ดังขึ้นเป็น 80% จะได้ยินชัดๆ
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const ambientPlayer = useRef<HTMLAudioElement | null>(null);
  const bgmPlayer = useRef<HTMLAudioElement | null>(null);
  const sfxPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !ambientPlayer.current) {
      ambientPlayer.current = new Audio(AUDIO_LIBRARY.ambient);
      ambientPlayer.current.loop = true;

      bgmPlayer.current = new Audio();
      bgmPlayer.current.loop = true;

      sfxPlayer.current = new Audio();
    }

    const handleAudioEvent = (e: any) => {
      const { type, track } = e.detail;
      if (type === 'play_bgm' && bgmPlayer.current) {
        if (track === 'stop') {
          bgmPlayer.current.pause();
          return;
        }
        // @ts-ignore
        const url = AUDIO_LIBRARY.bgm[track];
        if (url) {
          bgmPlayer.current.src = url;
          bgmPlayer.current.play().catch(err => console.log('BGM Error:', err));
        }
      }
      if (type === 'play_sfx' && sfxPlayer.current) {
        // @ts-ignore
        const url = AUDIO_LIBRARY.sfx[track];
        if (url) {
          sfxPlayer.current.src = url;
          sfxPlayer.current.play().catch(err => console.log('SFX Error:', err));
        }
      }
    };

    window.addEventListener('ai-audio', handleAudioEvent);
    return () => window.removeEventListener('ai-audio', handleAudioEvent);
  }, []);

  // 🌟 บังคับให้เริ่มเล่นเสียง เมื่อผู้เล่นกดปุ่มบนหน้าเว็บ
  const startAmbientAudio = () => {
    if (!hasInteracted && ambientPlayer.current) {
      ambientPlayer.current.play()
        .then(() => setHasInteracted(true))
        .catch((e) => console.log('เบราว์เซอร์บล็อกเสียง:', e));
    }
  };

  useEffect(() => {
    const actualVolume = isMuted ? 0 : volume;
    // ปรับให้เสียง Ambient ดังเท่าเสียง Master ไปเลยตอนเทสต์
    if (ambientPlayer.current) ambientPlayer.current.volume = actualVolume; 
    if (bgmPlayer.current) bgmPlayer.current.volume = actualVolume;
    if (sfxPlayer.current) sfxPlayer.current.volume = Math.min(actualVolume * 1.5, 1); 
  }, [volume, isMuted]);

  return (
    <div 
      className="bg-neutral-800/80 hover:bg-neutral-800 border border-white/20 px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 transition-all group pointer-events-auto"
      onClick={startAmbientAudio} // 🌟 คลิกที่กล่องนี้ปุ๊บ เสียงจะถูกปลดล็อกทันที!
    >
      
      {/* 🎵 ไอคอนแจ้งเตือนให้กดเพื่อเล่นเสียง */}
      {!hasInteracted && (
        <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold mr-1 animate-pulse uppercase tracking-wider">
          <Music size={12} /> Click to Play
        </span>
      )}

      {/* ปุ่มกด Mute */}
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsMuted(!isMuted);
          startAmbientAudio();
        }} 
        className="text-white hover:scale-110 transition-transform focus:outline-none"
        title={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted || volume === 0 ? (
          <VolumeX size={18} className="text-red-400" />
        ) : volume < 0.5 ? (
          <Volume1 size={18} className="text-green-400" />
        ) : (
          <Volume2 size={18} className="text-green-400" />
        )}
      </button>

      {/* หลอดสไลเดอร์ */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={isMuted ? 0 : volume}
        onChange={(e) => {
          setVolume(parseFloat(e.target.value));
          if (isMuted && parseFloat(e.target.value) > 0) setIsMuted(false);
          startAmbientAudio(); // ขยับหลอดปุ๊บ เล่นเสียงทันที
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-16 md:w-24 h-1.5 bg-neutral-600 rounded-lg appearance-none cursor-pointer accent-green-400 focus:outline-none"
        title="Adjust Volume"
      />
    </div>
  );
}